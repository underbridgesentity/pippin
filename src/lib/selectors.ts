// Pure, derived views over the persisted state. Everything the UI displays —
// calories, streaks, levels, leaderboard rank, challenge progress — is computed
// here from real logged data. No screen reads raw counters.

import { dayKey, num, todayKey } from './format'
import { CHALLENGE_BY_ID, MEMBERS, type SeedMember } from './seed'
import {
  BADGES,
  computeStreak,
  earnedBadges,
  levelFromXp,
  levelProgress,
  stageForLevel,
  xpToNextStage,
} from './gamification'
import type { Account, ActivityEntry, Challenge, MealEntry, UserState } from './types'

export const QUEST_TARGET = 3
const WEEK = 7 * 86_400_000

export type LeaderRow = {
  rank: number
  name: string
  initial: string
  avatar: string
  xp: number
  move: string
  you: boolean
}

export type JoinedChallenge = {
  challenge: Challenge
  value: number
  pct: number
  label: string
  complete: boolean
}

export type Derived = ReturnType<typeof derive>

export function derive(account: Account, s: UserState, now = Date.now(), members: SeedMember[] = MEMBERS) {
  const today = todayKey(now)
  const todayMeals = s.meals.filter((m) => dayKey(m.at) === today).sort((a, b) => b.at - a.at)
  const todayActivities = s.activities.filter((a) => dayKey(a.at) === today)

  const caloriesConsumed = todayMeals.reduce((t, m) => t + m.kcal, 0)
  const macros = todayMeals.reduce(
    (t, m) => ({ protein: t.protein + m.macros.protein, carbs: t.carbs + m.macros.carbs, fat: t.fat + m.macros.fat }),
    { protein: 0, carbs: 0, fat: 0 },
  )
  const caloriesBurned = todayActivities.reduce((t, a) => t + a.kcalBurned, 0)
  const steps = todayActivities.reduce((t, a) => t + a.steps, 0)
  const activeMinutes = todayActivities.reduce((t, a) => t + a.minutes, 0)

  const target = s.settings.calorieTarget
  const caloriesPct = target > 0 ? Math.min(1, caloriesConsumed / target) : 0

  const totalXp = s.xp
  const level = levelFromXp(totalXp)
  const lp = levelProgress(totalXp)
  const { current: stage } = stageForLevel(level)
  const toNext = xpToNextStage(totalXp)
  const streak = computeStreak(s, now)

  const questDone = todayMeals.length
  const quest = {
    done: Math.min(questDone, QUEST_TARGET),
    target: QUEST_TARGET,
    pct: Math.min(1, questDone / QUEST_TARGET),
    claimable: questDone >= QUEST_TARGET && s.questClaimedOn !== today,
    claimed: s.questClaimedOn === today,
  }

  const earnedIds = new Set(earnedBadges(s, now))
  const badges = BADGES.map((b) => ({ ...b, unlocked: earnedIds.has(b.id) }))
  const unlockedCount = badges.filter((b) => b.unlocked).length

  const weeklyXp = computeWeeklyXp(s, now)
  const leaderboard = buildLeaderboard(account, weeklyXp, members)
  const myRank = leaderboard.find((r) => r.you)?.rank ?? leaderboard.length

  const joinedChallenges: JoinedChallenge[] = s.joinedChallenges
    .map((id) => CHALLENGE_BY_ID[id])
    .filter(Boolean)
    .map((c) => challengeProgress(c, s, now))

  return {
    now,
    account,
    goal: s.goal,
    settings: s.settings,

    caloriesConsumed,
    caloriesTarget: target,
    caloriesRemaining: Math.max(0, target - caloriesConsumed),
    caloriesPct,
    macros,
    caloriesBurned,
    steps,
    stepsTarget: s.settings.stepsTarget,
    activeMinutes,
    onTrack: caloriesConsumed <= target,

    totalXp,
    level,
    xpInto: lp.into,
    xpNeed: lp.need,
    xpPct: lp.pct,
    stageName: stage.name,
    nextStage: toNext.next,
    xpToNextStage: toNext.xp,

    streak,
    quest,

    badges,
    unlockedCount,
    badgeTotal: BADGES.length,

    todayMeals,
    mealCount: s.meals.length,
    activityCount: s.activities.length,

    weeklyXp,
    leaderboard,
    myRank,
    joinedChallenges,
    winsCount: countWins(s),
  }
}

export function computeWeeklyXp(s: UserState, now: number = Date.now()): number {
  const since = now - WEEK
  const meals = s.meals.filter((m) => m.at >= since).length * 45
  const acts = s.activities.filter((a) => a.at >= since).length * 30
  const joins = Object.values(s.challengeJoinedOn).filter((d) => {
    const t = new Date(d + 'T00:00:00').getTime()
    return t >= since
  }).length * 15
  return meals + acts + joins
}

function buildLeaderboard(account: Account, weeklyXp: number, members: SeedMember[]): LeaderRow[] {
  const rows: (Omit<LeaderRow, 'rank'> & { weeklyXp: number })[] = members.map((m: SeedMember) => ({
    name: m.name,
    initial: m.initial,
    avatar: m.avatar,
    xp: m.weeklyXp,
    weeklyXp: m.weeklyXp,
    move: m.move,
    you: false,
  }))
  rows.push({
    name: `${account.name.split(' ')[0]} (You)`,
    initial: (account.name[0] || 'Y').toUpperCase(),
    avatar: account.avatar,
    xp: weeklyXp,
    weeklyXp,
    move: `+${num(Math.round(weeklyXp / 7))}`,
    you: true,
  })
  rows.sort((a, b) => b.weeklyXp - a.weeklyXp)
  return rows.map((r, i) => ({ rank: i + 1, name: r.name, initial: r.initial, avatar: r.avatar, xp: r.xp, move: r.move, you: r.you }))
}

function challengeProgress(c: Challenge, s: UserState, now: number): JoinedChallenge {
  const joinedOn = s.challengeJoinedOn[c.id]
  const joinedTs = joinedOn ? new Date(joinedOn + 'T00:00:00').getTime() : now
  const today = todayKey(now)
  let value = 0
  let label = ''

  if (c.metric === 'steps') {
    value = s.activities.filter((a) => dayKey(a.at) === today).reduce((t, a) => t + a.steps, 0)
    label = `${num(value)} / ${num(c.target)} steps today`
  } else if (c.metric === 'meals') {
    value = s.meals.filter((m) => m.at >= joinedTs).length
    label = `${value} / ${c.target} meals logged`
  } else if (c.metric === 'activities') {
    value = s.activities.filter((a) => a.at >= joinedTs).length
    label = `${value} / ${c.target} workouts`
  } else {
    value = Math.min(c.target, Math.floor((now - joinedTs) / 86_400_000) + 1)
    label = `Day ${value} of ${c.target}`
  }

  const pct = Math.min(1, value / c.target)
  return { challenge: c, value, pct, label, complete: pct >= 1 }
}

function countWins(s: UserState): number {
  // a "win" = a day you hit your calorie target (or under) with at least one meal
  const byDay = new Map<string, number>()
  for (const m of s.meals) byDay.set(dayKey(m.at), (byDay.get(dayKey(m.at)) ?? 0) + m.kcal)
  let wins = 0
  for (const total of byDay.values()) if (total > 0 && total <= s.settings.calorieTarget) wins++
  return wins
}

export function mealTypeFor(now = Date.now()): MealEntry['type'] {
  const h = new Date(now).getHours()
  if (h < 11) return 'breakfast'
  if (h < 15) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

export function summarizeActivity(a: ActivityEntry): string {
  const bits: string[] = []
  if (a.km) bits.push(`${a.km} km`)
  if (a.minutes) bits.push(`${a.minutes} min`)
  if (a.steps) bits.push(`${num(a.steps)} steps`)
  if (a.kcalBurned) bits.push(`${num(a.kcalBurned)} kcal`)
  return bits.join(' · ')
}
