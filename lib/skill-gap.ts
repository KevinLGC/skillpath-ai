import { getSkillName } from "@/lib/data";
import type { Career, SkillGapRow, StudentProfile } from "@/lib/types";

/**
 * Compares self-rated skills against what a career expects.
 *
 * A skill the student never rated is marked `known: false` with `gap: 0`
 * instead of being treated as a zero — otherwise a silent gap would be invented
 * and the learning plan would be built on a guess.
 */
export function computeSkillGap(profile: StudentProfile, career: Career): SkillGapRow[] {
  return career.skills
    .map((requirement) => {
      const rated = profile.skills[requirement.slug];
      const known = typeof rated === "number" && Number.isFinite(rated);
      const have = known ? Math.round(rated) : null;
      const gap = known ? Math.max(0, requirement.level - (have ?? 0)) : 0;
      return {
        skill: requirement.slug,
        name_en: getSkillName(requirement.slug),
        have,
        required: requirement.level,
        gap,
        known,
        priority: requirement.priority,
      } satisfies SkillGapRow;
    })
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority ? -1 : 1;
      if (b.gap !== a.gap) return b.gap - a.gap;
      return a.skill.localeCompare(b.skill);
    });
}

/** Skills that should be in the learning plan: known gaps, priority first. */
export function learningPlan(gap: SkillGapRow[]): SkillGapRow[] {
  return gap.filter((row) => row.known && row.gap > 0);
}

export function gapSummary(gap: SkillGapRow[]): {
  knownGaps: number;
  unknown: number;
  biggestGap: SkillGapRow | null;
} {
  const knownGaps = gap.filter((row) => row.known && row.gap > 0).length;
  const unknown = gap.filter((row) => !row.known).length;
  const biggest = gap.filter((row) => row.known).sort((a, b) => b.gap - a.gap)[0] ?? null;
  return { knownGaps, unknown, biggestGap: biggest };
}
