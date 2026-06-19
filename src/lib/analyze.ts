// Meal-photo analyzer. Sends a captured photo to the `analyze-meal` Supabase
// Edge Function (which calls Gemini 2.5 Flash-Lite with the API key kept
// server-side), then maps the detected food ids back onto the bundled food DB
// so the calorie/macro numbers stay deterministic and the model is swappable.
//
// Degrades gracefully: if Supabase is not configured, or the call fails, this
// returns an empty list and the user just logs the meal by hand.
import { FOODS, FOOD_BY_ID } from './foods'
import type { LoggedFood } from './types'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * True when the backend is configured. The `analyze-meal` Edge Function is
 * deployed, so the analyzer runs whenever Supabase is set; on any failure the
 * call returns [] and the app falls back to manual logging.
 */
export function analyzerAvailable(): boolean {
  return Boolean(url && key)
}

// One food the analyzer detected. catalogId is set only when it confidently
// matches a known food (then we use the app's exact numbers); otherwise the
// kcal/macros are the model's estimate for any arbitrary food.
type Detected = {
  name: string
  emoji?: string
  servings?: number
  kcal?: number
  protein?: number
  carbs?: number
  fat?: number
  catalogId?: string
}

function nn(v: unknown): number {
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function fromCatalog(foodId: string, servings: number): LoggedFood {
  const food = FOOD_BY_ID[foodId]
  return {
    foodId: food.id,
    name: food.name,
    emoji: food.emoji,
    servings,
    kcal: Math.round(food.kcal * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
  }
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'food'
}

function toLogged(d: Detected): LoggedFood | null {
  const servings = Math.max(1, Math.round(Number(d.servings) || 1))
  // Confident match to a known food -> use the app's exact nutrition data.
  if (d.catalogId && FOOD_BY_ID[d.catalogId]) return fromCatalog(d.catalogId, servings)
  // Otherwise, an arbitrary food carrying the model's own estimate.
  const name = (d.name || '').trim()
  if (!name) return null
  return {
    foodId: `ai:${slug(name)}`,
    name,
    emoji: d.emoji || '🍽️',
    servings,
    kcal: nn(d.kcal),
    protein: nn(d.protein),
    carbs: nn(d.carbs),
    fat: nn(d.fat),
  }
}

/**
 * Identify the foods in a meal photo and estimate their calories. Works for any
 * meal, not just catalog foods. Always resolves (never throws).
 */
export async function analyzeMeal(imageDataUrl: string): Promise<LoggedFood[]> {
  if (!url || !key) return []
  try {
    const catalog = FOODS.map((f) => ({ id: f.id, name: f.name, serving: f.serving }))
    const res = await fetch(`${url}/functions/v1/analyze-meal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ image: imageDataUrl, catalog }),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { items?: Detected[] }
    return (data.items ?? [])
      .map(toLogged)
      .filter((x): x is LoggedFood => x !== null)
  } catch {
    return []
  }
}
