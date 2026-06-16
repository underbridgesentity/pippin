import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { estimateBurn, stepsToKm } from '../lib/gamification'
import { num } from '../lib/format'
import { actions } from '../lib/store'
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
              style={{ flex: '1 0 28%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, background: kind === k.id ? '#EFE7FF' : '#fff', border: `2.5px solid ${kind === k.id ? '#7C3AF6' : '#ECE6FA'}`, borderRadius: 18, padding: '12px 6px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 24 }}>{k.emoji}</span>
              <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: kind === k.id ? '#7C3AF6' : '#241544' }}>{k.label}</span>
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFF0DC', borderRadius: 16, padding: '14px 16px', margin: '6px 0 18px' }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 14, color: '#C99A5B' }}>Estimated burn</span>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 22, color: '#FF8A1E' }}>{num(burnPreview)} kcal</span>
        </div>

        <button
          onClick={log}
          className="pressable"
          style={{ width: '100%', background: '#FF8A1E', color: '#fff', border: 'none', borderRadius: 18, padding: 16, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, boxShadow: '0 5px 0 #D9740F', cursor: 'pointer', ['--press-y' as string]: '3px', ['--press-shadow' as string]: '0 2px 0 #D9740F' }}
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
      <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#9B91B8', textTransform: 'uppercase', letterSpacing: '.4px', paddingLeft: 4 }}>{label}</span>
      <div style={{ position: 'relative', marginTop: 6 }}>
        <input
          type="number"
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: '100%', background: '#fff', border: '2.5px solid #ECE6FA', borderRadius: 16, padding: '14px 16px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#241544', outline: 'none' }}
        />
        {suffix && <span style={{ position: 'absolute', right: 16, top: 16, fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#9B91B8' }}>{suffix}</span>}
      </div>
    </label>
  )
}
