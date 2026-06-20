export type Tab = 'home' | 'challenges' | 'squad' | 'profile'

const GRAPE = '#7C3AF6'
const MUTED = '#B6AEC9'

export function TabBar({
  tab,
  onTab,
  onCapture,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  onCapture: () => void
}) {
  const color = (t: Tab) => (tab === t ? GRAPE : MUTED)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(14px + env(safe-area-inset-bottom, 0px))',
        left: 14,
        right: 14,
        flex: 'none',
        // Solid-ish translucent pill, NO backdrop-filter: a live blur here
        // repaints every scroll frame and freezes scrolling on iOS Safari.
        background: 'rgba(255,255,255,0.94)',
        border: '1px solid rgba(255,255,255,0.8)',
        borderRadius: 30,
        padding: '8px 6px 10px',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        boxShadow: '0 14px 36px rgba(90,40,140,.20), inset 0 1px 0 rgba(255,255,255,0.6)',
        zIndex: 30,
      }}
    >
      <TabButton label="Home" color={color('home')} onClick={() => onTab('home')}>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6 10v9h4v-5h4v5h4v-9" />
      </TabButton>

      <TabButton label="Challenges" color={color('challenges')} onClick={() => onTab('challenges')}>
        <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
        <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" />
      </TabButton>

      {/* center camera */}
      <button onClick={onCapture} style={{ flex: 1, display: 'flex', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Snap a meal">
        <span
          style={{
            width: 60,
            height: 60,
            borderRadius: 21,
            background: 'linear-gradient(135deg,#FF6CB6,#FF4D6D)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 9px 18px rgba(255,77,109,.42),0 4px 0 #D81E4A',
            marginTop: -30,
            border: '4px solid #fff',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 8h2.5l1.3-2h6.4l1.3 2H19a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z" />
            <circle cx="12" cy="13" r="3.2" />
          </svg>
        </span>
      </button>

      <TabButton label="Squad" color={color('squad')} onClick={() => onTab('squad')}>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <circle cx="17" cy="9" r="2.3" />
        <path d="M16 14.5a4.5 4.5 0 0 1 4.5 4.5" />
      </TabButton>

      <TabButton label="You" color={color('profile')} onClick={() => onTab('profile')}>
        <circle cx="12" cy="8" r="3.4" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </TabButton>
    </div>
  )
}

function TabButton({
  label,
  color,
  onClick,
  children,
}: {
  label: string
  color: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{ flex: 1, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
    >
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
      <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 10.5, color }}>{label}</span>
    </button>
  )
}
