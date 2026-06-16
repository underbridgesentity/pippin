// The single source of truth at runtime. A tiny reactive store (useSyncExternalStore)
// holds the signed-in account + their persisted state, and exposes the actions that
// mutate it. Every action persists through lib/api.ts and runs the gamification side
// effects (XP, level-ups, badge unlocks, feed entries, toasts).

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { api, defaultState, PENDING_GOAL_KEY, type ApiError, type SocialProvider } from './api'
import { storage } from './storage'
import { BADGES, XP, earnedBadges, estimateBurn, levelFromXp, stepsToKm } from './gamification'
import { CHALLENGE_BY_ID, type SeedMember } from './seed'
import { todayKey } from './format'
import type {
  Account,
  ActivityKind,
  FeedEntry,
  FeedKind,
  Goal,
  LoggedFood,
  MealType,
  Settings,
  UserState,
} from './types'

type StoreState = {
  status: 'loading' | 'ready'
  account: Account | null
  data: UserState | null
  community: SeedMember[] | null
  toast: { msg: string; key: number } | null
}

let current: StoreState = { status: 'loading', account: null, data: null, community: null, toast: null }
let toastKey = 0
let toastTimer: ReturnType<typeof setTimeout> | undefined

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}
function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}
function getSnapshot() {
  return current
}

/** First-run data for a brand-new account (OAuth or otherwise): welcome badge + feed. */
function freshUserData(account: Account, goal: Goal): UserState {
  return {
    ...defaultState(goal, Date.now()),
    badges: { 'first-steps': Date.now() },
    feed: [makeMyFeed(account, 'badge', 'joined Fettle and earned First Steps', { badge: 'First Steps' })],
  }
}

async function init() {
  try {
    const account = await api.getSession()
    if (account) {
      let data = await api.loadState(account.id)
      if (!data) {
        // No saved state → a fresh OAuth user returning from a redirect.
        const goal = storage.get<Goal>(PENDING_GOAL_KEY) ?? 'eat'
        storage.remove(PENDING_GOAL_KEY)
        data = freshUserData(account, goal)
        void api.saveState(account.id, data)
      }
      current = { status: 'ready', account, data, community: null, toast: null }
      emit()
      refreshCommunity(account.id)
      return
    }
  } catch {
    /* fall through to signed-out */
  }
  current = { status: 'ready', account: null, data: null, community: null, toast: null }
  emit()
}

function refreshCommunity(excludeId: string) {
  api
    .getLeaderboard(excludeId)
    .then((members) => {
      current = { ...current, community: members }
      emit()
    })
    .catch(() => {})
}

function setToast(msg: string) {
  toastKey += 1
  current = { ...current, toast: { msg, key: toastKey } }
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    current = { ...current, toast: null }
    emit()
  }, 2600)
}

function makeMyFeed(account: Account, kind: FeedKind, action: string, extra?: Partial<FeedEntry>): FeedEntry {
  return {
    id: `mf_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e4).toString(36)}`,
    at: Date.now(),
    kind,
    author: 'me',
    name: account.name.split(' ')[0],
    initial: (account.name[0] || 'Y').toUpperCase(),
    avatar: account.avatar,
    action,
    baseCheers: 0,
    ...extra,
  }
}

/** Commit new data, run badge/level side effects, persist, toast and notify. */
function commit(next: UserState, opts?: { toast?: string }) {
  const account = current.account
  if (!account) return

  const prevXp = current.data?.xp ?? next.xp
  const prevLevel = levelFromXp(prevXp)
  const newLevel = levelFromXp(next.xp)

  let data = next
  const feed = [...data.feed]
  let headline: string | undefined

  // Level-up
  if (newLevel > prevLevel) {
    feed.unshift(makeMyFeed(account, 'level', `reached level ${newLevel}`))
    headline = `Level up! You're level ${newLevel} ⚡`
  }

  // Badge unlocks (derived → persist unlock timestamps so we only fire once)
  const owned = new Set(Object.keys(data.badges))
  const freshlyEarned = earnedBadges({ ...data, feed }).filter((id) => !owned.has(id))
  if (freshlyEarned.length) {
    const badges = { ...data.badges }
    for (const id of freshlyEarned) {
      badges[id] = Date.now()
      const b = BADGES.find((x) => x.id === id)
      if (b) feed.unshift(makeMyFeed(account, 'badge', `unlocked the ${b.name} badge`, { badge: b.name }))
    }
    data = { ...data, badges }
    const first = BADGES.find((x) => x.id === freshlyEarned[0])
    if (first && !headline) headline = `Badge unlocked: ${first.name} 🏅`
  }

  data = { ...data, feed: feed.slice(0, 60) }
  current = { ...current, data }
  void api.saveState(account.id, data)
  emit()

  const msg = headline ?? opts?.toast
  if (msg) setToast(msg)
}

// ── Actions ─────────────────────────────────────────────────────────────────
export const actions = {
  async signUp(input: { name: string; email: string; password: string; goal: Goal }) {
    const account = await api.signUp(input)
    const base = (await api.loadState(account.id)) ?? defaultState(input.goal, Date.now())
    // Earn the welcome badge up front so it's there before any action.
    const data: UserState = {
      ...base,
      badges: { 'first-steps': Date.now() },
      feed: [makeMyFeed(account, 'badge', 'joined Fettle and earned First Steps', { badge: 'First Steps' })],
    }
    void api.saveState(account.id, data)
    current = { ...current, account, data, community: null }
    emit()
    refreshCommunity(account.id)
  },

  finishWelcome() {
    const { data, account } = current
    if (!data) return
    const next = { ...data, welcomed: true }
    current = { ...current, data: next }
    if (account) void api.saveState(account.id, next)
    emit()
    setToast('Welcome to Fettle! 🎉')
  },

  async logIn(input: { email: string; password: string }) {
    const account = await api.logIn(input)
    const data = (await api.loadState(account.id)) ?? defaultState('eat', Date.now())
    current = { ...current, account, data, community: null }
    emit()
    refreshCommunity(account.id)
  },

  async socialAuth(provider: SocialProvider, goal: Goal) {
    const res = await api.signInWithProvider(provider, { goal })
    if (res === 'redirect') return // Supabase OAuth: page navigates; init() handles the return.
    const account = res
    let data = (await api.loadState(account.id)) ?? freshUserData(account, goal)
    if (!data.badges['first-steps']) data = { ...data, badges: { ...data.badges, 'first-steps': Date.now() } }
    void api.saveState(account.id, data)
    current = { ...current, account, data, community: null }
    emit()
    refreshCommunity(account.id)
  },

  logOut() {
    void api.logOut()
    current = { ...current, account: null, data: null, community: null, toast: null }
    emit()
  },

  logMeal(input: { items: LoggedFood[]; type: MealType; photo?: string }) {
    const { data, account } = current
    if (!data || !account) return
    const kcal = Math.round(input.items.reduce((t, i) => t + i.kcal, 0))
    const macros = input.items.reduce(
      (t, i) => ({ protein: t.protein + i.protein, carbs: t.carbs + i.carbs, fat: t.fat + i.fat }),
      { protein: 0, carbs: 0, fat: 0 },
    )
    const meal = {
      id: `m_${Date.now().toString(36)}`,
      at: Date.now(),
      type: input.type,
      items: input.items,
      kcal,
      macros: { protein: Math.round(macros.protein), carbs: Math.round(macros.carbs), fat: Math.round(macros.fat) },
      photo: input.photo,
    }
    const label = input.items.length === 1 ? input.items[0].name.toLowerCase() : `a ${input.type}`
    const feed = makeMyFeed(account, 'meal', `logged ${label}`, {
      stat: `${kcal} kcal · ${meal.macros.protein}g protein`,
      photo: input.photo ?? null,
    })
    commit(
      { ...data, meals: [...data.meals, meal], xp: data.xp + XP.LOG_MEAL, feed: [feed, ...data.feed] },
      { toast: `Meal logged · +${XP.LOG_MEAL} XP` },
    )
  },

  deleteMeal(id: string) {
    const { data } = current
    if (!data) return
    commit({ ...data, meals: data.meals.filter((m) => m.id !== id) })
  },

  logActivity(input: { kind: ActivityKind; label: string; minutes: number; km?: number; steps?: number }) {
    const { data, account } = current
    if (!data || !account) return
    const steps = input.steps ?? (input.km ? Math.round(input.km / 0.000762) : 0)
    const km = input.km ?? (steps && input.kind !== 'workout' ? stepsToKm(steps) : undefined)
    const kcalBurned = estimateBurn(input.kind, input.minutes, km ?? 0) || Math.round(steps * 0.04)
    const activity = {
      id: `a_${Date.now().toString(36)}`,
      at: Date.now(),
      kind: input.kind,
      label: input.label,
      minutes: input.minutes,
      km,
      steps,
      kcalBurned,
    }
    const feed = makeMyFeed(account, 'activity', `logged ${input.label.toLowerCase()}`, {
      stat: [km ? `${km} km` : '', input.minutes ? `${input.minutes} min` : '', `${kcalBurned} kcal`].filter(Boolean).join(' · '),
    })
    commit(
      { ...data, activities: [...data.activities, activity], xp: data.xp + XP.LOG_ACTIVITY, feed: [feed, ...data.feed] },
      { toast: `Activity logged · +${XP.LOG_ACTIVITY} XP` },
    )
  },

  deleteActivity(id: string) {
    const { data } = current
    if (!data) return
    commit({ ...data, activities: data.activities.filter((a) => a.id !== id) })
  },

  joinChallenge(id: string) {
    const { data, account } = current
    if (!data || !account || data.joinedChallenges.includes(id)) return
    const c = CHALLENGE_BY_ID[id]
    const feed = makeMyFeed(account, 'challenge', `joined ${c ? c.name : 'a challenge'}`)
    commit(
      {
        ...data,
        joinedChallenges: [...data.joinedChallenges, id],
        challengeJoinedOn: { ...data.challengeJoinedOn, [id]: todayKey() },
        xp: data.xp + XP.JOIN_CHALLENGE,
        feed: [feed, ...data.feed],
      },
      { toast: `Joined${c ? ` ${c.name}` : ''} · +${XP.JOIN_CHALLENGE} XP` },
    )
  },

  leaveChallenge(id: string) {
    const { data } = current
    if (!data) return
    const challengeJoinedOn = { ...data.challengeJoinedOn }
    delete challengeJoinedOn[id]
    commit({ ...data, joinedChallenges: data.joinedChallenges.filter((c) => c !== id), challengeJoinedOn })
  },

  claimQuest() {
    const { data } = current
    if (!data) return
    const today = todayKey()
    if (data.questClaimedOn === today) return
    commit({ ...data, questClaimedOn: today, xp: data.xp + XP.DAILY_QUEST }, { toast: `Daily quest complete · +${XP.DAILY_QUEST} XP` })
  },

  toggleCheer(feedId: string) {
    const { data } = current
    if (!data) return
    commit({ ...data, cheers: { ...data.cheers, [feedId]: !data.cheers[feedId] } })
  },

  updateSettings(patch: Partial<Settings>) {
    const { data } = current
    if (!data) return
    commit({ ...data, settings: { ...data.settings, ...patch } }, { toast: 'Settings saved' })
  },

  updateGoal(goal: Goal) {
    const { data } = current
    if (!data) return
    commit({ ...data, goal })
  },

  async updateProfile(patch: { name?: string }) {
    const { account, data } = current
    if (!account || !data) return
    const updated = await api.updateAccount(account.id, patch)
    if (updated) {
      current = { ...current, account: updated }
      emit()
      setToast('Profile updated')
    }
  },

  dismissToast() {
    current = { ...current, toast: null }
    emit()
  },
}

export type Actions = typeof actions

// ── React glue ────────────────────────────────────────────────────────────
const StoreContext = createContext<StoreState | null>(null)

if (typeof window !== 'undefined') init()

export function StoreProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return <StoreContext.Provider value={state}>{children}</StoreContext.Provider>
}

export function useStore(): StoreState {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

export type { ApiError }
