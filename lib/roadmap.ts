import { educationRank, type Career, type EducationLevel, type RoadmapStep, type StudentProfile } from "@/lib/types";

/**
 * Builds the roadmap from the career's curated pathway stages and places the
 * "you are here" marker from the student's current education level. Durations
 * are carried from the pathway data, and every step keeps the career's
 * provenance label so estimates stay visually distinct from sourced facts.
 */
export function buildRoadmap(
  profile: Pick<StudentProfile, "educationLevel">,
  career: Career,
): { steps: RoadmapStep[]; youAreHereIndex: number } {
  const stages = [...career.pathways].sort((a, b) => a.stage - b.stage);
  const currentIndex = currentStageIndex(profile.educationLevel, stages.map((s) => s.type));

  const steps: RoadmapStep[] = stages.map((stage, index) => ({
    stage: stage.stage,
    type: stage.type,
    title_en: stage.title_en,
    title_te: stage.title_te,
    duration_months: stage.duration_months,
    note_en: stage.note_en,
    optional: stage.optional,
    status: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
    data_quality: career.data_quality,
  }));

  return { steps, youAreHereIndex: Math.max(0, currentIndex) };
}

function currentStageIndex(
  level: EducationLevel,
  types: Career["pathways"][number]["type"][],
): number {
  const rank = educationRank(level);
  const trainingIndex = types.indexOf("training");
  const afterTraining = types.findIndex(
    (type) => type === "certification" || type === "apprenticeship" || type === "employment",
  );

  // Still at school: the training stage is ahead of them.
  if (rank <= educationRank("class12")) {
    return trainingIndex >= 0 ? trainingIndex : 0;
  }

  // Already has an ITI/diploma/degree: training is behind them.
  if (afterTraining >= 0) return afterTraining;
  return Math.max(0, types.length - 1);
}

export function roadmapTimeline(steps: RoadmapStep[]): { label: string; title: string; optional: boolean }[] {
  let months = 0;
  const out: { label: string; title: string; optional: boolean }[] = [];
  for (const step of steps) {
    if (step.status === "done") continue;
    months += step.duration_months ?? 0;
    const yearLabel =
      step.duration_months === null
        ? "Beyond 3 years"
        : months <= 12
          ? "Year 1"
          : months <= 24
            ? "Year 2"
            : months <= 36
              ? "Year 3"
              : "Year 4+";
    out.push({ label: yearLabel, title: step.title_en, optional: step.optional });
  }
  return out;
}
