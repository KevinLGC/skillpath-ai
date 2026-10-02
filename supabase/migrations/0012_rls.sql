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
