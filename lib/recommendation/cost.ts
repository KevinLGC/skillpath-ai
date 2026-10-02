import { coursesForCareer } from "@/lib/data";
import type { Career, CostBand } from "@/lib/types";

/**
 * Illustrative cost bands in INR, used only when no seeded course carries a
 * fee. These are demo figures for the prototype and are always rendered with an
 * "illustrative" label — they are never presented as current official fees.
 */
export const COST_BAND_INR: Record<CostBand, number> = {
  low: 15000,
  medium: 35000,
  high: 70000,
};

export interface EstimatedCost {
  amountInr: number;
  quality: "illustrative";
  /** Where the number came from, shown in the cost breakdown. */
  basis: string;
}

export function estimatedTrainingCost(career: Career): EstimatedCost {
  const careerCourses = coursesForCareer(career.slug)
    .map((course) => course.cost_inr)
    .filter((amount) => amount > 0)
    .sort((a, b) => a - b);

  const cheapest = careerCourses[0];
  if (cheapest !== undefined) {
    return {
      amountInr: cheapest,
      quality: "illustrative",
      basis: "Lowest seeded course fee for this pathway",
    };
  }

  return {
    amountInr: COST_BAND_INR[career.cost_band],
    quality: "illustrative",
    basis: `Illustrative "${career.cost_band}" cost band`,
  };
}

/** Living/transport allowance assumption used in the family cost simulator. */
export const LIVING_COST_ESTIMATE_INR = 20000;
