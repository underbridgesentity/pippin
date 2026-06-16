// Small formatting + date helpers shared across screens.

export function dayKey(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function todayKey(now = Date.now()): string {
  return dayKey(now)
}

export function num(n: number): string {
  return Math.round(n).toLocaleString('en-US')
}

export function relativeTime(ts: number, now = Date.now()): string {
  const s = Math.max(1, Math.floor((now - ts) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function longDate(now = Date.now()): string {
  return new Date(now).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export function greeting(now = Date.now()): string {
  const h = new Date(now).getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || name
}

export function initialOf(name: string): string {
  return (name.trim()[0] || '?').toUpperCase()
}

const GRADIENTS = [
  'linear-gradient(135deg,#FF8A1E,#FF4D6D)',
  'linear-gradient(135deg,#2BB7F2,#7C3AF6)',
  'linear-gradient(135deg,#FF6CB6,#7C3AF6)',
  'linear-gradient(135deg,#18C98A,#2BB7F2)',
  'linear-gradient(135deg,#FFC53D,#FF8A1E)',
  'linear-gradient(135deg,#7C3AF6,#FF6CB6)',
  'linear-gradient(135deg,#7C3AF6,#2BB7F2)',
]

export function gradientFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return GRADIENTS[h % GRADIENTS.length]
}
