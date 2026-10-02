import { z } from "zod";
import { checkQuota, consumeQuota } from "@/lib/ai/quota";
import { getActiveStudentId, getSessionUser } from "@/lib/auth/session";
import { getStore } from "@/lib/db";
import { DEMO_STUDENT_ID } from "@/lib/demo/student";
import { askCounsellor } from "@/lib/rag/answer";
import { newId } from "@/lib/utils/id";
import type { Recommendation } from "@/lib/types";

const requestSchema = z.object({
  question: z.string().min(3).max(600),
  roleContext: z.enum(["student", "family", "counsellor"]).default("student"),
  sessionId: z.string().min(1).nullable().optional(),
  forceKeywordRetrieval: z.boolean().optional(),
});

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ error: "Invalid question payload" }, { status: 400 });
  }

  const user = await getSessionUser();
  const userId = user?.id ?? "anonymous-demo";

  const quota = await checkQuota(userId);
  if (!quota.allowed) {
    return Response.json(
      {
        error: "Daily AI question limit reached",
        detail: `You have used ${quota.used} of ${quota.limit} questions today. The rest of the platform keeps working.`,
      },
      { status: 429 },
    );
  }

  const studentId = (await getActiveStudentId(user)) ?? DEMO_STUDENT_ID;
  const store = getStore();
  const recommendations: Recommendation[] = await store.getRecommendationsForStudent(studentId);
  const assessments = await store.listAssessments(studentId);
  const profile = assessments[assessments.length - 1]?.profile ?? null;

  // Career slugs the student is currently matched with are used to boost
  // retrieval toward documents that are relevant to their actual shortlist.
  const careerSlugs = recommendations.slice(0, 3).map((rec) => rec.careerSlug);

  const existingSession = parsed.data.sessionId ? await store.getChatSession(parsed.data.sessionId) : null;
  const session =
    existingSession ??
    (await store.createChatSession({
      userId,
      studentId,
      roleContext: parsed.data.roleContext,
      locale: user?.locale ?? "en",
      profileSnapshot: profile,
    }));

  const answer = await askCounsellor({
    question: parsed.data.question,
    profile,
    roleContext: parsed.data.roleContext,
    locale: session.locale,
    retrieveOptions: { careerSlugs },
    forceKeywordRetrieval: parsed.data.forceKeywordRetrieval,
  });

  const now = new Date().toISOString();
  await store.appendMessage({
    id: newId("msg"),
    sessionId: session.id,
    role: "user",
    content: parsed.data.question,
    grounding: null,
    sources: [],
    mode: null,
    createdAt: now,
  });
  await store.appendMessage({
    id: newId("msg"),
    sessionId: session.id,
    role: "assistant",
    content: answer.answer,
    grounding: answer.grounding,
    sources: answer.sources,
    mode: answer.mode,
    createdAt: new Date().toISOString(),
  });

  await consumeQuota(userId);

  return Response.json({
    sessionId: session.id,
    answer: answer.answer,
    grounding: answer.grounding,
    sources: answer.sources,
    uncertainty: answer.uncertainty,
    mode: answer.mode,
    model: answer.model,
    latencyMs: answer.latencyMs,
    quota: { used: quota.used + 1, limit: quota.limit },
  });
}

/** Conversation history for a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  if (!sessionId) return Response.json({ error: "sessionId is required" }, { status: 400 });

  const store = getStore();
  const session = await store.getChatSession(sessionId);
  if (!session) return Response.json({ error: "Session not found" }, { status: 404 });

  const messages = await store.listMessages(sessionId);
  return Response.json({
    session: { id: session.id, roleContext: session.roleContext, locale: session.locale },
    messages: messages.map((message) => ({
      role: message.role,
      content: message.content,
      grounding: message.grounding,
      sources: message.sources,
      mode: message.mode,
      createdAt: message.createdAt,
    })),
  });
}
