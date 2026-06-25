import type { ReactNode } from 'react'
import { T } from '../lib/theme'

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
        background: 'rgba(20,15,8,0.4)',
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
          background: T.solid,
          borderRadius: '28px 28px 0 0',
          maxHeight,
          overflowY: 'auto',
          animation: 'pep-sheet .28s cubic-bezier(.2,.9,.3,1)',
          paddingBottom: 'env(safe-area-inset-bottom, 24px)',
          boxShadow: '0 -16px 40px rgba(48,38,22,0.16)',
          borderTop: `1px solid ${T.line}`,
        }}
      >
        <div style={{ position: 'sticky', top: 0, background: T.solid, zIndex: 2, padding: '12px 0 4px' }}>
          <div style={{ width: 40, height: 5, borderRadius: 5, background: T.line, margin: '0 auto' }} />
          {title && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px 8px' }}>
              <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22, color: T.text }}>{title}</span>
              <button
                onClick={onClose}
                aria-label="Close"
                style={{ width: 34, height: 34, borderRadius: '50%', background: T.glass, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.dim} strokeWidth="2.6" strokeLinecap="round">
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
