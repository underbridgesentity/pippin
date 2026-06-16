// Picks the backend at startup: Supabase if its env vars are present, otherwise
// the local-storage adapter. Swapping backends is purely configuration.

import { localApi } from './local'
import { createSupabaseApi } from './supabase'
import type { FettleApi } from './contract'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const api: FettleApi = url && key ? createSupabaseApi(url, key) : localApi

export { ApiError, defaultState, DEFAULT_SETTINGS, PENDING_GOAL_KEY } from './contract'
export type { FettleApi, SocialProvider } from './contract'
