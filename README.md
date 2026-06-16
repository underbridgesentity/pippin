# Fettle

> Reach your goals. Together.

A gamified fitness & wellness community app — log your meals for real calorie
counts, track activity, crush challenges, climb the leaderboard, and watch your
character evolve as you level up. Mobile-first, iOS-style, candy-bright, and
**fully functional**: real accounts, real persisted data, real gamification.

Originally designed in [Claude Design](https://claude.ai/design) — the handoff
bundle is preserved in
[`gamified-fitness-community-platform/`](gamified-fitness-community-platform/).

## Stack

- **React 18** + **TypeScript** + **Vite**
- **Local-first, with a real backend on a switch**: all data goes through one
  data-access layer ([`src/lib/api/`](src/lib/api)) that has two adapters — local
  storage (default, zero setup) and **Supabase** (real auth, cloud sync, real
  global leaderboard). It picks the backend from env vars; the UI is untouched
  either way. See [SUPABASE.md](SUPABASE.md).
- A bundled nutrition database (no external API, no keys, works offline).
- Fonts: **Fredoka** (display) + **Nunito** (body).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run preview  # preview the production build
```

## It actually works — no mock data

Everything below is real, computed from what you log, and persisted across reloads.

- **Accounts & auth** — sign up / log in / log out. Accounts and sessions are
  stored locally; your data restores automatically on return.
- **Meal logging** — open the camera (live capture where permitted, photo-library
  or manual fallback otherwise), search a real food database, set portions, pick a
  meal type, and log. Calories & macros are summed from the database.
- **Activity logging** — walks, runs, rides, workouts and steps, with a MET-based
  calorie-burn estimate.
- **Live dashboard** — today's calories vs. your goal-based target, calories
  burned, steps, active minutes — all derived from your logs.
- **XP, levels & evolution** — every action grants XP; your level and character
  stage (Seed → Sprout → Bloomer → Legend) are computed from it, with level-up and
  badge moments.
- **Streaks** — consecutive days with activity, computed from your log history.
- **Badges** — unlock automatically from real milestones (first meal, first
  activity, 7-day streak, 10 meals, join a challenge…).
- **Daily quest** — "snap 3 meals today" tracks real meals; claim the XP bonus.
- **Challenges** — join/leave real challenges; personal progress is tracked
  against steps / meals / activities / days.
- **Leaderboard** — seeded community members + you, ranked by weekly XP; you climb
  as you log.
- **Settings** — edit profile, change daily targets and goal, log out.

## Architecture

```
src/
  App.tsx                # provider + auth gating + tab routing + overlays
  data.ts                # onboarding goal options
  lib/
    types.ts             # domain model
    storage.ts           # namespaced/versioned localStorage wrapper
    api/                 # ⭐ backend adapters — contract + local + supabase, picked by env
    store.tsx            # reactive store (useSyncExternalStore) + all actions
    selectors.ts         # pure derived views (every displayed number)
    gamification.ts      # XP / levels / stages / streaks / badge rules
    foods.ts             # bundled nutrition database + search
    seed.ts              # seeded community (members, challenges, ambient feed)
    hooks.ts             # useDerived()
    format.ts, image.ts  # helpers (dates/format, photo compression)
  components/            # IOSDevice, TabBar, Toast, Sheet, Ring, ProgressBar, Avatar, Mascot, Confetti
  screens/               # Auth, Welcome, Home, Quests, Squad, Profile, Capture, AddActivity, Settings
```

**Going multi-user** is already wired: add a free Supabase project's URL + anon
key to `.env.local` and Fettle switches to real auth, cloud-synced state, and a
real global leaderboard — no code changes. Full walkthrough in
[SUPABASE.md](SUPABASE.md). Friends / friends-only leaderboards are the next
increment from there.

## Notes

- Meal photos are downscaled to small JPEGs so they fit in `localStorage`; a
  backend would store full-resolution uploads (and move photos to object storage).
- Local password hashing is intentionally simple — real hashing belongs server-side.
- Camera capture needs a secure context and permission; it falls back to the
  photo library or manual entry gracefully.
