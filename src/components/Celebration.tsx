// Full-screen celebration for a big, earned moment: confetti and a cheering
// Pip. Fired by the store the instant the user crosses a threshold (level up,
// badge, streak milestone). Tap anywhere to continue.
import { Confetti } from './Confetti'
import { Mascot } from './Mascot'
import { T } from '../lib/theme'
import type { Celebration } from '../lib/store'

const KIND_LABEL: Record<Celebration['kind'], string> = {
  level: 'Level up',
  badge: 'Badge unlocked',
  streak: 'Streak milestone',
}

export function CelebrationOverlay({ data, onDismiss, onShare }: { data: Celebration; onDismiss: () => void; onShare: () => void }) {
  return (
    <div
      onClick={onDismiss}
      style={{ position: 'absolute', inset: 0, zIndex: 96, background: 'rgba(20,15,8,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 30px', animation: 'pep-fade .2s ease' }}
    >
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <Confetti count={42} />
      </div>
      <div style={{ position: 'relative', width: '100%', maxWidth: 330, background: T.solid, borderRadius: 30, padding: '30px 26px 24px', textAlign: 'center', boxShadow: '0 26px 60px rgba(0,0,0,.32)', animation: 'pep-pop .45s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <Mascot stage={data.stage} size={124} mood="cheer" float />
        </div>
        <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, letterSpacing: '1.4px', textTransform: 'uppercase', color: T.accent, marginBottom: 6 }}>{KIND_LABEL[data.kind]}</div>
        <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 28, color: T.text, letterSpacing: '-.5px', marginBottom: 6 }}>{data.title}</div>
        <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 15, color: T.dim, marginBottom: 20, lineHeight: 1.35 }}>{data.subtitle}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onShare() }}
            className="pressable"
            style={{ flex: 1, background: T.glassHi, color: T.text, border: `1px solid ${T.line}`, borderRadius: T.r.pill, padding: 15, fontFamily: T.display, fontWeight: 600, fontSize: 16, cursor: 'pointer', ['--press-y' as string]: '2px' }}
          >
            Share
          </button>
          <button
            onClick={onDismiss}
            className="pressable"
            style={{ flex: 1, background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: 15, fontFamily: T.display, fontWeight: 600, fontSize: 16, cursor: 'pointer', ['--press-y' as string]: '2px' }}
          >
            Nice!
          </button>
        </div>
      </div>
    </div>
  )
}
