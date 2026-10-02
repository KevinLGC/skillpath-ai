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
