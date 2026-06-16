// Domain types for Fettle. These describe the real, persisted data model —
// no mock-only shapes. The storage layer (lib/api.ts) is written against these
// so it can be swapped for a remote backend later without touching the UI.

export type Goal = 'lose' | 'strong' | 'eat' | 'move' | 'feel'

export type Account = {
  id: string
  name: string
  email: string
  /** Lightweight local password hash. NOT secure — see lib/api.ts. */
  passwordHash: string
  avatar: string // CSS gradient
  createdAt: number
}

export type Settings = {
  calorieTarget: number
  moveTargetMin: number
  sleepTargetHrs: number
  stepsTarget: number
}

export type Macros = {
  protein: number
  carbs: number
  fat: number
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

export type LoggedFood = {
  foodId: string
  name: string
  emoji: string
  servings: number
  kcal: number
  protein: number
  carbs: number
  fat: number
}

export type MealEntry = {
  id: string
  at: number
  type: MealType
  items: LoggedFood[]
  kcal: number
  macros: Macros
  /** Compressed data-URL of the captured photo, if any. */
  photo?: string
}

export type ActivityKind = 'walk' | 'run' | 'ride' | 'workout' | 'steps'

export type ActivityEntry = {
  id: string
  at: number
  kind: ActivityKind
  label: string
  /** minutes (0 for a pure steps entry) */
  minutes: number
  /** distance in km, optional */
  km?: number
  steps: number
  kcalBurned: number
}

export type FeedKind = 'meal' | 'activity' | 'badge' | 'challenge' | 'level'

export type FeedEntry = {
  id: string
  at: number
  kind: FeedKind
  /** author id; 'me' for the current user, otherwise a seeded community member */
  author: string
  name: string
  initial: string
  avatar: string
  action: string
  stat?: string | null
  badge?: string | null
  photo?: string | null
  baseCheers: number
}

export type UserState = {
  goal: Goal
  settings: Settings
  /** total lifetime XP — level & stage are derived from this */
  xp: number
  meals: MealEntry[]
  activities: ActivityEntry[]
  joinedChallenges: string[]
  /** challengeId -> ISO day the user joined */
  challengeJoinedOn: Record<string, string>
  /** badgeId -> unlock timestamp */
  badges: Record<string, number>
  /** feedEntryId -> cheered */
  cheers: Record<string, boolean>
  /** the user's own feed events */
  feed: FeedEntry[]
  /** ISO day the daily quest bonus was last claimed */
  questClaimedOn?: string
  /** false until the first-run "You're in!" celebration is dismissed */
  welcomed: boolean
  onboardedAt: number
}

export type Challenge = {
  id: string
  name: string
  cat: string
  color: string
  tint: string
  people: string
  days: number
  diff: 'Easy' | 'Medium' | 'Hard'
  reward: string
  /** how personal progress is measured */
  metric: 'steps' | 'meals' | 'days' | 'activities'
  target: number
}
