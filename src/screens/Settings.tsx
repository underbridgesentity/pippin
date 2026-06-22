import { useState } from 'react'
import { Sheet } from '../components/Sheet'
import { GOAL_OPTIONS } from '../data'
import { actions, useStore } from '../lib/store'
import { ACTIVITY_OPTIONS, bodyComplete, recommendedCalories } from '../lib/nutrition'
import { num } from '../lib/format'
import { T, card, inset, eyebrow } from '../lib/theme'
import type { ActivityLevel, Body, Goal, Sex } from '../lib/types'

const SEX_OPTIONS: { id: Sex; label: string }[] = [
  { id: 'female', label: 'Female' },
  { id: 'male', label: 'Male' },
  { id: 'other', label: 'Other' },
]

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { account, data } = useStore()
  const [name, setName] = useState(account?.name ?? '')
  const [calorieTarget, setCalorieTarget] = useState(String(data?.settings.calorieTarget ?? 1800))
  const [stepsTarget, setStepsTarget] = useState(String(data?.settings.stepsTarget ?? 8000))
  const [heightCm, setHeightCm] = useState(data?.body?.heightCm ? String(data.body.heightCm) : '')
  const [weightKg, setWeightKg] = useState(data?.body?.weightKg ? String(data.body.weightKg) : '')
  const [age, setAge] = useState(data?.body?.age ? String(data.body.age) : '')
  const [sex, setSex] = useState<Sex | ''>(data?.body?.sex ?? '')
  const [activity, setActivity] = useState<ActivityLevel>(data?.body?.activity ?? 'moderate')

  if (!account || !data) return null

  const draftBody: Partial<Body> = { heightCm: parseFloat(heightCm), weightKg: parseFloat(weightKg), age: parseInt(age), sex: sex || undefined, activity }
  const recommended = bodyComplete(draftBody) ? recommendedCalories(draftBody, data.goal) : null

  function saveProfile() {
    if (name.trim() && name.trim() !== account!.name) actions.updateProfile({ name: name.trim() })
  }
  function saveTargets() {
    actions.updateSettings({
      calorieTarget: Math.max(800, parseInt(calorieTarget) || 1800),
      stepsTarget: Math.max(1000, parseInt(stepsTarget) || 8000),
    })
  }
  // Persist body stats once they are all filled in (recomputes the target).
  function saveBody(next?: { sex?: Sex; activity?: ActivityLevel }) {
    const b: Partial<Body> = { heightCm: parseFloat(heightCm), weightKg: parseFloat(weightKg), age: parseInt(age), sex: next?.sex ?? (sex || undefined), activity: next?.activity ?? activity }
    if (bodyComplete(b)) {
      actions.saveBody(b)
      setCalorieTarget(String(recommendedCalories(b, data!.goal)))
    }
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
            <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 15, color: T.dim }}>{account.email}</span>
          </Row>
        </Section>

        <Section title="Your stats">
          <Row>
            <Label>Height</Label>
            <UnitInput value={heightCm} onChange={setHeightCm} onBlur={() => saveBody()} unit="cm" />
          </Row>
          <Row>
            <Label>Weight</Label>
            <UnitInput value={weightKg} onChange={setWeightKg} onBlur={() => saveBody()} unit="kg" />
          </Row>
          <Row>
            <Label>Age</Label>
            <UnitInput value={age} onChange={setAge} onBlur={() => saveBody()} unit="yrs" />
          </Row>
          <Row>
            <Label>Sex</Label>
            <div style={{ display: 'flex', gap: 6 }}>
              {SEX_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => { setSex(o.id); saveBody({ sex: o.id }) }} style={pill(sex === o.id)}>{o.label}</button>
              ))}
            </div>
          </Row>
          <div style={{ padding: '12px 0 4px' }}>
            <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.dim, marginBottom: 8, paddingLeft: 2 }}>Activity level</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ACTIVITY_OPTIONS.map((o) => (
                <button key={o.id} onClick={() => { setActivity(o.id); saveBody({ activity: o.id }) }} style={pill(activity === o.id)}>{o.label}</button>
              ))}
            </div>
          </div>
        </Section>
        {recommended != null && (
          <div style={{ ...inset, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', marginTop: -8, marginBottom: 18 }}>
            <span style={{ fontSize: 18, flex: 'none' }}>🎯</span>
            <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.accent, lineHeight: 1.35 }}>
              Personalized target: <b>{num(recommended)} kcal/day</b>, from your stats and goal. Fine-tune it below if you like.
            </span>
          </div>
        )}

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
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: sel ? T.accentDim : T.glass, border: `2px solid ${sel ? g.color : T.line}`, borderRadius: 14, padding: '9px 12px', cursor: 'pointer', fontFamily: T.display, fontWeight: 600, fontSize: 13, color: T.text }}
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
          style={{ width: '100%', background: T.glass, color: T.rose, border: `1px solid ${T.line}`, borderRadius: 16, padding: 15, fontFamily: T.display, fontWeight: 600, fontSize: 16, cursor: 'pointer', marginTop: 8 }}
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
      <div style={{ ...eyebrow, letterSpacing: '.4px', padding: '0 4px 8px' }}>{title}</div>
      <div style={{ ...card, padding: '4px 14px' }}>{children}</div>
    </div>
  )
}
function Row({ children, last }: { children: React.ReactNode; last?: boolean }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 0', borderBottom: last ? 'none' : `1px solid ${T.lineSoft}` }}>{children}</div>
}
function Label({ children }: { children: React.ReactNode }) {
  return <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text, flex: 'none' }}>{children}</span>
}
const input: React.CSSProperties = { flex: 1, maxWidth: 200, background: T.glass, border: `1px solid ${T.line}`, borderRadius: 12, padding: '8px 12px', fontFamily: T.body, fontWeight: 700, fontSize: 15, color: T.text, outline: 'none' }

function UnitInput({ value, onChange, onBlur, unit }: { value: string; onChange: (v: string) => void; onBlur: () => void; unit: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <input type="number" inputMode="numeric" value={value} onChange={(e) => onChange(e.target.value)} onBlur={onBlur} style={{ ...input, maxWidth: 84, textAlign: 'right' }} />
      <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.dim, width: 26, flex: 'none' }}>{unit}</span>
    </div>
  )
}

function pill(active: boolean): React.CSSProperties {
  return { background: active ? T.accent : T.glass, color: active ? T.ink : T.dim, border: `1px solid ${active ? T.accent : T.line}`, borderRadius: 12, padding: '7px 12px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer' }
}
