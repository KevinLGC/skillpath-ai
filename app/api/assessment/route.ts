import { z } from "zod";
import { getActiveStudentId, getSessionUser } from "@/lib/auth/session";
import { scoreAssessment } from "@/lib/assessment/score";
import { getStore, useLocalStore } from "@/lib/db";
import { DEMO_STUDENT_ID } from "@/lib/demo/student";
import { rankCareers } from "@/lib/recommendation";
import { newId } from "@/lib/utils/id";

const payloadSchema = z.object({
  educationLevel: z.enum(["class8", "class10", "class12", "iti", "diploma", "graduate"]),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(1),
        value: z.union([z.string(), z.array(z.string())]),
      }),
    )
    .min(1),
  constraints: z.object({
    budgetMaxInr: z.number().int().nonnegative().nullable(),
    durationMaxMonths: z.number().int().nonnegative().nullable(),
    minIncomeInr: z.number().int().nonnegative().nullable(),
    state: z.string().max(80),
    district: z.string().max(80),
    hard: z.array(z.enum(["budget", "duration", "income", "location"])),
  }),
});

/**
 * Assessment submission.
 *
 * Scoring, ranking and explanation all happen on the server, in one transaction
 * of work, so the client can never submit its own scores — and so the trace
 * stored with each recommendation matches exactly what the student will see.
 */
export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid assessment payload", detail: parsed.error.issues }, { status: 400 });
  }

  const user = await getSessionUser();
  const studentId = (await getActiveStudentId(user)) ?? DEMO_STUDENT_ID;
  const assessmentId = newId("assessment");

  const scored = scoreAssessment({
    answers: parsed.data.answers,
    educationLevel: parsed.data.educationLevel,
    constraints: parsed.data.constraints,
    assessmentId,
  });

  const isDemo = user?.kind === "demo" || studentId === DEMO_STUDENT_ID;
  const store = isDemo ? useLocalStore() : getStore();
  await store.saveAssessment({
    id: assessmentId,
    studentId,
    educationLevel: parsed.data.educationLevel,
    answers: parsed.data.answers,
    constraints: parsed.data.constraints,
    profile: scored.profile,
    createdAt: new Date().toISOString(),
  });

  const recommendations = rankCareers(scored.profile, { limit: 10 }).map((rec) => ({ ...rec, studentId }));
  await store.saveRecommendations(assessmentId, studentId, recommendations);

  return Response.json({
    assessmentId,
    answered: scored.answered,
    total: scored.total,
    coverage: scored.profile.coverage,
    top: recommendations.slice(0, 3).map((rec) => ({ slug: rec.careerSlug, score: rec.score })),
    redirect: "/results",
  });
}
