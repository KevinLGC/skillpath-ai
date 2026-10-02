-- 0001 — pgvector.
-- The knowledge-base RAG path depends on it (document_chunks.embedding and
-- match_document_chunks in 0011). If this fails, the app still runs: retrieval
-- automatically falls back to keyword mode.
create extension if not exists vector;
