import {
  EMBEDDING_DIM,
  GEMINI_API_KEY,
  GEMINI_BASE_URL,
  GEMINI_CHAT_MODEL,
  GEMINI_EMBED_MODEL,
  GEMINI_TIMEOUT_MS,
  isAiConfigured,
} from "@/lib/ai/config";

/**
 * Provider interface. The rest of the app depends on this, not on Gemini, so a
 * different provider (or the retrieval-only fallback) can be swapped in without
 * touching the counsellor, the RAG pipeline or the UI.
 */
export interface ChatRequest {
  systemInstruction: string;
  userMessage: string;
  maxOutputTokens: number;
  temperature?: number;
}

export interface AIProvider {
  readonly kind: "gemini" | "none";
  readonly chatModel: string;
  readonly embedModel: string;
  chat(request: ChatRequest): Promise<string>;
  embed(texts: string[], taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY"): Promise<number[][]>;
}

export class ProviderUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProviderUnavailableError";
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = GEMINI_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Gemini provider implemented against the REST API directly.
 *
 * Deliberately dependency-free: the SDK moves with model releases, and this
 * prototype must not break because a package exposes a different surface. The
 * endpoints used are the same ones the SDK wraps.
 */
function createGeminiProvider(): AIProvider {
  return {
    kind: "gemini",
    chatModel: GEMINI_CHAT_MODEL,
    embedModel: GEMINI_EMBED_MODEL,

    async chat({ systemInstruction, userMessage, maxOutputTokens, temperature = 0.3 }) {
      const candidates = Array.from(new Set([GEMINI_CHAT_MODEL, "gemini-3.8-flash", "gemini-3-flash-preview"]));
      let lastError: Error | null = null;

      for (const model of candidates) {
        try {
          const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
          const response = await fetchWithTimeout(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemInstruction }] },
              contents: [{ role: "user", parts: [{ text: userMessage }] }],
              generationConfig: {
                temperature,
                maxOutputTokens,
                responseMimeType: "application/json",
              },
            }),
          });

          if (!response.ok) {
            const detail = await response.text().catch(() => "");
            lastError = new ProviderUnavailableError(`Gemini chat (${model}) failed (${response.status}): ${detail.slice(0, 150)}`);
            continue;
          }

          const payload = (await response.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
          };
          const text = payload.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
          if (text) return text;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
        }
      }

      throw lastError ?? new ProviderUnavailableError("All Gemini model endpoints failed");
    },

    async embed(texts, taskType) {
      if (texts.length === 0) return [];
      const url = `${GEMINI_BASE_URL}/models/${GEMINI_EMBED_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`;
      const response = await fetchWithTimeout(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${GEMINI_EMBED_MODEL}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: EMBEDDING_DIM,
          })),
        }),
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new ProviderUnavailableError(`Gemini embed failed (${response.status}): ${detail.slice(0, 200)}`);
      }

      const payload = (await response.json()) as { embeddings?: { values?: number[] }[] };
      const vectors = (payload.embeddings ?? []).map((item) => item.values ?? []);
      if (vectors.length !== texts.length) {
        throw new ProviderUnavailableError("Gemini returned an unexpected number of embeddings");
      }
      // Vectors below the native dimension must be L2-normalized before cosine
      // search; storing unnormalized vectors silently degrades retrieval.
      return vectors.map(normalizeVector);
    },
  };
}

function createUnavailableProvider(): AIProvider {
  const fail = () => {
    throw new ProviderUnavailableError("No AI provider configured (GEMINI_API_KEY is missing)");
  };
  return {
    kind: "none",
    chatModel: "none",
    embedModel: "none",
    chat: async () => fail(),
    embed: async () => fail(),
  };
}

export function getAIProvider(): AIProvider {
  return isAiConfigured() ? createGeminiProvider() : createUnavailableProvider();
}

export function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}
