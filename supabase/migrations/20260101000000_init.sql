-- ─────────────────────────────────────────────────────────────────────────────
-- Base schema for the app template
-- Run with: supabase db reset  (local)
--           supabase db push   (remote)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Profiles table ────────────────────────────────────────────────────────────
-- One row per auth.users entry. Auto-created via trigger on signup.
-- Add app-specific columns here (e.g., bio, preferences, credits, etc.)

create table public.profiles (
  id           uuid        primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url   text,
  -- TODO: Add your app-specific columns here
  -- e.g., bio text, credits integer default 0, plan_type text default 'free'
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

comment on table public.profiles is 'Per-user profile data, extended from auth.users.';

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users can read any profile (adjust if profiles should be private)
create policy "Profiles are publicly readable"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Users can insert their own profile (needed for manual upsert)
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ── Auto-create profile on signup ─────────────────────────────────────────────
-- Triggered when a new row is inserted into auth.users.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Auto-update updated_at ─────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Add more tables below as your app grows.
-- Tip: Create a new migration file for each feature addition so diffs are clean.
-- ─────────────────────────────────────────────────────────────────────────────
