// AI coach: turns the user's goal, stats, and today's progress into short
// recommendations (eat / move / focus) via the `coach` Edge Function. The plan
// is cached per day so it is one cheap call a day; a manual refresh re-generates
// it with the current numbers. Degrades to nothing (card hidden) on any failure.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export type CoachPlan = {
  eat: { title: string; detail: string }[]
  move: { title: string; detail: string }
  focus: string
}

export type CoachCtx = {
  goal: string
  bodyLine: string
  calorieTarget: number
  consumed: number
  remaining: number
  protein: number
  carbs: number
  fat: number
  steps: number
  stepsTarget: number
  activeMinutes: number
}

export function coachAvailable(): boolean {
  return Boolean(url && key)
}

const CACHE_KEY = 'pippin:coachplan'

function dayStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

function valid(p: unknown): p is CoachPlan {
  const v = p as CoachPlan
  return Boolean(v && Array.isArray(v.eat) && v.eat.length > 0 && v.move?.title && typeof v.focus === 'string')
}

/** Today's cached plan, or null if there isn't one yet. */
export function cachedPlan(): CoachPlan | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as { day: string; plan: CoachPlan }
    return v.day === dayStamp() && valid(v.plan) ? v.plan : null
  } catch {
    return null
  }
}

/** Generate (and cache) today's plan. Always resolves; null on any failure. */
export async function fetchCoachPlan(ctx: CoachCtx): Promise<CoachPlan | null> {
  if (!url || !key) return null
  try {
    const res = await fetch(`${url}/functions/v1/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify(ctx),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { plan?: CoachPlan | null }
    if (!valid(data.plan)) return null
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ day: dayStamp(), plan: data.plan }))
    } catch {
      /* cache is best-effort */
    }
    return data.plan
  } catch {
    return null
  }
}
