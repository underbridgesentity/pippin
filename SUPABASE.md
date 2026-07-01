# Turning on the real backend

Pippin runs on local storage out of the box. Point it at a free Supabase project
to get **real accounts, cloud sync across devices, and a real global leaderboard**
(everyone who signs up appears, ranked by weekly XP). No app code changes, it's
all configuration, because the UI talks to one data-access layer
([`src/lib/api/`](src/lib/api)) that has both a local and a Supabase adapter.

## 1. Create a project

1. Go to [supabase.com](https://supabase.com) → **New project** (the free tier is plenty).
2. Wait for it to finish provisioning.

## 2. Create the tables

1. In the dashboard, open **SQL Editor → New query**.
2. Paste the contents of [`supabase/schema.sql`](supabase/schema.sql) and **Run**.

This creates `profiles` (public leaderboard stats) and `user_state` (each user's
private app data), with Row Level Security so people can only write their own data
but everyone can see the leaderboard.

## 3. Allow instant sign-in (dev)

**Authentication → Sign In / Providers → Email** → turn **Confirm email** *off*.
This lets new accounts sign in immediately. (Leave it on for production and add an
email-confirmation step to the onboarding flow.)

## 4. Add your keys

1. **Project Settings → API**, copy the **Project URL** and the **anon public** key.
2. Create `.env.local` in the repo root (copy from [`.env.example`](.env.example)):

   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-KEY
   ```

3. Restart the dev server (`npm run dev`). Pippin now uses Supabase.

To confirm which backend is live at runtime: `import { api } from './lib/api'` and
check `api.mode` (`'local'` or `'supabase'`).

## 5. (Optional) Enable Google / Apple sign-in

In Supabase mode the social buttons do a real OAuth redirect, so they only work
once the provider is configured. To avoid dead-end journeys, the buttons stay
**hidden until you list the provider in `VITE_AUTH_PROVIDERS`**. Email sign-in
always works regardless.

**Google (the realistic one to set up):**
1. **Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID
   → Web application.** Add `https://mzimtqdtfuehxlfqzajx.supabase.co/auth/v1/callback`
   as an authorized redirect URI. Copy the Client ID and Client Secret.
2. **Supabase → Authentication → Sign In / Providers → Google** → enable, paste the
   Client ID and Secret, save.
3. **Supabase → Authentication → URL Configuration → Redirect URLs** → add your app
   origin (e.g. `http://localhost:5173`, and your production URL later).
4. In `.env.local` set `VITE_AUTH_PROVIDERS=google` and restart the dev server. The
   Google button now appears and works.

**Apple** needs a paid **Apple Developer Program** account ($99/yr) plus a Services
ID, a key, and return-URL setup. Once done, add `apple` to `VITE_AUTH_PROVIDERS`
(e.g. `VITE_AUTH_PROVIDERS=google,apple`).

The chosen onboarding goal is preserved across the redirect, a new social user gets
the same first-run welcome + First Steps badge, and any OAuth error is surfaced as a
toast instead of a silent dead-end. In **local mode** (no Supabase) the buttons sign
into a per-provider demo account so the flow is testable offline.

## What's real vs. next

- ✅ Real auth, cloud-synced state, real global leaderboard.
- ✅ **Schema is ready for multi-user friends and circles.** `supabase/schema.sql`
  now also creates `friendships` (directed requests with a `status` of `pending` /
  `accepted`) and `circle_members`, both with RLS. Run the schema and the tables
  are there. Wiring the app's friends/circles UI to these tables (real friend
  requests, shared circle membership and feeds) is the remaining step, and it can
  only be built and verified once your project is live, because it needs real
  rows from real users to test against.
- ⏭️ Meal **photos** currently embed as compressed data-URLs inside the JSON state.
  For scale, move them to **Supabase Storage** and keep only the URL in state.
