import { ProgressBar } from '../components/ProgressBar'
import { useDerived } from '../lib/hooks'
import { actions } from '../lib/store'
import { CHALLENGES, TEAM_CHALLENGE } from '../lib/seed'
import { num } from '../lib/format'

export function Quests() {
  const d = useDerived()
  if (!d) return null

  const dailyGoals = [
    { label: `Eat ${num(d.caloriesTarget)} kcal`, sub: `${num(d.caloriesConsumed)} logged today`, color: '#18C98A', pct: d.caloriesPct },
    { label: `Move ${d.settings.moveTargetMin} min`, sub: `${d.activeMinutes} of ${d.settings.moveTargetMin} min`, color: '#FF8A1E', pct: d.activeMinutes / d.settings.moveTargetMin },
    { label: `Walk ${num(d.stepsTarget)} steps`, sub: `${num(d.steps)} of ${num(d.stepsTarget)}`, color: '#7C3AF6', pct: d.steps / d.stepsTarget },
  ]

  const teamPct = TEAM_CHALLENGE.current / TEAM_CHALLENGE.goalSteps

  return (
    <div data-screen-label="Quests" style={{ padding: '56px 18px 116px' }}>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 30, color: '#241544', marginBottom: 4 }}>Quests</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#9B91B8', marginBottom: 18 }}>Win them together. Brag about it forever.</div>

      {/* team challenge */}
      <div style={{ position: 'relative', background: 'linear-gradient(140deg,#18C98A,#12B47B)', borderRadius: 26, padding: 18, marginBottom: 18, overflow: 'hidden', boxShadow: '0 10px 26px rgba(24,201,138,.32)' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#fff', background: 'rgba(255,255,255,.22)', padding: '5px 11px', borderRadius: 20, letterSpacing: '.4px', textTransform: 'uppercase' }}>Active · Team</span>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#fff' }}>{TEAM_CHALLENGE.daysLeft} days left</span>
        </div>
        <div style={{ position: 'relative', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 23, color: '#fff', lineHeight: 1.1, marginBottom: 3 }}>{TEAM_CHALLENGE.name}</div>
        <div style={{ position: 'relative', fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,.85)', marginBottom: 14 }}>with {TEAM_CHALLENGE.squad} · {num(TEAM_CHALLENGE.goalSteps)} steps</div>
        <div style={{ position: 'relative' }}>
          <ProgressBar pct={teamPct} fill="linear-gradient(90deg,#FFC53D,#FF8A1E)" track="rgba(255,255,255,.25)" height={14} />
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14, color: '#fff' }}>{num(TEAM_CHALLENGE.current)} steps · {Math.round(teamPct * 100)}%</span>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {TEAM_CHALLENGE.members.map((m, i) => (
              <div key={i} style={{ width: 28, height: 28, borderRadius: '50%', background: m.bg, border: '2px solid #15B47B', marginLeft: i ? -9 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 12, color: '#fff' }}>{m.label}</div>
            ))}
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.3)', border: '2px solid #15B47B', marginLeft: -9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#fff' }}>+5</div>
          </div>
        </div>
      </div>

      {/* your daily goals */}
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544', marginBottom: 12, paddingLeft: 2 }}>Your daily goals</div>
      <div style={{ background: '#fff', borderRadius: 24, padding: 16, marginBottom: 20, boxShadow: '0 6px 16px rgba(120,60,180,.06)', display: 'flex', flexDirection: 'column', gap: 15 }}>
        {dailyGoals.map((g) => (
          <div key={g.label}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>{g.label}</span>
              <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#9B91B8' }}>{g.sub}</span>
            </div>
            <ProgressBar pct={g.pct} fill={g.color} track="#F1ECFA" />
          </div>
        ))}
      </div>

      {/* your challenges */}
      {d.joinedChallenges.length > 0 && (
        <>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544', marginBottom: 12, paddingLeft: 2 }}>Your challenges</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
            {d.joinedChallenges.map((jc) => (
              <div key={jc.challenge.id} style={{ background: '#fff', borderRadius: 24, padding: 16, boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544' }}>{jc.challenge.name}</span>
                  {jc.complete ? (
                    <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#18C98A', background: '#E2F8EF', padding: '4px 10px', borderRadius: 12 }}>Complete 🎉</span>
                  ) : (
                    <button onClick={() => actions.leaveChallenge(jc.challenge.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#C3BBD6' }}>Leave</button>
                  )}
                </div>
                <ProgressBar pct={jc.pct} fill={jc.challenge.color} track="#F1ECFA" />
                <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8', marginTop: 6 }}>{jc.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* browse */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544' }}>Browse challenges</span>
        <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#7C3AF6' }}>Filters</span>
      </div>
      {CHALLENGES.map((c) => {
        const joined = d.joinedChallenges.some((jc) => jc.challenge.id === c.id)
        return (
          <div key={c.id} style={{ background: '#fff', borderRadius: 24, padding: 16, marginBottom: 12, boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginBottom: 13 }}>
              <div style={{ width: 50, height: 50, borderRadius: 16, background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3M9 20h6M12 13v4" /></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 17, color: '#241544' }}>{c.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#fff', background: c.color, padding: '3px 9px', borderRadius: 12 }}>{c.cat}</span>
                  <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8' }}>{c.people} joined</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F2ECFB', paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14, color: '#241544' }}>{c.days} days</span>
                  <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, color: '#9B91B8' }}>{c.diff}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill={c.color}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
                  <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#9B91B8' }}>{c.reward}</span>
                </div>
              </div>
              <button
                onClick={() => !joined && actions.joinChallenge(c.id)}
                className="pressable"
                style={{ background: joined ? '#E2F8EF' : c.color, color: joined ? '#18C98A' : '#fff', border: 'none', borderRadius: 14, padding: '9px 18px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14, cursor: joined ? 'default' : 'pointer', boxShadow: joined ? 'none' : '0 3px 0 rgba(0,0,0,.12)', ['--press-shadow' as string]: '0 1px 0 rgba(0,0,0,.12)' }}
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
