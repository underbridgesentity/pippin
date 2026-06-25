import { useState } from 'react'
import { ProgressBar } from '../components/ProgressBar'
import { useDerived } from '../lib/hooks'
import { actions } from '../lib/store'
import { CHALLENGES, TEAM_CHALLENGE } from '../lib/seed'
import { num } from '../lib/format'
import { T, card, softTile } from '../lib/theme'

const CHALLENGE_CATS = ['All', ...Array.from(new Set(CHALLENGES.map((c) => c.cat)))]

export function Quests() {
  const d = useDerived()
  const [cat, setCat] = useState('All')
  if (!d) return null

  const shownChallenges = cat === 'All' ? CHALLENGES : CHALLENGES.filter((c) => c.cat === cat)

  const dailyGoals = [
    { label: `Eat ${num(d.caloriesTarget)} kcal`, sub: `${num(d.caloriesConsumed)} logged today`, color: T.green, pct: d.caloriesPct },
    { label: `Move ${d.settings.moveTargetMin} min`, sub: `${d.activeMinutes} of ${d.settings.moveTargetMin} min`, color: T.amber, pct: d.activeMinutes / d.settings.moveTargetMin },
    { label: `Walk ${num(d.stepsTarget)} steps`, sub: `${num(d.steps)} of ${num(d.stepsTarget)}`, color: T.accent, pct: d.steps / d.stepsTarget },
  ]

  const teamPct = TEAM_CHALLENGE.current / TEAM_CHALLENGE.goalSteps

  return (
    <div data-screen-label="Quests" style={{ padding: '56px 18px 116px' }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 30, color: T.text, marginBottom: 4 }}>Challenges</div>
      <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim, marginBottom: 18 }}>Win them together. Brag about it forever.</div>

      {/* team challenge */}
      <div style={{ ...card, position: 'relative', padding: 18, marginBottom: 18, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: T.accentDim }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.ink, background: T.accent, padding: '5px 11px', borderRadius: 20, letterSpacing: '.4px', textTransform: 'uppercase' }}>Active · Team</span>
          <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.dim }}>{TEAM_CHALLENGE.daysLeft} days left</span>
        </div>
        <div style={{ position: 'relative', fontFamily: T.display, fontWeight: 600, fontSize: 23, color: T.text, lineHeight: 1.1, marginBottom: 3 }}>{TEAM_CHALLENGE.name}</div>
        <div style={{ position: 'relative', fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim, marginBottom: 14 }}>with {TEAM_CHALLENGE.squad} · {num(TEAM_CHALLENGE.goalSteps)} steps</div>
        <div style={{ position: 'relative' }}>
          <ProgressBar pct={teamPct} fill={T.accent} track={T.glass} height={14} />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 14, color: T.text }}>{num(TEAM_CHALLENGE.current)} steps · {Math.round(teamPct * 100)}%</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {TEAM_CHALLENGE.members.map((m, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: m.bg, border: `2px solid ${T.solid}`, marginLeft: i ? -9 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display, fontWeight: 600, fontSize: 12, color: '#fff' }}>{m.label}</div>
            ))}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: T.glassHi, border: `2px solid ${T.solid}`, marginLeft: -9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.text }}>+5</div>
          </div>
        </div>
      </div>

      {/* your daily goals */}
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text, marginBottom: 12, paddingLeft: 2 }}>Your daily goals</div>
      <div style={{ ...card, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 15 }}>
        {dailyGoals.map((g) => (
          <div key={g.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text }}>{g.label}</span>
              <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.dim }}>{g.sub}</span>
            </div>
            <ProgressBar pct={g.pct} fill={g.color} track={T.glass} />
          </div>
        ))}
      </div>

      {/* your challenges */}
      {d.joinedChallenges.length > 0 && (
        <>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text, marginBottom: 12, paddingLeft: 2 }}>Your challenges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {d.joinedChallenges.map((jc) => (
              <div key={jc.challenge.id} style={{ ...card, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16, color: T.text }}>{jc.challenge.name}</span>
                  {jc.complete ? (
                    <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.green, background: T.glass, padding: '4px 10px', borderRadius: 12 }}>Complete 🎉</span>
                  ) : (
                    <button onClick={() => actions.leaveChallenge(jc.challenge.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.faint }}>Leave</button>
                  )}
                </div>
                <ProgressBar pct={jc.pct} fill={jc.challenge.color} track={T.glass} />
                <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim, marginTop: 6 }}>{jc.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* browse */}
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text, marginBottom: 12, paddingLeft: 2 }}>Browse challenges</div>
      <div className="fettle-scroll" style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {CHALLENGE_CATS.map((cc) => (
          <button key={cc} onClick={() => setCat(cc)} style={{ flex: 'none', background: cat === cc ? T.accent : T.glass, color: cat === cc ? T.ink : T.dim, border: cat === cc ? 'none' : `1px solid ${T.line}`, borderRadius: 14, padding: '8px 14px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>{cc}</button>
        ))}
      </div>
      {shownChallenges.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px 16px', fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim }}>No challenges in this category yet.</div>
      )}
      {shownChallenges.map((c) => {
        const joined = d.joinedChallenges.some((jc) => jc.challenge.id === c.id)
        return (
          <div key={c.id} style={{ ...card, padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
              <div style={{ ...softTile(c.color), width: 50, height: 50, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.text }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.ink, background: c.color, padding: '3px 9px', borderRadius: 12 }}>{c.cat}</span>
                  <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim }}>{c.people} joined</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${T.lineSoft}`, paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 14, color: T.text }}>{c.days} days</span>
                  <span style={{ fontFamily: T.body, fontWeight: 700, fontSize: 11, color: T.dim }}>{c.diff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={c.color}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
                  <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.dim }}>{c.reward}</span>
                </div>
              </div>
              <button
                onClick={() => !joined && actions.joinChallenge(c.id)}
                className="pressable"
                style={{ background: joined ? T.glass : c.color, color: joined ? T.green : T.ink, border: joined ? `1px solid ${T.line}` : 'none', borderRadius: T.r.pill, padding: '9px 18px', fontFamily: T.display, fontWeight: 600, fontSize: 14, cursor: joined ? 'default' : 'pointer', boxShadow: 'none' }}
              >
                {joined ? 'Joined ✓' : 'Join'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
