// Definitions for the social layer: reaction types and post types, with the
// playful, encouraging vocabulary that gives Fettle its supportive feel.

import type { Mood, PostType, ReactionKind } from './types'

export type ReactionDef = { kind: ReactionKind; emoji: string; label: string; color: string }

export const REACTIONS: ReactionDef[] = [
  { kind: 'cheer', emoji: '👏', label: 'Cheer', color: '#FFB86B' },
  { kind: 'fire', emoji: '🔥', label: 'On fire', color: '#FF7A93' },
  { kind: 'strong', emoji: '💪', label: 'Strong', color: '#9F8BFF' },
  { kind: 'love', emoji: '❤️', label: 'Love', color: '#FF9FD0' },
]

export const REACTION_BY_KIND: Record<ReactionKind, ReactionDef> = Object.fromEntries(
  REACTIONS.map((r) => [r.kind, r]),
) as Record<ReactionKind, ReactionDef>

export type PostTypeDef = { type: PostType; emoji: string; label: string; color: string; tint: string; prompt: string }

export const POST_TYPES: PostTypeDef[] = [
  { type: 'update', emoji: '✨', label: 'Update', color: '#9F8BFF', tint: 'rgba(159,139,255,0.14)', prompt: "What's on your mind? Share a moment from your day." },
  { type: 'tip', emoji: '💡', label: 'Tip', color: '#FFB86B', tint: 'rgba(255,184,107,0.14)', prompt: 'Share something that worked for you, help the squad out.' },
  { type: 'question', emoji: '🙋', label: 'Question', color: '#6FA8FF', tint: 'rgba(111,168,255,0.14)', prompt: 'Stuck on something? Ask the community for advice.' },
  { type: 'win', emoji: '🎉', label: 'Win', color: '#5BE39A', tint: 'rgba(91,227,154,0.14)', prompt: 'Celebrate a win, big or small. Let your squad cheer you on.' },
]

export const POST_TYPE_BY_TYPE: Record<PostType, PostTypeDef> = Object.fromEntries(
  POST_TYPES.map((p) => [p.type, p]),
) as Record<PostType, PostTypeDef>

export type MoodDef = { id: Mood; emoji: string; label: string; color: string; tint: string }

export const MOODS: MoodDef[] = [
  { id: 'great', emoji: '💪', label: 'Crushing it', color: '#5BE39A', tint: 'rgba(91,227,154,0.14)' },
  { id: 'ok', emoji: '👍', label: 'On track', color: '#6FA8FF', tint: 'rgba(111,168,255,0.14)' },
  { id: 'tough', emoji: '🫤', label: 'Tough day', color: '#FFB86B', tint: 'rgba(255,184,107,0.14)' },
]

export const MOOD_BY_ID: Record<Mood, MoodDef> = Object.fromEntries(MOODS.map((m) => [m.id, m])) as Record<Mood, MoodDef>
