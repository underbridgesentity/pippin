// The Fettle character. Its colour shifts as you evolve through stages:
// Seed → Sprout → Bloomer → Legend.

const STAGE_BODY: Record<string, string> = {
  Seed: '#18C98A',
  Sprout: '#8A4DFF',
  Bloomer: '#FF6CB6',
  Legend: '#FFC53D',
}

export function Mascot({ stage = 'Sprout', size = 92, float = false }: { stage?: string; size?: number; float?: boolean }) {
  const body = STAGE_BODY[stage] ?? '#8A4DFF'
  const dark = stage === 'Legend' ? '#7A4B00' : '#241544'
  return (
    <div style={{ width: size, height: size, animation: float ? 'pep-float 3.4s ease-in-out infinite' : undefined }}>
      <svg width={size} height={size} viewBox="0 0 120 120">
        <path d="M60 12c26 0 44 18 44 44 0 30-20 50-44 50S16 86 16 56C16 30 34 12 60 12Z" fill={body} />
        <ellipse cx="44" cy="42" rx="16" ry="11" fill="#fff" opacity=".28" />
        <path d="M62 12c0-7 5-11 11-11-1 7-5 11-11 11Z" fill="#18C98A" />
        <circle cx="40" cy="74" r="7" fill="#FF6CB6" opacity=".55" />
        <circle cx="80" cy="74" r="7" fill="#FF6CB6" opacity=".55" />
        <circle cx="46" cy="58" r="8.5" fill="#fff" />
        <circle cx="74" cy="58" r="8.5" fill="#fff" />
        <circle cx="48" cy="59" r="3.8" fill={dark} />
        <circle cx="76" cy="59" r="3.8" fill={dark} />
        <path d="M46 80q14 13 28 0" stroke={dark} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  )
}
