// Preview-and-confirm flow for sharing a meal as a story. The card is rendered
// on a canvas (see lib/storyCard) and the user chooses exactly what appears on
// it before saving or sharing, so nothing lands on a screenshot-able image
// without their sign-off.
import { useEffect, useRef, useState } from 'react'
import { renderMealStory } from '../lib/storyCard'
import { T } from '../lib/theme'
import type { MealEntry } from '../lib/types'

export function StoryComposer({ meal, name, onClose }: { meal: MealEntry | null; name: string; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showMacros, setShowMacros] = useState(true)
  const [showName, setShowName] = useState(true)
  const [rendering, setRendering] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!meal || !canvasRef.current) return
    let stale = false
    setRendering(true)
    renderMealStory(canvasRef.current, { meal, name, showMacros, showName })
      .catch(() => {})
      .finally(() => { if (!stale) setRendering(false) })
    return () => { stale = true }
  }, [meal, name, showMacros, showName])

  if (!meal) return null

  function toBlob(): Promise<Blob | null> {
    return new Promise((resolve) => canvasRef.current?.toBlob((b) => resolve(b), 'image/png') ?? resolve(null))
  }

  async function save() {
    const blob = await toBlob()
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pippin-story.png'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  async function share() {
    setBusy(true)
    try {
      const blob = await toBlob()
      if (!blob) return
      const file = new File([blob], 'pippin-story.png', { type: 'image/png' })
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
      if (nav.canShare && nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: 'My Pippin', text: 'Tracked on Pippin' })
      } else {
        await save() // desktop / unsupported: fall back to a download
      }
    } catch {
      /* user cancelled the share sheet */
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 97, background: 'rgba(20,15,8,0.62)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '54px 22px 26px', animation: 'pep-fade .2s ease' }}>
      <div style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={onClose} aria-label="Close" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: '#fff' }}>Share to story</span>
        <div style={{ width: 40 }} />
      </div>

      {/* preview */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' }}>
        <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}>
          <canvas ref={canvasRef} style={{ display: 'block', height: '52vh', width: 'auto', maxWidth: '100%' }} />
          {rendering && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(241,237,228,0.6)' }}><span style={{ width: 26, height: 26, borderRadius: '50%', border: `3px solid ${T.line}`, borderTopColor: T.accent, animation: 'pep-spin .8s linear infinite' }} /></div>}
        </div>
      </div>

      {/* toggles */}
      <div style={{ display: 'flex', gap: 8, margin: '14px 0 4px' }}>
        <Toggle on={showMacros} onClick={() => setShowMacros((v) => !v)} label="Macros" />
        <Toggle on={showName} onClick={() => setShowName((v) => !v)} label="My name" />
      </div>
      <div style={{ fontFamily: T.body, fontWeight: 600, fontSize: 12, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 14, maxWidth: 300 }}>
        Anyone who sees your story can screenshot it. Only what's shown here is included.
      </div>

      {/* actions */}
      <div style={{ width: '100%', display: 'flex', gap: 10 }}>
        <button onClick={save} className="pressable" style={{ flex: 1, background: 'rgba(255,255,255,0.14)', color: '#fff', border: 'none', borderRadius: T.r.pill, padding: 15, fontFamily: T.display, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>Save image</button>
        <button onClick={share} disabled={busy} className="pressable" style={{ flex: 1.4, background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: 15, fontFamily: T.display, fontWeight: 600, fontSize: 16, cursor: 'pointer', opacity: busy ? 0.6 : 1 }}>Share</button>
      </div>
    </div>
  )
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, background: on ? T.accent : 'rgba(255,255,255,0.14)', color: on ? T.ink : '#fff', border: 'none', borderRadius: T.r.pill, padding: '9px 16px', fontFamily: T.body, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
      <span style={{ width: 16, height: 16, borderRadius: '50%', background: on ? T.ink : 'rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {on && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12l5 5L20 6" /></svg>}
      </span>
      {label}
    </button>
  )
}
