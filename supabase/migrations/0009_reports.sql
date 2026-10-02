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
