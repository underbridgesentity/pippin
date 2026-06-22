import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { estimateBurn, stepsToKm } from '../lib/gamification'
import { num } from '../lib/format'
import { actions } from '../lib/store'
import { T } from '../lib/theme'
import type { ActivityKind } from '../lib/types'

const KINDS: { id: ActivityKind; label: string; emoji: string; usesDistance: boolean }[] = [
  { id: 'walk', label: 'Walk', emoji: '🚶', usesDistance: true },
  { id: 'run', label: 'Run', emoji: '🏃', usesDistance: true },
  { id: 'ride', label: 'Ride', emoji: '🚴', usesDistance: true },
  { id: 'workout', label: 'Workout', emoji: '🏋️', usesDistance: false },
  { id: 'steps', label: 'Steps', emoji: '👟', usesDistance: false },
]

export function AddActivity({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [kind, setKind] = useState<ActivityKind>('run')
  const [minutes, setMinutes] = useState('30')
  const [km, setKm] = useState('5')
  const [steps, setSteps] = useState('5000')

  const def = KINDS.find((k) => k.id === kind)!
  const mins = Math.max(0, parseInt(minutes) || 0)
  const dist = parseFloat(km) || 0
  const stepCount = Math.max(0, parseInt(steps) || 0)

  const burnPreview =
    kind === 'steps'
      ? Math.round(stepCount * 0.04)
      : estimateBurn(kind, mins, def.usesDistance ? dist : 0)

  function log() {
    if (kind === 'steps') {
      if (stepCount <= 0) return
      actions.logActivity({ kind, label: `${num(stepCount)} steps`, minutes: 0, steps: stepCount })
    } else {
      if (mins <= 0 && dist <= 0) return
      const label = def.usesDistance && dist ? `a ${dist} km ${def.label.toLowerCase()}` : `a ${def.label.toLowerCase()}`
      actions.logActivity({ kind, label, minutes: mins, km: def.usesDistance ? dist || undefined : undefined })
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Log activity">
      <div style={{ padding: '6px 18px 24px' }}>
        {/* kind picker */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
          {KINDS.map((k) => (
            <button
              key={k.id}
              onClick={() => setKind(k.id)}
              style={{ flex: '1 0 28%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: kind === k.id ? T.glassHi : T.glass, border: `2px solid ${kind === k.id ? T.accent : T.line}`, borderRadius: 18, padding: '12px 6px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 24 }}>{k.emoji}</span>
              <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 13, color: kind === k.id ? T.accent : T.text }}>{k.label}</span>
            </button>
          ))}
        </div>

        {kind === 'steps' ? (
          <NumField label="Steps" value={steps} onChange={setSteps} suffix={`≈ ${stepsToKm(stepCount)} km`} />
        ) : (
          <>
            <NumField label="Minutes" value={minutes} onChange={setMinutes} />
            {def.usesDistance && <NumField label="Distance (km)" value={km} onChange={setKm} />}
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,184,107,0.12)', border: `1px solid ${T.line}`, borderRadius: 16, padding: '14px 16px', margin: '6px 0 18px' }}>
          <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim }}>Estimated burn</span>
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color: T.amber }}>{num(burnPreview)} kcal</span>
        </div>

        <button
          onClick={log}
          className="pressable"
          style={{ width: '100%', background: T.accent, color: T.ink, border: 'none', borderRadius: 18, padding: 16, fontFamily: T.display, fontWeight: 600, fontSize: 18, cursor: 'pointer', ['--press-y' as string]: '3px' }}
        >
          Log activity · +30 XP
        </button>
      </div>
    </Sheet>
  )
}

function NumField({ label, value, onChange, suffix }: { label: string; value: string; onChange: (v: string) => void; suffix?: string }) {
  return (
    <label style={{ display: 'block', marginBottom: 12 }}>
      <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.faint, textTransform: 'uppercase', letterSpacing: '.4px', paddingLeft: 4 }}>{label}</span>
      <div style={{ position: 'relative', marginTop: 6 }}>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', background: T.glass, border: `1px solid ${T.line}`, borderRadius: 16, padding: '14px 16px', fontFamily: T.display, fontWeight: 600, fontSize: 18, color: T.text, outline: 'none' }}
        />
        {suffix && <span style={{ position: 'absolute', right: 16, top: 16, fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim }}>{suffix}</span>}
      </div>
    </label>
  )
}
