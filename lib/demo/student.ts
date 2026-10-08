import { scoreAssessment } from "@/lib/assessment/score";
import { rankCareers } from "@/lib/recommendation";
import {
  DEMO_ANSWERS,
  DEMO_ASSESSMENT_ID,
  DEMO_CONSTRAINTS,
  DEMO_STUDENT_ID,
  DEMO_STUDENT_NAME,
} from "@/lib/demo/answers";
import type { Recommendation, StudentProfile } from "@/lib/types";

/**
 * The SIH demo student (plan §23): Rahul, Class 12, Visakhapatnam, low budget,
 * strong in machines and maths.
 *
 * The profile is NOT hardcoded as scores — it is produced by running real
 * answers through the real assessment rubric, so the demo path exercises the
 * same code students use.
 *
 * The raw answers and constraints live in `lib/demo/answers.ts` (pure data) so
 * client components can use them without dragging the scoring engine and the
 * whole seed into the browser. This module adds the derived, server-side pieces
 * on top and re-exports the constants so existing server importers keep working.
 */

export {
  DEMO_ANSWERS,
  DEMO_ASSESSMENT_ID,
  DEMO_CONSTRAINTS,
  DEMO_STUDENT_ID,
  DEMO_STUDENT_NAME,
} from "@/lib/demo/answers";

export function buildDemoProfile(): StudentProfile {
  return scoreAssessment({
    answers: DEMO_ANSWERS,
    educationLevel: "class12",
    constraints: DEMO_CONSTRAINTS,
    assessmentId: DEMO_ASSESSMENT_ID,
  }).profile;
}

export function demoRecommendations(limit = 6): Recommendation[] {
  return rankCareers(buildDemoProfile(), { limit }).map((rec) => ({
    ...rec,
    studentId: DEMO_STUDENT_ID,
  }));
}
