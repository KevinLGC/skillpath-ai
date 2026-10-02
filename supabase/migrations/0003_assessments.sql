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
