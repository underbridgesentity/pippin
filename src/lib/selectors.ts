// Pure, derived views over the persisted state. Everything the UI displays
// (calories, streaks, levels, leaderboard rank, challenge progress) is computed
// here from real logged data. No screen reads raw counters.

import { dayKey, num, todayKey } from './format'
import { api } from './api'
import { CHALLENGE_BY_ID, CIRCLES, MEMBER_BY_ID, MEMBERS, circleFeed, communityFeed, type Circle, type SeedMember } from './seed'

// On a real backend the feed/circles are populated by actual people, so the
// seeded personas are suppressed (showing invented users to real members reads
// as deceptive). Local/demo mode keeps them so the app never looks empty.
const ambientFeed = (now: number) => (api.realFeed ? [] : communityFeed(now))
const ambientCircleFeed = (circleId: string, now: number) => (api.realFeed ? [] : circleFeed(circleId, now))
import {
  BADGES,
  computeStreak,
  earnedBadges,
  levelFromXp,
  levelProgress,
  stageForLevel,
  xpToNextStage,
} from './gamification'
import type { Account, ActivityEntry, Challenge, FeedEntry, MealEntry, ReactionKind, UserState } from './types'

export const QUEST_TARGET = 3
const WEEK = 7 * 86_400_000

export type DecoratedFeed = FeedEntry & {
  reactionCounts: Partial<Record<ReactionKind, number>>
  totalReactions: number
  myReaction: ReactionKind | null
  comments: ReturnType<typeof mergeComments>
  commentCount: number
}

function mergeComments(entry: FeedEntry, s: UserState) {
  const seed = entry.seedComments ?? []
  const mine = s.comments[entry.id] ?? []
  return [...seed, ...mine].sort((a, b) => a.at - b.at)
}

export function decorateEntry(entry: FeedEntry, s: UserState): DecoratedFeed {
  // Real community posts carry the viewer's reaction from the server; seeded and
  // local entries fall back to the locally-stored reaction.
  const myReaction = entry.serverMyReaction !== undefined
    ? entry.serverMyReaction
    : s.reactions[entry.id] ?? (s.cheers[entry.id] ? ('cheer' as ReactionKind) : null)
  const counts: Partial<Record<ReactionKind, number>> = { ...(entry.baseReactions ?? {}) }
  if (myReaction) counts[myReaction] = (counts[myReaction] ?? 0) + 1
  const totalReactions = Object.values(counts).reduce((t, n) => t + (n ?? 0), 0)
  const comments = mergeComments(entry, s)
  return { ...entry, reactionCounts: counts, totalReactions, myReaction, comments, commentCount: comments.length }
}

/** The merged, decorated global feed: real cross-user posts (when present) +
 * the user's own non-circle events + ambient community. When real posts exist,
 * local 'post' entries are hidden (the server is the source of truth for those);
 * the user's auto-events (meals, activities, levels) still show. */
export function buildFeed(s: UserState, communityPosts: FeedEntry[] = [], now = Date.now()): DecoratedFeed[] {
  const hasReal = communityPosts.length > 0
  const local = s.feed.filter((e) => !e.circleId && (!hasReal || e.kind !== 'post'))
  const merged = [...communityPosts, ...local, ...ambientFeed(now)].sort((a, b) => b.at - a.at)
  return merged.map((e) => decorateEntry(e, s))
}

/** A single circle's feed: the user's posts to that circle + seeded circle posts. */
export function buildCircleFeed(s: UserState, circleId: string, now = Date.now()): DecoratedFeed[] {
  const mine = s.feed.filter((e) => e.circleId === circleId)
  const merged = [...mine, ...ambientCircleFeed(circleId, now)].sort((a, b) => b.at - a.at)
  return merged.map((e) => decorateEntry(e, s))
}

/** Resolve any post by id across the global feed, community and every circle. */
export function findDecoratedPost(s: UserState, id: string, communityPosts: FeedEntry[] = [], now = Date.now()): DecoratedFeed | null {
  let entry = communityPosts.find((e) => e.id === id) ?? s.feed.find((e) => e.id === id) ?? ambientFeed(now).find((e) => e.id === id)
  if (!entry) {
    for (const c of CIRCLES) {
      const f = ambientCircleFeed(c.id, now).find((e) => e.id === id)
      if (f) {
        entry = f
        break
      }
    }
  }
  return entry ? decorateEntry(entry, s) : null
}

/** The user's raw contribution to a circle's metric (regardless of joined). */
export function circleYours(s: UserState, circle: Circle): number {
  if (circle.metric === 'steps') return s.activities.reduce((t, a) => t + a.steps, 0)
  if (circle.metric === 'activities') return s.activities.length
  if (circle.metric === 'meals') return s.meals.length
  const days = new Set<string>()
  s.meals.forEach((m) => days.add(dayKey(m.at)))
  s.activities.forEach((a) => days.add(dayKey(a.at)))
  return days.size
}

/** Collective progress on a circle's shared goal, with the user's own contribution. */
export function circleGoalProgress(s: UserState, circle: Circle) {
  const joined = s.circles.includes(circle.id)
  const yours = joined ? circleYours(s, circle) : 0
  const collective = circle.goalProgress + yours
  return {
    joined,
    yours,
    collective,
    target: circle.goalTarget,
    pct: Math.min(1, collective / circle.goalTarget),
    youTarget: circle.youTarget,
    youPct: Math.min(1, yours / circle.youTarget),
    youEarned: joined && yours >= circle.youTarget,
  }
}

// ── Circle reward badges ─────────────────────────────────────────────────────
export type CircleBadge = { id: string; name: string; emoji: string; color: string; circleId: string }

export const CIRCLE_BADGES: CircleBadge[] = CIRCLES.map((c) => ({ id: `circle-${c.id}`, name: c.reward, emoji: c.rewardEmoji, color: c.color, circleId: c.id }))
export const CIRCLE_BADGE_BY_ID: Record<string, CircleBadge> = Object.fromEntries(CIRCLE_BADGES.map((b) => [b.id, b]))

/** Circle reward badge ids the user has earned (joined + hit their personal target). */
export function earnedCircleBadges(s: UserState): string[] {
  return CIRCLES.filter((c) => s.circles.includes(c.id) && circleYours(s, c) >= c.youTarget).map((c) => `circle-${c.id}`)
}

export type LeaderRow = {
  rank: number
  id: string
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

  const kudosGiven =
    Object.keys(s.reactions).length +
    Object.keys(s.cheers).filter((k) => s.cheers[k] && !s.reactions[k]).length +
    Object.values(s.comments).flat().filter((com) => com.author === 'me').length
  const kudosReceived = s.kudosReceived

  const friends = s.friends.map((id) => MEMBER_BY_ID[id]).filter((m): m is SeedMember => !!m)
  const friendsLeaderboard = buildLeaderboard(account, weeklyXp, friends)

  const earnedCircleIds = new Set(earnedCircleBadges(s))
  const circleBadges = CIRCLE_BADGES.map((b) => ({ ...b, unlocked: earnedCircleIds.has(b.id), inCircle: s.circles.includes(b.circleId) }))

  const buddy = s.buddyId ? MEMBER_BY_ID[s.buddyId] ?? null : null
  const todayCheckIn = s.checkIns.find((ci) => dayKey(ci.at) === today) ?? null

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
    kudosGiven,
    kudosReceived,
    friends,
    friendIds: s.friends,
    friendCount: friends.length,
    friendsLeaderboard,
    circleIds: s.circles,
    circleBadges,
    buddy,
    todayCheckIn,
    checkInCount: s.checkIns.length,
    buddyLastCheckIn: s.buddyLastCheckIn ?? null,
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
    id: m.id,
    name: m.name,
    initial: m.initial,
    avatar: m.avatar,
    xp: m.weeklyXp,
    weeklyXp: m.weeklyXp,
    move: m.move,
    you: false,
  }))
  rows.push({
    id: 'me',
    name: `${account.name.split(' ')[0]} (You)`,
    initial: (account.name[0] || 'Y').toUpperCase(),
    avatar: account.avatar,
    xp: weeklyXp,
    weeklyXp,
    move: `+${num(Math.round(weeklyXp / 7))}`,
    you: true,
  })
  rows.sort((a, b) => b.weeklyXp - a.weeklyXp)
  return rows.map((r, i) => ({ rank: i + 1, id: r.id, name: r.name, initial: r.initial, avatar: r.avatar, xp: r.xp, move: r.move, you: r.you }))
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
