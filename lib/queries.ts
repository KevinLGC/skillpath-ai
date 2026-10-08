import "server-only";
import { cache } from "react";
import { getActiveStudentId, getSessionUser } from "@/lib/auth/session";
import { getStore, useLocalStore, type AssessmentRecord } from "@/lib/db";
import { DEMO_ASSESSMENT_ID, DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "@/lib/demo/answers";
import { getCareer } from "@/lib/data";
import { rankCareers, recommendationFor } from "@/lib/recommendation";
import type { Career, Recommendation, StudentOverview, StudentProfile } from "@/lib/types";

export interface StudentContext {
  user: Awaited<ReturnType<typeof getSessionUser>>;
  studentId: string | null;
  studentName: string;
  /** True when we are showing the seeded demo student because nobody is signed in. */
  isDemoFallback: boolean;
  assessment: AssessmentRecord | null;
  profile: StudentProfile | null;
  recommendations: Recommendation[];
}

/**
 * One place that answers "whose data is this and what do we know about them".
 *
 * Pages never read the store directly: they ask for a context, which guarantees
 * every screen has the same fallback behaviour (signed-in student → their data;
 * demo → the seeded student; nothing at all → empty states, never fake numbers).
 */
export async function getStudentContext(options: { allowDemoFallback?: boolean } = {}): Promise<StudentContext> {
  const user = await getSessionUser();
  const allowDemoFallback = options.allowDemoFallback ?? true;

  let studentId = await getActiveStudentId(user);
  let isDemoFallback = false;

  if (!studentId && allowDemoFallback) {
    studentId = DEMO_STUDENT_ID;
    isDemoFallback = true;
  }

  if (!studentId) {
    return { user, studentId: null, studentName: "", isDemoFallback, assessment: null, profile: null, recommendations: [] };
  }

  // Fast path: for demo student or demo session, use memory store (0ms)
  const isDemo = user?.kind === "demo" || studentId === DEMO_STUDENT_ID;
  const store = isDemo ? useLocalStore() : getStore();

  const [assessments, storedRecommendations] = await Promise.all([
    store.listAssessments(studentId),
    store.getRecommendationsForStudent(studentId),
  ]);
  let assessment = assessments[assessments.length - 1] ?? null;
  if (!assessment && studentId === DEMO_STUDENT_ID) {
    assessment = await store.getAssessment(DEMO_ASSESSMENT_ID);
  }

  const profile = assessment?.profile ?? null;
  let recommendations = storedRecommendations;

  if (recommendations.length === 0 && profile) {
    recommendations = rankCareers(profile, { limit: 8 }).map((rec) => ({ ...rec, studentId }));
    if (assessment) await store.saveRecommendations(assessment.id, studentId, recommendations);
  }

  const studentName =
    studentId === DEMO_STUDENT_ID ? DEMO_STUDENT_NAME : (user?.name ?? "Student");

  return {
    user,
    studentId,
    studentName,
    isDemoFallback,
    assessment,
    profile,
    recommendations,
  };
}

export interface CareerFit {
  career: Career;
  recommendation: Recommendation;
}

/** Fit for one career against the current (or demo) student profile. */
export async function getCareerFit(careerSlug: string): Promise<CareerFit | null> {
  const career = getCareer(careerSlug);
  if (!career) return null;
  const context = await getStudentContext();
  if (!context.profile) return null;
  return { career, recommendation: recommendationFor(context.profile, career) };
}

/** Cached per request so the counsellor page and the engagement summary share one roster read. */
export const getCounsellorRoster = cache(async (): Promise<StudentOverview[]> => {
  const user = await getSessionUser();
  const store = user?.kind === "demo" ? useLocalStore() : getStore();
  return store.listStudents();
});

export async function getStudentById(studentId: string) {
  const isDemo = studentId === DEMO_STUDENT_ID;
  const store = isDemo ? useLocalStore() : getStore();
  const [assessments, recommendations, roster, notes] = await Promise.all([
    store.listAssessments(studentId),
    store.getRecommendationsForStudent(studentId),
    store.listStudents(),
    store.listNotes(studentId),
  ]);
  const assessment =
    assessments[assessments.length - 1] ??
    (studentId === DEMO_STUDENT_ID ? await store.getAssessment(DEMO_ASSESSMENT_ID) : null);
  return {
    studentId,
    overview: roster.find((item: StudentOverview) => item.studentId === studentId) ?? null,
    assessment,
    profile: assessment?.profile ?? null,
    recommendations,
    notes,
  };
}

export interface EngagementSummary {
  students: number;
  completed: number;
  needsReview: number;
  plans: number;
}

export async function getEngagementSummary(): Promise<EngagementSummary> {
  // getCounsellorRoster is request-cached, so calling it here does not repeat
  // the roster read the counsellor page already made.
  const roster = await getCounsellorRoster();
  const user = await getSessionUser();
  const store = user?.kind === "demo" ? useLocalStore() : getStore();

  // Parallel fetch instead of slow serial for-loop
  const recsList = await Promise.all(
    roster.map((student) => store.getRecommendationsForStudent(student.studentId).catch(() => [])),
  );
  const plans = recsList.filter((recs: Recommendation[]) => recs.length > 0).length;

  return {
    students: roster.length,
    completed: roster.filter((s) => s.status === "completed").length,
    needsReview: roster.filter((s) => s.status === "needs_review" || s.status === "assessment_pending").length,
    plans,
  };
}
