// XP, levels, character evolution, streaks and badge rules. All of these are
// derived from real logged data — nothing here is hard-coded per user.

import { dayKey, todayKey } from './format'
import type { UserState } from './types'

export const XP_PER_LEVEL = 500

export const XP = {
  ONBOARD: 50,
  LOG_MEAL: 45,
  DAILY_QUEST: 50,
  LOG_ACTIVITY: 30,
  JOIN_CHALLENGE: 15,
  CHEER: 2,
} as const

export type Stage = { key: string; name: string; minLevel: number }

export const STAGES: Stage[] = [
  { key: 'seed', name: 'Seed', minLevel: 1 },
  { key: 'sprout', name: 'Sprout', minLevel: 5 },
  { key: 'bloomer', name: 'Bloomer', minLevel: 25 },
  { key: 'legend', name: 'Legend', minLevel: 60 },
]

export function levelFromXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1
}

export function levelProgress(xp: number): { into: number; need: number; pct: number } {
  const into = xp % XP_PER_LEVEL
  return { into, need: XP_PER_LEVEL, pct: into / XP_PER_LEVEL }
}

export function stageForLevel(level: number): { current: Stage; next: Stage | null } {
  let current = STAGES[0]
  for (const s of STAGES) if (level >= s.minLevel) current = s
  const next = STAGES.find((s) => s.minLevel > level) ?? null
  return { current, next }
}

/** XP still needed to reach the next character stage, or 0 if maxed. */
export function xpToNextStage(xp: number): { next: string | null; xp: number } {
  const level = levelFromXp(xp)
  const { next } = stageForLevel(level)
  if (!next) return { next: null, xp: 0 }
  const target = (next.minLevel - 1) * XP_PER_LEVEL
  return { next: next.name, xp: Math.max(0, target - xp) }
}

/** Consecutive days (ending today or yesterday) with at least one logged event. */
export function computeStreak(state: UserState, now = Date.now()): number {
  const days = new Set<string>()
  for (const m of state.meals) days.add(dayKey(m.at))
  for (const a of state.activities) days.add(dayKey(a.at))
  if (days.size === 0) return 0

  const oneDay = 86_400_000
  const today = todayKey(now)
  const yesterday = dayKey(now - oneDay)
  // Streak only "live" if there's activity today or yesterday.
  let cursor: number
  if (days.has(today)) cursor = now
  else if (days.has(yesterday)) cursor = now - oneDay
  else return 0

  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak++
    cursor -= oneDay
  }
  return streak
}

// ── Badges ────────────────────────────────────────────────────────────────
export type Badge = { id: string; name: string; color: string; hint: string }

export const BADGES: Badge[] = [
  { id: 'first-steps', name: 'First Steps', color: '#18C98A', hint: 'Finish onboarding' },
  { id: 'early-bird', name: 'Early Bird', color: '#FF8A1E', hint: 'Log a meal before 9am' },
  { id: 'streak-7', name: '7-Day Streak', color: '#FF4D6D', hint: 'Keep a 7-day streak' },
  { id: 'first-move', name: 'On the Move', color: '#2BB7F2', hint: 'Log your first activity' },
  { id: 'meal-master', name: 'Meal Master', color: '#FFC53D', hint: 'Log 10 meals' },
  { id: 'squad-captain', name: 'Squad Captain', color: '#7C3AF6', hint: 'Join a challenge' },
  { id: 'iron-will', name: 'Iron Will', color: '#FF6CB6', hint: 'Reach a 14-day streak' },
  { id: 'century', name: '100 Meals', color: '#18C98A', hint: 'Log 100 meals' },
]

/** Returns the ids of every badge currently earned by the data. */
export function earnedBadges(state: UserState, now = Date.now()): string[] {
  const earned: string[] = []
  const streak = computeStreak(state, now)
  const earlyMeal = state.meals.some((m) => new Date(m.at).getHours() < 9)

  if (state.onboardedAt) earned.push('first-steps')
  if (earlyMeal) earned.push('early-bird')
  if (streak >= 7) earned.push('streak-7')
  if (state.activities.length >= 1) earned.push('first-move')
  if (state.meals.length >= 10) earned.push('meal-master')
  if (state.joinedChallenges.length >= 1) earned.push('squad-captain')
  if (streak >= 14) earned.push('iron-will')
  if (state.meals.length >= 100) earned.push('century')
  return earned
}

/** kcal burned estimate for an activity, MET-based, assuming ~70kg. */
export function estimateBurn(kind: string, minutes: number, km = 0): number {
  const met: Record<string, number> = { walk: 3.5, run: 9.8, ride: 7.5, workout: 6, steps: 0 }
  if (kind === 'steps') return 0
  const perMin = ((met[kind] ?? 5) * 3.5 * 70) / 200
  const base = perMin * minutes
  // small distance bonus for run/ride/walk
  return Math.round(base + (kind === 'steps' ? 0 : km * 12))
}

export function stepsToKm(steps: number): number {
  return Math.round((steps * 0.000762) * 10) / 10
}
