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
