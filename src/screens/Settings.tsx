import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { GOAL_OPTIONS } from '../data'
import { actions, useStore } from '../lib/store'
import type { Goal } from '../lib/types'

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { account, data } = useStore()
  const [name, setName] = useState(account?.name ?? '')
  const [calorieTarget, setCalorieTarget] = useState(String(data?.settings.calorieTarget ?? 1800))
  const [stepsTarget, setStepsTarget] = useState(String(data?.settings.stepsTarget ?? 8000))

  if (!account || !data) return null

  function saveProfile() {
    if (name.trim() && name.trim() !== account!.name) actions.updateProfile({ name: name.trim() })
  }
  function saveTargets() {
    actions.updateSettings({
      calorieTarget: Math.max(800, parseInt(calorieTarget) || 1800),
      stepsTarget: Math.max(1000, parseInt(stepsTarget) || 8000),
    })
  }

  return (
    <Sheet open={open} onClose={onClose} title="Settings">
      <div style={{ padding: '6px 18px 28px' }}>
        <Section title="Profile">
          <Row>
            <Label>Name</Label>
            <input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveProfile} style={input} />
          </Row>
          <Row>
            <Label>Email</Label>
            <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#9B91B8' }}>{account.email}</span>
          </Row>
        </Section>

        <Section title="Daily targets">
          <Row>
            <Label>Calorie goal</Label>
            <input type="number" inputMode="numeric" value={calorieTarget} onChange={(e) => setCalorieTarget(e.target.value)} onBlur={saveTargets} style={{ ...input, maxWidth: 110, textAlign: 'right' }} />
          </Row>
          <Row last>
            <Label>Steps goal</Label>
            <input type="number" inputMode="numeric" value={stepsTarget} onChange={(e) => setStepsTarget(e.target.value)} onBlur={saveTargets} style={{ ...input, maxWidth: 110, textAlign: 'right' }} />
          </Row>
        </Section>

        <Section title="Your goal">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOAL_OPTIONS.map((g) => {
              const sel = data.goal === (g.id as Goal)
              return (
                <button
                  key={g.id}
                  onClick={() => actions.updateGoal(g.id as Goal)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: sel ? g.tint : '#fff', border: `2px solid ${sel ? g.color : '#ECE6FA'}`, borderRadius: 14, padding: '9px 12px', cursor: 'pointer', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: '#241544' }}
                >
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: g.color }} /> {g.label}
                </button>
              )
            })}
          </div>
        </Section>

        <button
          onClick={() => { onClose(); actions.logOut() }}
          className="pressable"
          style={{ width: '100%', background: '#FFE7EC', color: '#FF4D6D', border: 'none', borderRadius: 16, padding: 15, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 8 }}
        >
          Log out
        </button>
      </div>
    </Sheet>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#9B91B8', textTransform: 'uppercase', letterSpacing: '.4px', padding: '0 4px 8px' }}>{title}</div>
      <div style={{ background: '#fff', borderRadius: 18, padding: '4px 14px', boxShadow: '0 5px 14px rgba(120,60,180,.05)' }}>{children}</div>
    </div>
  )
}
function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : '1px solid #F2ECFB' }}>{children}</div>
}
function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544', flex: 'none' }}>{children}</span>
}
const input: React.CSSProperties = { flex: 1, maxWidth: 200, background: '#F4EFFF', border: '2px solid #ECE6FA', borderRadius: 12, padding: '8px 12px', fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#241544', outline: 'none' }
