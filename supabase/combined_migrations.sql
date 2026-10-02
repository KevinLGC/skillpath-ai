-- 0001 — pgvector.
-- The knowledge-base RAG path depends on it (document_chunks.embedding and
-- match_document_chunks in 0011). If this fails, the app still runs: retrieval
-- automatically falls back to keyword mode.
create extension if not exists vector;
-- 0002 — profiles: the identity + role table.
-- One row per auth.users row. Roles drive the app's routing (student, family,
-- counsellor, admin); the app never trusts a client-supplied role.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'student'
    check (role in ('student', 'family', 'counsellor', 'admin')),
  locale text not null default 'en',
  -- Student key used by the store. For students this equals id (their auth
  -- uid); it is a separate column so linked/guardian rows can point at a
  -- different student later without a migration.
  student_id text,
  education_level text,
  district text,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- Every auth user gets a profile automatically, with the role taken from the
-- signup metadata (default: student). Dashboard-created users fire this too.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, student_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, ''), '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'student'),
    new.id::text
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
-- 0003 — assessments: one row per submission.
-- answers / constraints / profile are stored verbatim as jsonb so an
-- assessment can be re-scored later with new engine weights and produce a
-- reproducible result.
create table public.assessments (
  id text primary key,
  student_id text not null,
  education_level text not null,
  answers jsonb not null default '[]'::jsonb,
  constraints jsonb not null default '{}'::jsonb,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index assessments_student_created_idx
  on public.assessments (student_id, created_at);
-- 0004 — recommendations: engine output, stored with its versions.
-- payload keeps the full record (factor trace, explanations, skill gap) so the
-- UI can replay exactly what was computed, including the score breakdown that
-- makes the recommendation explainable.
create table public.recommendations (
  id text primary key,
  assessment_id text not null,
  student_id text not null,
  career_slug text not null,
  score numeric not null default 0,
  raw_score numeric,
  confidence numeric,
  eligible boolean not null default true,
  engine_version text not null,
  weights_version text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index recommendations_assessment_score_idx
  on public.recommendations (assessment_id, score desc);
create index recommendations_student_created_idx
  on public.recommendations (student_id, created_at desc);
-- 0005 — roadmaps: the student's step plan for one career.
create table public.roadmaps (
  id text primary key,
  student_id text not null,
  career_slug text not null,
  steps jsonb not null default '[]'::jsonb,
  you_are_here_index integer not null default 0,
  created_at timestamptz not null default now()
);

create index roadmaps_student_career_idx
  on public.roadmaps (student_id, career_slug, created_at desc);
-- 0006 — family sharing: consent is a first-class record, not a checkbox.
-- Creating a share link writes a consent row via trigger, so "consent exists"
-- is enforced by the database rather than by application discipline.
create table public.share_links (
  id text primary key,
  token text not null unique,
  student_id text not null,
  career_slugs jsonb not null default '[]'::jsonb,
  scope text not null default 'family_view'
    check (scope in ('family_view', 'report', 'full')),
  consent_id text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index share_links_student_idx on public.share_links (student_id, created_at desc);
create index share_links_token_idx on public.share_links (token);

create table public.consent_records (
  id text primary key,
  student_id text not null,
  share_link_id text references public.share_links (id) on delete cascade,
  scope text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index consent_records_student_idx on public.consent_records (student_id, granted_at desc);

-- One consent record per share link, written in the same statement as the link.
create or replace function public.record_share_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.consent_id is not null then
    insert into public.consent_records (id, student_id, share_link_id, scope, granted_at)
    values (new.consent_id, new.student_id, new.id, new.scope, new.created_at)
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

create trigger share_link_consent
  after insert on public.share_links
  for each row execute function public.record_share_consent();

-- Revoking the link revokes the consent it was created with.
create or replace function public.revoke_link_consent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.revoked_at is not null and old.revoked_at is null then
    update public.consent_records
      set revoked_at = new.revoked_at
      where share_link_id = new.id and revoked_at is null;
  end if;
  return new;
end;
$$;

create trigger share_link_revoke
  after update on public.share_links
  for each row execute function public.revoke_link_consent();
-- 0007 — counsellor notes: the human review layer over engine output.
create table public.counsellor_notes (
  id text primary key,
  counsellor_id text not null,
  student_id text not null,
  recommendation_id text,
  note text not null,
  created_at timestamptz not null default now()
);

create index counsellor_notes_student_idx on public.counsellor_notes (student_id, created_at);
-- 0008 — AI counsellor sessions and messages.
-- profile_snapshot pins the profile the answer was given for, so an old
-- conversation remains understandable even after the student re-takes the
-- assessment.
create table public.chat_sessions (
  id text primary key,
  user_id text not null,
  student_id text,
  role_context text not null default 'student'
    check (role_context in ('student', 'family', 'counsellor', 'admin')),
  locale text not null default 'en',
  profile_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index chat_sessions_user_idx on public.chat_sessions (user_id, created_at desc);

create table public.chat_messages (
  id text primary key,
  session_id text not null references public.chat_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  grounding text check (grounding in ('sourced', 'estimated', 'guidance', 'uncertain')),
  sources jsonb not null default '[]'::jsonb,
  mode text check (mode in ('gemini', 'retrieval-only', 'hybrid')),
  created_at timestamptz not null default now()
);

create index chat_messages_session_idx on public.chat_messages (session_id, created_at);
-- 0009 — decision reports: a frozen snapshot, printable by the family.
-- The snapshot jsonb contains everything the PDF/print view renders (costs,
-- timeline, factor trace, sources), so a report never changes after it is
-- generated even if careers or weights change later.
create table public.reports (
  id text primary key,
  student_id text not null,
  career_slug text not null,
  kind text not null default 'family_decision',
  locale text not null default 'en',
  snapshot jsonb not null,
  share_token text,
  created_at timestamptz not null default now()
);

create index reports_student_idx on public.reports (student_id, created_at desc);
create index reports_share_token_idx on public.reports (share_token);
-- 0010 — AI quota and engine weights.
-- ai_usage is a per-user daily counter keyed (user_id, day) so the upsert in
-- the app is a single row write with no read-modify-write race.
create table public.ai_usage (
  user_id text not null,
  day text not null,
  count integer not null default 0,
  primary key (user_id, day)
);

-- Engine weights are versioned configuration. Recommendations record the
-- version that produced them (0004), so editing weights here never rewrites
-- history; old results stay reproducible and explainable.
create table public.engine_config (
  id text primary key,
  engine_version text not null,
  weights_version text not null,
  weights jsonb not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create index engine_config_active_idx on public.engine_config (is_active);

-- Seed the plan §5 defaults as the active configuration.
insert into public.engine_config (id, engine_version, weights_version, weights, is_active)
values (
  'weights-2026.1',
  'engine-1.0.0',
  'weights-2026.10',
  '{"interest":0.25,"skill":0.25,"aptitude":0.2,"preference":0.1,"education":0.1,"constraint":0.1}'::jsonb,
  true
)
on conflict (id) do nothing;
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
-- 0012 — row level security.
--
-- The app's store uses the secret key (server only, bypasses RLS) for engine
-- writes, but every cookie-based client — session lookup today, any direct
-- client tomorrow — runs under these policies. Principle: a student sees their
-- own rows, staff see their caseload, the knowledge base is readable, and
-- nothing is writable by anonymous callers.
--
-- Tables without UPDATE/DELETE policies are append-only or service-role only;
-- RLS denies by default (enabled below), so absence of a policy is a lock.

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role in ('counsellor', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------- profiles
alter table public.profiles enable row level security;

create policy "profiles: read own or staff"
  on public.profiles for select
  using (id = auth.uid() or public.is_staff());

create policy "profiles: update own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- ------------------------------------------------------------- assessments
alter table public.assessments enable row level security;

create policy "assessments: owner rw, staff r"
  on public.assessments for all
  using (student_id = auth.uid()::text or public.is_staff())
  with check (student_id = auth.uid()::text);

-- ---------------------------------------------------------- recommendations
alter table public.recommendations enable row level security;

create policy "recommendations: owner r, staff r"
  on public.recommendations for select
  using (student_id = auth.uid()::text or public.is_staff());

create policy "recommendations: owner insert"
  on public.recommendations for insert
  with check (student_id = auth.uid()::text);

-- --------------------------------------------------------------- roadmaps
alter table public.roadmaps enable row level security;

create policy "roadmaps: owner rw, staff r"
  on public.roadmaps for all
  using (student_id = auth.uid()::text or public.is_staff())
  with check (student_id = auth.uid()::text);

-- ------------------------------------------------------------- share links
alter table public.share_links enable row level security;

create policy "share_links: owner r, staff r"
  on public.share_links for select
  using (student_id = auth.uid()::text or public.is_staff());

create policy "share_links: owner insert"
  on public.share_links for insert
  with check (student_id = auth.uid()::text);

create policy "share_links: owner revoke"
  on public.share_links for update
  using (student_id = auth.uid()::text)
  with check (student_id = auth.uid()::text);

-- --------------------------------------------------------- consent records
alter table public.consent_records enable row level security;

create policy "consent: owner r, staff r"
  on public.consent_records for select
  using (student_id = auth.uid()::text or public.is_staff());

-- Inserts happen through the security definer trigger (0006) or service role.

-- -------------------------------------------------------- counsellor notes
alter table public.counsellor_notes enable row level security;

create policy "notes: staff rw, student r"
  on public.counsellor_notes for all
  using (public.is_staff() or student_id = auth.uid()::text)
  with check (public.is_staff());

-- ------------------------------------------------------------ chat sessions
alter table public.chat_sessions enable row level security;

create policy "chat_sessions: owner rw"
  on public.chat_sessions for all
  using (user_id = auth.uid()::text or public.is_staff())
  with check (user_id = auth.uid()::text);

alter table public.chat_messages enable row level security;

create policy "chat_messages: session owner rw"
  on public.chat_messages for all
  using (
    exists (
      select 1 from chat_sessions s
      where s.id = session_id
        and (s.user_id = auth.uid()::text or public.is_staff())
    )
  )
  with check (
    exists (
      select 1 from chat_sessions s
      where s.id = session_id and s.user_id = auth.uid()::text
    )
  );

-- ----------------------------------------------------------------- reports
alter table public.reports enable row level security;

create policy "reports: owner r, staff r"
  on public.reports for select
  using (student_id = auth.uid()::text or public.is_staff());

create policy "reports: owner insert"
  on public.reports for insert
  with check (student_id = auth.uid()::text);

-- --------------------------------------------------------------- ai usage
alter table public.ai_usage enable row level security;

create policy "ai_usage: own rows"
  on public.ai_usage for all
  using (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- ----------------------------------------------------------- engine config
alter table public.engine_config enable row level security;

create policy "engine_config: readable when signed in"
  on public.engine_config for select
  using (auth.uid() is not null);

-- Writes: admin UI (service role). Editing weights is an admin action.

-- ----------------------------------------------------- knowledge base (read)
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

create policy "documents: readable when signed in"
  on public.documents for select
  using (auth.uid() is not null);

create policy "chunks: readable when signed in"
  on public.document_chunks for select
  using (auth.uid() is not null);

-- Ingestion (scripts/ingest-knowledge.mjs) writes with the secret key, which
-- bypasses RLS by design: documents are curated content, not user data.
