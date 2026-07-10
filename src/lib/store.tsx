// The single source of truth at runtime. A tiny reactive store (useSyncExternalStore)
// holds the signed-in account + their persisted state, and exposes the actions that
// mutate it. Every action persists through lib/api.ts and runs the gamification side
// effects (XP, level-ups, badge unlocks, feed entries, toasts).

import { createContext, useContext, useSyncExternalStore, type ReactNode } from 'react'
import { api, defaultState, normalize, PENDING_GOAL_KEY, type ApiError, type CommunityPost, type SocialProvider } from './api'
import { storage } from './storage'
import { BADGES, XP, computeStreak, earnedBadges, estimateBurn, levelFromXp, stageForLevel, stepsToKm } from './gamification'
import { CIRCLE_BADGE_BY_ID, earnedCircleBadges } from './selectors'
import { CHALLENGE_BY_ID, CIRCLE_BY_ID, MEMBER_BY_ID, MEMBERS, SUPPORT_LINES, type SeedMember } from './seed'
import { dayKey, todayKey } from './format'
import { recommendedCalories } from './nutrition'
import { ensureStreakReminder, cancelStreakReminder } from './notifications'
import type {
  Account,
  ActivityKind,
  Body,
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

// A big, earned moment that warrants a full-screen celebration (confetti +
// cheering Pip), as opposed to a quiet toast.
export type Celebration = { key: number; kind: 'level' | 'badge' | 'streak'; title: string; subtitle: string; stage: string; eyebrow?: string }

type StoreState = {
  status: 'loading' | 'ready'
  /** true when opened from a password-reset link; App shows the set-new-password screen */
  passwordRecovery?: boolean
  account: Account | null
  data: UserState | null
  community: SeedMember[] | null
  toast: { msg: string; key: number } | null
  celebration: Celebration | null
  /** real cross-user posts (Supabase); undefined/empty falls back to the seeded feed */
  communityPosts?: FeedEntry[]
}

let current: StoreState = { status: 'loading', account: null, data: null, community: null, toast: null, celebration: null }
let toastKey = 0
let celebrationKey = 0
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
    feed: [makeMyFeed(account, 'badge', 'joined Pippin and earned First Steps', { badge: 'First Steps' })],
  }
}

async function init() {
  // A reset link opens the app with a recovery session. Intercept it before the
  // normal session check so we show "set a new password", not the logged-in app.
  if (api.isPasswordRecovery()) {
    current = { status: 'ready', passwordRecovery: true, account: null, data: null, community: null, toast: null, celebration: null }
    emit()
    return
  }
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
        void api.sendWelcomeEmail() // idempotent server-side
      }
      current = { status: 'ready', account, data, community: null, toast: null, celebration: null }
      emit()
      refreshCommunity(account.id); refreshFeed()
      void ensureStreakReminder() // native-only daily nudge; no-op on web
      return
    }
  } catch {
    /* fall through to signed-out */
  }
  current = { status: 'ready', account: null, data: null, community: null, toast: null, celebration: null }
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
  refreshFriends()
}

// On a real backend the server's accepted friendships are the source of truth
// for who counts as a friend (leaderboard scope, cheer targets). Sync them into
// the persisted friends list so derive() sees them.
function refreshFriends() {
  if (!api.realFriends) return
  api
    .listFriendships()
    .then((f) => {
      const { data, account } = current
      if (!data || !account) return
      const ids = f.friends.map((p) => p.id).sort()
      if (JSON.stringify(ids) === JSON.stringify([...data.friends].sort())) return
      const next = { ...data, friends: ids }
      current = { ...current, data: next }
      emit()
      void api.saveState(account.id, next)
    })
    .catch(() => {})
}

// Map a real community post to the FeedEntry shape the feed already renders.
// Server reaction counts land in baseReactions, other users' comments arrive as
// seedComments, and the viewer's own reaction rides in serverMyReaction.
function postToFeedEntry(p: CommunityPost, myId: string, myName: string): FeedEntry {
  const mine = p.authorId === myId
  return {
    id: p.id,
    at: p.createdAt,
    kind: 'post',
    author: mine ? 'me' : p.authorId,
    // No "(You)" suffix here: the feed card appends it for author === 'me'.
    name: mine ? myName.split(' ')[0] : p.authorName,
    initial: (p.authorName[0] || '?').toUpperCase(),
    avatar: p.authorAvatar,
    action: POST_ACTION[p.postType ?? 'update'],
    text: p.text ?? '',
    photo: p.photoUrl,
    postType: p.postType ?? 'update',
    baseCheers: 0,
    baseReactions: p.reactions,
    seedComments: p.comments,
    serverMyReaction: p.myReaction,
  }
}

// Update one community post in place (returns false when the id is not a
// real community post, so callers can fall back to the local path).
function patchCommunityPost(id: string, patch: (e: FeedEntry) => FeedEntry): boolean {
  const list = current.communityPosts
  if (!list?.some((e) => e.id === id)) return false
  current = { ...current, communityPosts: list.map((e) => (e.id === id ? patch(e) : e)) }
  emit()
  return true
}

// Pull the shared community feed (Supabase only). Graceful: on any error the
// feed just stays on the local + seeded content.
function refreshFeed() {
  if (!api.realFeed) return
  const acc = current.account
  if (!acc) return
  api
    .listCommunity()
    .then((posts) => {
      current = { ...current, communityPosts: posts.map((p) => postToFeedEntry(p, acc.id, acc.name)) }
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
  // On a real backend, cheers come from real people, never fabricated ones.
  if (api.realFeed) return
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
  // Simulated buddy only exists in local/demo mode.
  if (api.realFriends) return
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
  emit()
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    current = { ...current, toast: null }
    emit()
  }, 2600)
}

// A celebration stays up until the user taps to dismiss (it is a moment to
// savour), so unlike a toast it has no auto-timeout.
function setCelebration(c: Omit<Celebration, 'key'>) {
  celebrationKey += 1
  current = { ...current, celebration: { ...c, key: celebrationKey } }
  emit()
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
  // The single biggest moment in this commit, shown as a full-screen
  // celebration (level-up beats a badge beats a streak milestone).
  let celebration: Omit<Celebration, 'key'> | undefined
  const stageName = stageForLevel(newLevel).current.name

  // Level-up
  if (newLevel > prevLevel) {
    feed.unshift(makeMyFeed(account, 'level', `reached level ${newLevel}`))
    headline = `Level up! You're level ${newLevel} ⚡`
    celebration = { kind: 'level', title: 'Level up!', subtitle: `You're now level ${newLevel}, ${stageName}`, stage: stageName }
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
    if (firstName && !celebration) celebration = { kind: 'badge', title: 'Badge unlocked!', subtitle: firstName, stage: stageName }
  }

  // Streak milestones that do not already have their own badge (7 and 14 do).
  if (!celebration) {
    const now = Date.now()
    const prevStreak = current.data ? computeStreak(current.data, now) : 0
    const newStreak = computeStreak(data, now)
    const hit = [3, 30, 100].find((m) => newStreak >= m && prevStreak < m)
    if (hit) celebration = { kind: 'streak', title: `${hit}-day streak!`, subtitle: 'Keep the fire going', stage: stageName }
  }

  data = { ...data, feed: feed.slice(0, 60) }
  current = { ...current, data }
  void api.saveState(account.id, data)
  emit()

  // A big moment supersedes the quiet "+XP" toast for this commit.
  if (celebration) setCelebration(celebration)
  else {
    const msg = headline ?? opts?.toast
    if (msg) setToast(msg)
  }
}

// ── Actions ─────────────────────────────────────────────────────────────────
export const actions = {
  dismissCelebration() {
    current = { ...current, celebration: null }
    emit()
  },

  async signUp(input: { name: string; email: string; password: string; goal: Goal }) {
    const account = await api.signUp(input)
    const loaded = await api.loadState(account.id)
    const base = loaded ? normalize(loaded) : defaultState(input.goal, Date.now())
    // Earn the welcome badge up front so it's there before any action.
    const data: UserState = {
      ...base,
      badges: { 'first-steps': Date.now() },
      feed: [makeMyFeed(account, 'badge', 'joined Pippin and earned First Steps', { badge: 'First Steps' })],
    }
    void api.saveState(account.id, data)
    current = { ...current, account, data, community: null }
    emit()
    refreshCommunity(account.id); refreshFeed()
    void api.sendWelcomeEmail() // idempotent server-side
  },

  finishWelcome() {
    const { data, account } = current
    if (!data) return
    const next = { ...data, welcomed: true }
    current = { ...current, data: next }
    if (account) void api.saveState(account.id, next)
    emit()
    void ensureStreakReminder() // ask for notification permission once onboarded
    setToast('Welcome to Pippin! 🎉')
  },

  async logIn(input: { email: string; password: string }) {
    const account = await api.logIn(input)
    const loaded = await api.loadState(account.id)
    const data = loaded ? normalize(loaded) : defaultState('eat', Date.now())
    current = { ...current, account, data, community: null }
    emit()
    refreshCommunity(account.id); refreshFeed()
  },

  // Always resolves (never reveals whether the email exists). The caller shows
  // the same "check your inbox" confirmation regardless.
  async sendPasswordReset(email: string) {
    await api.sendPasswordReset(email).catch(() => {})
  },

  // Set the new password for the recovery session, then drop into the app.
  async completePasswordReset(newPassword: string) {
    await api.completePasswordReset(newPassword)
    const account = await api.getSession()
    if (!account) {
      // Recovery session expired; send them back to a clean login.
      current = { ...current, passwordRecovery: false, account: null, data: null }
      emit()
      return
    }
    const loaded = await api.loadState(account.id)
    const data = loaded ? normalize(loaded) : freshUserData(account, 'eat')
    if (!loaded) void api.saveState(account.id, data)
    current = { ...current, passwordRecovery: false, account, data, community: null }
    emit()
    refreshCommunity(account.id); refreshFeed()
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
    refreshCommunity(account.id); refreshFeed()
    void api.sendWelcomeEmail() // idempotent server-side
  },

  logOut() {
    void api.logOut()
    void cancelStreakReminder()
    current = { ...current, account: null, data: null, community: null, toast: null }
    emit()
  },

  async deleteAccount(): Promise<boolean> {
    const { account } = current
    if (!account) return false
    try {
      await api.deleteAccount(account.id)
      return true
    } catch {
      return false
    } finally {
      // Always drop the local session, even if the server call failed, so a
      // user who asked to leave is never left signed in.
      void cancelStreakReminder()
      current = { ...current, account: null, data: null, community: null, toast: null }
      emit()
    }
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
    // Real community post: toggle on the server, optimistically in the UI.
    let next: ReactionKind | null = kind
    const wasReal = patchCommunityPost(feedId, (e) => {
      next = e.serverMyReaction === kind ? null : kind
      return { ...e, serverMyReaction: next }
    })
    if (wasReal) {
      if (api.realFeed) void api.reactToPost(feedId, next).catch(() => {})
      return
    }
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
    // Real community post: show optimistically, then swap in the server row
    // (which carries the real id, needed to delete it later).
    const isReal = (current.communityPosts ?? []).some((e) => e.id === feedId)
    if (isReal && api.realFeed) {
      patchCommunityPost(feedId, (e) => ({ ...e, seedComments: [...(e.seedComments ?? []), com] }))
      void api
        .commentOnPost(feedId, text, tip)
        .then((server) => {
          if (server) patchCommunityPost(feedId, (e) => ({ ...e, seedComments: (e.seedComments ?? []).map((c) => (c.id === com.id ? server : c)) }))
        })
        .catch(() => {})
      return
    }
    commit({ ...data, comments: { ...data.comments, [feedId]: [...(data.comments[feedId] ?? []), com] } })
  },

  // Remove a comment you authored (from any post). Seeded community comments are protected.
  deleteComment(feedId: string, commentId: string) {
    const { data } = current
    if (!data) return
    // Real community post: remove my comment optimistically + on the server.
    const entry = (current.communityPosts ?? []).find((e) => e.id === feedId)
    if (entry && (entry.seedComments ?? []).some((c) => c.id === commentId && c.author === 'me')) {
      patchCommunityPost(feedId, (e) => ({ ...e, seedComments: (e.seedComments ?? []).filter((c) => c.id !== commentId) }))
      if (api.realFeed) void api.deleteCommentRemote(commentId).catch(() => {})
      setToast('Comment deleted')
      return
    }
    const list = data.comments[feedId] ?? []
    if (!list.some((c) => c.id === commentId && c.author === 'me')) return
    commit({ ...data, comments: { ...data.comments, [feedId]: list.filter((c) => c.id !== commentId) } }, { toast: 'Comment deleted' })
  },

  // photoDataUrl is the higher-quality frame for Storage upload; photoPreview is
  // the small frame kept when the post stays local (fits localStorage).
  post(input: { type: PostType; text: string; circleId?: string; photoDataUrl?: string; photoPreview?: string }) {
    const { data, account } = current
    if (!data || !account || (!input.text.trim() && !input.photoDataUrl)) return

    // Global (non-circle) posts go to the shared community feed when the backend
    // supports it. Circle posts stay local for now.
    if (api.realFeed && !input.circleId) {
      void (async () => {
        const created = await api.createPost({ postType: input.type, text: input.text, photoDataUrl: input.photoDataUrl }).catch(() => null)
        if (created) {
          current = { ...current, communityPosts: [postToFeedEntry(created, account.id, account.name), ...(current.communityPosts ?? [])] }
          emit()
          commit({ ...data, xp: data.xp + 20 }, { toast: 'Shared with your squad ✨' })
        } else {
          // Server unavailable → keep it locally so composing never breaks.
          const local = makeMyFeed(account, 'post', POST_ACTION[input.type], { postType: input.type, text: input.text.trim(), photo: input.photoPreview ?? null })
          commit({ ...data, feed: [local, ...data.feed], xp: data.xp + 20 }, { toast: 'Shared with your squad ✨' })
        }
      })()
      return
    }

    const entry = makeMyFeed(account, 'post', POST_ACTION[input.type], { postType: input.type, text: input.text.trim(), circleId: input.circleId, photo: input.photoPreview ?? null })
    commit({ ...data, feed: [entry, ...data.feed], xp: data.xp + 20 }, { toast: input.circleId ? 'Posted to your circle ✨' : 'Shared with your squad ✨' })
    scheduleSupport(entry.id)
  },

  // Remove a post you authored, plus its comments/reactions. Only your own feed entries.
  deletePost(feedId: string) {
    const { data } = current
    if (!data) return
    // A real community post of mine lives in communityPosts, not local feed.
    const cp = (current.communityPosts ?? []).find((e) => e.id === feedId)
    if (cp && cp.author === 'me') {
      current = { ...current, communityPosts: (current.communityPosts ?? []).filter((e) => e.id !== feedId) }
      emit()
      if (api.realFeed) void api.deletePostRemote(feedId).catch(() => {})
      setToast('Post deleted')
      return
    }
    const entry = data.feed.find((e) => e.id === feedId)
    if (!entry || entry.author !== 'me') return
    const comments = { ...data.comments }; delete comments[feedId]
    const reactions = { ...data.reactions }; delete reactions[feedId]
    const cheers = { ...data.cheers }; delete cheers[feedId]
    commit({ ...data, feed: data.feed.filter((e) => e.id !== feedId), comments, reactions, cheers }, { toast: 'Post deleted' })
  },

  // ── moderation (App Store Guideline 1.2) ──
  reportPost(feedId: string) {
    if (api.realFeed) void api.reportPost(feedId, 'user_report').catch(() => {})
    // Remove it from the reporter's view immediately.
    current = { ...current, communityPosts: (current.communityPosts ?? []).filter((e) => e.id !== feedId) }
    emit()
    setToast('Thanks. We will review this post.')
  },

  blockUser(userId: string, name?: string) {
    if (!userId || userId === 'me') return
    if (api.realFeed) void api.blockUser(userId).catch(() => {})
    // Drop everything from this author out of the current feed.
    current = { ...current, communityPosts: (current.communityPosts ?? []).filter((e) => e.author !== userId) }
    emit()
    setToast(name ? `You won't see posts from ${name}` : 'User blocked')
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

  // ── daily trackers (keyed by ISO day) ───────────────────────────────────────
  logWater(delta: number) {
    const { data } = current
    if (!data) return
    const day = dayKey(Date.now())
    const next = Math.max(0, Math.min(20, (data.water[day] ?? 0) + delta))
    commit({ ...data, water: { ...data.water, [day]: next } })
  },
  setSleep(hours: number) {
    const { data } = current
    if (!data) return
    const day = dayKey(Date.now())
    const next = Math.max(0, Math.min(16, Math.round(hours * 2) / 2))
    commit({ ...data, sleep: { ...data.sleep, [day]: next } })
  },
  setMood(mood: Mood) {
    const { data } = current
    if (!data) return
    const day = dayKey(Date.now())
    commit({ ...data, moods: { ...data.moods, [day]: mood } })
  },

  updateGoal(goal: Goal) {
    const { data } = current
    if (!data) return
    // Keep the personalized target in step with the goal once body stats exist.
    const settings = data.body ? { ...data.settings, calorieTarget: recommendedCalories(data.body, goal) } : data.settings
    commit({ ...data, goal, settings })
  },

  // Save body stats; recompute the calorie target and log the weight if it changed.
  saveBody(body: Body) {
    const { data } = current
    if (!data) return
    const calorieTarget = recommendedCalories(body, data.goal)
    const last = data.weights[data.weights.length - 1]
    const weights = !last || Math.abs(last.kg - body.weightKg) >= 0.1
      ? [...data.weights, { at: Date.now(), kg: body.weightKg }]
      : data.weights
    commit({ ...data, body, weights, settings: { ...data.settings, calorieTarget } }, { toast: `Target set to ${calorieTarget} kcal/day` })
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

  toast(message: string) {
    setToast(message)
  },

  /** re-sync server friendships into the friends list (leaderboard scope) */
  refreshFriends() {
    refreshFriends()
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
