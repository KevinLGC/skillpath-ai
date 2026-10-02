#!/usr/bin/env node
/**
 * ingest-knowledge.mjs — chunks data/documents.json, embeds the chunks with
 * Gemini, and writes documents + document_chunks into Supabase.
 *
 * Reuses lib/rag/chunk.ts (Node 24 type stripping) so the chunk boundaries —
 * and therefore chunk ids like "doc-id#3" used by citations — are identical
 * to what the keyword fallback produces at runtime. Re-running is safe: rows
 * are upserted by deterministic id.
 *
 * Env (from .env.local or the shell):
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY   — target database
 *   GEMINI_API_KEY                                   — embedding calls
 *   EMBEDDING_DIM                                    — must equal the vector column (1536)
 *
 * Usage:
 *   node scripts/ingest-knowledge.mjs            # full ingest
 *   node scripts/ingest-knowledge.mjs --dry-run  # chunk only, no DB, no API
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

// The chunker is the single source of truth for chunk ids and boundaries.
const { chunkText } = await import("../lib/rag/chunk.ts");

// ---------------------------------------------------------------- env setup
// Minimal .env.local loader: the script runs outside Next, so it loads the
// same file the app reads, without adding a dotenv dependency.
if (existsSync(".env.local")) {
  const raw = await readFile(".env.local", "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!match || line.trim().startsWith("#")) continue;
    const [, key, value] = match;
    if (process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM ?? 1536);
const GEMINI_BASE_URL = process.env.GEMINI_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta";
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS ?? 30000);
const DRY_RUN = process.argv.includes("--dry-run");

const BERTH = 16; // embed batch size (API limit is far higher; small batches fail cheaply)

function normalize(vector) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (magnitude === 0) return vector;
  return vector.map((value) => value / magnitude);
}

async function embedBatch(texts, taskType) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${EMBED_MODEL}:batchEmbedContents?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${EMBED_MODEL}`,
            content: { parts: [{ text }] },
            taskType,
            outputDimensionality: EMBEDDING_DIM,
          })),
        }),
      },
    );
    if (!response.ok) {
      throw new Error(`embed failed: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
    }
    const payload = await response.json();
    const vectors = (payload.embeddings ?? []).map((item) => normalize(item.values ?? []));
    if (vectors.length !== texts.length) {
      throw new Error(`embed returned ${vectors.length} vectors for ${texts.length} texts`);
    }
    const wrongDim = vectors.find((vector) => vector.length !== EMBEDDING_DIM);
    if (wrongDim) {
      throw new Error(
        `embedding dimension mismatch: got ${wrongDim.length}, expected ${EMBEDDING_DIM} ` +
          `(document_chunks is vector(${EMBEDDING_DIM}); fix EMBEDDING_DIM or re-run the migration)`,
      );
    }
    return vectors;
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------ load
const documents = JSON.parse(await readFile(path.join(process.cwd(), "data", "documents.json"), "utf8"));
console.log(`ingest: ${documents.length} documents`);

const chunks = [];
for (const document of documents) {
  const pieces = chunkText(document.content);
  pieces.forEach((piece, index) => {
    if (index !== piece.chunkIndex) {
      throw new Error(`chunk index drift in ${document.id}: expected ${index}, got ${piece.chunkIndex}`);
    }
    // Title is prepended for embedding/keyword parity with buildLocalIndex().
    chunks.push({
      id: `${document.id}#${piece.chunkIndex}`,
      document_id: document.id,
      chunk_index: piece.chunkIndex,
      content: piece.content,
      embedText: `${document.title} ${piece.content}`,
    });
  });
}
console.log(`ingest: ${chunks.length} chunks (ids are '<doc>#<index>', matching runtime citations)`);

if (DRY_RUN) {
  const longest = chunks.reduce((max, chunk) => Math.max(max, chunk.content.length), 0);
  console.log(`dry-run: longest chunk ${longest} chars — no API calls, no database writes`);
  process.exit(0);
}

// ------------------------------------------------------------- validate env
const problems = [];
if (!SUPABASE_URL.startsWith("http")) problems.push("NEXT_PUBLIC_SUPABASE_URL is missing");
if (!SECRET_KEY) problems.push("SUPABASE_SECRET_KEY is missing (server-only key, never the publishable one)");
if (!GEMINI_API_KEY) problems.push("GEMINI_API_KEY is missing");
if (problems.length) {
  console.error(`ingest: cannot continue — ${problems.join("; ")}`);
  process.exit(1);
}

const { createClient } = await import("@supabase/supabase-js");
const db = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ------------------------------------------------------------- embed + write
console.log(`ingest: embedding with ${EMBED_MODEL} at dim ${EMBEDDING_DIM}…`);
let written = 0;

for (let offset = 0; offset < documents.length; offset += 4) {
  const slice = documents.slice(offset, offset + 4);
  const { error } = await db.from("documents").upsert(
    slice.map((document) => ({
      id: document.id,
      title: document.title,
      source_org: document.source_org,
      source_url: document.source_url,
      retrieved_at: document.retrieved_at,
      license_note: document.license_note ?? "",
      locale: document.locale ?? "multi",
      data_quality: document.data_quality,
      career_slugs: document.career_slugs ?? [],
      content: document.content,
    })),
    { onConflict: "id" },
  );
  if (error) {
    console.error(`ingest: document upsert failed — ${error.message}`);
    console.error("  Have migrations 0001–0012 been applied? (supabase db push)");
    process.exit(1);
  }
}
console.log(`ingest: ${documents.length} documents written`);

for (let offset = 0; offset < chunks.length; offset += BERTH) {
  const batch = chunks.slice(offset, offset + BERTH);
  const vectors = await embedBatch(
    batch.map((chunk) => chunk.embedText),
    "RETRIEVAL_DOCUMENT",
  );
  const { error } = await db.from("document_chunks").upsert(
    batch.map((chunk, index) => ({
      id: chunk.id,
      document_id: chunk.document_id,
      chunk_index: chunk.chunk_index,
      content: chunk.content,
      embedding: vectors[index],
    })),
    { onConflict: "id" },
  );
  if (error) {
    console.error(`ingest: chunk upsert failed — ${error.message}`);
    process.exit(1);
  }
  written += batch.length;
  process.stdout.write(`\r  ${written}/${chunks.length} chunks embedded+written`);
}
console.log("\ningest: done. Vector search is live; the app will use hybrid retrieval.");

// Quick self-check: run the RPC the app actually calls.
const { data: probe, error: rpcError } = await db.rpc("match_document_chunks", {
  query_embedding: (await embedBatch(["how do I become an electrician"], "RETRIEVAL_QUERY"))[0],
  match_count: 3,
  min_similarity: 0.2,
});
if (rpcError) {
  console.error(`ingest: match_document_chunks RPC failed — ${rpcError.message}`);
  process.exit(1);
}
console.log(`ingest: RPC self-check ok — top hit similarity ${Number(probe?.[0]?.similarity ?? 0).toFixed(3)}`);
