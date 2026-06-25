import { Mascot } from '../components/Mascot'
import { Confetti } from '../components/Confetti'
import { useStore, actions } from '../lib/store'
import { useDerived } from '../lib/hooks'
import { STAGES } from '../lib/gamification'
import { num } from '../lib/format'
import { T, card, inset, eyebrow, softTile } from '../lib/theme'
import type { WeightEntry } from '../lib/types'

export function Profile({ onOpenSettings, onShareWin, onSnap }: { onOpenSettings: () => void; onShareWin: () => void; onSnap: () => void }) {
  const { account, data } = useStore()
  const d = useDerived()
  if (!account || !d || !data) return null

  const stats = [
    { value: num(d.streak), label: 'Day streak', color: T.amber },
    { value: num(d.winsCount), label: 'Wins', color: T.green },
    { value: num(d.unlockedCount), label: 'Badges', color: T.rose },
    { value: num(d.mealCount), label: 'Meals', color: T.blue },
  ]

  const completed = d.joinedChallenges.find((j) => j.complete)
  const celebratory = !!completed || d.streak >= 3 || (d.caloriesConsumed > 0 && d.onTrack)
  const proud = completed
    ? { tag: 'You did it!', text: `Completed ${completed.challenge.name} 🎉` }
    : d.streak >= 3
      ? { tag: "You're on fire!", text: `${d.streak}-day streak and counting.` }
      : d.caloriesConsumed > 0 && d.onTrack
        ? { tag: 'Nice work', text: "You're on track today, keep it going." }
        : { tag: 'Your first win awaits', text: 'Snap a meal to start your streak.' }
  // The CTA matches the moment: share a real win, or snap a meal when there is none yet.
  const cta = celebratory
    ? { label: 'Share your win', action: onShareWin }
    : { label: 'Snap a meal', action: onSnap }

  const currentStageIdx = STAGES.findIndex((s) => s.name === d.stageName)

  return (
    <div data-screen-label="Profile" style={{ padding: '56px 18px 116px' }}>
      {/* character + identity */}
      <div style={{ ...card, borderRadius: 28, padding: '22px 18px 20px', marginBottom: 14, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: T.accentDim }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
          <button onClick={onOpenSettings} aria-label="Settings" style={{ width: 38, height: 38, borderRadius: 12, background: T.glassHi, border: `1px solid ${T.line}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={T.text} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -10 }}>
          <div style={{ position: 'relative', width: 128, height: 128, marginBottom: 10 }}>
            <svg width="128" height="128" viewBox="0 0 128 128" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(40,33,22,0.08)" strokeWidth="7" />
              <circle cx="64" cy="64" r="58" fill="none" stroke={T.accent} strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - d.xpPct)} transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset .5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mascot stage={d.stageName} size={92} float />
            </div>
            <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', background: T.accent, borderRadius: 13, padding: '3px 12px', fontFamily: T.display, fontWeight: 700, fontSize: 13, color: T.ink, border: `2px solid ${T.bg}` }}>LVL {d.level}</div>
          </div>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 23, color: T.text }}>{account.name}</div>
          <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim }}>
            {d.stageName}{d.nextStage ? ` · ${num(d.xpToNextStage)} XP to ${d.nextStage}` : ' · max stage'}
          </div>
        </div>
      </div>

      {/* stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ ...inset, ...softTile(s.color), flex: 1, borderRadius: 18, padding: '13px 6px', textAlign: 'center' }}>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.dim }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* weight progress */}
      <WeightCard weights={data.weights} onSetup={onOpenSettings} />

      {/* community impact, celebrating generosity, not just personal metrics */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ ...inset, ...softTile(T.amber), flex: 1, borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>👏</div>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color: T.amber }}>{num(d.kudosGiven)}</div>
          <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.dim }}>Cheers given</div>
        </div>
        <div style={{ ...inset, ...softTile(T.rose), flex: 1, borderRadius: 18, padding: '14px 16px' }}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>💛</div>
          <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color: T.rose }}>{num(d.kudosReceived)}</div>
          <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.dim }}>Cheers received</div>
        </div>
      </div>

      {/* proud moment */}
      <div style={{ ...card, position: 'relative', borderRadius: 24, padding: 18, marginBottom: 18, overflow: 'hidden' }}>
        <Confetti count={24} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', ...softTile(T.accent), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', border: `1px solid ${T.lineSoft}` }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill={T.accent}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...eyebrow, letterSpacing: '.5px' }}>{proud.tag}</div>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text, lineHeight: 1.15 }}>{proud.text}</div>
          </div>
        </div>
        <button onClick={cta.action} className="pressable" style={{ position: 'relative', marginTop: 14, width: '100%', background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: 12, fontFamily: T.display, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          {cta.label}
        </button>
      </div>

      {/* evolution */}
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text, marginBottom: 12, paddingLeft: 2 }}>Your character grows with you</div>
      <div style={{ ...card, borderRadius: 24, padding: 16, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {STAGES.map((s, i) => (
          <Stage key={s.key} name={s.name} state={i < currentStageIdx ? 'done' : i === currentStageIdx ? 'current' : 'locked'} isLast={i === STAGES.length - 1} />
        ))}
      </div>

      {/* badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text }}>Badge collection</span>
        <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.dim }}>{d.unlockedCount} of {d.badgeTotal}</span>
      </div>
      <div style={{ ...card, borderRadius: 24, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px 6px' }}>
        {d.badges.map((b) => (
          <button key={b.id} onClick={() => actions.toast(b.unlocked ? `${b.name} unlocked ✓` : `${b.name}: ${b.hint}`)} style={{ textAlign: 'center', opacity: b.unlocked ? 1 : 0.6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: b.unlocked ? b.color : T.glass, border: b.unlocked ? 'none' : `1px solid ${T.lineSoft}`, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {b.unlocked ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill={T.ink}><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              )}
            </div>
            <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 10, color: T.dim, lineHeight: 1.2 }}>{b.name}</div>
          </button>
        ))}
      </div>

      {/* circle rewards */}
      {d.circleBadges.some((b) => b.inCircle || b.unlocked) && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '18px 2px 12px' }}>
            <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text }}>Circle rewards</span>
            <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 13, color: T.dim }}>{d.circleBadges.filter((b) => b.unlocked).length} earned</span>
          </div>
          <div style={{ ...card, borderRadius: 24, padding: 18, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px 6px' }}>
            {d.circleBadges.filter((b) => b.inCircle || b.unlocked).map((b) => (
              <button key={b.id} onClick={() => actions.toast(b.unlocked ? `${b.name} unlocked ✓` : `${b.name}: contribute to your circle to earn it`)} style={{ textAlign: 'center', opacity: b.unlocked ? 1 : 0.5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: b.unlocked ? b.color : T.glass, border: b.unlocked ? 'none' : `1px solid ${T.lineSoft}`, margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>
                  {b.unlocked ? b.emoji : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>}
                </div>
                <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 10, color: T.dim, lineHeight: 1.2 }}>{b.name}</div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function Stage({ name, state, isLast }: { name: string; state: 'done' | 'current' | 'locked'; isLast: boolean }) {
  return (
    <>
      <div style={{ textAlign: 'center', opacity: state === 'locked' ? 0.4 : state === 'done' ? 0.55 : 1 }}>
        {state === 'current' ? (
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: T.accent, margin: '0 auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `3px solid ${T.accent}` }}>
            <Mascot stage={name} size={34} />
          </div>
        ) : state === 'done' ? (
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.green, margin: '0 auto 5px' }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.glass, border: `1px solid ${T.lineSoft}`, margin: '0 auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.faint} strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </div>
        )}
        <div style={{ fontFamily: state === 'current' ? T.display : T.body, fontWeight: state === 'current' ? 600 : 800, fontSize: state === 'current' ? 11 : 10, color: state === 'current' ? T.accent : T.dim }}>{name}</div>
      </div>
      {!isLast && <div style={{ width: 18, height: 2, background: T.line, flex: 'none', marginBottom: 18 }} />}
    </>
  )
}

function WeightCard({ weights, onSetup }: { weights: WeightEntry[]; onSetup: () => void }) {
  if (weights.length === 0) {
    return (
      <button onClick={onSetup} className="pressable" style={{ ...card, width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, borderRadius: 20, padding: 16, marginBottom: 16, cursor: 'pointer' }}>
        <div style={{ ...inset, width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>⚖️</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text }}>Track your weight</div>
          <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12.5, color: T.dim, lineHeight: 1.3 }}>Add your height & weight for a personalized calorie target and a progress trend.</div>
        </div>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><path d="M9 6l6 6-6 6" /></svg>
      </button>
    )
  }

  const current = weights[weights.length - 1].kg
  const change = Math.round((current - weights[0].kg) * 10) / 10
  const kgs = weights.map((w) => w.kg)
  const min = Math.min(...kgs)
  const range = Math.max(...kgs) - min || 1
  const W = 300
  const H = 44
  const pts = weights.map((w, i) => {
    const x = weights.length === 1 ? W / 2 : (i / (weights.length - 1)) * W
    const y = H - ((w.kg - min) / range) * (H - 6) - 3
    return { x, y }
  })
  const path = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const dropped = change < 0
  const trendColor = dropped ? T.green : change > 0 ? T.amber : T.dim

  return (
    <button onClick={onSetup} className="pressable" style={{ ...card, width: '100%', textAlign: 'left', display: 'block', borderRadius: 20, padding: 16, marginBottom: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text }}>Weight </span>
          <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color: T.text }}>{current}</span>
          <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.dim }}> kg</span>
        </div>
        {weights.length > 1 && (
          <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: trendColor, background: T.glass, border: `1px solid ${T.lineSoft}`, padding: '4px 10px', borderRadius: 12 }}>
            {change > 0 ? '+' : ''}{change} kg
          </span>
        )}
      </div>
      {weights.length > 1 ? (
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
          <polyline points={path} fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3.5" fill={trendColor} />
        </svg>
      ) : (
        <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12.5, color: T.dim }}>Update your weight in Settings to see your progress trend.</div>
      )}
    </button>
  )
}
