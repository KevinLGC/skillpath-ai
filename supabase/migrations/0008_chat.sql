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
