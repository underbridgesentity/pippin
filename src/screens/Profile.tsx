import { Mascot } from '../components/Mascot'
import { Confetti } from '../components/Confetti'
import { useStore } from '../lib/store'
import { useDerived } from '../lib/hooks'
import { STAGES } from '../lib/gamification'
import { num } from '../lib/format'

export function Profile({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { account } = useStore()
  const d = useDerived()
  if (!account || !d) return null

  const stats = [
    { value: num(d.streak), label: 'Day streak', color: '#FF8A1E' },
    { value: num(d.winsCount), label: 'Wins', color: '#18C98A' },
    { value: num(d.unlockedCount), label: 'Badges', color: '#FF4D6D' },
    { value: num(d.mealCount), label: 'Meals', color: '#2BB7F2' },
  ]

  const completed = d.joinedChallenges.find((j) => j.complete)
  const proud = completed
    ? { tag: 'You did it!', text: `Completed ${completed.challenge.name} 🎉` }
    : d.streak >= 3
      ? { tag: "You're on fire!", text: `${d.streak}-day streak and counting.` }
      : d.caloriesConsumed > 0 && d.onTrack
        ? { tag: 'Nice work', text: "You're on track today — keep it going." }
        : { tag: 'Your first win awaits', text: 'Snap a meal to start your streak.' }

  const currentStageIdx = STAGES.findIndex((s) => s.name === d.stageName)

  return (
    <div data-screen-label="Profile" style={{ padding: '56px 18px 116px' }}>
      {/* character + identity */}
      <div style={{ background: 'linear-gradient(160deg,#7C3AF6,#9B5CFF)', borderRadius: 28, padding: '22px 18px 20px', marginBottom: 14, boxShadow: '0 10px 26px rgba(124,58,246,.28)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.1)' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', position: 'relative' }}>
          <button onClick={onOpenSettings} aria-label="Settings" style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,.18)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 13a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.7-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.4 1Z" /></svg>
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -10 }}>
          <div style={{ position: 'relative', width: 128, height: 128, marginBottom: 10 }}>
            <svg width="128" height="128" viewBox="0 0 128 128" style={{ position: 'absolute', inset: 0 }}>
              <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="7" />
              <circle cx="64" cy="64" r="58" fill="none" stroke="#FFC53D" strokeWidth="7" strokeLinecap="round" strokeDasharray={2 * Math.PI * 58} strokeDashoffset={2 * Math.PI * 58 * (1 - d.xpPct)} transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset .5s ease' }} />
            </svg>
            <div style={{ position: 'absolute', inset: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mascot stage={d.stageName} size={92} float />
            </div>
            <div style={{ position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)', background: '#FFC53D', borderRadius: 13, padding: '3px 12px', fontFamily: 'Fredoka', fontWeight: 700, fontSize: 13, color: '#241544', boxShadow: '0 4px 10px rgba(255,138,30,.4)', border: '2px solid #fff' }}>LVL {d.level}</div>
          </div>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 23, color: '#fff' }}>{account.name}</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,.8)' }}>
            {d.stageName}{d.nextStage ? ` · ${num(d.xpToNextStage)} XP to ${d.nextStage}` : ' · max stage'}
          </div>
        </div>
      </div>

      {/* stats row */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        {stats.map((s) => (
          <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 18, padding: '13px 6px', textAlign: 'center', boxShadow: '0 5px 14px rgba(120,60,180,.06)' }}>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#9B91B8' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* proud moment */}
      <div style={{ position: 'relative', background: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)', borderRadius: 24, padding: 18, marginBottom: 18, overflow: 'hidden', boxShadow: '0 10px 24px rgba(255,77,109,.28)' }}>
        <Confetti count={24} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', border: '2.5px solid rgba(255,255,255,.5)' }}>
            <svg width="34" height="34" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', letterSpacing: '.5px' }}>{proud.tag}</div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#fff', lineHeight: 1.15 }}>{proud.text}</div>
          </div>
        </div>
        <button className="pressable" style={{ position: 'relative', marginTop: 14, width: '100%', background: '#fff', color: '#FF4D6D', border: 'none', borderRadius: 15, padding: 12, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,.1)', ['--press-shadow' as string]: '0 2px 0 rgba(0,0,0,.1)' }}>
          Share your win
        </button>
      </div>

      {/* evolution */}
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544', marginBottom: 12, paddingLeft: 2 }}>Your character grows with you</div>
      <div style={{ background: '#fff', borderRadius: 24, padding: 16, marginBottom: 18, boxShadow: '0 6px 16px rgba(120,60,180,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {STAGES.map((s, i) => (
          <Stage key={s.key} name={s.name} state={i < currentStageIdx ? 'done' : i === currentStageIdx ? 'current' : 'locked'} isLast={i === STAGES.length - 1} />
        ))}
      </div>

      {/* badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544' }}>Badge collection</span>
        <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#9B91B8' }}>{d.unlockedCount} of {d.badgeTotal}</span>
      </div>
      <div style={{ background: '#fff', borderRadius: 24, padding: 18, boxShadow: '0 6px 16px rgba(120,60,180,.06)', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px 6px' }}>
        {d.badges.map((b) => (
          <div key={b.id} style={{ textAlign: 'center', opacity: b.unlocked ? 1 : 0.6 }} title={b.hint}>
            <div style={{ width: 54, height: 54, borderRadius: '50%', background: b.unlocked ? b.color : '#ECE6FA', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(120,60,180,.12)' }}>
              {b.unlocked ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9BFE0" strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
              )}
            </div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 10, color: '#7A719B', lineHeight: 1.2 }}>{b.name}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Stage({ name, state, isLast }: { name: string; state: 'done' | 'current' | 'locked'; isLast: boolean }) {
  return (
    <>
      <div style={{ textAlign: 'center', opacity: state === 'locked' ? 0.4 : state === 'done' ? 0.55 : 1 }}>
        {state === 'current' ? (
          <div style={{ width: 58, height: 58, borderRadius: '50%', background: 'linear-gradient(135deg,#9B5CFF,#7C3AF6)', margin: '0 auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #FFC53D' }}>
            <Mascot stage={name} size={34} />
          </div>
        ) : state === 'done' ? (
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#18C98A', margin: '0 auto 5px' }} />
        ) : (
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#E3DAF5', margin: '0 auto 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B91B8" strokeWidth="2.4"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
          </div>
        )}
        <div style={{ fontFamily: state === 'current' ? 'Fredoka' : 'Nunito', fontWeight: state === 'current' ? 600 : 800, fontSize: state === 'current' ? 11 : 10, color: state === 'current' ? '#7C3AF6' : '#9B91B8' }}>{name}</div>
      </div>
      {!isLast && <div style={{ width: 18, height: 2, background: '#E3DAF5', flex: 'none', marginBottom: 18 }} />}
    </>
  )
}
