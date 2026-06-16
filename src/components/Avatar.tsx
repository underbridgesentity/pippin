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
        color: '#fff',
        fontFamily: 'Fredoka',
        fontWeight: 600,
        fontSize: fontSize ?? size * 0.4,
        flex: 'none',
        border: ring ? `3px solid ${ring}` : undefined,
        boxShadow: '0 3px 8px rgba(120,60,180,.18)',
      }}
    >
      {initial}
    </div>
  )
}
