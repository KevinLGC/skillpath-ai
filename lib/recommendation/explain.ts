import { getInterestName } from "@/lib/data";
import type { Career, MatchExplanation, StudentProfile } from "@/lib/types";
import type { ScoredCareer } from "@/lib/recommendation/score";

/**
 * Explanations are generated in code from the factor scores — deliberately not
 * by a language model. The plan is explicit that an LLM must not invent
 * percentages or reasons, so the wording is templated and tied to real numbers.
 */
export function buildExplanation(
  profile: StudentProfile,
  scored: ScoredCareer,
): MatchExplanation {
  const { career, contributions, skillGap } = scored;

  const strongAlignment: string[] = [];
  const considerations: string[] = [];

  for (const contribution of contributions) {
    if (!contribution.available) continue;
    if (contribution.score >= 0.7) {
      strongAlignment.push(capitalize(contribution.detail));
    } else if (contribution.score < 0.5) {
      considerations.push(capitalize(contribution.detail));
    }
  }

  // Career-level considerations from curated content (max 3, keeps the list actionable).
  for (const note of career.considerations_en.slice(0, 3)) {
    considerations.push(note);
  }

  const skillsToImprove = skillGap
    .filter((row) => row.known && row.gap > 0)
    .slice(0, 4)
    .map((row) => `${row.name_en} (${row.have}/100 → ${row.required}/100 needed)`);

  const nextSteps = career.pathways
    .filter((stage) => stage.type === "training" || stage.type === "certification")
    .slice(0, 3)
    .map((stage) => stage.title_en);

  const unknownSkills = skillGap.filter((row) => !row.known).length;
  const confidenceNote = buildConfidenceNote(profile, scored, unknownSkills);

  return {
    strongAlignment: dedupe(strongAlignment).slice(0, 5),
    considerations: dedupe(considerations).slice(0, 5),
    skillsToImprove,
    nextSteps,
    confidenceNote,
  };
}

function buildConfidenceNote(profile: StudentProfile, scored: ScoredCareer, unknownSkills: number): string {
  const available = scored.contributions.filter((c) => c.available).length;
  const parts: string[] = [
    `Scored on ${available} of ${scored.contributions.length} factors (${Math.round(scored.confidence * 100)}% of the weighting).`,
  ];
  if (profile.coverage < 0.75) {
    parts.push("Your profile is incomplete, so this match is less certain.");
  }
  if (unknownSkills > 0) {
    parts.push(`${unknownSkills} required skill${unknownSkills === 1 ? "" : "s"} were not self-rated.`);
  }
  const topInterest = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])[0];
  if (topInterest) {
    parts.push(`Your strongest interest area in the assessment was ${getInterestName(topInterest[0])}.`);
  }
  return parts.join(" ");
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function dedupe(values: string[]): string[] {
  return [...new Set(values)];
}

/** Used by the "why not this career" panel for filtered-out matches. */
export function explainIneligibility(career: Career, reasons: string[]): string {
  if (reasons.length === 0) return `${career.title_en} was not filtered out.`;
  return reasons.join(" · ");
}
