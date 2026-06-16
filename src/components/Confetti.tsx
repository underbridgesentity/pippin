import { useMemo } from 'react'

const COLORS = ['#7C3AF6', '#FF4D6D', '#FF8A1E', '#FFC53D', '#18C98A', '#2BB7F2', '#FF6CB6']

/**
 * Falling confetti burst, ported from the design's makeConfetti().
 * Sits absolutely inside a positioned, overflow-hidden parent.
 */
export function Confetti({ count = 28 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const left = Math.random() * 100
        const delay = Math.random() * 0.6
        const dur = 1.7 + Math.random() * 1.3
        const size = 6 + Math.random() * 8
        const rot = Math.random() * 360
        return { i, left, delay, dur, size, rot, color: COLORS[i % COLORS.length] }
      }),
    [count],
  )

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {pieces.map((p) => (
        <div
          key={p.i}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.5,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rot}deg)`,
            animation: `pep-confetti ${p.dur}s ${p.delay}s ease-in forwards`,
          }}
        />
      ))}
    </div>
  )
}
