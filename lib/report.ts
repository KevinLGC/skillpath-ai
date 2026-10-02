import { documentsForCareer, getSkillName } from "@/lib/data";
import { buildRoadmap, roadmapTimeline } from "@/lib/roadmap";
import { estimatedTrainingCost, LIVING_COST_ESTIMATE_INR } from "@/lib/recommendation/cost";
import type {
  AnswerSource,
  Career,
  DecisionReport,
  Locale,
  Recommendation,
  StudentProfile,
} from "@/lib/types";

/**
 * The final demo moment: a report a family can print and keep.
 *
 * The snapshot is frozen at generation time on purpose — a family should be able
 * to look at the same document a week later, even if the student has since
 * changed their answers.
 */
export function buildDecisionReport(input: {
  id: string;
  studentId: string;
  studentName: string;
  profile: StudentProfile;
  career: Career;
  recommendation: Recommendation;
  locale: Locale;
  now?: Date;
}): DecisionReport {
  const { career, recommendation, profile, locale } = input;
  const cost = estimatedTrainingCost(career);
  const { steps } = buildRoadmap(profile, career);
  const timeline = roadmapTimeline(steps);

  const sources: AnswerSource[] = documentsForCareer(career.slug)
    .slice(0, 4)
    .map((doc, index) => ({
      marker: `S${index + 1}`,
      title: doc.title,
      sourceOrg: doc.source_org,
      sourceUrl: doc.source_url,
      retrievedAt: doc.retrieved_at,
      dataQuality: doc.data_quality,
    }));

  return {
    id: input.id,
    studentId: input.studentId,
    careerSlug: career.slug,
    locale,
    createdAt: (input.now ?? new Date()).toISOString(),
    snapshot: {
      studentName: input.studentName,
      educationLevel: profile.educationLevel,
      district: profile.constraints.district || "—",
      careerTitle: locale === "te" ? career.title_te : career.title_en,
      summary: locale === "te" ? career.summary_te : career.summary_en,
      score: recommendation.score,
      factors: recommendation.contributions,
      explanation: recommendation.explanation,
      skillGap: recommendation.skillGap.map((row) => ({
        ...row,
        name_en: getSkillName(row.skill),
      })),
      pathway: career.pathways,
      costs: [
        { label: "Training (lowest seeded course)", amountInr: cost.amountInr, quality: cost.quality },
        { label: "Living / transport allowance (illustrative)", amountInr: LIVING_COST_ESTIMATE_INR, quality: "illustrative" },
      ],
      timeline: timeline.map((item) => ({ year: item.label, label: item.title, quality: career.data_quality })),
      furtherEducation: career.further_education_en,
      considerations: career.considerations_en,
      sources,
      disclaimer:
        "AI provides guidance and does not replace professional career counselling. Figures shown are illustrative demo data unless labelled as sourced. Verify fees, eligibility and scheme details with the institution or the official portal before deciding.",
    },
  };
}
