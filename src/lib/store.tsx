// The single source of truth at runtime. A tiny reactive store (useSyncExternalStore)
// holds the signed-in account + their persisted state, and exposes the actions that
// mutate it. Every action persists through lib/api.ts and runs the gamification side
// effects (XP, level-ups, badge unlocks, feed entries, toasts).

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { api, defaultState, normalize, PENDING_GOAL_KEY, type ApiError, type SocialProvider } from './api'
import { storage } from './storage'
import { BADGES, XP, earnedBadges, estimateBurn, levelFromXp, stepsToKm } from './gamification'
import { CIRCLE_BADGE_BY_ID, earnedCircleBadges } from './selectors'
import { CHALLENGE_BY_ID, CIRCLE_BY_ID, MEMBER_BY_ID, MEMBERS, SUPPORT_LINES, type SeedMember } from './seed'
import { dayKey, todayKey } from './format'
import type {
  Account,
  ActivityKind,
  BuddyCheckIn,
  CheckIn,
  Comment,
  FeedEntry,
  FeedKind,
  Goal,
  LoggedFood,
  MealType,
  Mood,
  PostType,
  ReactionKind,
  Settings,
  UserState,
} from './types'

const POST_ACTION: Record<PostType, string> = {
  tip: 'shared a tip',
  win: 'celebrated a win',
  question: 'asked the squad',
  update: 'shared an update',
}

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
      const loaded = await api.loadState(account.id)
      let data: UserState
      if (loaded) {
        data = normalize(loaded)
      } else {
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

/**
 * Simulates the community noticing your post, a member leaves an encouraging
 * reply shortly after you share. Locally this fakes the social loop; with a real
 * backend, genuine cheers from real people arrive here instead.
 */
function scheduleSupport(feedId: string) {
  setTimeout(() => {
    const { data, account } = current
    if (!data || !account) return
    const seed = data.feed.length + Object.keys(data.comments).length + feedId.length
    const member = MEMBERS[seed % MEMBERS.length]
    const line = SUPPORT_LINES[seed % SUPPORT_LINES.length]
    const com: Comment = { id: `spt_${Date.now().toString(36)}`, at: Date.now(), author: member.id, name: member.name, initial: member.initial, avatar: member.avatar, text: line }
    const next: UserState = {
      ...data,
      comments: { ...data.comments, [feedId]: [...(data.comments[feedId] ?? []), com] },
      kudosReceived: data.kudosReceived + 3,
    }
    current = { ...current, data: next }
    void api.saveState(account.id, next)
    emit()
    setToast(`${member.name} cheered you on 👏`)
  }, 2800)
}

/** Your accountability buddy checks in shortly after you do (simulated locally). */
function scheduleBuddyResponse() {
  setTimeout(() => {
    const { data, account } = current
    if (!data || !data.buddyId || !account) return
    const m = MEMBER_BY_ID[data.buddyId]
    if (!m) return
    const i = data.checkIns.length
    const moods: Mood[] = ['great', 'ok', 'great', 'ok', 'tough']
    const buddyLastCheckIn: BuddyCheckIn = { at: Date.now(), mood: moods[i % moods.length], note: SUPPORT_LINES[i % SUPPORT_LINES.length] }
    const next: UserState = { ...data, buddyLastCheckIn }
    current = { ...current, data: next }
    void api.saveState(account.id, next)
    emit()
    setToast(`${m.name} checked in and cheered you on 👋`)
  }, 2600)
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
  const nameOf = (id: string) => BADGES.find((x) => x.id === id)?.name ?? CIRCLE_BADGE_BY_ID[id]?.name
  const allEarned = [...earnedBadges({ ...data, feed }), ...earnedCircleBadges(data)]
  const freshlyEarned = allEarned.filter((id) => !owned.has(id))
  if (freshlyEarned.length) {
    const badges = { ...data.badges }
    for (const id of freshlyEarned) {
      badges[id] = Date.now()
      const name = nameOf(id)
      if (name) feed.unshift(makeMyFeed(account, 'badge', `unlocked the ${name} badge`, { badge: name }))
    }
    data = { ...data, badges }
    const firstName = nameOf(freshlyEarned[0])
    if (firstName && !headline) headline = `Badge unlocked: ${firstName} 🏅`
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
    const loaded = await api.loadState(account.id)
    const base = loaded ? normalize(loaded) : defaultState(input.goal, Date.now())
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
    const loaded = await api.loadState(account.id)
    const data = loaded ? normalize(loaded) : defaultState('eat', Date.now())
    current = { ...current, account, data, community: null }
    emit()
    refreshCommunity(account.id)
  },

  async socialAuth(provider: SocialProvider, goal: Goal) {
    const res = await api.signInWithProvider(provider, { goal })
    if (res === 'redirect') return // Supabase OAuth: page navigates; init() handles the return.
    const account = res
    const loaded = await api.loadState(account.id)
    let data = loaded ? normalize(loaded) : freshUserData(account, goal)
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

  react(feedId: string, kind: ReactionKind) {
    const { data } = current
    if (!data) return
    const reactions = { ...data.reactions }
    if (reactions[feedId] === kind) delete reactions[feedId]
    else reactions[feedId] = kind
    const cheers = { ...data.cheers }
    delete cheers[feedId] // retire any legacy cheer on this post
    commit({ ...data, reactions, cheers })
  },

  comment(feedId: string, text: string, tip = false) {
    const { data, account } = current
    if (!data || !account || !text.trim()) return
    const com: Comment = {
      id: `cm_${Date.now().toString(36)}`,
      at: Date.now(),
      author: 'me',
      name: account.name.split(' ')[0],
      initial: (account.name[0] || 'Y').toUpperCase(),
      avatar: account.avatar,
      text: text.trim(),
      tip,
    }
    commit({ ...data, comments: { ...data.comments, [feedId]: [...(data.comments[feedId] ?? []), com] } })
  },

  post(input: { type: PostType; text: string; circleId?: string }) {
    const { data, account } = current
    if (!data || !account || !input.text.trim()) return
    const entry = makeMyFeed(account, 'post', POST_ACTION[input.type], { postType: input.type, text: input.text.trim(), circleId: input.circleId })
    commit({ ...data, feed: [entry, ...data.feed], xp: data.xp + 20 }, { toast: input.circleId ? 'Posted to your circle ✨' : 'Shared with your squad ✨' })
    scheduleSupport(entry.id)
  },

  cheerMember(name: string) {
    setToast(`You cheered ${name} 👏`)
  },

  addFriend(memberId: string) {
    const { data } = current
    if (!data || data.friends.includes(memberId)) return
    const name = MEMBER_BY_ID[memberId]?.name ?? 'them'
    commit({ ...data, friends: [...data.friends, memberId], xp: data.xp + 5 }, { toast: `You're now friends with ${name} 🤝` })
  },

  removeFriend(memberId: string) {
    const { data } = current
    if (!data) return
    commit({ ...data, friends: data.friends.filter((id) => id !== memberId) })
  },

  nudgeFriend(name: string) {
    setToast(`Nudge sent to ${name} 👋`)
  },

  joinCircle(circleId: string) {
    const { data } = current
    if (!data || data.circles.includes(circleId)) return
    const c = CIRCLE_BY_ID[circleId]
    commit({ ...data, circles: [...data.circles, circleId], xp: data.xp + 15 }, { toast: `Joined ${c ? c.name : 'the circle'} 🎉` })
  },

  leaveCircle(circleId: string) {
    const { data } = current
    if (!data) return
    commit({ ...data, circles: data.circles.filter((id) => id !== circleId) })
  },

  setBuddy(memberId: string) {
    const { data } = current
    if (!data) return
    const m = MEMBER_BY_ID[memberId]
    const buddyLastCheckIn: BuddyCheckIn = { at: Date.now(), mood: 'ok', note: "Glad we're in this together. Let's keep each other honest 💛" }
    commit({ ...data, buddyId: memberId, buddyLastCheckIn }, { toast: `${m ? m.name : 'They'} is now your accountability buddy 🤝` })
  },

  removeBuddy() {
    const { data } = current
    if (!data) return
    const next = { ...data }
    delete next.buddyId
    delete next.buddyLastCheckIn
    commit(next)
  },

  checkIn(mood: Mood, note?: string) {
    const { data } = current
    if (!data) return
    const today = todayKey()
    const entry: CheckIn = { id: `ci_${Date.now().toString(36)}`, at: Date.now(), mood, note: note?.trim() || undefined }
    const checkIns = [entry, ...data.checkIns.filter((ci) => dayKey(ci.at) !== today)]
    commit({ ...data, checkIns }, { toast: 'Checked in for today ✓' })
    if (data.buddyId) scheduleBuddyResponse()
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
