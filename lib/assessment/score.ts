import { DEFAULT_SCALE_OPTIONS } from "@/lib/assessment/scale";
import { questions } from "@/lib/data";
import { isLocale } from "@/lib/i18n/config";
import {
  EDUCATION_LEVELS,
  type AssessmentQuestion,
  type EducationLevel,
  type Locale,
  type QuestionOption,
  type StudentConstraints,
  type StudentPreferences,
  type StudentProfile,
} from "@/lib/types";

export const ASSESSMENT_ENGINE_VERSION = "assessment-1.0.0";

export interface RawAnswer {
  questionId: string;
  /** "3" for scale/single, or an array of option values for multi. */
  value: string | string[];
}

export interface ScoreAssessmentInput {
  answers: RawAnswer[];
  educationLevel: EducationLevel;
  constraints: StudentConstraints;
  assessmentId: string;
}

export interface ScoreAssessmentResult {
  profile: StudentProfile;
  /** Per-question normalized 0–100 score, kept for transparency/debugging. */
  questionScores: { questionId: string; target: string; dimension: string; score: number }[];
  answered: number;
  total: number;
}

export function optionsFor(question: AssessmentQuestion): QuestionOption[] {
  return question.type === "scale" ? DEFAULT_SCALE_OPTIONS : (question.options ?? []);
}

/** Reverse-scored items invert within the scale range rather than using 0–100 padding. */
export function reverseScore(score: number): number {
  const min = DEFAULT_SCALE_OPTIONS[0]?.score ?? 20;
  const max = DEFAULT_SCALE_OPTIONS[DEFAULT_SCALE_OPTIONS.length - 1]?.score ?? 100;
  return min + max - score;
}

function optionScore(question: AssessmentQuestion, value: string): number | null {
  const option = optionsFor(question).find((o) => o.value === value);
  if (!option) return null;
  return question.reverse ? reverseScore(option.score) : option.score;
}

function weightedMean(entries: { value: number; weight: number }[]): number | null {
  const usable = entries.filter((entry) => Number.isFinite(entry.value));
  if (usable.length === 0) return null;
  const totalWeight = usable.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) return null;
  const total = usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0);
  return Math.round(total / totalWeight);
}

export function parseEducationLevel(value: string): EducationLevel {
  return (EDUCATION_LEVELS as readonly string[]).includes(value)
    ? (value as EducationLevel)
    : "class10";
}

/**
 * Turns raw answers into the normalized profile the matching engine consumes.
 * No model is involved: the same answers always produce the same profile.
 */
export function scoreAssessment(input: ScoreAssessmentInput): ScoreAssessmentResult {
  const answerMap = new Map(input.answers.map((a) => [a.questionId, a.value]));
  const questionScores: ScoreAssessmentResult["questionScores"] = [];

  const interestEntries = new Map<string, { value: number; weight: number }[]>();
  const abilityEntries = new Map<string, { value: number; weight: number }[]>();
  const skillEntries = new Map<string, { value: number; weight: number }[]>();

  const preferences: StudentPreferences = {
    workEnvironments: [],
    sector: null,
    team: null,
    relocation: null,
  };

  let answered = 0;

  for (const question of questions) {
    const raw = answerMap.get(question.id);
    if (raw === undefined || (Array.isArray(raw) && raw.length === 0)) continue;

    if (question.type === "multi") {
      if (question.target === "work_environment" && Array.isArray(raw)) {
        preferences.workEnvironments = raw as StudentPreferences["workEnvironments"];
      }
      answered += 1;
      continue;
    }

    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined) continue;
    const score = optionScore(question, value);
    if (score === null) continue;

    answered += 1;
    questionScores.push({
      questionId: question.id,
      target: question.target,
      dimension: question.dimension,
      score,
    });

    const entry = { value: score, weight: question.weight };
    switch (question.dimension) {
      case "interest":
        push(interestEntries, question.target, entry);
        break;
      case "aptitude":
      case "practical":
        push(abilityEntries, question.target, entry);
        break;
      case "skill":
        push(skillEntries, question.target, entry);
        break;
      case "preference": {
        if (question.target === "team" && (value === "individual" || value === "team" || value === "either")) {
          preferences.team = value;
        } else if (
          question.target === "sector" &&
          (value === "government" || value === "private" || value === "entrepreneurship" || value === "any")
        ) {
          preferences.sector = value;
        } else if (
          question.target === "relocation" &&
          (value === "willing" || value === "maybe" || value === "not_willing")
        ) {
          preferences.relocation = value;
        }
        break;
      }
      default:
        break;
    }
  }

  const interests: Record<string, number> = {};
  for (const [slug, entries] of interestEntries) {
    const mean = weightedMean(entries);
    if (mean !== null) interests[slug] = mean;
  }

  const abilities: Record<string, number> = {};
  for (const [slug, entries] of abilityEntries) {
    const mean = weightedMean(entries);
    if (mean !== null) abilities[slug] = mean;
  }

  const skills: Record<string, number> = {};
  for (const [slug, entries] of skillEntries) {
    const mean = weightedMean(entries);
    if (mean !== null) skills[slug] = mean;
  }

  const constraintFields = [
    input.constraints.budgetMaxInr,
    input.constraints.durationMaxMonths,
    input.constraints.minIncomeInr,
    input.constraints.district || null,
  ];
  const constraintAnswered = constraintFields.filter((value) => value !== null && value !== "").length;
  const expected = questions.length + 4;
  const coverage = Math.min(1, Number(((answered + constraintAnswered) / expected).toFixed(3)));

  return {
    profile: {
      assessmentId: input.assessmentId,
      educationLevel: input.educationLevel,
      interests,
      abilities,
      skills,
      preferences,
      constraints: input.constraints,
      coverage,
      engineVersion: ASSESSMENT_ENGINE_VERSION,
    },
    questionScores,
    answered,
    total: questions.length,
  };
}

function push<T>(map: Map<string, T[]>, key: string, value: T) {
  const existing = map.get(key);
  if (existing) existing.push(value);
  else map.set(key, [value]);
}

export function localizedQuestionText(question: AssessmentQuestion, locale: Locale): string {
  return isLocale(locale) && locale === "te" ? question.text_te : question.text_en;
}
