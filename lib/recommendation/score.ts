import { getSkillName } from "@/lib/data";
import { estimatedTrainingCost } from "@/lib/recommendation/cost";
import { DEFAULT_WEIGHTS, FACTOR_KEYS, FACTOR_LABELS, normalizeWeights } from "@/lib/recommendation/weights";
import { computeSkillGap } from "@/lib/skill-gap";
import {
  EDUCATION_LEVELS,
  educationRank,
  type Career,
  type FactorContribution,
  type FactorKey,
  type FactorScores,
  type SkillGapRow,
  type StudentProfile,
} from "@/lib/types";

/**
 * The matching engine.
 *
 * Six factors, each normalized to 0–1, are combined with configurable weights.
 * Three rules keep it honest:
 *   1. A factor with no student input is EXCLUDED, not scored as zero.
 *   2. Hard constraints filter a career out and are reported as reasons.
 *   3. The weighted total is divided by the weight actually covered, so a
 *      half-answered profile is compared fairly — and then reported with lower
 *      confidence.
 */

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

interface FactorResult {
  score: number | null;
  detail: string;
}

export interface ScoredCareer {
  career: Career;
  rawScore: number;
  displayScore: number;
  confidence: number;
  factors: FactorScores;
  contributions: FactorContribution[];
  eligible: boolean;
  ineligibleReasons: string[];
  skillGap: SkillGapRow[];
}

export interface ScoreCareerOptions {
  weights?: FactorScores;
  /** When true, education shortfalls are scored instead of filtering the career out. */
  whatIf?: boolean;
}

const APTITUDE_KEYS = ["math", "logical", "mechanical", "creativity", "communication", "practical"] as const;

function interestFactor(profile: StudentProfile, career: Career): FactorResult {
  // Only interests the student actually rated take part. An unrated interest is
  // removed from the denominator instead of counting as a zero, so a partially
  // answered profile is not quietly punished for the questions it skipped.
  const rated = career.interests.filter(
    (item) => typeof profile.interests[item.slug] === "number",
  );
  const totalWeight = rated.reduce((sum, item) => sum + item.weight, 0);
  if (rated.length === 0 || totalWeight <= 0) return { score: null, detail: "" };

  const matched = rated.reduce((sum, item) => {
    const student = clamp01((profile.interests[item.slug] ?? 0) / 100);
    return sum + Math.min(student, item.weight);
  }, 0);

  const score = clamp01(matched / totalWeight);
  const top = [...rated]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map((item) => item.slug)
    .join(" and ");
  return { score, detail: `Your interest profile lines up with this work (key interests: ${top})` };
}

function skillFactor(profile: StudentProfile, career: Career): FactorResult {
  let weighted = 0;
  let denominator = 0;
  const missing: string[] = [];

  for (const requirement of career.skills) {
    const rated = profile.skills[requirement.slug];
    if (typeof rated !== "number" || !Number.isFinite(rated)) {
      missing.push(requirement.slug);
      continue;
    }
    const weight = requirement.priority ? 2 : 1;
    denominator += weight;
    weighted += weight * clamp01(rated / Math.max(1, requirement.level));
  }

  if (denominator === 0) return { score: null, detail: "" };

  const score = clamp01(weighted / denominator);
  const detail =
    missing.length > 0
      ? `You already meet some expected skills; ${missing.length} skill${missing.length === 1 ? "" : "s"} not rated yet`
      : "You already meet the skill level this pathway expects";
  return { score, detail };
}

function aptitudeFactor(profile: StudentProfile, career: Career): FactorResult {
  let total = 0;
  let count = 0;

  for (const key of APTITUDE_KEYS) {
    const student = profile.abilities[key];
    if (typeof student !== "number" || !Number.isFinite(student)) continue;
    total += 1 - Math.abs(student - career.factors[key]) / 100;
    count += 1;
  }

  if (count === 0) return { score: null, detail: "" };

  const score = clamp01(total / count);
  const strongest = APTITUDE_KEYS.map((key) => ({
    key,
    delta: Math.abs((profile.abilities[key] ?? 0) - career.factors[key]),
  }))
    .filter((item) => typeof profile.abilities[item.key] === "number")
    .sort((a, b) => a.delta - b.delta)[0];

  return {
    score,
    detail: strongest
      ? `Your ${strongest.key} aptitude is close to what this trade demands`
      : "Aptitude profile compared with the demands of this trade",
  };
}

function preferenceFactor(profile: StudentProfile, career: Career): FactorResult {
  const signals: number[] = [];
  const notes: string[] = [];
  const prefs = profile.preferences;

  if (prefs.workEnvironments.length > 0) {
    const matches = prefs.workEnvironments.includes(career.work_environment);
    signals.push(matches ? 1 : 0);
    notes.push(
      matches
        ? `Work environment (${career.work_environment}) is one you chose`
        : `Work happens in a ${career.work_environment}, which you did not select`,
    );
  }

  if (prefs.team !== null) {
    const matches = prefs.team === "either" || career.team_orientation === "either" || career.team_orientation === prefs.team;
    signals.push(matches ? 1 : 0.3);
    if (matches) notes.push("Team style matches your preference");
  }

  if (prefs.sector !== null) {
    const matches = prefs.sector === "any" || career.sector_fit.includes(prefs.sector);
    signals.push(matches ? 1 : 0.2);
    if (!matches) notes.push("Employer type differs from your stated preference");
  }

  if (prefs.relocation !== null) {
    const likelihood = career.relocation_likelihood;
    const score =
      prefs.relocation === "willing"
        ? 1
        : prefs.relocation === "maybe"
          ? likelihood === "low"
            ? 1
            : likelihood === "medium"
              ? 0.7
              : 0.4
          : likelihood === "low"
            ? 1
            : likelihood === "medium"
              ? 0.4
              : 0.15;
    signals.push(score);
    if (score < 1) notes.push(`Relocation likelihood is ${likelihood}, which you were unsure about`);
  }

  if (signals.length === 0) return { score: null, detail: "" };
  const score = clamp01(signals.reduce((a, b) => a + b, 0) / signals.length);
  return { score, detail: notes[0] ?? "Compared with your stated work preferences" };
}

function educationFactor(profile: StudentProfile, career: Career): FactorResult & { eligible: boolean } {
  const studentRank = educationRank(profile.educationLevel);
  const requiredRank = educationRank(career.min_education_level);

  if (studentRank < requiredRank) {
    return {
      score: 0,
      eligible: false,
      detail: `Requires ${EDUCATION_LEVELS[requiredRank]} to start`,
    };
  }
  if (studentRank - requiredRank >= 2) {
    return {
      score: 0.85,
      eligible: true,
      detail: "You are already more qualified than the entry requirement — ask whether this is the right level",
    };
  }
  return { score: 1, eligible: true, detail: "Your current qualification meets the entry requirement" };
}

interface ConstraintResult extends FactorResult {
  hardFailures: string[];
}

function constraintFactor(profile: StudentProfile, career: Career): ConstraintResult {
  const { constraints } = profile;
  const signals: number[] = [];
  const hardFailures: string[] = [];
  const notes: string[] = [];

  const cost = estimatedTrainingCost(career);

  if (constraints.budgetMaxInr !== null && constraints.budgetMaxInr > 0) {
    const budget = constraints.budgetMaxInr;
    if (cost.amountInr <= budget) {
      signals.push(1);
      notes.push("Training cost fits the budget you stated");
    } else if (cost.amountInr <= budget * 1.5) {
      signals.push(0.5);
      notes.push("Training cost is somewhat above your stated budget");
    } else {
      signals.push(0.1);
      notes.push("Training cost is well above your stated budget");
      if (constraints.hard.includes("budget")) hardFailures.push("Cost exceeds your stated maximum budget");
    }
  }

  if (constraints.durationMaxMonths !== null && constraints.durationMaxMonths > 0) {
    const max = constraints.durationMaxMonths;
    if (career.duration_months_min <= max) {
      signals.push(1);
      notes.push("Training duration fits the time you can commit");
    } else if (career.duration_months_min <= max * 1.25) {
      signals.push(0.6);
      notes.push("Training takes slightly longer than you preferred");
    } else {
      signals.push(0.2);
      notes.push("Training takes longer than you preferred");
      if (constraints.hard.includes("duration")) hardFailures.push("Training takes longer than your limit");
    }
  }

  if (constraints.minIncomeInr !== null && constraints.minIncomeInr > 0) {
    const min = constraints.minIncomeInr;
    if (career.income_band_min >= min) {
      signals.push(1);
      notes.push("Illustrative starting income is at or above the minimum you stated");
    } else if (career.income_band_min >= min * 0.8) {
      signals.push(0.6);
      notes.push("Illustrative starting income is close to your minimum");
    } else {
      signals.push(0.2);
      notes.push("Illustrative starting income is below the minimum you stated");
      if (constraints.hard.includes("income")) hardFailures.push("Illustrative income band is below your minimum");
    }
  }

  if (constraints.district) {
    const inDistrict = career.availability.some((entry) => entry.districts.includes(constraints.district));
    const inState = career.availability.some((entry) => entry.state === constraints.state);
    if (inDistrict) {
      signals.push(1);
      notes.push(`Opportunities seeded in ${constraints.district}`);
    } else if (inState) {
      signals.push(0.7);
      notes.push("Opportunities exist in your state but not in your district");
      if (constraints.hard.includes("location")) hardFailures.push("No seeded opportunities in your district");
    } else {
      signals.push(0.3);
      notes.push("Main opportunities are outside your state");
      if (constraints.hard.includes("location")) hardFailures.push("Opportunities are outside your state");
    }
  }

  if (signals.length === 0) {
    return { score: null, detail: "", hardFailures };
  }

  const score = clamp01(signals.reduce((a, b) => a + b, 0) / signals.length);
  return { score, detail: notes[0] ?? "Compared with the limits you stated", hardFailures };
}

export function scoreCareer(
  profile: StudentProfile,
  career: Career,
  options: ScoreCareerOptions = {},
): ScoredCareer {
  const weights = normalizeWeights(options.weights ?? DEFAULT_WEIGHTS);

  const education = educationFactor(profile, career);
  const constraint = constraintFactor(profile, career);

  const results: Record<FactorKey, FactorResult> = {
    interest: interestFactor(profile, career),
    skill: skillFactor(profile, career),
    aptitude: aptitudeFactor(profile, career),
    preference: preferenceFactor(profile, career),
    education: { score: education.score, detail: education.detail },
    constraint: { score: constraint.score, detail: constraint.detail },
  };

  const contributions: FactorContribution[] = FACTOR_KEYS.map((factor) => {
    const result = results[factor];
    const available = result.score !== null;
    const score = result.score ?? 0;
    return {
      factor,
      score,
      weight: weights[factor],
      contribution: score * weights[factor],
      available,
      detail: result.detail || `${FACTOR_LABELS[factor].en} — no data provided`,
    } satisfies FactorContribution;
  });

  const availableWeight = contributions
    .filter((c) => c.available)
    .reduce((sum, c) => sum + c.weight, 0);
  const weightedTotal = contributions
    .filter((c) => c.available)
    .reduce((sum, c) => sum + c.contribution, 0);

  const rawScore = availableWeight > 0 ? clamp01(weightedTotal / availableWeight) : 0;

  const factors = FACTOR_KEYS.reduce((acc, key) => {
    acc[key] = results[key].score ?? 0;
    return acc;
  }, {} as FactorScores);

  const ineligibleReasons: string[] = [];
  if (!options.whatIf && !education.eligible) {
    ineligibleReasons.push(`Entry requirement not met: needs ${career.min_education_level}`);
  }
  ineligibleReasons.push(...constraint.hardFailures);

  return {
    career,
    rawScore,
    displayScore: Math.round(rawScore * 100),
    confidence: Number(availableWeight.toFixed(3)),
    factors,
    contributions,
    eligible: ineligibleReasons.length === 0,
    ineligibleReasons,
    skillGap: computeSkillGap(profile, career),
  };
}

export { getSkillName as skillLabel };
