import { useEffect, useRef, useState } from 'react'
import { Ring } from '../components/Ring'
import { ProgressBar } from '../components/ProgressBar'
import { Avatar } from '../components/Avatar'
import { Mascot } from '../components/Mascot'
import { useStore, actions } from '../lib/store'
import { useDerived, useFeed } from '../lib/hooks'
import { REACTION_BY_KIND } from '../lib/social'
import { coachAvailable, cachedPlan, fetchCoachPlan, type CoachCtx } from '../lib/coach'
import { firstName, greeting, longDate, num, relativeTime } from '../lib/format'
import type { DecoratedFeed } from '../lib/selectors'
import type { Goal, MealEntry, ReactionKind } from '../lib/types'

const GOAL_LABEL: Record<Goal, string> = {
  lose: 'Lose weight',
  strong: 'Build strength',
  eat: 'Eat better',
  move: 'Move more',
  feel: 'Feel good',
}

type Filter = 'all' | 'tip' | 'question' | 'win'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tip', label: '💡 Tips' },
  { id: 'question', label: '🙋 Questions' },
  { id: 'win', label: '🎉 Wins' },
]

export function Home({
  onOpenCapture,
  onAddActivity,
  onCompose,
  onOpenPost,
  onOpenMember,
  onOpenNotifications,
}: {
  onOpenCapture: () => void
  onAddActivity: () => void
  onCompose: () => void
  onOpenPost: (id: string) => void
  onOpenMember: (id: string) => void
  onOpenNotifications: () => void
}) {
  const { account, data } = useStore()
  const d = useDerived()
  const feed = useFeed()
  const [filter, setFilter] = useState<Filter>('all')
  const now = d?.now ?? Date.now()

  if (!account || !data || !d) return null

  const coachCtx: CoachCtx = {
    goal: GOAL_LABEL[data.goal],
    bodyLine: data.body
      ? `${data.body.heightCm} cm, ${data.body.weightKg} kg, ${data.body.age} yrs, ${data.body.sex}, ${data.body.activity}`
      : 'stats not provided',
    calorieTarget: d.caloriesTarget,
    consumed: d.caloriesConsumed,
    remaining: d.caloriesRemaining,
    protein: d.macros.protein,
    carbs: d.macros.carbs,
    fat: d.macros.fat,
    steps: d.steps,
    stepsTarget: d.stepsTarget,
    activeMinutes: d.activeMinutes,
  }

  const shown = feed
    .filter((p) => {
      if (filter === 'all') return true
      if (filter === 'win') return p.postType === 'win' || p.kind === 'badge' || p.kind === 'level'
      return p.postType === filter
    })
    .slice(0, 16)

  return (
    <div data-screen-label="Home" style={{ padding: '56px 18px 116px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#6E6596' }}>{longDate(now)}</div>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 26, lineHeight: 1.05, color: '#241544' }}>{greeting(now)}, {firstName(account.name)}!</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={onOpenNotifications} aria-label="Notifications" style={{ position: 'relative', width: 42, height: 42, borderRadius: 14, background: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(120,60,180,.08)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7C3AF6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" /></svg>
            {d.kudosReceived > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: '50%', background: '#FF4D6D', border: '2px solid #fff' }} />}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', borderRadius: 16, padding: '9px 13px', boxShadow: '0 4px 12px rgba(120,60,180,.08)' }}>
            <svg width="20" height="22" viewBox="0 0 24 24">
              <path d="M12 3c2.4 3.2 4.4 5 4.4 8.1a4.4 4.4 0 1 1-8.8 0c0-1.3.5-2.4 1.2-3.3.3 1.1 1 1.8 1.9 1.8 1 0 1.3-.9 1.3-2.4 0-1.7-.4-2.9-1.4-4.2Z" fill={d.streak > 0 ? '#FF8A1E' : '#D9CEF0'} />
              <path d="M12 9.6c1 1.4 1.9 2.3 1.9 3.7a1.9 1.9 0 1 1-3.8 0c0-.9.5-1.6 1.1-2.2.1.5.4.8.8.8.4 0 .6-.4.6-1 0-.5-.2-.8-.6-1.3Z" fill={d.streak > 0 ? '#FFC53D' : '#EBE3F8'} />
            </svg>
            <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: d.streak > 0 ? '#FF8A1E' : '#B6AEC9' }}>{d.streak}</span>
          </div>
        </div>
      </div>

      {/* level strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 20, padding: '12px 14px', marginBottom: 14, boxShadow: '0 6px 16px rgba(120,60,180,.07)' }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: 'linear-gradient(135deg,#9B5CFF,#7C3AF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 #5B22C9', flex: 'none' }}>
          <Mascot stage={d.stageName} size={30} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>Level {d.level} · {d.stageName}</span>
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#6E6596' }}>{d.xpInto} / {d.xpNeed} XP</span>
          </div>
          <ProgressBar pct={d.xpPct} fill="linear-gradient(90deg,#9B5CFF,#FF6CB6)" track="#EEE7FB" />
        </div>
      </div>

      {/* today hero */}
      <div style={{ background: '#fff', borderRadius: 26, padding: 18, marginBottom: 14, boxShadow: '0 8px 22px rgba(120,60,180,.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#241544' }}>Today</span>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: d.onTrack ? '#18C98A' : '#FF8A1E', background: d.onTrack ? '#E2F8EF' : '#FFF0DC', padding: '5px 11px', borderRadius: 20 }}>
            {d.caloriesConsumed === 0 ? 'Get started' : d.onTrack ? 'On track' : 'Over target'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <Ring size={120} pct={d.caloriesPct} color={d.onTrack ? '#18C98A' : '#FF8A1E'}>
            <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 24, color: '#241544', lineHeight: 1 }}>{num(d.caloriesConsumed)}</span>
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#6E6596' }}>of {num(d.caloriesTarget)} kcal</span>
          </Ring>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <Stat tint="#FFF0DC" stroke="#FF8A1E" value={num(d.caloriesBurned)} label="kcal burned" icon={<path d="M13 3 5 13h5l-1 8 8-11h-5l1-7Z" />} />
            <Stat tint="#E2F4FE" stroke="#2BB7F2" value={num(d.steps)} label="steps" icon={<path d="M9 5l3-2 3 2M7 21l2-7 3 1 1 6M16 21l-1-6 3-1" />} />
            <button onClick={onAddActivity} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F4EFFF', borderRadius: 12, padding: '7px 10px', border: 'none', cursor: 'pointer', width: '100%' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AF6" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#7C3AF6' }}>Log a walk, run or steps</span>
            </button>
          </div>
        </div>
      </div>

      {/* daily quest */}
      <div style={{ background: 'linear-gradient(135deg,#7C3AF6,#9B5CFF)', borderRadius: 24, padding: '16px 18px', marginBottom: 14, boxShadow: '0 8px 20px rgba(124,58,246,.3)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -18, top: -18, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFC53D"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#fff', letterSpacing: '.4px', textTransform: 'uppercase' }}>Daily Quest</span>
        </div>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#fff', marginBottom: 10 }}>Snap {d.quest.target} meals today <span style={{ opacity: 0.8 }}>· {d.quest.done}/{d.quest.target}</span></div>
        <ProgressBar pct={d.quest.pct} fill="linear-gradient(90deg,#FFC53D,#FF8A1E)" track="rgba(255,255,255,.25)" height={10} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#FFE6B8' }}>Reward: +50 XP &amp; a Streak Shield</span>
          {d.quest.claimable && (
            <button onClick={() => actions.claimQuest()} className="pressable" style={{ background: '#FFC53D', color: '#241544', border: 'none', borderRadius: 12, padding: '7px 14px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 0 #D9A21F', ['--press-shadow' as string]: '0 1px 0 #D9A21F' }}>Claim</button>
          )}
          {d.quest.claimed && <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#fff' }}>Claimed ✓</span>}
        </div>
      </div>

      {/* AI coach */}
      <CoachCard ctx={coachCtx} />

      {/* today's meals */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544' }}>Today's meals</span>
        <button onClick={onOpenCapture} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#7C3AF6' }}>+ Add</button>
      </div>
      {d.todayMeals.length === 0 ? (
        <button onClick={onOpenCapture} style={{ width: '100%', background: '#fff', border: '2px dashed #E0D6F4', borderRadius: 22, padding: '22px 16px', cursor: 'pointer', marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 30 }}>🍽️</span>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544' }}>No meals yet today</span>
          <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#6E6596' }}>Snap your first to start tracking</span>
        </button>
      ) : (
        <div style={{ background: '#fff', borderRadius: 22, padding: 6, marginBottom: 18, boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
          {d.todayMeals.map((m) => (
            <MealRow key={m.id} meal={m} now={now} onDelete={() => actions.deleteMeal(m.id)} />
          ))}
        </div>
      )}

      {/* community */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544' }}>Community</span>
        <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#18C98A', background: '#E2F8EF', padding: '4px 10px', borderRadius: 12 }}>{d.kudosGiven} cheers given</span>
      </div>

      {/* composer prompt */}
      <button onClick={onCompose} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: 'none', borderRadius: 20, padding: '13px 14px', marginBottom: 12, cursor: 'pointer', boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
        <Avatar initial={(account.name[0] || 'Y').toUpperCase()} gradient={account.avatar} size={40} radius={13} />
        <span style={{ flex: 1, textAlign: 'left', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#6E6596' }}>Share a win, a tip, or a question…</span>
        <span style={{ width: 36, height: 36, borderRadius: 12, background: 'linear-gradient(135deg,#FF6CB6,#FF4D6D)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
        </span>
      </button>

      {/* filters */}
      <div className="fettle-scroll" style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{ flex: 'none', background: filter === f.id ? '#7C3AF6' : '#fff', color: filter === f.id ? '#fff' : '#7A719B', border: filter === f.id ? 'none' : '2px solid #ECE6FA', borderRadius: 14, padding: '8px 14px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>{f.label}</button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 16px', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#6E6596' }}>Nothing here yet, be the first to share.</div>
      ) : (
        shown.map((p) => <FeedCard key={p.id} post={p} now={now} onOpenPost={onOpenPost} onOpenMember={onOpenMember} />)
      )}
    </div>
  )
}

function CoachCard({ ctx }: { ctx: CoachCtx }) {
  const ctxRef = useRef(ctx)
  ctxRef.current = ctx
  const [plan, setPlan] = useState(() => cachedPlan())
  const [loading, setLoading] = useState(false)
  const [tried, setTried] = useState(false)

  async function load(force?: boolean) {
    if (loading) return
    const cached = cachedPlan()
    if (!force && cached) { setPlan(cached); return }
    setLoading(true)
    const p = await fetchCoachPlan(ctxRef.current)
    setPlan(p ?? cached)
    setLoading(false)
    setTried(true)
  }
  useEffect(() => { if (!cachedPlan()) load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!coachAvailable()) return null
  if (!plan && tried) return null // generation failed (e.g. function not deployed) -> hide quietly

  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: 18, marginBottom: 14, boxShadow: '0 6px 16px rgba(120,60,180,.07)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: plan ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🧭</span>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#241544' }}>Your plan today</span>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 9, color: '#7C3AF6', background: '#EFE7FF', padding: '3px 7px', borderRadius: 8, letterSpacing: '.4px' }}>AI COACH</span>
        </div>
        {plan && (
          <button onClick={() => load(true)} aria-label="Refresh plan" disabled={loading} style={{ width: 32, height: 32, borderRadius: 10, background: '#F4EFFF', border: 'none', cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7C3AF6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ animation: loading ? 'pep-spin .8s linear infinite' : 'none' }}><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
          </button>
        )}
      </div>

      {!plan && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: '50%', border: '2.5px solid #ECE6FA', borderTopColor: '#7C3AF6', display: 'inline-block', animation: 'pep-spin .8s linear infinite', flex: 'none' }} />
          <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#6E6596' }}>Building your plan...</span>
        </div>
      )}

      {plan && (
        <>
          <CoachBlock label="EAT">
            {plan.eat.map((e, i) => (
              <div key={i} style={{ marginBottom: i < plan.eat.length - 1 ? 8 : 0 }}>
                <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14.5, color: '#241544' }}>{e.title}</div>
                <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12.5, color: '#6E6596', lineHeight: 1.35 }}>{e.detail}</div>
              </div>
            ))}
          </CoachBlock>
          <CoachBlock label="MOVE">
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14.5, color: '#241544' }}>{plan.move.title}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12.5, color: '#6E6596', lineHeight: 1.35 }}>{plan.move.detail}</div>
          </CoachBlock>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F4EFFF', borderRadius: 12, padding: '10px 12px', marginTop: 12 }}>
            <span style={{ fontSize: 15, flex: 'none' }}>🎯</span>
            <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13.5, color: '#5B22C9' }}>{plan.focus}</span>
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 10.5, color: '#B6AEC9', marginTop: 10, textAlign: 'center' }}>
            General wellness guidance, not medical advice.
          </div>
        </>
      )}
    </div>
  )
}

function CoachBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#6E6596', letterSpacing: '.5px', marginBottom: 6 }}>{label}</div>
      {children}
    </div>
  )
}

function Stat({ tint, stroke, value, label, icon }: { tint: string; stroke: string; value: string; label: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 11, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
      </div>
      <div>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, lineHeight: 1 }}>{value}</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, color: '#6E6596' }}>{label}</div>
      </div>
    </div>
  )
}

function MealRow({ meal, now, onDelete }: { meal: MealEntry; now: number; onDelete: () => void }) {
  const emoji = meal.items[0] ? meal.items[0].emoji : '🍽️'
  const title = meal.items.length === 1 ? meal.items[0].name : `${meal.items[0]?.name ?? 'Meal'} +${meal.items.length - 1}`
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 8px' }}>
      {meal.photo ? (
        <img src={meal.photo} alt="" style={{ width: 42, height: 42, borderRadius: 12, objectFit: 'cover', flex: 'none' }} />
      ) : (
        <div style={{ width: 42, height: 42, borderRadius: 12, background: '#F4EFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flex: 'none' }}>{emoji}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#6E6596', textTransform: 'capitalize' }}>{meal.type} · {relativeTime(meal.at, now)}</div>
      </div>
      <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544', flex: 'none' }}>{num(meal.kcal)}</span>
      <button onClick={onDelete} aria-label="Delete meal" style={{ width: 28, height: 28, borderRadius: 9, background: '#F7F2FE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C3BBD6" strokeWidth="2.4" strokeLinecap="round"><path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" /></svg>
      </button>
    </div>
  )
}

function FeedCard({ post, now, onOpenPost, onOpenMember }: { post: DecoratedFeed; now: number; onOpenPost: (id: string) => void; onOpenMember: (id: string) => void }) {
  const isMine = post.author === 'me'
  const presentReactions = (Object.keys(post.reactionCounts) as ReactionKind[]).filter((k) => (post.reactionCounts[k] ?? 0) > 0)
  const typeTag = post.postType ? { tip: '💡 Tip', question: '🙋 Question', win: '🎉 Win', update: '✨ Update' }[post.postType] : null

  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: 14, marginBottom: 12, boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
        <button onClick={() => !isMine && onOpenMember(post.author)} style={{ border: 'none', background: 'none', padding: 0, cursor: isMine ? 'default' : 'pointer', flex: 'none' }}>
          <Avatar initial={post.initial} gradient={post.avatar} size={44} radius={15} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>{post.name}{isMine ? ' (You)' : ''}</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#6E6596' }}>{post.action}</div>
        </div>
        {typeTag && <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#7A719B', background: '#F4EFFF', padding: '4px 9px', borderRadius: 10, flex: 'none' }}>{typeTag}</span>}
        <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#C3BBD6', flex: 'none' }}>{relativeTime(post.at, now)}</span>
      </div>

      <div onClick={() => onOpenPost(post.id)} style={{ cursor: 'pointer' }}>
        {post.text && <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14.5, color: '#3A2B5C', lineHeight: 1.45, marginBottom: 10 }}>{post.text}</div>}

        {post.photo && (
          post.photo.startsWith('data:') ? (
            <img src={post.photo} alt="" style={{ width: '100%', height: 148, objectFit: 'cover', borderRadius: 18, marginBottom: 10 }} />
          ) : (
            <div style={{ position: 'relative', height: 148, borderRadius: 18, background: post.photo, marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(36,21,68,.78)', backdropFilter: 'blur(6px)', padding: '6px 11px', borderRadius: 14 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFC53D"><path d="M12 2l2 5 5 .5-4 3.5 1 5-4-2.5L8 19l1-5-4-3.5 5-.5 2-5Z" /></svg>
                <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#fff' }}>Fettle counted it</span>
              </div>
            </div>
          )
        )}

        {post.badge && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F4EFFF', borderRadius: 16, padding: 12, marginBottom: 10 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#FFC53D,#FF8A1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 4px 10px rgba(255,138,30,.35)' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
            </div>
            <div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#6E6596', textTransform: 'uppercase', letterSpacing: '.4px' }}>New badge</div>
              <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544' }}>{post.badge}</div>
            </div>
          </div>
        )}

        {post.stat && !post.photo && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F4EFFF', borderRadius: 14, padding: '7px 12px', marginBottom: 10 }}>
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#5B22C9' }}>{post.stat}</span>
          </div>
        )}
      </div>

      {/* reaction summary */}
      {(post.totalReactions > 0 || post.commentCount > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 2px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {presentReactions.slice(0, 3).map((k) => (
              <span key={k} style={{ fontSize: 13 }}>{REACTION_BY_KIND[k].emoji}</span>
            ))}
            {post.totalReactions > 0 && <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#6E6596' }}>{post.totalReactions}</span>}
          </div>
          {post.commentCount > 0 && (
            <button onClick={() => onOpenPost(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#6E6596' }}>{post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}</button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #F2ECFB', paddingTop: 10 }}>
        <button onClick={() => actions.react(post.id, 'cheer')} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: post.myReaction ? '#FFF4E6' : 'none', border: 'none', borderRadius: 12, padding: '8px 6px', cursor: 'pointer' }}>
          {post.myReaction ? (
            <>
              <span style={{ fontSize: 17, animation: 'pep-cheer .35s ease' }}>{REACTION_BY_KIND[post.myReaction].emoji}</span>
              <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: REACTION_BY_KIND[post.myReaction].color }}>{REACTION_BY_KIND[post.myReaction].label}</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: 17, filter: 'grayscale(1)', opacity: 0.7 }}>👏</span>
              <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#B6AEC9' }}>Cheer</span>
            </>
          )}
        </button>
        <button onClick={() => onOpenPost(post.id)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 6px' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B6AEC9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-5.6A8.4 8.4 0 1 1 21 11.5Z" /></svg>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#B6AEC9' }}>{isMine ? 'Replies' : 'Encourage'}</span>
        </button>
      </div>
    </div>
  )
}
