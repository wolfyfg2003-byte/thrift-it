-- ENVIRONMENT A — Teaser / landing database only.
-- Project: gloehnypjcyhvjalvnez (waitlist). Do not run this on the future production project.
-- Already applied in supabase/migrations/20260824120000_waitlist.sql

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text,
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

revoke all on table public.waitlist from anon, authenticated;
grant insert on table public.waitlist to anon, authenticated;

drop policy if exists "waitlist_insert_anon" on public.waitlist;
create policy "waitlist_insert_anon"
  on public.waitlist
  for insert
  to anon, authenticated
  with check (true);
