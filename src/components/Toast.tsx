import { T } from '../lib/theme'

export function Toast({ message }: { message: string }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: 108,
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: T.text,
        padding: '13px 18px',
        borderRadius: 18,
        boxShadow: '0 12px 30px rgba(48,38,22,0.22)',
        animation: 'pep-toast 2.6s ease forwards',
        whiteSpace: 'nowrap',
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#FFC53D,#FF8A1E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24">
          <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 15, color: '#fff' }}>{message}</span>
    </div>
  )
}
