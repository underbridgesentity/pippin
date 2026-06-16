import { Confetti } from '../components/Confetti'
import { actions } from '../lib/store'

export function Welcome({ name }: { name: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 92,
        background: 'radial-gradient(circle at 50% 18%,#FBEBFF,#F4EFFF 60%)',
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
                background: 'linear-gradient(135deg,#FFC53D,#FF8A1E)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 12px 28px rgba(255,138,30,.4)',
                animation: 'pep-float 3s ease-in-out infinite',
              }}
            >
              <svg width="64" height="64" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" />
              </svg>
            </div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 30, color: '#241544', marginBottom: 8 }}>You're in, {name}!</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#9B91B8', maxWidth: 280, margin: '0 auto 14px' }}>
              You just earned your first badge. Your squad is waiting — let's make today count.
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 16, padding: '9px 15px', boxShadow: '0 6px 16px rgba(120,60,180,.1)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#18C98A"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
              <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>Badge unlocked: First Steps</span>
            </div>
          </div>
        </div>
      </div>
      <button
        onClick={() => actions.finishWelcome()}
        className="pressable"
        style={{
          background: '#7C3AF6',
          color: '#fff',
          border: 'none',
          borderRadius: 20,
          padding: 17,
          fontFamily: 'Fredoka',
          fontWeight: 600,
          fontSize: 19,
          boxShadow: '0 5px 0 #5B22C9',
          cursor: 'pointer',
          width: '100%',
          ['--press-y' as string]: '3px',
          ['--press-shadow' as string]: '0 2px 0 #5B22C9',
        }}
      >
        Let's go!
      </button>
    </div>
  )
}
