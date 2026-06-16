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
  { id: 'm-priya', name: 'Priya N.', initial: 'P', avatar: 'linear-gradient(135deg,#FF6CB6,#7C3AF6)', weeklyXp: 4820, move: '+340', level: 22, streak: 41, wins: 30, badges: 7, bio: 'Morning runner ☀️ Here to keep the squad moving. You vs. yesterday, always.' },
  { id: 'm-maya', name: 'Maya R.', initial: 'M', avatar: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)', weeklyXp: 4510, move: '+280', level: 19, streak: 28, wins: 24, badges: 6, bio: 'Half-marathon in training. Big believer in small daily wins 💪' },
  { id: 'm-theo', name: 'Theo K.', initial: 'T', avatar: 'linear-gradient(135deg,#2BB7F2,#7C3AF6)', weeklyXp: 4180, move: '+210', level: 17, streak: 12, wins: 18, badges: 5, bio: 'Meal-prep nerd & gym regular. Ask me about high-protein lunches 🍱' },
  { id: 'm-leo', name: 'Leo M.', initial: 'L', avatar: 'linear-gradient(135deg,#18C98A,#2BB7F2)', weeklyXp: 3720, move: '+160', level: 15, streak: 9, wins: 14, badges: 5, bio: 'Cyclist. Slow progress is still progress 🚴' },
  { id: 'm-nina', name: 'Nina P.', initial: 'N', avatar: 'linear-gradient(135deg,#FFC53D,#FF8A1E)', weeklyXp: 3500, move: '+120', level: 14, streak: 21, wins: 12, badges: 4, bio: 'Yoga + walks. Wellness is a marathon, not a sprint 🧘' },
  { id: 'm-owen', name: 'Owen B.', initial: 'O', avatar: 'linear-gradient(135deg,#7C3AF6,#2BB7F2)', weeklyXp: 3310, move: '+90', level: 13, streak: 6, wins: 10, badges: 4, bio: 'Just here to feel better and have fun doing it 🙌' },
  { id: 'm-aria', name: 'Aria T.', initial: 'A', avatar: 'linear-gradient(135deg,#FF4D6D,#FFC53D)', weeklyXp: 2980, move: '+70', level: 12, streak: 15, wins: 9, badges: 3, bio: 'Recovering couch potato, 15-day streak and counting 🔥' },
  { id: 'm-kabelo', name: 'Kabelo D.', initial: 'K', avatar: 'linear-gradient(135deg,#18C98A,#7C3AF6)', weeklyXp: 2640, move: '+55', level: 11, streak: 8, wins: 7, badges: 3, bio: 'Hydration evangelist 💧 Lekker journey so far.' },
]

export const MEMBER_BY_ID: Record<string, SeedMember> = Object.fromEntries(MEMBERS.map((m) => [m.id, m]))

/** Support circles, smaller communities rallying around a shared goal. */
export type CircleMetric = 'activities' | 'steps' | 'meals' | 'days'

export type Circle = {
  id: string
  name: string
  emoji: string
  blurb: string
  color: string
  tint: string
  count: string
  goal: string
  members: string[] // member ids
  /** collective weekly goal the circle pushes toward together */
  goalUnit: string
  goalTarget: number
  /** seeded collective progress (the user's contribution is added on top) */
  goalProgress: number
  /** how the signed-in user contributes to the collective goal */
  metric: CircleMetric
  /** days left in this week's circle challenge */
  daysLeft: number
  /** reward badge the circle unlocks (badge name, no "badge" suffix) */
  reward: string
  rewardEmoji: string
  /** your personal contribution that earns you the reward badge */
  youTarget: number
}

export const CIRCLES: Circle[] = [
  { id: 'cir-runners', name: 'Morning Runners', emoji: '🏃', color: '#FF8A1E', tint: '#FFF0DC', count: '4.2k', goal: 'Run before 8am, 4× a week', members: ['m-maya', 'm-priya', 'm-leo'], blurb: 'Early miles, big smiles. We lace up before the world wakes, come run with us.', goalUnit: 'runs this week', goalTarget: 2000, goalProgress: 1486, metric: 'activities', daysLeft: 4, reward: 'Sunrise Crew', rewardEmoji: '🌅', youTarget: 3 },
  { id: 'cir-sugarfree', name: 'Sugar-Free Squad', emoji: '🍓', color: '#FF4D6D', tint: '#FFE7EC', count: '2.8k', goal: 'Cut added sugar, one day at a time', members: ['m-theo', 'm-aria', 'm-nina'], blurb: 'Beating cravings together. Share swaps, recipes and the wins (and the slip-ups, no judgement here).', goalUnit: 'sugar-free days', goalTarget: 1500, goalProgress: 968, metric: 'days', daysLeft: 6, reward: 'Sweet Freedom', rewardEmoji: '🍬', youTarget: 3 },
  { id: 'cir-newbeginnings', name: 'New Beginnings', emoji: '🌱', color: '#18C98A', tint: '#E2F8EF', count: '6.1k', goal: 'Build the habit, start small', members: ['m-aria', 'm-owen', 'm-kabelo'], blurb: 'Just starting out? This is your soft landing. Every streak begins at day one, we celebrate them all.', goalUnit: 'meals logged', goalTarget: 5000, goalProgress: 3124, metric: 'meals', daysLeft: 9, reward: 'First Bloom', rewardEmoji: '🌸', youTarget: 3 },
  { id: 'cir-mindful', name: 'Mindful Eating', emoji: '🧘', color: '#7C3AF6', tint: '#EFE7FF', count: '1.9k', goal: 'Eat slow, log it, no guilt', members: ['m-nina', 'm-priya'], blurb: 'Wellness over willpower. Less restriction, more awareness, and a lot of encouragement.', goalUnit: 'mindful meals', goalTarget: 1200, goalProgress: 742, metric: 'meals', daysLeft: 5, reward: 'Zen Garden', rewardEmoji: '🪷', youTarget: 3 },
  { id: 'cir-steps', name: 'Step It Up', emoji: '👟', color: '#2BB7F2', tint: '#E2F4FE', count: '5.4k', goal: '10k steps a day, together', members: ['m-leo', 'm-owen', 'm-kabelo', 'm-maya'], blurb: 'Walk, pace, wander, it all counts. Hit your steps and keep the squad streak alive.', goalUnit: 'steps', goalTarget: 5_000_000, goalProgress: 3_412_900, metric: 'steps', daysLeft: 3, reward: 'Trailblazer', rewardEmoji: '🏆', youTarget: 12000 },
]

export const CIRCLE_BY_ID: Record<string, Circle> = Object.fromEntries(CIRCLES.map((c) => [c.id, c]))

/** Seeded posts inside a circle, so each one has a living conversation. */
export function circleFeed(circleId: string, now = Date.now()): FeedEntry[] {
  const M = MEMBER_BY_ID
  const mk = (member: SeedMember, mins: number, postType: FeedEntry['postType'], text: string, react: FeedEntry['baseReactions'], comments: Comment[] = []): FeedEntry => ({
    id: `circ-${circleId}-${member.id}-${mins}`,
    at: now - mins * MIN,
    kind: 'post',
    author: member.id,
    name: member.name,
    initial: member.initial,
    avatar: member.avatar,
    action: postType === 'tip' ? 'shared a tip' : postType === 'win' ? 'celebrated a win' : postType === 'question' ? 'asked the circle' : 'shared an update',
    postType,
    text,
    circleId,
    baseCheers: 0,
    baseReactions: react,
    seedComments: comments,
  })

  switch (circleId) {
    case 'cir-runners':
      return [
        mk(M['m-maya'], 22, 'win', 'Beat my 5K PB this morning, 26:40! The early start is brutal but so worth it ☀️', { cheer: 14, fire: 11, strong: 5 }, [c(M['m-leo'], now - 18 * MIN, 'Flying! 🔥 see you out there tomorrow')]),
        mk(M['m-priya'], 95, 'tip', 'Lay your kit out the night before. Half the battle is just not having to think at 5:45am 👟', { cheer: 9, love: 6 }, [c(M['m-maya'], now - 80 * MIN, 'This is the way. Shoes by the door = no excuses', true)]),
      ]
    case 'cir-sugarfree':
      return [
        mk(M['m-aria'], 40, 'win', 'Day 10 no added sugar 🎉 the cravings have actually faded, didn\'t believe people when they said that', { cheer: 17, fire: 8, love: 9 }, [c(M['m-theo'], now - 30 * MIN, 'Huge! it really does get easier, proud of you 💪')]),
        mk(M['m-nina'], 130, 'tip', 'Frozen grapes when a sweet craving hits. Tastes like candy, zero added sugar 🍇', { cheer: 12, love: 7 }, [c(M['m-aria'], now - 110 * MIN, 'Trying this tonight!')]),
      ]
    case 'cir-newbeginnings':
      return [
        mk(M['m-owen'], 18, 'update', 'Logged my first ever meal today. Small step but I actually did it 🙌', { cheer: 21, love: 14, strong: 6 }, [c(M['m-kabelo'], now - 12 * MIN, 'THIS is how it starts. Welcome, we\'ve got you 💛'), c(M['m-aria'], now - 8 * MIN, 'Day one is the hardest. So proud!')]),
        mk(M['m-kabelo'], 150, 'question', 'How do you stay consistent in the first week? My motivation comes and goes 😅', { cheer: 5, love: 8 }, [c(M['m-aria'], now - 120 * MIN, 'Aim for "just log it", not perfect. Showing up beats motivation every time', true)]),
      ]
    case 'cir-mindful':
      return [
        mk(M['m-nina'], 35, 'tip', 'Put the fork down between bites. Sounds silly but it doubles how satisfied I feel 🍽️', { cheer: 10, love: 9 }, [c(M['m-priya'], now - 25 * MIN, 'Game changer. I eat half as much and enjoy it twice as much')]),
        mk(M['m-priya'], 140, 'update', 'No guilt today, just noticed I was full and stopped. Tiny win but it counts 🧘', { cheer: 8, love: 11 }, []),
      ]
    case 'cir-steps':
      return [
        mk(M['m-leo'], 28, 'win', '14,200 steps today 🚶 took the long way home and called my mum, double win', { cheer: 13, strong: 7, love: 5 }, [c(M['m-owen'], now - 20 * MIN, 'Love a walk-and-talk 👏')]),
        mk(M['m-kabelo'], 120, 'tip', 'Park at the far end of the lot, every time. Free steps add up fast 👟', { cheer: 9, fire: 4 }, []),
      ]
    default:
      return []
  }
}

const MIN = 60_000
const HR = 3_600_000

function c(member: SeedMember, at: number, text: string, tip = false): Comment {
  return { id: `sc-${member.id}-${at}`, at, author: member.id, name: member.name, initial: member.initial, avatar: member.avatar, text, tip }
}

/** Ambient community feed, supportive, varied, and relative to now so it feels fresh. */
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
      seedComments: [c(M['m-aria'], now - 20 * MIN, 'Needed this 🙏 trying it this weekend'), c(M['m-kabelo'], now - 14 * MIN, 'Add a sauce on the side so it doesn\'t get boring, game changer', true)],
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
      seedComments: [c(M['m-nina'], now - 70 * MIN, 'Rest IS the work 🧘 a gentle walk counts. Be kind to yourself!', true), c(M['m-maya'], now - 55 * MIN, 'I log a short stretch so my streak stays alive, keeps my head in it', true)],
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
  'This is awesome, keep it up! 🔥',
  "You've got this 💪",
  'Love to see it 💛',
  'Inspiring stuff, friend 🙌',
  'Big win! The squad is cheering 🎉',
  'One step at a time, you\'re crushing it ✨',
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
