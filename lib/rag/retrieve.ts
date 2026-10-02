import { getAIProvider } from "@/lib/ai/provider";
import { RAG_MIN_SIMILARITY, RAG_TOP_K } from "@/lib/ai/config";
import { documents } from "@/lib/data";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";
import { chunkText } from "@/lib/rag/chunk";
import type { DataQuality, KnowledgeDocument, RetrievedChunk } from "@/lib/types";

/**
 * Retrieval.
 *
 * Two paths, one output shape:
 *   - vector  : pgvector cosine search over embedded chunks (when Supabase + a
 *               provider are configured)
 *   - keyword : deterministic term-overlap search over the same documents,
 *               which is what runs in the local demo and as the fallback when
 *               embeddings are unavailable
 *
 * Keyword mode exists so the counsellor NEVER goes silent: if the network, the
 * API key or the embedding model is unavailable during judging, answers are
 * still grounded in the same source documents, just assembled differently.
 */

/**
 * Keyword-mode thresholds. They live on a different scale to cosine similarity,
 * so they are configured separately rather than pretending one number fits both.
 *
 *   score = share of the question's content words that appear in the chunk
 *
 * plus a rule that at least two content words must match, which is what stops a
 * single common word from dragging an unrelated document into an answer.
 */
export const LEXICAL_MIN_SCORE = 0.34;
export const LEXICAL_MIN_SHARED_TERMS = 2;

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "than", "that", "this", "these", "those",
  "is", "are", "was", "were", "be", "been", "being", "do", "does", "did", "doing", "have", "has",
  "had", "having", "i", "me", "my", "we", "our", "you", "your", "he", "she", "it", "they", "them",
  "his", "her", "its", "their", "what", "which", "who", "whom", "when", "where", "why", "how",
  "can", "could", "should", "would", "will", "shall", "may", "might", "must", "to", "of", "in",
  "on", "at", "by", "for", "with", "about", "into", "from", "up", "down", "out", "over", "after",
  "before", "so", "no", "not", "only", "own", "same", "too", "very", "just", "also", "there",
  "here", "as", "any", "all", "more", "most", "some", "such", "am", "get", "got", "make", "made",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOPWORDS.has(token));
}

/**
 * Question coverage: the share of the question's content words found in the
 * chunk. Chosen over cosine-of-term-sets because it answers the question the
 * user actually cares about — "was my question addressed here?" — and because a
 * long, well-written chunk should not be penalised for being long.
 */
export function lexicalScore(queryTokens: string[], chunkTokens: string[]): number {
  if (queryTokens.length === 0 || chunkTokens.length === 0) return 0;
  const querySet = new Set(queryTokens);
  const chunkSet = new Set(chunkTokens);
  let shared = 0;
  for (const token of querySet) {
    if (chunkSet.has(token)) shared += 1;
  }
  return shared / querySet.size;
}

export function sharedTermCount(queryTokens: string[], chunkTokens: string[]): number {
  const chunkSet = new Set(chunkTokens);
  let shared = 0;
  for (const token of new Set(queryTokens)) {
    if (chunkSet.has(token)) shared += 1;
  }
  return shared;
}

export interface IndexedChunk {
  chunkId: string;
  document: KnowledgeDocument;
  chunkIndex: number;
  content: string;
  contentTokens: string[];
}

let cachedIndex: IndexedChunk[] | null = null;

/** Builds (and memoises) the local chunk index over the seeded knowledge base. */
export function buildLocalIndex(docs: KnowledgeDocument[] = documents): IndexedChunk[] {
  if (docs === documents && cachedIndex) return cachedIndex;
  const index: IndexedChunk[] = [];
  for (const document of docs) {
    for (const chunk of chunkText(document.content)) {
      index.push({
        chunkId: `${document.id}#${chunk.chunkIndex}`,
        document,
        chunkIndex: chunk.chunkIndex,
        content: chunk.content,
        // The document title is part of the searchable text: it is the most
        // information-dense sentence in the document, and a question about
        // "continuing education after ITI" should match this way.
        contentTokens: tokenize(`${document.title} ${chunk.content}`),
      });
    }
  }
  if (docs === documents) cachedIndex = index;
  return index;
}

function toRetrieved(hit: IndexedChunk, similarity: number, via: RetrievedChunk["via"]): RetrievedChunk {
  return {
    chunkId: hit.chunkId,
    documentId: hit.document.id,
    title: hit.document.title,
    sourceOrg: hit.document.source_org,
    sourceUrl: hit.document.source_url,
    retrievedAt: hit.document.retrieved_at,
    dataQuality: hit.document.data_quality as DataQuality,
    content: hit.content,
    similarity: Number(similarity.toFixed(4)),
    via,
  };
}

export interface RetrieveOptions {
  topK?: number;
  minSimilarity?: number;
  /** Boosts documents tagged with these careers (used by career-specific questions). */
  careerSlugs?: string[];
  /** Force keyword-only retrieval (used by tests and the offline demo). */
  forceKeyword?: boolean;
}

export interface RetrieveResult {
  chunks: RetrievedChunk[];
  mode: "vector" | "keyword" | "hybrid";
}

export async function retrieve(question: string, options: RetrieveOptions = {}): Promise<RetrieveResult> {
  const topK = options.topK ?? RAG_TOP_K;
  const keywordHits = retrieveKeyword(question, { ...options, topK });

  if (options.forceKeyword || !isSupabaseAdminConfigured()) {
    return { chunks: keywordHits, mode: "keyword" };
  }

  try {
    const vectorHits = await retrieveVector(question, { ...options, topK });
    if (vectorHits.length === 0) return { chunks: keywordHits, mode: "keyword" };

    // Hybrid merge: vector results lead, keyword hits fill gaps. Reciprocal
    // rank fusion keeps it simple and does not pretend the scores are comparable.
    const merged = new Map<string, RetrievedChunk>();
    vectorHits.forEach((hit, rank) => merged.set(hit.chunkId, { ...hit, similarity: Number((1 / (60 + rank)).toFixed(4)) }));
    keywordHits.forEach((hit, rank) => {
      if (!merged.has(hit.chunkId)) {
        merged.set(hit.chunkId, { ...hit, similarity: Number((1 / (60 + rank + vectorHits.length)).toFixed(4)) });
      }
    });
    const chunks = [...merged.values()].slice(0, topK).sort((a, b) => b.similarity - a.similarity);
    return { chunks, mode: chunks.some((c) => c.via === "vector") ? "hybrid" : "keyword" };
  } catch (error) {
    console.error("[rag] vector retrieval failed, falling back to keyword search", error);
    return { chunks: keywordHits, mode: "keyword" };
  }
}

export function retrieveKeyword(question: string, options: RetrieveOptions = {}): RetrievedChunk[] {
  const topK = options.topK ?? RAG_TOP_K;
  const minScore = options.minSimilarity ?? LEXICAL_MIN_SCORE;
  const queryTokens = tokenize(question);
  if (queryTokens.length === 0) return [];

  const scored = buildLocalIndex()
    .map((hit) => {
      let score = lexicalScore(queryTokens, hit.contentTokens);
      if (options.careerSlugs?.length && hit.document.career_slugs.some((slug) => options.careerSlugs?.includes(slug))) {
        score = Math.min(1, score + 0.05); // small boost for career-specific documents
      }
      return { hit, shared: sharedTermCount(queryTokens, hit.contentTokens), score };
    })
    .filter(
      (item) =>
        item.score >= minScore &&
        item.shared >= Math.min(LEXICAL_MIN_SHARED_TERMS, new Set(queryTokens).size),
    )
    .sort((a, b) => (b.score !== a.score ? b.score - a.score : a.hit.chunkId.localeCompare(b.hit.chunkId)))
    .slice(0, topK);

  return scored.map((item) => toRetrieved(item.hit, item.score, "keyword"));
}

async function retrieveVector(question: string, options: RetrieveOptions): Promise<RetrievedChunk[]> {
  const provider = getAIProvider();
  if (provider.kind === "none") return [];

  const db = getSupabaseAdminClient();
  if (!db) return [];

  const [embedding] = await provider.embed([question], "RETRIEVAL_QUERY");
  if (!embedding) return [];

  const { data, error } = await db.rpc("match_document_chunks", {
    query_embedding: embedding,
    match_count: options.topK ?? RAG_TOP_K,
    min_similarity: options.minSimilarity ?? RAG_MIN_SIMILARITY,
  });
  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    chunkId: String(row.id ?? row.chunk_id ?? ""),
    documentId: String(row.document_id ?? ""),
    title: String(row.title ?? ""),
    sourceOrg: String(row.source_org ?? ""),
    sourceUrl: String(row.source_url ?? ""),
    retrievedAt: String(row.retrieved_at ?? ""),
    dataQuality: (row.data_quality as DataQuality) ?? "guidance",
    content: String(row.content ?? ""),
    similarity: Number(row.similarity ?? 0),
    via: "vector" as const,
  }));
}
