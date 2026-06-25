// Pippin "Daylight" design system. A warm, soft, playful-modern LIGHT
// aesthetic inspired by Family (family.co): a warm paper canvas, soft
// physical depth (diffuse shadows, no harsh borders), generously rounded
// squircle shapes, a friendly colourful spectrum, and a fresh green
// primary. Components reference these tokens instead of hardcoding values,
// so the look stays cohesive and is tunable in one place.
import type { CSSProperties } from 'react'

export const T = {
  // surfaces — warm paper, soft physical depth
  bg: '#F1EDE4', // warm canvas
  bgElev: '#F8F5EE',
  glass: '#FBF9F3', // soft tinted inset fill (chips, rows, tiles)
  glassHi: '#FFFFFF', // elevated inset
  solid: '#FFFFFF', // sheets / solid cards
  line: 'rgba(40,33,22,0.08)',
  lineSoft: 'rgba(40,33,22,0.05)',

  // text — warm ink
  text: '#231E16',
  dim: '#736D60',
  faint: '#ABA493',
  ink: '#FFFFFF', // readable text on saturated / accent fills

  // primary + a playful, colourful spectrum
  accent: '#2FC36B', // fresh, friendly green (primary)
  accentDim: 'rgba(47,195,107,0.15)',
  blue: '#4F9DF7',
  amber: '#FF9F43',
  green: '#2FC36B',
  rose: '#FF6F8B',
  violet: '#8C7CF5',

  // type
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",

  // radii — soft squircles
  r: { sm: 14, md: 18, lg: 22, xl: 28, pill: 999 },
} as const

/** A solid card with soft, diffuse, warm physical depth (no harsh border). */
export const card: CSSProperties = {
  background: T.solid,
  borderRadius: T.r.xl,
  boxShadow: '0 1px 2px rgba(48,38,22,0.04), 0 10px 26px rgba(48,38,22,0.07)',
}

/** A flatter inset surface (rows, chips, inputs, icon tiles). */
export const inset: CSSProperties = {
  background: T.glass,
  border: `1px solid ${T.lineSoft}`,
  borderRadius: T.r.md,
}

/** Uppercase eyebrow label. */
export const eyebrow: CSSProperties = {
  fontFamily: T.body,
  fontWeight: 700,
  fontSize: 11,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  color: T.faint,
}

/** Primary green button face, fully rounded. */
export const accentBtn: CSSProperties = {
  background: T.accent,
  color: T.ink,
  border: 'none',
  borderRadius: T.r.pill,
  fontFamily: T.display,
  fontWeight: 600,
  cursor: 'pointer',
}

/** Subtle ghost button on the warm canvas. */
export const ghostBtn: CSSProperties = {
  background: T.solid,
  color: T.text,
  border: `1px solid ${T.line}`,
  borderRadius: T.r.pill,
  fontFamily: T.body,
  fontWeight: 700,
  cursor: 'pointer',
}

/** A soft tint helper for colourful squircle icon tiles. Pass a spectrum hue. */
export function softTile(hex: string): CSSProperties {
  return { background: hexA(hex, 0.14), borderRadius: T.r.md }
}

/** Hex + alpha -> rgba string (hex must be #RRGGBB). */
export function hexA(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}
