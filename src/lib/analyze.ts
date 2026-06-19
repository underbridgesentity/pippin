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
 * True only when the backend is configured AND the analyzer is explicitly
 * switched on (`VITE_MEAL_ANALYZER=on`). The flag keeps the feature dormant
 * until the `analyze-meal` Edge Function is deployed and the Gemini key is set,
 * so users never see an "analyzing" state that finds nothing.
 */
export function analyzerAvailable(): boolean {
  return Boolean(url && key && import.meta.env.VITE_MEAL_ANALYZER === 'on')
}

type Detected = { id: string; servings: number }

function toLogged(foodId: string, servings: number): LoggedFood | null {
  const food = FOOD_BY_ID[foodId]
  if (!food) return null
  const s = Math.max(1, Math.round(servings || 1))
  return {
    foodId: food.id,
    name: food.name,
    emoji: food.emoji,
    servings: s,
    kcal: Math.round(food.kcal * s),
    protein: Math.round(food.protein * s),
    carbs: Math.round(food.carbs * s),
    fat: Math.round(food.fat * s),
  }
}

/** Identify catalog foods in a meal photo. Always resolves (never throws). */
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
      .map((d) => toLogged(d.id, d.servings))
      .filter((x): x is LoggedFood => x !== null)
  } catch {
    return []
  }
}
