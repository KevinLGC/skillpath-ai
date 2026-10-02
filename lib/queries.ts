import "server-only";
import { getActiveStudentId, getSessionUser } from "@/lib/auth/session";
import { getStore, useLocalStore, type AssessmentRecord } from "@/lib/db";
import { DEMO_ASSESSMENT_ID, DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "@/lib/demo/student";
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

  const assessments = await store.listAssessments(studentId);
  let assessment = assessments[assessments.length - 1] ?? null;
  if (!assessment && studentId === DEMO_STUDENT_ID) {
    assessment = await store.getAssessment(DEMO_ASSESSMENT_ID);
  }

  const profile = assessment?.profile ?? null;
  let recommendations = await store.getRecommendationsForStudent(studentId);

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

export async function getCounsellorRoster(): Promise<StudentOverview[]> {
  const user = await getSessionUser();
  const store = user?.kind === "demo" ? useLocalStore() : getStore();
  const roster = await store.listStudents();
  return roster;
}

export async function getStudentById(studentId: string) {
  const isDemo = studentId === DEMO_STUDENT_ID;
  const store = isDemo ? useLocalStore() : getStore();
  const assessments = await store.listAssessments(studentId);
  const assessment = assessments[assessments.length - 1] ?? (studentId === DEMO_STUDENT_ID ? await store.getAssessment(DEMO_ASSESSMENT_ID) : null);
  const recommendations = await store.getRecommendationsForStudent(studentId);
  const roster = await store.listStudents();
  return {
    studentId,
    overview: roster.find((item: StudentOverview) => item.studentId === studentId) ?? null,
    assessment,
    profile: assessment?.profile ?? null,
    recommendations,
    notes: await store.listNotes(studentId),
  };
}

export interface EngagementSummary {
  students: number;
  completed: number;
  needsReview: number;
  plans: number;
}

export async function getEngagementSummary(): Promise<EngagementSummary> {
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
