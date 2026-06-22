// Onboarding goal options (shared by Auth and Settings). The rest of the app's
// content now lives in lib/ (foods, seed, gamification) and is computed at runtime.

export type GoalOption = {
  id: string
  label: string
  color: string
  tint: string
  /** SVG path data for the goal glyph */
  path: string
}

export const GOAL_OPTIONS: GoalOption[] = [
  { id: 'lose', label: 'Lose weight', color: '#FF7A93', tint: 'rgba(255,122,147,0.14)', path: 'M12 3c2.4 3.2 4.4 5 4.4 8.1a4.4 4.4 0 1 1-8.8 0c0-1.3.5-2.4 1.2-3.3.3 1.1 1 1.8 1.9 1.8 1 0 1.3-.9 1.3-2.4 0-1.7-.4-2.9-1.4-4.2Z' },
  { id: 'strong', label: 'Build strength', color: '#9F8BFF', tint: 'rgba(159,139,255,0.14)', path: 'M13 3 6 13h5l-1 8 8-11h-5l1-7Z' },
  { id: 'eat', label: 'Eat better', color: '#5BE39A', tint: 'rgba(91,227,154,0.14)', path: 'M5 19C5 11 11 5 19 5c0 8-6 14-14 14Zm1.5-1.5C10 14 13 11.5 16 9.5' },
  { id: 'move', label: 'Move more', color: '#FFB86B', tint: 'rgba(255,184,107,0.14)', path: 'M14 5.5a1.6 1.6 0 1 0 0-.01M6.5 21l2.5-6 3 1.5 1 4.5M9 11.5l3-2 3 1 2-2' },
  { id: 'feel', label: 'Feel good', color: '#6FA8FF', tint: 'rgba(111,168,255,0.14)', path: 'M12 20S4 14.5 4 9a3.6 3.6 0 0 1 8-2 3.6 3.6 0 0 1 8 2c0 5.5-8 11-8 11Z' },
]
