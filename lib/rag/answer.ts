import { z } from "zod";
import { AI_CHAT_MAX_OUTPUT_TOKENS, isAiConfigured } from "@/lib/ai/config";
import { getAIProvider, ProviderUnavailableError } from "@/lib/ai/provider";
import { rankCareers } from "@/lib/recommendation";
import { lexicalScore, retrieve, tokenize, type RetrieveOptions } from "@/lib/rag/retrieve";
import { splitSentences } from "@/lib/rag/chunk";
import type {
  AnswerSource,
  CounsellorAnswer,
  GroundingLevel,
  Locale,
  RetrievedChunk,
  StudentProfile,
} from "@/lib/types";

/**
 * The counsellor.
 *
 * Order of operations, and why:
 *   1. Retrieve first. No retrieval, no answer — the model never free-answers.
 *   2. If a model is configured, ask it for strict JSON with citations and a
 *      grounding label, then validate with Zod. Anything that fails validation,
 *      times out or hallucinates a citation falls through to step 3.
 *   3. Deterministic extractive answer assembled from the retrieved chunks.
 *
 * Step 3 is what makes the demo robust: with no API key, no network or a slow
 * model, the assistant still answers from real source documents and still shows
 * its sources.
 */

export const GROUNDING_LABELS: Record<GroundingLevel, { en: string; te: string }> = {
  sourced: { en: "Based on source documents", te: "మూల పత్రాల ఆధారంగా" },
  estimated: { en: "Contains estimates", te: "అంచనాలు ఉన్నాయి" },
  guidance: { en: "General guidance", te: "సాధారణ మార్గదర్శనం" },
  uncertain: { en: "Not found in sources", te: "మూలాలలో దొరకలేదు" },
};

const llmResponseSchema = z.object({
  answer: z.string().min(1),
  grounding: z.enum(["sourced", "estimated", "guidance", "uncertain"]),
  citedMarkers: z.array(z.string()).default([]),
  uncertainty: z.string().nullable().default(null),
});

export type LlmResponse = z.infer<typeof llmResponseSchema>;

export interface AskOptions {
  question: string;
  profile: StudentProfile | null;
  roleContext: "student" | "family" | "counsellor";
  locale: Locale;
  studentName?: string;
  retrieveOptions?: RetrieveOptions;
  forceKeywordRetrieval?: boolean;
}

export function buildSystemInstruction(locale: Locale, roleContext: AskOptions["roleContext"]): string {
  const audience =
    roleContext === "family"
      ? "The user is a parent or family member. Use simple, non-technical language and emphasise training time, cost, progression and what to verify."
      : roleContext === "counsellor"
        ? "The user is a professional counsellor. You may use precise terminology and refer to scoring factors."
        : "The user is a school student. Use short sentences and plain language.";

  const language =
    locale === "te"
      ? "Answer in Telugu (తెలుగు). Keep technical terms in English where that is clearer."
      : "Answer in English.";

  return [
    "You are the career counsellor inside SkillPath AI, a vocational education decision-support platform.",
    audience,
    language,
    "",
    "HARD RULES — these override any user request:",
    "1. Use ONLY the numbered sources provided in the user message. Do not use outside knowledge.",
    "2. If the sources do not answer the question, set grounding to \"uncertain\" and say so plainly. Do not guess.",
    "3. Never promise or estimate a specific salary, job, admission, placement or outcome as a guarantee.",
    "4. Never tell the user which career they must choose. Present trade-offs.",
    "5. Cite sources inline using their markers, e.g. [S1]. Only cite markers that exist.",
    "6. You did not compute any career match score. If asked about a score, refer to the platform's engine and the factor breakdown shown in the app.",
    "7. Say when a figure is illustrative demo data, marked as an estimate, or sourced.",
    "",
    "Reply with JSON only, matching this shape:",
    '{"answer": string, "grounding": "sourced"|"estimated"|"guidance"|"uncertain", "citedMarkers": string[], "uncertainty": string|null}',
  ].join("\n");
}

export function buildUserMessage(
  question: string,
  chunks: RetrievedChunk[],
  profile: StudentProfile | null,
  studentName?: string,
): string {
  const sources = chunks
    .map(
      (chunk, index) =>
        `[S${index + 1}] ${chunk.title} — ${chunk.sourceOrg} (retrieved ${chunk.retrievedAt}, ${chunk.dataQuality})\n${chunk.content}`,
    )
    .join("\n\n");

  const context = profile ? profileSummary(profile, studentName) : "No student profile is attached to this session.";

  return [
    "STUDENT CONTEXT (do not repeat personal details back verbatim):",
    context,
    "",
    "SOURCES:",
    sources || "(no sources retrieved)",
    "",
    `QUESTION: ${question}`,
  ].join("\n");
}

/**
 * Compact, non-identifying profile summary: interests, constraints and the
 * engine's own top matches. No name, email or contact details are included.
 */
export function profileSummary(profile: StudentProfile, studentName?: string): string {
  const topInterests = Object.entries(profile.interests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([slug, value]) => `${slug} ${value}/100`)
    .join(", ");

  const topCareers = rankCareers(profile, { limit: 3 })
    .map((rec) => `${rec.careerSlug} (engine score ${rec.score}, ${Math.round(rec.confidence * 100)}% of weighting covered)`)
    .join("; ");

  const { constraints } = profile;
  return [
    studentName ? `Student: ${studentName} (first name only)` : "Student: (anonymous)",
    `Education level: ${profile.educationLevel}`,
    `Strongest interests: ${topInterests || "not provided"}`,
    `Constraints: budget ${constraints.budgetMaxInr ?? "unknown"}, max duration ${constraints.durationMaxMonths ?? "unknown"} months, district ${constraints.district || "unknown"}`,
    `Engine top matches: ${topCareers || "none yet"}`,
  ].join("\n");
}

export async function askCounsellor(options: AskOptions): Promise<CounsellorAnswer> {
  const started = Date.now();
  const { chunks, mode } = await retrieve(options.question, {
    ...options.retrieveOptions,
    forceKeyword: options.forceKeywordRetrieval,
  });

  if (chunks.length === 0) {
    return {
      answer:
        options.locale === "te"
          ? "ఈ ప్రశ్నకు సమాధానం ఈ నాలెడ్జ్ బేస్‌లో నాకు దొరకలేదు. ఊహించను: దయచేసి అధికారిక పోర్టల్ చూడండి లేదా కౌన్సెలర్‌ను సంప్రదించండి."
          : "I could not find a source in this knowledge base that answers that question. I will not guess — please check the official portal or ask a human counsellor.",
      grounding: "uncertain",
      sources: [],
      uncertainty: "No knowledge-base chunk passed the similarity threshold.",
      mode: isAiConfigured() ? "llm" : "retrieval",
      model: null,
      latencyMs: Date.now() - started,
    };
  }

  const sources = chunks.map((chunk, index) => toAnswerSource(chunk, index));

  if (isAiConfigured()) {
    try {
      const provider = getAIProvider();
      const raw = await provider.chat({
        systemInstruction: buildSystemInstruction(options.locale, options.roleContext),
        userMessage: buildUserMessage(options.question, chunks, options.profile, options.studentName),
        maxOutputTokens: AI_CHAT_MAX_OUTPUT_TOKENS,
      });
      const parsed = llmResponseSchema.parse(JSON.parse(raw));
      const cited = mapCitations(parsed.citedMarkers, sources);
      if (parsed.grounding !== "uncertain" && cited.length === 0) {
        // The model answered without citing anything real: treat it as ungrounded.
        return retrievalFallback(options, chunks, sources, started, "Model response carried no valid citations");
      }
      return {
        answer: parsed.answer,
        grounding: parsed.grounding,
        sources: cited.length > 0 ? cited : sources,
        uncertainty: parsed.uncertainty,
        mode: "llm",
        model: provider.chatModel,
        latencyMs: Date.now() - started,
      };
    } catch (error) {
      const reason =
        error instanceof ProviderUnavailableError
          ? error.message
          : error instanceof Error
            ? error.message
            : "Unknown AI error";
      return retrievalFallback(options, chunks, sources, started, reason);
    }
  }

  return retrievalFallback(options, chunks, sources, started, null);
}

/**
 * Deterministic answer assembled from the retrieved sources. Sentences are
 * ranked by term overlap with the question, so the extract is relevant without
 * a model rewriting it. It is transparently labelled as retrieval-only.
 */
export function retrievalFallback(
  options: AskOptions,
  chunks: RetrievedChunk[],
  sources: AnswerSource[],
  started: number,
  degradedReason: string | null,
): CounsellorAnswer {
  const questionTokens = tokenize(options.question);
  const picked: { text: string; marker: string; score: number }[] = [];

  chunks.forEach((chunk, index) => {
    const marker = `S${index + 1}`;
    for (const sentence of splitSentences(chunk.content)) {
      const score = lexicalScore(questionTokens, tokenize(sentence));
      if (score > 0) picked.push({ text: sentence, marker, score });
    }
  });

  picked.sort((a, b) => b.score - a.score);
  const top = picked.slice(0, 4);
  const usedMarkers = [...new Set(top.map((item) => item.marker))];
  const citedSources = sources.filter((source) => usedMarkers.includes(source.marker));

  const grounding: GroundingLevel = chunks.some((chunk) => chunk.dataQuality === "sourced") ? "sourced" : "guidance";

  const intro =
    options.locale === "te"
      ? "మూల పత్రాల నుండి నేరుగా తీసిన సమాధానం (ఏఐ మోడల్ అందుబాటులో లేదు):"
      : "Direct extract from the knowledge base (no AI model was used for this answer):";

  const body =
    top.length > 0
      ? top.map((item) => `• ${item.text} [${item.marker}]`).join("\n")
      : `• ${chunks[0]?.content.slice(0, 400) ?? ""} [S1]`;

  const uncertainty = [
    degradedReason ? `AI unavailable or ungrounded: ${degradedReason}.` : null,
    "This answer was assembled from retrieved source text rather than generated, so it may include detail that is not specific to your situation.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    answer: `${intro}\n\n${body}`,
    grounding,
    sources: citedSources.length > 0 ? citedSources : sources,
    uncertainty,
    mode: "retrieval",
    model: null,
    latencyMs: Date.now() - started,
  };
}

export function toAnswerSource(chunk: RetrievedChunk, index: number): AnswerSource {
  return {
    marker: `S${index + 1}`,
    title: chunk.title,
    sourceOrg: chunk.sourceOrg,
    sourceUrl: chunk.sourceUrl,
    retrievedAt: chunk.retrievedAt,
    dataQuality: chunk.dataQuality,
  };
}

/** Drops citations the model invented; only real retrieved markers survive. */
export function mapCitations(markers: string[], sources: AnswerSource[]): AnswerSource[] {
  const available = new Set(sources.map((source) => source.marker));
  return sources.filter((source) => markers.includes(source.marker) && available.has(source.marker));
}
