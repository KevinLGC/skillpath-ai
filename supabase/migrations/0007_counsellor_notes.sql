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
