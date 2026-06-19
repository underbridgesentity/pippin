import type { ReactNode } from 'react'

/** Bottom-sheet modal scoped to the device frame. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '90%',
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxHeight?: string
}) {
  if (!open) return null
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 85,
        background: 'rgba(36,21,68,.45)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        animation: 'pep-fade .2s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="fettle-scroll"
        style={{
          background: '#F4EFFF',
          borderRadius: '28px 28px 0 0',
          maxHeight,
          overflowY: 'auto',
          animation: 'pep-sheet .28s cubic-bezier(.2,.9,.3,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          boxShadow: '0 -12px 40px rgba(36,21,68,.25)',
        }}
      >
        <div style={{ position: 'sticky', top: 0, background: 'rgba(244,239,255,0.82)', backdropFilter: 'blur(18px) saturate(160%)', WebkitBackdropFilter: 'blur(18px) saturate(160%)', zIndex: 2, padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 5, borderRadius: 5, background: '#D9CEF0', margin: '0 auto' }} />
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 8px' }}>
              <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 22, color: '#241544' }}>{title}</span>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ width: 34, height: 34, borderRadius: '50%', background: '#EAE2F8', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A719B" strokeWidth="2.6" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}
