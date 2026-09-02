-- ENVIRONMENT B — Future production database ONLY.
-- Do not paste this into the teaser/waitlist project (gloehnypjcyhvjalvnez).
-- Run it after you create the second Supabase project and a profiles table.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  phone text,
  community text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists taste_preferences jsonb not null default '{
    "sizes": [],
    "brands": {},
    "categories": {}
  }'::jsonb;

alter table public.profiles
  add column if not exists shipping_address jsonb;

create table if not exists public.swipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  listing_id text not null,
  direction text not null check (direction in ('like', 'pass')),
  created_at timestamptz not null default now(),
  unique (user_id, listing_id)
);

alter table public.profiles enable row level security;
alter table public.swipes enable row level security;
