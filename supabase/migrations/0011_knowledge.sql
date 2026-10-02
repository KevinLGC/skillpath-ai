-- 0011 — knowledge base: documents, embedded chunks, and the vector search RPC.
--
-- Chunk ids are text in the form '<document_id>#<chunk_index>', identical to
-- the ids the keyword fallback builds in lib/rag/chunk.ts. That lets hybrid
-- retrieval merge vector and keyword hits by id, and lets stored citations
-- resolve regardless of which path produced them.
create table public.documents (
  id text primary key,
  title text not null,
  source_org text not null,
  source_url text not null,
  retrieved_at text not null,
  license_note text not null default '',
  locale text not null default 'multi',
  data_quality text not null default 'guidance'
    check (data_quality in ('sourced', 'estimated', 'illustrative', 'guidance')),
  career_slugs jsonb not null default '[]'::jsonb,
  content text not null,
  created_at timestamptz not null default now()
);

create table public.document_chunks (
  id text primary key,
  document_id text not null references public.documents (id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  -- Locked to EMBEDDING_DIM (default 1536). Changing the dimension requires a
  -- migration AND a full re-ingest; mixing dimensions silently breaks search.
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- Cosine similarity index; ivfflat is chosen over hnsw for cheap incremental
-- builds on a small corpus (a few hundred chunks).
create index document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 20);

-- Supabase RPC called by lib/rag/retrieve.ts.
-- min_similarity is a cosine similarity floor (1 - cosine distance).
create or replace function public.match_document_chunks(
  query_embedding vector(1536),
  match_count integer default 6,
  min_similarity double precision default 0.62
)
returns table (
  id text,
  document_id text,
  chunk_index integer,
  title text,
  source_org text,
  source_url text,
  retrieved_at text,
  data_quality text,
  content text,
  similarity double precision
)
language sql
stable
set search_path = public
as $$
  select
    c.id,
    c.document_id,
    c.chunk_index,
    d.title,
    d.source_org,
    d.source_url,
    d.retrieved_at,
    d.data_quality,
    c.content,
    (1 - (c.embedding <=> query_embedding))::double precision as similarity
  from document_chunks c
  join documents d on d.id = c.document_id
  where c.embedding is not null
    and (1 - (c.embedding <=> query_embedding)) >= min_similarity
  order by c.embedding <=> query_embedding
  limit greatest(match_count, 1);
$$;
