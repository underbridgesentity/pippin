import { T } from '../lib/theme'

export function Avatar({
  initial,
  gradient,
  size = 44,
  radius,
  fontSize,
  ring,
}: {
  initial: string
  gradient: string
  size?: number
  radius?: number
  fontSize?: number
  ring?: string
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius ?? '50%',
        background: gradient,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: T.ink,
        fontFamily: 'Bricolage Grotesque',
        fontWeight: 600,
        fontSize: fontSize ?? size * 0.4,
        flex: 'none',
        border: ring ? `3px solid ${ring}` : undefined,
        boxShadow: '0 4px 14px rgba(48,38,22,0.12)',
      }}
    >
      {initial}
    </div>
  )
}
