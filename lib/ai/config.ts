import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { normalizeLocale } from "@/lib/i18n/config";

/**
 * AI configuration.
 *
 * Model IDs are configuration, not constants: mid-2026 Gemini model names move
 * quickly, so `scripts/verify-models.mjs` checks the live model list and the
 * deployment env decides which IDs are used. If no key is configured the app
 * still answers — from retrieval only (see lib/rag/answer.ts).
 */
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
export const GEMINI_CHAT_MODEL = process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
export const GEMINI_EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
export const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 8000);
export const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 1536);
export const RAG_TOP_K = Number(process.env.RAG_TOP_K ?? 6);
export const RAG_MIN_SIMILARITY = Number(process.env.RAG_MIN_SIMILARITY ?? 0.62);
export const RAG_MIN_CHUNKS = Number(process.env.RAG_MIN_CHUNKS ?? 1);
export const AI_DAILY_QUOTA = Number(process.env.AI_DAILY_QUOTA ?? 60);
export const AI_CHAT_MAX_OUTPUT_TOKENS = Number(process.env.AI_CHAT_MAX_OUTPUT_TOKENS ?? 1200);

export function isAiConfigured(): boolean {
  return GEMINI_API_KEY.length > 0;
}

export function aiModeLabel(): "gemini" | "retrieval-only" {
  return isAiConfigured() ? "gemini" : "retrieval-only";
}

export { DEFAULT_LOCALE, normalizeLocale };
