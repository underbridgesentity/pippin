// Definitions for the social layer: reaction types and post types, with the
// playful, encouraging vocabulary that gives Fettle its supportive feel.

import type { PostType, ReactionKind } from './types'

export type ReactionDef = { kind: ReactionKind; emoji: string; label: string; color: string }

export const REACTIONS: ReactionDef[] = [
  { kind: 'cheer', emoji: '👏', label: 'Cheer', color: '#FF8A1E' },
  { kind: 'fire', emoji: '🔥', label: 'On fire', color: '#FF4D6D' },
  { kind: 'strong', emoji: '💪', label: 'Strong', color: '#7C3AF6' },
  { kind: 'love', emoji: '❤️', label: 'Love', color: '#FF6CB6' },
]

export const REACTION_BY_KIND: Record<ReactionKind, ReactionDef> = Object.fromEntries(
  REACTIONS.map((r) => [r.kind, r]),
) as Record<ReactionKind, ReactionDef>

export type PostTypeDef = { type: PostType; emoji: string; label: string; color: string; tint: string; prompt: string }

export const POST_TYPES: PostTypeDef[] = [
  { type: 'update', emoji: '✨', label: 'Update', color: '#7C3AF6', tint: '#EFE7FF', prompt: "What's on your mind? Share a moment from your day." },
  { type: 'tip', emoji: '💡', label: 'Tip', color: '#FF8A1E', tint: '#FFF0DC', prompt: 'Share something that worked for you — help the squad out.' },
  { type: 'question', emoji: '🙋', label: 'Question', color: '#2BB7F2', tint: '#E2F4FE', prompt: 'Stuck on something? Ask the community for advice.' },
  { type: 'win', emoji: '🎉', label: 'Win', color: '#18C98A', tint: '#E2F8EF', prompt: 'Celebrate a win, big or small. Let your squad cheer you on.' },
]

export const POST_TYPE_BY_TYPE: Record<PostType, PostTypeDef> = Object.fromEntries(
  POST_TYPES.map((p) => [p.type, p]),
) as Record<PostType, PostTypeDef>
