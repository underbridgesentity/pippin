import { useEffect, useState, type ReactNode } from 'react'

function clockLabel(): string {
  const d = new Date()
  let h = d.getHours() % 12
  if (h === 0) h = 12
  return `${h}:${d.getMinutes().toString().padStart(2, '0')}`
}

// Mock status bar for the desktop phone preview only. It is hidden on real
// phones (see the .ios-statusbar media query), where the device draws the real
// clock, wifi, and battery. The time is live so the preview never looks frozen.
function StatusBar() {
  const c = '#231E16'
  const [time, setTime] = useState(clockLabel)
  useEffect(() => {
    const id = setInterval(() => setTime(clockLabel()), 15_000)
    return () => clearInterval(id)
  }, [])
  return (
    <div
      className="ios-statusbar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '21px 30px 8px',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 40,
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          fontFamily: '-apple-system, "SF Pro", system-ui',
          fontWeight: 600,
          fontSize: 17,
          color: c,
        }}
      >
        {time}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <svg width="19" height="12" viewBox="0 0 19 12">
          <rect x="0" y="7.5" width="3.2" height="4.5" rx="0.7" fill={c} />
          <rect x="4.8" y="5" width="3.2" height="7" rx="0.7" fill={c} />
          <rect x="9.6" y="2.5" width="3.2" height="9.5" rx="0.7" fill={c} />
          <rect x="14.4" y="0" width="3.2" height="12" rx="0.7" fill={c} />
        </svg>
        <svg width="17" height="12" viewBox="0 0 17 12">
          <path d="M8.5 3.2C10.8 3.2 12.9 4.1 14.4 5.6L15.5 4.5C13.7 2.7 11.2 1.5 8.5 1.5C5.8 1.5 3.3 2.7 1.5 4.5L2.6 5.6C4.1 4.1 6.2 3.2 8.5 3.2Z" fill={c} />
          <path d="M8.5 6.8C9.9 6.8 11.1 7.3 12 8.2L13.1 7.1C11.8 5.9 10.2 5.1 8.5 5.1C6.8 5.1 5.2 5.9 3.9 7.1L5 8.2C5.9 7.3 7.1 6.8 8.5 6.8Z" fill={c} />
          <circle cx="8.5" cy="10.5" r="1.5" fill={c} />
        </svg>
        <svg width="27" height="13" viewBox="0 0 27 13">
          <rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke={c} strokeOpacity="0.35" fill="none" />
          <rect x="2" y="2" width="20" height="9" rx="2" fill={c} />
          <path d="M25 4.5V8.5C25.8 8.2 26.5 7.2 26.5 6.5C26.5 5.8 25.8 4.8 25 4.5Z" fill={c} fillOpacity="0.4" />
        </svg>
      </div>
    </div>
  )
}

/**
 * iOS 26-style device frame, adapted from the design's ios-frame.jsx.
 * On phone-sized viewports the bezel collapses and the app fills the screen.
 */
export function IOSDevice({ children }: { children: ReactNode }) {
  return (
    <div className="ios-device">
      {/* dynamic island */}
      <div className="ios-island" />
      <StatusBar />
      <div className="ios-content">{children}</div>
      {/* home indicator */}
      <div className="ios-home-indicator">
        <div className="ios-home-pill" />
      </div>

      <style>{`
        .ios-device {
          width: 402px;
          height: 874px;
          border-radius: 48px;
          overflow: hidden;
          position: relative;
          background: radial-gradient(circle at 50% -8%, #fbf7ef, #f1ede4 58%);
          box-shadow: 0 40px 90px rgba(60,45,20,0.28), 0 0 0 1px rgba(40,33,22,0.08);
          font-family: -apple-system, system-ui, sans-serif;
        }
        .ios-island {
          position: absolute;
          top: 11px;
          left: 50%;
          transform: translateX(-50%);
          width: 126px;
          height: 37px;
          border-radius: 24px;
          background: #000;
          z-index: 50;
        }
        .ios-content {
          height: 100%;
          width: 100%;
          position: relative;
          overflow: hidden;
        }
        .ios-home-indicator {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 60;
          height: 28px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          padding-bottom: 8px;
          pointer-events: none;
        }
        .ios-home-pill {
          width: 139px;
          height: 5px;
          border-radius: 100px;
          background: rgba(40,33,22,0.22);
        }

        @media (max-width: 640px) {
          .ios-device {
            width: 100%;
            height: 100vh;
            height: 100dvh;
            border-radius: 0;
            box-shadow: none;
          }
          .ios-island { display: none; }
          .ios-home-indicator { display: none; }
          /* The bar carries an inline display:flex, so this needs !important to win. */
          .ios-statusbar { display: none !important; }
        }
      `}</style>
    </div>
  )
}
