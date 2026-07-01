// Supabase adapter: real auth (Supabase Auth), cloud-synced state (jsonb), and a
// real global leaderboard (the `profiles` table). Activated only when
// VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are set. See SUPABASE.md.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { gradientFor, initialOf } from '../format'
import { computeWeeklyXp } from '../selectors'
import { storage } from '../storage'
import type { Account, Goal, PostType, UserState } from '../types'
import type { SeedMember } from '../seed'
import { ApiError, defaultState, isUserState, PENDING_GOAL_KEY, validateSignup, type CommunityPost, type FettleApi, type FriendProfile, type Friendships, type SocialProvider } from './contract'

// Only offer social buttons for providers actually enabled in Supabase, set via
// VITE_AUTH_PROVIDERS (e.g. "google" or "google,apple"). Empty = email only.
function enabledProviders(): SocialProvider[] {
  const raw = import.meta.env.VITE_AUTH_PROVIDERS ?? ''
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((p): p is SocialProvider => p === 'google' || p === 'apple')
}

type ProfileRow = { id: string; name: string; avatar: string; total_xp: number; weekly_xp: number; created_at?: string; username?: string | null }

function toFriendProfile(p: { id: string; name: string; username?: string | null; avatar?: string | null }): FriendProfile {
  return { id: p.id, name: p.name || 'Friend', username: p.username ?? null, avatar: p.avatar || gradientFor(p.id) }
}

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
      name: prof?.name ?? (session.user.user_metadata?.name as string) ?? 'Friend',
      avatar: prof?.avatar || gradientFor(email || uid),
      passwordHash: '',
      createdAt: prof?.created_at ? Date.parse(prof.created_at) : Date.now(),
    }
  }

  async function uid(): Promise<string | null> {
    const { data } = await sb.auth.getSession()
    return data.session?.user.id ?? null
  }

  // Upload a data-URL photo to the public post-photos bucket, return its URL.
  async function uploadPhoto(userId: string, dataUrl: string): Promise<string | null> {
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const path = `${userId}/${Date.now()}_${Math.round(Math.random() * 1e6)}.jpg`
      const { error } = await sb.storage.from('post-photos').upload(path, blob, { contentType: blob.type || 'image/jpeg' })
      if (error) return null
      return sb.storage.from('post-photos').getPublicUrl(path).data.publicUrl
    } catch {
      return null
    }
  }

  return {
    mode: 'supabase',
    socialProviders: enabledProviders(),
    realFriends: true,
    realFeed: true,

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

    async myUsername() {
      const id = await uid()
      if (!id) return null
      const { data } = await sb.from('profiles').select('username').eq('id', id).maybeSingle()
      return ((data?.username as string) ?? null) || null
    },

    async setUsername(username) {
      const clean = username.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(clean)) return { ok: false, error: '3-20 letters, numbers or _' }
      const id = await uid()
      if (!id) return { ok: false, error: 'Not signed in' }
      const { error } = await sb.from('profiles').update({ username: clean }).eq('id', id)
      if (error) return { ok: false, error: error.code === '23505' ? 'That username is taken' : error.message }
      return { ok: true }
    },

    async searchUsers(query) {
      const id = await uid()
      if (!id) return []
      const q = query.trim().replace(/[^a-zA-Z0-9_ ]/g, '')
      if (q.length < 2) return []
      const { data } = await sb
        .from('profiles')
        .select('id,name,username,avatar')
        .or(`username.ilike.%${q}%,name.ilike.%${q}%`)
        .neq('id', id)
        .limit(20)
      return (data ?? []).map(toFriendProfile)
    },

    async findByUsername(username) {
      const clean = username.trim().toLowerCase()
      if (!/^[a-z0-9_]{3,20}$/.test(clean)) return null
      const { data } = await sb.from('profiles').select('id,name,username,avatar').ilike('username', clean).maybeSingle()
      return data ? toFriendProfile(data) : null
    },

    async sendFriendRequest(userId) {
      const id = await uid()
      if (!id) return { ok: false, error: 'Not signed in' }
      if (id === userId) return { ok: false, error: "That's you" }
      // If they already requested me, accept that instead of creating a new row.
      const { data: rev } = await sb.from('friendships').select('id,status').eq('requester', userId).eq('addressee', id).maybeSingle()
      if (rev) {
        if (rev.status !== 'accepted') await sb.from('friendships').update({ status: 'accepted' }).eq('id', rev.id)
        return { ok: true }
      }
      const { error } = await sb.from('friendships').insert({ requester: id, addressee: userId, status: 'pending' })
      if (error) return { ok: false, error: error.code === '23505' ? 'Request already sent' : error.message }
      return { ok: true }
    },

    async respondToRequest(requesterId, accept) {
      const id = await uid()
      if (!id) return
      if (accept) await sb.from('friendships').update({ status: 'accepted' }).eq('requester', requesterId).eq('addressee', id)
      else await sb.from('friendships').delete().eq('requester', requesterId).eq('addressee', id)
    },

    async removeFriend(userId) {
      const id = await uid()
      if (!id) return
      await sb.from('friendships').delete().or(`and(requester.eq.${id},addressee.eq.${userId}),and(requester.eq.${userId},addressee.eq.${id})`)
    },

    async listFriendships(): Promise<Friendships> {
      const empty: Friendships = { friends: [], incoming: [], outgoing: [] }
      const id = await uid()
      if (!id) return empty
      const { data: rows } = await sb.from('friendships').select('requester,addressee,status').or(`requester.eq.${id},addressee.eq.${id}`)
      const friendIds: string[] = []
      const incomingIds: string[] = []
      const outgoingIds: string[] = []
      for (const r of (rows ?? []) as { requester: string; addressee: string; status: string }[]) {
        const other = r.requester === id ? r.addressee : r.requester
        if (r.status === 'accepted') friendIds.push(other)
        else if (r.addressee === id) incomingIds.push(other)
        else outgoingIds.push(other)
      }
      const all = [...friendIds, ...incomingIds, ...outgoingIds]
      const byId = new Map<string, FriendProfile>()
      if (all.length) {
        const { data: profs } = await sb.from('profiles').select('id,name,username,avatar').in('id', all)
        for (const p of profs ?? []) byId.set(p.id, toFriendProfile(p))
      }
      const pick = (ids: string[]) => ids.map((i) => byId.get(i)).filter((x): x is FriendProfile => !!x)
      return { friends: pick(friendIds), incoming: pick(incomingIds), outgoing: pick(outgoingIds) }
    },

    // ── community feed ──────────────────────────────────────────────────────
    async listCommunity(limit = 40): Promise<CommunityPost[]> {
      const { data, error } = await sb
        .from('posts')
        .select('id, author, post_type, text, photo_url, created_at, profiles(name, avatar)')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error || !data) return []
      return (data as unknown as PostRow[]).map((r) => ({
        id: r.id,
        authorId: r.author,
        authorName: r.profiles?.name || 'Someone',
        authorAvatar: r.profiles?.avatar || gradientFor(r.author),
        postType: r.post_type,
        text: r.text,
        photoUrl: r.photo_url,
        createdAt: Date.parse(r.created_at),
      }))
    },

    async createPost(input): Promise<CommunityPost | null> {
      const acc = await currentAccount()
      if (!acc) return null
      const photoUrl = input.photoDataUrl ? await uploadPhoto(acc.id, input.photoDataUrl) : null
      const { data, error } = await sb
        .from('posts')
        .insert({ author: acc.id, post_type: input.postType, text: input.text.trim() || null, photo_url: photoUrl })
        .select('id, created_at')
        .single()
      if (error || !data) return null
      return { id: data.id, authorId: acc.id, authorName: acc.name, authorAvatar: acc.avatar, postType: input.postType, text: input.text.trim() || null, photoUrl, createdAt: Date.parse(data.created_at) }
    },

    async deletePostRemote(id) {
      await sb.from('posts').delete().eq('id', id)
    },
  }
}

type PostRow = { id: string; author: string; post_type: PostType | null; text: string | null; photo_url: string | null; created_at: string; profiles: { name: string | null; avatar: string | null } | null }
