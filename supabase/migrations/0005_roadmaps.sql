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
