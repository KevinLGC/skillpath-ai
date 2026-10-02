import type { FactorKey, FactorScores } from "@/lib/types";

/**
 * Engine versioning. Recommendations store the version and the weights that
 * produced them, so a result shown to a family last week can always be
 * reproduced and explained later — even after the weights are tuned.
 */
export const ENGINE_VERSION = "engine-1.0.0";
export const WEIGHTS_VERSION = "weights-2026.10";

/** Plan §5 defaults. Configurable: stored in engine_config, editable in admin. */
export const DEFAULT_WEIGHTS: FactorScores = {
  interest: 0.25,
  skill: 0.25,
  aptitude: 0.2,
  preference: 0.1,
  education: 0.1,
  constraint: 0.1,
};

export const FACTOR_KEYS: FactorKey[] = [
  "interest",
  "skill",
  "aptitude",
  "preference",
  "education",
  "constraint",
];

export const FACTOR_LABELS: Record<FactorKey, { en: string; te: string }> = {
  interest: { en: "Interest match", te: "ఆసక్తి సరిపోలిక" },
  skill: { en: "Skill match", te: "నైపుణ్య సరిపోలిక" },
  aptitude: { en: "Aptitude match", te: "సామర్థ్య సరిపోలిక" },
  preference: { en: "Preferences", te: "ప్రాధాన్యతలు" },
  education: { en: "Education compatibility", te: "విద్య అనుకూలత" },
  constraint: { en: "Constraints", te: "పరిమితులు" },
};

/** Weights must sum to 1; anything else is a configuration bug, not a preference. */
export function normalizeWeights(weights: FactorScores): FactorScores {
  const sum = FACTOR_KEYS.reduce((total, key) => total + (weights[key] ?? 0), 0);
  if (sum <= 0) return { ...DEFAULT_WEIGHTS };
  return FACTOR_KEYS.reduce((acc, key) => {
    acc[key] = (weights[key] ?? 0) / sum;
    return acc;
  }, {} as FactorScores);
}
