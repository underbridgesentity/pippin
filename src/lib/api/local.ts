// localStorage-backed adapter. Default when no Supabase env is configured —
// the app is fully functional offline with this alone.

import { storage } from '../storage'
import { gradientFor } from '../format'
import { MEMBERS, type SeedMember } from '../seed'
import type { Account, UserState } from '../types'
import { ApiError, defaultState, validateSignup, type FettleApi } from './contract'

const ACCOUNTS = 'accounts'
const SESSION = 'session'
const userKey = (id: string) => `user:${id}`

// Local-only, deliberately simple. NOT a secure hash — real hashing is the
// backend's job (see the Supabase adapter / your auth provider).
function hash(s: string): string {
  let h = 5381
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0
  return h.toString(36)
}

function accounts(): Account[] {
  return storage.get<Account[]>(ACCOUNTS) ?? []
}
function saveAccounts(list: Account[]): void {
  storage.set(ACCOUNTS, list)
}

export const localApi: FettleApi = {
  mode: 'local',
  socialProviders: ['google', 'apple'],

  async getSession() {
    const id = storage.get<string>(SESSION)
    if (!id) return null
    return accounts().find((a) => a.id === id) ?? null
  },

  async signUp(input) {
    const { name, email } = validateSignup(input)
    const list = accounts()
    if (list.some((a) => a.email === email)) throw new ApiError('That email already has an account', 'email')

    const now = Date.now()
    const account: Account = {
      id: `u_${now.toString(36)}_${Math.floor(now % 1000)}`,
      name,
      email,
      passwordHash: hash(input.password),
      avatar: gradientFor(email),
      createdAt: now,
    }
    saveAccounts([...list, account])
    storage.set(userKey(account.id), defaultState(input.goal, now))
    storage.set(SESSION, account.id)
    return account
  },

  async logIn(input) {
    const email = input.email.trim().toLowerCase()
    const account = accounts().find((a) => a.email === email)
    if (!account || account.passwordHash !== hash(input.password)) {
      throw new ApiError('Wrong email or password')
    }
    storage.set(SESSION, account.id)
    return account
  },

  // No real OAuth offline — sign into a stable per-provider demo account so the
  // one-tap flow works locally. Real Google/Apple kicks in with Supabase.
  async signInWithProvider(provider, opts) {
    const email = `${provider}.demo@fettle.local`
    const list = accounts()
    let account = list.find((a) => a.email === email)
    if (!account) {
      const now = Date.now()
      account = {
        id: `u_${now.toString(36)}_${provider}`,
        name: provider === 'google' ? 'Google User' : 'Apple User',
        email,
        passwordHash: '',
        avatar: gradientFor(email),
        createdAt: now,
      }
      saveAccounts([...list, account])
      storage.set(userKey(account.id), defaultState(opts.goal, now))
    }
    storage.set(SESSION, account.id)
    return account
  },

  async logOut() {
    storage.remove(SESSION)
  },

  async loadState(accountId) {
    return storage.get<UserState>(userKey(accountId))
  },

  async saveState(accountId, state) {
    storage.set(userKey(accountId), state)
  },

  async updateAccount(accountId, patch) {
    const list = accounts()
    const idx = list.findIndex((a) => a.id === accountId)
    if (idx < 0) return null
    const updated = { ...list[idx], ...patch }
    list[idx] = updated
    saveAccounts(list)
    return updated
  },

  async getLeaderboard(excludeId): Promise<SeedMember[]> {
    return MEMBERS.filter((m) => m.id !== excludeId)
  },
}
