import { careers as allCareers } from "@/lib/data";
import { buildExplanation } from "@/lib/recommendation/explain";
import { scoreCareer, type ScoreCareerOptions } from "@/lib/recommendation/score";
import {
  DEFAULT_WEIGHTS,
  ENGINE_VERSION,
  FACTOR_LABELS,
  normalizeWeights,
  WEIGHTS_VERSION,
} from "@/lib/recommendation/weights";
import type { Career, FactorScores, Recommendation, StudentProfile } from "@/lib/types";

export interface RankOptions extends ScoreCareerOptions {
  limit?: number;
  /** Include careers that fail a hard constraint (used for "why not" explanations). */
  includeIneligible?: boolean;
  weightsVersion?: string;
  /** Injectable clock keeps tests deterministic. */
  now?: () => Date;
  careerList?: Career[];
}

/**
 * Ranks careers for a profile.
 *
 * Ordering is fully deterministic: score descending, then career slug
 * ascending. Two runs on the same profile always produce the same order —
 * which is exactly what a family needs if they come back to the same result.
 */
export function rankCareers(profile: StudentProfile, options: RankOptions = {}): Recommendation[] {
  const weights = normalizeWeights(options.weights ?? DEFAULT_WEIGHTS);
  const now = options.now ?? (() => new Date());
  const createdAt = now().toISOString();
  const list = options.careerList ?? allCareers;

  const scored = list
    .map((career) => scoreCareer(profile, career, options))
    .filter((scored) => options.includeIneligible || scored.eligible);

  scored.sort((a, b) => {
    if (b.rawScore !== a.rawScore) return b.rawScore - a.rawScore;
    return a.career.slug.localeCompare(b.career.slug);
  });

  const limited = typeof options.limit === "number" ? scored.slice(0, options.limit) : scored;

  return limited.map((item) => ({
    id: `rec-${profile.assessmentId}-${item.career.slug}`,
    studentId: "",
    assessmentId: profile.assessmentId,
    careerSlug: item.career.slug,
    score: item.displayScore,
    rawScore: Number(item.rawScore.toFixed(6)),
    confidence: item.confidence,
    factors: item.factors,
    contributions: item.contributions,
    explanation: buildExplanation(profile, item),
    skillGap: item.skillGap,
    eligible: item.eligible,
    ineligibleReasons: item.ineligibleReasons,
    engineVersion: ENGINE_VERSION,
    weightsVersion: options.weightsVersion ?? WEIGHTS_VERSION,
    createdAt,
  }));
}

/** Single-career lookup used by the career detail, roadmap and skill-gap pages. */
export function recommendationFor(profile: StudentProfile, career: Career, options: ScoreCareerOptions = {}): Recommendation {
  const [primary] = rankCareers(profile, { ...options, careerList: [career] });
  if (primary) return primary;
  const [fallback] = rankCareers(profile, { ...options, careerList: [career], includeIneligible: true });
  if (!fallback) throw new Error(`Unable to score career ${career.slug}`);
  return fallback;
}

export { scoreCareer } from "@/lib/recommendation/score";
export type { ScoredCareer } from "@/lib/recommendation/score";
export { buildExplanation } from "@/lib/recommendation/explain";
export { DEFAULT_WEIGHTS, ENGINE_VERSION, FACTOR_KEYS, FACTOR_LABELS, WEIGHTS_VERSION, normalizeWeights } from "@/lib/recommendation/weights";
export { estimatedTrainingCost, COST_BAND_INR, LIVING_COST_ESTIMATE_INR } from "@/lib/recommendation/cost";

export function factorLabel(factor: keyof FactorScores, locale: "en" | "te" = "en"): string {
  return FACTOR_LABELS[factor][locale];
}
