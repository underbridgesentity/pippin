export function ProgressBar({
  pct,
  fill,
  track = '#EEE7FB',
  height = 11,
}: {
  pct: number
  fill: string
  track?: string
  height?: number
}) {
  const clamped = Math.max(0, Math.min(1, pct))
  return (
    <div style={{ height, borderRadius: 8, background: track, overflow: 'hidden' }}>
      <div
        style={{
          width: `${clamped * 100}%`,
          height: '100%',
          borderRadius: 8,
          background: fill,
          transition: 'width .5s ease',
        }}
      />
    </div>
  )
}
