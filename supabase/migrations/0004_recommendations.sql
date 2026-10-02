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
