// Stable seeded community: the other people in the app. The current user is real
// and computed; these provide a believable social context to act within. When a
// backend is added, these come from the server instead.

import type { Challenge, FeedEntry } from './types'

export const CHALLENGES: Challenge[] = [
  { id: 'c1', name: '7-Day Sugar Detox', cat: 'Eat better', color: '#FF4D6D', tint: '#FFE7EC', people: '1.2k', days: 7, diff: 'Easy', reward: 'Sweet Escape', metric: 'days', target: 7 },
  { id: 'c2', name: '10K Steps Squad', cat: 'Move more', color: '#18C98A', tint: '#E2F8EF', people: '3.6k', days: 30, diff: 'Medium', reward: 'Trailblazer', metric: 'steps', target: 10000 },
  { id: 'c3', name: 'Summer Shred', cat: 'Lose weight', color: '#FF8A1E', tint: '#FFF0DC', people: '920', days: 21, diff: 'Hard', reward: 'Phoenix', metric: 'activities', target: 21 },
  { id: 'c4', name: 'Hydration Hero', cat: 'Feel good', color: '#2BB7F2', tint: '#E2F4FE', people: '2.1k', days: 14, diff: 'Easy', reward: 'Aqua Spirit', metric: 'days', target: 14 },
  { id: 'c5', name: 'Meal Prep Masters', cat: 'Eat better', color: '#7C3AF6', tint: '#EFE7FF', people: '780', days: 14, diff: 'Medium', reward: 'Kitchen Boss', metric: 'meals', target: 28 },
  { id: 'c6', name: 'Weekend Warrior', cat: 'Move more', color: '#FF6CB6', tint: '#FFE9F4', people: '1.5k', days: 30, diff: 'Hard', reward: 'Unstoppable', metric: 'activities', target: 12 },
]

export const CHALLENGE_BY_ID: Record<string, Challenge> = Object.fromEntries(CHALLENGES.map((c) => [c.id, c]))

export type SeedMember = {
  id: string
  name: string
  initial: string
  avatar: string
  weeklyXp: number
  move: string
}

export const MEMBERS: SeedMember[] = [
  { id: 'm-priya', name: 'Priya N.', initial: 'P', avatar: 'linear-gradient(135deg,#FF6CB6,#7C3AF6)', weeklyXp: 4820, move: '+340' },
  { id: 'm-maya', name: 'Maya R.', initial: 'M', avatar: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)', weeklyXp: 4510, move: '+280' },
  { id: 'm-theo', name: 'Theo K.', initial: 'T', avatar: 'linear-gradient(135deg,#2BB7F2,#7C3AF6)', weeklyXp: 4180, move: '+210' },
  { id: 'm-leo', name: 'Leo M.', initial: 'L', avatar: 'linear-gradient(135deg,#18C98A,#2BB7F2)', weeklyXp: 3720, move: '+160' },
  { id: 'm-nina', name: 'Nina P.', initial: 'N', avatar: 'linear-gradient(135deg,#FFC53D,#FF8A1E)', weeklyXp: 3500, move: '+120' },
  { id: 'm-owen', name: 'Owen B.', initial: 'O', avatar: 'linear-gradient(135deg,#7C3AF6,#2BB7F2)', weeklyXp: 3310, move: '+90' },
  { id: 'm-aria', name: 'Aria T.', initial: 'A', avatar: 'linear-gradient(135deg,#FF4D6D,#FFC53D)', weeklyXp: 2980, move: '+70' },
  { id: 'm-kabelo', name: 'Kabelo D.', initial: 'K', avatar: 'linear-gradient(135deg,#18C98A,#7C3AF6)', weeklyXp: 2640, move: '+55' },
]

const MIN = 60_000
const HR = 3_600_000

/** Ambient community feed, relative to now so it always feels fresh. */
export function communityFeed(now = Date.now()): FeedEntry[] {
  return [
    {
      id: 'cf-1', at: now - 12 * MIN, kind: 'activity', author: 'm-maya', name: 'Maya R.', initial: 'M',
      avatar: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)', action: 'crushed a morning 5K', stat: '5.0 km · 27:48 · 410 kcal', baseCheers: 24,
    },
    {
      id: 'cf-2', at: now - 34 * MIN, kind: 'meal', author: 'm-theo', name: 'Theo K.', initial: 'T',
      avatar: 'linear-gradient(135deg,#2BB7F2,#7C3AF6)', action: 'logged a power lunch', stat: '620 kcal · 48g protein',
      photo: 'linear-gradient(135deg,#FFD7A8,#FF9F6B 55%,#7BC47F)', baseCheers: 11,
    },
    {
      id: 'cf-3', at: now - 1 * HR, kind: 'badge', author: 'm-priya', name: 'Priya N.', initial: 'P',
      avatar: 'linear-gradient(135deg,#FF6CB6,#7C3AF6)', action: 'unlocked a new badge', badge: '7-Day Streak', baseCheers: 38,
    },
    {
      id: 'cf-4', at: now - 2 * HR, kind: 'challenge', author: 'm-leo', name: 'The Early Birds', initial: 'E',
      avatar: 'linear-gradient(135deg,#18C98A,#2BB7F2)', action: 'hit 72% of the squad goal', stat: '720,400 / 1,000,000 steps', baseCheers: 16,
    },
    {
      id: 'cf-5', at: now - 4 * HR, kind: 'activity', author: 'm-nina', name: 'Nina P.', initial: 'N',
      avatar: 'linear-gradient(135deg,#FFC53D,#FF8A1E)', action: 'finished a yoga flow', stat: '40 min · 150 kcal', baseCheers: 9,
    },
  ]
}

/** The headline team challenge shown on Quests. */
export const TEAM_CHALLENGE = {
  name: 'Move Marathon',
  squad: 'The Early Birds',
  goalSteps: 1_000_000,
  current: 720_400,
  daysLeft: 9,
  members: [
    { label: 'P', bg: 'linear-gradient(135deg,#FF6CB6,#7C3AF6)' },
    { label: 'M', bg: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)' },
    { label: 'T', bg: 'linear-gradient(135deg,#2BB7F2,#7C3AF6)' },
  ],
}
