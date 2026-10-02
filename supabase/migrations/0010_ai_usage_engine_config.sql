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
