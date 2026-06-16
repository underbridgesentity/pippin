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

-- ── friendships (real multi-user friends) ───────────────────────────────────
-- A directed request row; "accepted" means the two users are friends.
create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users on delete cascade,
  addressee uuid not null references auth.users on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted'
  created_at timestamptz not null default now(),
  unique (requester, addressee)
);

alter table public.friendships enable row level security;

drop policy if exists "see own friendships" on public.friendships;
create policy "see own friendships"
  on public.friendships for select to authenticated
  using (auth.uid() = requester or auth.uid() = addressee);

drop policy if exists "send friend requests" on public.friendships;
create policy "send friend requests"
  on public.friendships for insert to authenticated
  with check (auth.uid() = requester);

drop policy if exists "respond to friend requests" on public.friendships;
create policy "respond to friend requests"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee or auth.uid() = requester);

drop policy if exists "remove friendships" on public.friendships;
create policy "remove friendships"
  on public.friendships for delete to authenticated
  using (auth.uid() = requester or auth.uid() = addressee);

-- ── circle memberships (real multi-user circles) ────────────────────────────
create table if not exists public.circle_members (
  circle_id text not null,
  user_id uuid not null references auth.users on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

alter table public.circle_members enable row level security;

drop policy if exists "circle members readable" on public.circle_members;
create policy "circle members readable"
  on public.circle_members for select to authenticated using (true);

drop policy if exists "manage own membership" on public.circle_members;
create policy "manage own membership"
  on public.circle_members for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
