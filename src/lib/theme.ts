// Fettle "Midnight Glass" design system. One source of truth for the dark,
// premium, glass aesthetic. Components reference these tokens instead of
// hardcoding values, so the look stays cohesive and is tunable in one place.
import type { CSSProperties } from 'react'

export const T = {
  // surfaces
  bg: '#0B0D13',
  bgElev: '#10131B',
  glass: 'rgba(255,255,255,0.045)',
  glassHi: 'rgba(255,255,255,0.07)',
  solid: '#151823',
  line: 'rgba(255,255,255,0.09)',
  lineSoft: 'rgba(255,255,255,0.06)',

  // text
  text: '#EAECF3',
  dim: '#9498A8',
  faint: '#5E6373',
  ink: '#0B0D13', // text on bright surfaces

  // accent + refined data hues
  accent: '#C6F24E', // electric citron
  accentDim: 'rgba(198,242,78,0.14)',
  blue: '#6FA8FF',
  amber: '#FFB86B',
  green: '#5BE39A',
  rose: '#FF7A93',
  violet: '#9F8BFF',

  // type
  display: "'Bricolage Grotesque', system-ui, sans-serif",
  body: "'Hanken Grotesk', system-ui, sans-serif",

  // radii
  r: { sm: 12, md: 16, lg: 20, xl: 26, pill: 999 },
} as const

/** A frosted glass surface over the dark background (static, no live blur). */
export const card: CSSProperties = {
  background: T.glass,
  border: `1px solid ${T.line}`,
  borderRadius: T.r.xl,
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 18px 40px rgba(0,0,0,.45)',
}

/** A flatter inset surface (rows, chips, inputs). */
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
  letterSpacing: '1.4px',
  textTransform: 'uppercase',
  color: T.faint,
}

/** Primary citron button face. */
export const accentBtn: CSSProperties = {
  background: T.accent,
  color: T.ink,
  border: 'none',
  borderRadius: T.r.md,
  fontFamily: T.display,
  fontWeight: 600,
  cursor: 'pointer',
}

/** Subtle ghost button on glass. */
export const ghostBtn: CSSProperties = {
  background: T.glassHi,
  color: T.text,
  border: `1px solid ${T.line}`,
  borderRadius: T.r.md,
  fontFamily: T.body,
  fontWeight: 700,
  cursor: 'pointer',
}
