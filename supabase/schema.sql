-- Pippin backend schema. Run this in the Supabase SQL editor (see SUPABASE.md).
-- Two tables: `profiles` (public stats for the leaderboard) and `user_state`
-- (each user's full app state as JSON, private to them). RLS enforces both.

-- ── profiles ────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  name text not null default 'Friend',
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

-- Unique handle for friend search + invite links (case-insensitive).
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique on public.profiles (lower(username));

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
  insert into public.profiles (id, name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'Friend'),
    'pippin_' || substr(replace(new.id::text, '-', ''), 1, 8)
  )
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

-- Only the addressee can act on a request (accept it). The requester cannot
-- self-accept; cancelling is handled by the delete policy below.
drop policy if exists "respond to friend requests" on public.friendships;
create policy "respond to friend requests"
  on public.friendships for update to authenticated
  using (auth.uid() = addressee)
  with check (auth.uid() = addressee);

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

-- ── community posts (real cross-user feed) ──────────────────────────────────
-- author references profiles(id) so the feed query can embed the author's
-- name + avatar in one request.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references public.profiles(id) on delete cascade,
  post_type text,
  text text,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

drop policy if exists "posts readable by authenticated" on public.posts;
create policy "posts readable by authenticated"
  on public.posts for select to authenticated using (true);

drop policy if exists "create own posts" on public.posts;
create policy "create own posts"
  on public.posts for insert to authenticated with check (auth.uid() = author);

drop policy if exists "delete own posts" on public.posts;
create policy "delete own posts"
  on public.posts for delete to authenticated using (auth.uid() = author);

create index if not exists posts_created_idx on public.posts (created_at desc);

-- ── post reactions (one per user per post) ──────────────────────────────────
create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_reactions enable row level security;

drop policy if exists "reactions readable by authenticated" on public.post_reactions;
create policy "reactions readable by authenticated"
  on public.post_reactions for select to authenticated using (true);

drop policy if exists "manage own reactions" on public.post_reactions;
create policy "manage own reactions"
  on public.post_reactions for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── post comments ────────────────────────────────────────────────────────────
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  tip boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;

drop policy if exists "comments readable by authenticated" on public.post_comments;
create policy "comments readable by authenticated"
  on public.post_comments for select to authenticated using (true);

drop policy if exists "create own comments" on public.post_comments;
create policy "create own comments"
  on public.post_comments for insert to authenticated with check (auth.uid() = author);

drop policy if exists "delete own comments" on public.post_comments;
create policy "delete own comments"
  on public.post_comments for delete to authenticated using (auth.uid() = author);

create index if not exists post_comments_post_idx on public.post_comments (post_id, created_at);

-- ── post reports (moderation queue for user-generated content) ───────────────
create table if not exists public.post_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reporter uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

alter table public.post_reports enable row level security;

drop policy if exists "create own reports" on public.post_reports;
create policy "create own reports"
  on public.post_reports for insert to authenticated with check (auth.uid() = reporter);

-- ── blocks (hide a blocked user's content from the blocker) ───────────────────
create table if not exists public.blocks (
  blocker uuid not null references public.profiles(id) on delete cascade,
  blocked uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);

alter table public.blocks enable row level security;

drop policy if exists "manage own blocks" on public.blocks;
create policy "manage own blocks"
  on public.blocks for all to authenticated
  using (auth.uid() = blocker) with check (auth.uid() = blocker);

-- ── post photos (public storage bucket) ─────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('post-photos', 'post-photos', true)
on conflict (id) do nothing;

drop policy if exists "post photos readable" on storage.objects;
create policy "post photos readable"
  on storage.objects for select to public using (bucket_id = 'post-photos');

drop policy if exists "upload own post photos" on storage.objects;
create policy "upload own post photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "delete own post photos" on storage.objects;
create policy "delete own post photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'post-photos' and (storage.foldername(name))[1] = auth.uid()::text);
