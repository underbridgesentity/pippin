// Supabase adapter: real auth (Supabase Auth), cloud-synced state (jsonb), and a
// real global leaderboard (the `profiles` table). Activated only when
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set. See SUPABASE.md.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gradientFor, initialOf } from '../format'
import { computeWeeklyXp } from '../selectors'
import { storage } from '../storage'
import type { Account, Goal, UserState } from '../types'
import type { SeedMember } from '../seed'
import { ApiError, defaultState, isUserState, PENDING_GOAL_KEY, validateSignup, type FettleApi, type SocialProvider } from './contract'

// Only offer social buttons for providers actually enabled in Supabase, set via
// VITE_AUTH_PROVIDERS (e.g. "google" or "google,apple"). Empty = email only.
function enabledProviders(): SocialProvider[] {
  const raw = import.meta.env.VITE_AUTH_PROVIDERS ?? ''
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((p): p is SocialProvider => p === 'google' || p === 'apple')
}

type ProfileRow = { id: string; name: string; avatar: string; total_xp: number; weekly_xp: number; created_at?: string }

export function createSupabaseApi(url: string, anonKey: string): FettleApi {
  const sb: SupabaseClient = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  })

  async function profile(id: string): Promise<ProfileRow | null> {
    const { data } = await sb.from('profiles').select('*').eq('id', id).maybeSingle()
    return (data as ProfileRow) ?? null
  }

  async function currentAccount(): Promise<Account | null> {
    const { data } = await sb.auth.getSession()
    const session = data.session
    if (!session) return null
    const uid = session.user.id
    const email = session.user.email ?? ''
    const prof = await profile(uid)
    return {
      id: uid,
      email,
      name: prof?.name ?? (session.user.user_metadata?.name as string) ?? 'Fettler',
      avatar: prof?.avatar || gradientFor(email || uid),
      passwordHash: '',
      createdAt: prof?.created_at ? Date.parse(prof.created_at) : Date.now(),
    }
  }

  return {
    mode: 'supabase',
    socialProviders: enabledProviders(),

    async getSession() {
      return currentAccount()
    },

    async signInWithProvider(provider, opts) {
      // Stash the chosen goal so it survives the OAuth round-trip.
      storage.set<Goal>(PENDING_GOAL_KEY, opts.goal)
      const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined
      const { error } = await sb.auth.signInWithOAuth({ provider, options: { redirectTo } })
      if (error) throw new ApiError(error.message)
      return 'redirect'
    },

    async signUp(input) {
      const { name, email } = validateSignup(input)
      const { data, error } = await sb.auth.signUp({
        email,
        password: input.password,
        options: { data: { name } },
      })
      if (error) throw new ApiError(error.message, /email/i.test(error.message) ? 'email' : undefined)

      // Ensure a session (email-confirmation must be off for instant sign-in).
      if (!data.session) {
        const { error: sErr } = await sb.auth.signInWithPassword({ email, password: input.password })
        if (sErr) throw new ApiError('Account created, confirm your email, then log in.')
      }

      const uid = (await sb.auth.getSession()).data.session?.user.id
      if (!uid) throw new ApiError('Could not start your session')

      const avatar = gradientFor(email)
      await sb.from('profiles').upsert({ id: uid, name, avatar })
      await sb.from('user_state').upsert({ user_id: uid, state: defaultState(input.goal, Date.now()) })

      const acc = await currentAccount()
      if (!acc) throw new ApiError('Could not load your account')
      return acc
    },

    async logIn(input) {
      const { error } = await sb.auth.signInWithPassword({
        email: input.email.trim().toLowerCase(),
        password: input.password,
      })
      if (error) throw new ApiError('Wrong email or password')
      const acc = await currentAccount()
      if (!acc) throw new ApiError('Could not load your account')
      return acc
    },

    async logOut() {
      await sb.auth.signOut()
    },

    async loadState(accountId) {
      const { data } = await sb.from('user_state').select('state').eq('user_id', accountId).maybeSingle()
      const state = data?.state
      return isUserState(state) ? state : null
    },

    async saveState(accountId, state: UserState) {
      await sb.from('user_state').upsert({ user_id: accountId, state, updated_at: new Date().toISOString() })
      await sb.from('profiles').upsert({
        id: accountId,
        total_xp: state.xp,
        weekly_xp: computeWeeklyXp(state),
        updated_at: new Date().toISOString(),
      })
    },

    async updateAccount(accountId, patch) {
      await sb.from('profiles').update(patch).eq('id', accountId)
      return currentAccount()
    },

    async getLeaderboard(excludeId): Promise<SeedMember[]> {
      const { data } = await sb
        .from('profiles')
        .select('id,name,avatar,weekly_xp')
        .neq('id', excludeId)
        .order('weekly_xp', { ascending: false })
        .limit(25)
      return (data ?? []).map((p) => {
        const row = p as Pick<ProfileRow, 'id' | 'name' | 'avatar' | 'weekly_xp'>
        return {
          id: row.id,
          name: row.name,
          initial: initialOf(row.name),
          avatar: row.avatar || gradientFor(row.id),
          weeklyXp: row.weekly_xp ?? 0,
          move: `+${Math.max(0, Math.round((row.weekly_xp ?? 0) / 7))}`,
        }
      })
    },
  }
}
