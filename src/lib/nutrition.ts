// Personalized calorie target from body stats, using the Mifflin-St Jeor
// equation for BMR, an activity multiplier for TDEE, and a goal adjustment.
import type { ActivityLevel, Body, Goal } from './types'

const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
}

export const ACTIVITY_OPTIONS: { id: ActivityLevel; label: string }[] = [
  { id: 'sedentary', label: 'Sedentary' },
  { id: 'light', label: 'Lightly active' },
  { id: 'moderate', label: 'Moderately active' },
  { id: 'active', label: 'Very active' },
  { id: 'athlete', label: 'Athlete' },
]

/** Mifflin-St Jeor basal metabolic rate (kcal/day). */
export function bmr(b: Body): number {
  const base = 10 * b.weightKg + 6.25 * b.heightCm - 5 * b.age
  if (b.sex === 'male') return base + 5
  if (b.sex === 'female') return base - 161
  return base - 78 // 'other' -> midpoint of the two sex constants
}

/** Daily calorie target from body stats + goal. */
export function recommendedCalories(b: Body, goal: Goal): number {
  const tdee = bmr(b) * ACTIVITY_FACTOR[b.activity]
  const adjust = goal === 'lose' ? -500 : goal === 'strong' ? 250 : 0
  return Math.max(1200, Math.round((tdee + adjust) / 10) * 10)
}

/** True when every body field has a usable value. */
export function bodyComplete(b: Partial<Body> | undefined): b is Body {
  return Boolean(b && b.heightCm && b.weightKg && b.age && b.sex && b.activity)
}
