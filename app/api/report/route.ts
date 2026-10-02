import { z } from "zod";
import { getActiveStudentId, getSessionUser } from "@/lib/auth/session";
import { getCareer } from "@/lib/data";
import { getStore, useLocalStore } from "@/lib/db";
import { DEMO_ASSESSMENT_ID, DEMO_STUDENT_ID, DEMO_STUDENT_NAME } from "@/lib/demo/student";
import { recommendationFor } from "@/lib/recommendation";
import { buildDecisionReport } from "@/lib/report";
import { newId, shareToken } from "@/lib/utils/id";

const schema = z.object({
  careerSlug: z.string().min(1),
  /** When true, the report is also published behind a fresh share token. */
  shareWithFamily: z.boolean().default(false),
  locale: z.enum(["en", "te"]).default("en"),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "Invalid report request" }, { status: 400 });

  const career = getCareer(parsed.data.careerSlug);
  if (!career) return Response.json({ error: "Unknown career" }, { status: 404 });

  const user = await getSessionUser();
  const studentId = (await getActiveStudentId(user)) ?? DEMO_STUDENT_ID;
  const isDemo = user?.kind === "demo" || studentId === DEMO_STUDENT_ID;
  const store = isDemo ? useLocalStore() : getStore();

  const assessments = await store.listAssessments(studentId);
  const assessment =
    assessments[assessments.length - 1] ??
    (studentId === DEMO_STUDENT_ID
      ? await store.getAssessment(DEMO_ASSESSMENT_ID)
      : null);

  if (!assessment) {
    return Response.json(
      { error: "No assessment yet", detail: "Complete the assessment before generating a family report." },
      { status: 409 },
    );
  }

  const recommendation = recommendationFor(assessment.profile, career);
  const reportId = newId("report");
  const token = parsed.data.shareWithFamily ? shareToken() : null;

  const report = buildDecisionReport({
    id: reportId,
    studentId,
    studentName: studentId === DEMO_STUDENT_ID ? DEMO_STUDENT_NAME : (user?.name ?? "Student"),
    profile: assessment.profile,
    career,
    recommendation,
    locale: parsed.data.locale,
  });

  await store.saveReport({ id: reportId, studentId, careerSlug: career.slug, shareToken: token, report });

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return Response.json({
    reportId,
    shareUrl: token ? `${base}/share/${token}?report=1` : null,
    reportUrl: `/report/${reportId}`,
    score: recommendation.score,
  });
}
