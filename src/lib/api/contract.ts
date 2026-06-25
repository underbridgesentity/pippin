// The data-access contract. Both the local-storage adapter and the Supabase
// adapter implement FettleApi, so the rest of the app is backend-agnostic.

import type { Account, FeedEntry, Goal, Settings, UserState } from '../types'
import type { SeedMember } from '../seed'

export type SocialProvider = 'google' | 'apple'

/** A real (Supabase) user, for friend search / requests / friends list. */
export type FriendProfile = { id: string; name: string; username: string | null; avatar: string }
export type Friendships = { friends: FriendProfile[]; incoming: FriendProfile[]; outgoing: FriendProfile[] }

/** Onboarding goal stashed before an OAuth redirect, applied on return. */
export const PENDING_GOAL_KEY = 'pendingGoal'

export interface FettleApi {
  /** which backend is active, handy for UI hints */
  readonly mode: 'local' | 'supabase'
  /** social providers this backend supports */
  readonly socialProviders: SocialProvider[]
  getSession(): Promise<Account | null>
  signUp(input: { name: string; email: string; password: string; goal: Goal }): Promise<Account>
  logIn(input: { email: string; password: string }): Promise<Account>
  /** Resolves to an Account (local) or 'redirect' when the page navigates to the provider (Supabase OAuth). */
  signInWithProvider(provider: SocialProvider, opts: { goal: Goal }): Promise<Account | 'redirect'>
  logOut(): Promise<void>
  loadState(accountId: string): Promise<UserState | null>
  saveState(accountId: string, state: UserState): Promise<void>
  updateAccount(accountId: string, patch: Partial<Pick<Account, 'name' | 'avatar'>>): Promise<Account | null>
  /** community members for the leaderboard, excluding the current user */
  getLeaderboard(excludeId: string): Promise<SeedMember[]>

  // ── real multi-user friends (only meaningful when realFriends is true) ──────
  /** true when this backend supports real friend search/requests (Supabase) */
  readonly realFriends: boolean
  myUsername(): Promise<string | null>
  setUsername(username: string): Promise<{ ok: boolean; error?: string }>
  searchUsers(query: string): Promise<FriendProfile[]>
  findByUsername(username: string): Promise<FriendProfile | null>
  sendFriendRequest(userId: string): Promise<{ ok: boolean; error?: string }>
  respondToRequest(requesterId: string, accept: boolean): Promise<void>
  removeFriend(userId: string): Promise<void>
  listFriendships(): Promise<Friendships>
}

export class ApiError extends Error {
  field?: 'name' | 'email' | 'password'
  constructor(message: string, field?: ApiError['field']) {
    super(message)
    this.field = field
  }
}

/** Client-side validation shared by both adapters so inline field errors match. */
export function validateSignup(input: { name: string; email: string; password: string }): {
  name: string
  email: string
} {
  const name = input.name.trim()
  const email = input.email.trim().toLowerCase()
  if (name.length < 2) throw new ApiError('Enter your name', 'name')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new ApiError('Enter a valid email', 'email')
  if (input.password.length < 6) throw new ApiError('Use at least 6 characters', 'password')
  return { name, email }
}

export const DEFAULT_SETTINGS: Settings = {
  calorieTarget: 1800,
  moveTargetMin: 30,
  sleepTargetHrs: 8,
  stepsTarget: 8000,
}

export function calorieTargetForGoal(goal: Goal): number {
  switch (goal) {
    case 'lose':
      return 1600
    case 'strong':
      return 2200
    case 'move':
      return 2000
    default:
      return 1800
  }
}

export function defaultState(goal: Goal, now: number): UserState {
  return {
    goal,
    settings: { ...DEFAULT_SETTINGS, calorieTarget: calorieTargetForGoal(goal) },
    weights: [],
    water: {},
    sleep: {},
    moods: {},
    xp: 0,
    meals: [],
    activities: [],
    joinedChallenges: [],
    challengeJoinedOn: {},
    friends: [],
    circles: [],
    checkIns: [],
    badges: {},
    cheers: {},
    reactions: {},
    comments: {},
    kudosReceived: 0,
    feed: [],
    welcomed: false,
    onboardedAt: now,
  }
}

/** Fill in any fields missing from older saved state, so upgrades don't crash. */
export function normalize(s: UserState): UserState {
  return {
    ...s,
    cheers: s.cheers ?? {},
    reactions: s.reactions ?? {},
    comments: s.comments ?? {},
    kudosReceived: s.kudosReceived ?? 0,
    feed: (s.feed ?? []).map(migrateFeedBrand),
    badges: s.badges ?? {},
    friends: s.friends ?? [],
    circles: s.circles ?? [],
    checkIns: s.checkIns ?? [],
    weights: s.weights ?? [],
    water: s.water ?? {},
    sleep: s.sleep ?? {},
    moods: s.moods ?? {},
  }
}

// One-time migration: accounts created before the Fettle -> Pippin rename have
// the old brand baked into stored feed text (e.g. "joined Fettle and earned
// First Steps"). Rewrite it on load so the feed reflects the current name.
function migrateFeedBrand(e: FeedEntry): FeedEntry {
  const action = e.action.replace(/Fettle/g, 'Pippin')
  const text = e.text?.replace(/Fettle/g, 'Pippin')
  if (action === e.action && text === e.text) return e
  return { ...e, action, text }
}

/** A loaded blob is only a real UserState if it carries the core fields. */
export function isUserState(value: unknown): value is UserState {
  return (
    !!value &&
    typeof value === 'object' &&
    Array.isArray((value as UserState).meals) &&
    Array.isArray((value as UserState).activities) &&
    typeof (value as UserState).onboardedAt === 'number'
  )
}
