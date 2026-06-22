import { Confetti } from '../components/Confetti'
import { actions } from '../lib/store'
import { T } from '../lib/theme'

export function Welcome({ name }: { name: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 92,
        background: `radial-gradient(circle at 50% 18%,${T.bgElev},${T.bg} 60%)`,
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 26px 30px',
      }}
    >
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '100%', animation: 'pep-pop .45s ease' }}>
          <Confetti count={32} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div
              style={{
                width: 120,
                height: 120,
                margin: '0 auto 18px',
                borderRadius: '50%',
                background: T.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 34px rgba(198,242,78,.28)',
                animation: 'pep-float 3s ease-in-out infinite',
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill={T.ink}>
                <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" />
              </svg>
            </div>
            <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 30, color: T.text, marginBottom: 8 }}>You're in, {name}!</div>
            <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 15, color: T.dim, maxWidth: 280, margin: '0 auto 14px' }}>
              You just earned your first badge. Your squad is waiting, let's make today count.
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: T.glass, border: `1px solid ${T.line}`, borderRadius: 16, padding: '9px 15px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={T.green}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
              <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text }}>Badge unlocked: First Steps</span>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => actions.finishWelcome()}
        className="pressable"
        style={{
          background: T.accent,
          color: T.ink,
          border: 'none',
          borderRadius: 20,
          padding: 17,
          fontFamily: T.display,
          fontWeight: 600,
          fontSize: 19,
          cursor: 'pointer',
          width: '100%',
          ['--press-y' as string]: '3px',
        }}
      >
        Let's go!
      </button>
    </div>
  )
}
