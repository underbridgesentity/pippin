// Domain types for Fettle. These describe the real, persisted data model,
// no mock-only shapes. The storage layer (lib/api.ts) is written against these
// so it can be swapped for a remote backend later without touching the UI.

export type Goal = 'lose' | 'strong' | 'eat' | 'move' | 'feel'

export type Account = {
  id: string
  name: string
  email: string
  /** Lightweight local password hash. NOT secure, see lib/api.ts. */
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

export type Sex = 'male' | 'female' | 'other'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'athlete'

/** Body stats used to personalize the calorie target and track progress. */
export type Body = {
  heightCm: number
  weightKg: number
  age: number
  sex: Sex
  activity: ActivityLevel
}

/** One weigh-in, for the progress trend. */
export type WeightEntry = { at: number; kg: number }

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

export type FeedKind = 'meal' | 'activity' | 'badge' | 'challenge' | 'level' | 'post'

/** The kind of thing someone shares with the community. */
export type PostType = 'update' | 'tip' | 'question' | 'win'

export type ReactionKind = 'cheer' | 'fire' | 'strong' | 'love'

/** How you're feeling at a daily accountability check-in. */
export type Mood = 'great' | 'ok' | 'tough'

export type CheckIn = { id: string; at: number; mood: Mood; note?: string }

export type BuddyCheckIn = { at: number; mood: Mood; note: string }

export type Comment = {
  id: string
  at: number
  author: string // 'me' or a member id
  name: string
  initial: string
  avatar: string
  text: string
  /** marked as a helpful tip rather than a plain reply */
  tip?: boolean
}

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
  /** for kind === 'post' */
  postType?: PostType
  text?: string
  /** seeded reactions/comments so the community feels alive from day one */
  baseReactions?: Partial<Record<ReactionKind, number>>
  seedComments?: Comment[]
  /** when set, this post belongs to a support circle rather than the global feed */
  circleId?: string
}

export type UserState = {
  goal: Goal
  settings: Settings
  /** body stats for a personalized calorie target (optional until the user sets them) */
  body?: Body
  /** weigh-in history, oldest first */
  weights: WeightEntry[]
  /** daily trackers, keyed by ISO day (YYYY-MM-DD) */
  water: Record<string, number>
  sleep: Record<string, number>
  moods: Record<string, Mood>
  /** total lifetime XP, level & stage are derived from this */
  xp: number
  meals: MealEntry[]
  activities: ActivityEntry[]
  joinedChallenges: string[]
  /** challengeId -> ISO day the user joined */
  challengeJoinedOn: Record<string, string>
  /** member ids the user is friends with */
  friends: string[]
  /** circle (support group) ids the user has joined */
  circles: string[]
  /** your 1:1 accountability buddy (a member id) */
  buddyId?: string
  /** your daily check-ins */
  checkIns: CheckIn[]
  /** your buddy's most recent (simulated) check-in */
  buddyLastCheckIn?: BuddyCheckIn
  /** badgeId -> unlock timestamp */
  badges: Record<string, number>
  /** feedEntryId -> cheered (legacy; superseded by reactions) */
  cheers: Record<string, boolean>
  /** feedEntryId -> my reaction */
  reactions: Record<string, ReactionKind>
  /** feedEntryId -> comments I (and simulated community responses) have added */
  comments: Record<string, Comment[]>
  /** cumulative cheers/encouragement received from the community */
  kudosReceived: number
  /** the user's own feed events (auto + community posts they author) */
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
