// The seeded community: the people of Fettle and the supportive content they
// share. The current user is real and computed; this gives a warm, encouraging
// social context to act within. Becomes real users once Supabase is connected.

import type { Challenge, Comment, FeedEntry } from './types'

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
  bio?: string
  level?: number
  streak?: number
  wins?: number
  badges?: number
}

export const MEMBERS: SeedMember[] = [
  { id: 'm-priya', name: 'Priya N.', initial: 'P', avatar: 'linear-gradient(135deg,#FF6CB6,#7C3AF6)', weeklyXp: 4820, move: '+340', level: 22, streak: 41, wins: 30, badges: 7, bio: 'Morning runner ☀️ Here to keep the squad moving. You vs. yesterday — always.' },
  { id: 'm-maya', name: 'Maya R.', initial: 'M', avatar: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)', weeklyXp: 4510, move: '+280', level: 19, streak: 28, wins: 24, badges: 6, bio: 'Half-marathon in training. Big believer in small daily wins 💪' },
  { id: 'm-theo', name: 'Theo K.', initial: 'T', avatar: 'linear-gradient(135deg,#2BB7F2,#7C3AF6)', weeklyXp: 4180, move: '+210', level: 17, streak: 12, wins: 18, badges: 5, bio: 'Meal-prep nerd & gym regular. Ask me about high-protein lunches 🍱' },
  { id: 'm-leo', name: 'Leo M.', initial: 'L', avatar: 'linear-gradient(135deg,#18C98A,#2BB7F2)', weeklyXp: 3720, move: '+160', level: 15, streak: 9, wins: 14, badges: 5, bio: 'Cyclist. Slow progress is still progress 🚴' },
  { id: 'm-nina', name: 'Nina P.', initial: 'N', avatar: 'linear-gradient(135deg,#FFC53D,#FF8A1E)', weeklyXp: 3500, move: '+120', level: 14, streak: 21, wins: 12, badges: 4, bio: 'Yoga + walks. Wellness is a marathon, not a sprint 🧘' },
  { id: 'm-owen', name: 'Owen B.', initial: 'O', avatar: 'linear-gradient(135deg,#7C3AF6,#2BB7F2)', weeklyXp: 3310, move: '+90', level: 13, streak: 6, wins: 10, badges: 4, bio: 'Just here to feel better and have fun doing it 🙌' },
  { id: 'm-aria', name: 'Aria T.', initial: 'A', avatar: 'linear-gradient(135deg,#FF4D6D,#FFC53D)', weeklyXp: 2980, move: '+70', level: 12, streak: 15, wins: 9, badges: 3, bio: 'Recovering couch potato, 15-day streak and counting 🔥' },
  { id: 'm-kabelo', name: 'Kabelo D.', initial: 'K', avatar: 'linear-gradient(135deg,#18C98A,#7C3AF6)', weeklyXp: 2640, move: '+55', level: 11, streak: 8, wins: 7, badges: 3, bio: 'Hydration evangelist 💧 Lekker journey so far.' },
]

export const MEMBER_BY_ID: Record<string, SeedMember> = Object.fromEntries(MEMBERS.map((m) => [m.id, m]))

const MIN = 60_000
const HR = 3_600_000

function c(member: SeedMember, at: number, text: string, tip = false): Comment {
  return { id: `sc-${member.id}-${at}`, at, author: member.id, name: member.name, initial: member.initial, avatar: member.avatar, text, tip }
}

/** Ambient community feed — supportive, varied, and relative to now so it feels fresh. */
export function communityFeed(now = Date.now()): FeedEntry[] {
  const M = MEMBER_BY_ID
  return [
    {
      id: 'cf-1', at: now - 12 * MIN, kind: 'activity', author: 'm-maya', name: 'Maya R.', initial: 'M', avatar: M['m-maya'].avatar,
      action: 'crushed a morning 5K', stat: '5.0 km · 27:48 · 410 kcal', baseCheers: 24,
      baseReactions: { cheer: 18, fire: 9, strong: 6 },
      seedComments: [c(M['m-theo'], now - 8 * MIN, 'Beast mode 🔥 what a pace!'), c(M['m-nina'], now - 5 * MIN, 'So inspiring, love seeing this first thing 💛')],
    },
    {
      id: 'cf-tip-1', at: now - 26 * MIN, kind: 'post', author: 'm-theo', name: 'Theo K.', initial: 'T', avatar: M['m-theo'].avatar,
      action: 'shared a tip', postType: 'tip', text: 'Prep 3 lunches on Sunday and you basically can\'t fail the week. I batch-cook chicken + rice + roast veg and it takes 40 min total 🍱',
      baseCheers: 31, baseReactions: { cheer: 22, strong: 14, love: 8 },
      seedComments: [c(M['m-aria'], now - 20 * MIN, 'Needed this 🙏 trying it this weekend'), c(M['m-kabelo'], now - 14 * MIN, 'Add a sauce on the side so it doesn\'t get boring — game changer', true)],
    },
    {
      id: 'cf-win-1', at: now - 48 * MIN, kind: 'post', author: 'm-priya', name: 'Priya N.', initial: 'P', avatar: M['m-priya'].avatar,
      action: 'celebrated a win', postType: 'win', text: 'Hit a 40-day streak today!! Six months ago I couldn\'t run for the bus. This community kept me going 🥹',
      baseCheers: 58, baseReactions: { cheer: 40, fire: 26, love: 31, strong: 12 },
      seedComments: [c(M['m-maya'], now - 44 * MIN, 'YES PRIYA 🎉🎉 absolute legend'), c(M['m-owen'], now - 30 * MIN, 'This is the kind of thing that keeps me showing up. Congrats!'), c(M['m-leo'], now - 18 * MIN, '40 days 🤯 inspiring stuff')],
    },
    {
      id: 'cf-q-1', at: now - 1.5 * HR, kind: 'post', author: 'm-aria', name: 'Aria T.', initial: 'A', avatar: M['m-aria'].avatar,
      action: 'asked the squad', postType: 'question', text: 'Anyone have tips for staying motivated on rest days? I always feel like I\'m losing momentum 😅',
      baseCheers: 12, baseReactions: { cheer: 5, love: 7 },
      seedComments: [c(M['m-nina'], now - 70 * MIN, 'Rest IS the work 🧘 a gentle walk counts. Be kind to yourself!', true), c(M['m-maya'], now - 55 * MIN, 'I log a short stretch so my streak stays alive — keeps my head in it', true)],
    },
    {
      id: 'cf-3', at: now - 2 * HR, kind: 'badge', author: 'm-leo', name: 'Leo M.', initial: 'L', avatar: M['m-leo'].avatar,
      action: 'unlocked a new badge', badge: '7-Day Streak', baseCheers: 19, baseReactions: { cheer: 14, fire: 5 },
      seedComments: [c(M['m-kabelo'], now - 90 * MIN, 'One week strong 👏 keep it rolling')],
    },
    {
      id: 'cf-4', at: now - 3 * HR, kind: 'challenge', author: 'm-leo', name: 'The Early Birds', initial: 'E', avatar: 'linear-gradient(135deg,#18C98A,#2BB7F2)',
      action: 'hit 72% of the squad goal', stat: '720,400 / 1,000,000 steps', baseCheers: 16, baseReactions: { cheer: 11, strong: 7 },
    },
    {
      id: 'cf-tip-2', at: now - 5 * HR, kind: 'post', author: 'm-kabelo', name: 'Kabelo D.', initial: 'K', avatar: M['m-kabelo'].avatar,
      action: 'shared a tip', postType: 'tip', text: 'Keep a 1L bottle on your desk and finish it before lunch. Easiest hydration win there is 💧',
      baseCheers: 27, baseReactions: { cheer: 19, love: 9, strong: 4 },
      seedComments: [c(M['m-owen'], now - 4.5 * HR, 'Doing this right now 😄')],
    },
  ]
}

/** Encouraging one-liners used for simulated community responses to your posts. */
export const SUPPORT_LINES = [
  "Let's go! 👏 So proud of you",
  'This is awesome — keep it up! 🔥',
  "You've got this 💪",
  'Love to see it 💛',
  'Inspiring stuff, friend 🙌',
  'Big win! The squad is cheering 🎉',
  'One step at a time — you\'re crushing it ✨',
]

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
