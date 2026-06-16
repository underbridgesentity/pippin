-- Fettle backend schema. Run this in the Supabase SQL editor (see SUPABASE.md).
-- Two tables: `profiles` (public stats for the leaderboard) and `user_state`
-- (each user's full app state as JSON, private to them). RLS enforces both.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Fettler',
  avatar text not null default '',
  total_xp integer not null default 0,
  weekly_xp integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles readable by authenticated" on public.profiles;
create policy "profiles readable by authenticated"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "users manage own profile" on public.profiles;
create policy "users manage own profile"
  on public.profiles for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── user_state ──────────────────────────────────────────────────────────────
create table if not exists public.user_state (
  user_id uuid primary key references auth.users on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "users manage own state" on public.user_state;
create policy "users manage own state"
  on public.user_state for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── auto-create a profile row when a user signs up ──────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', 'Fettler'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helpful index for the leaderboard query.
create index if not exists profiles_weekly_xp_idx on public.profiles (weekly_xp desc);
