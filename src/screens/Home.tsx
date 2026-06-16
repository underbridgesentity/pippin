import { useMemo } from 'react'
import { Ring } from '../components/Ring'
import { ProgressBar } from '../components/ProgressBar'
import { Avatar } from '../components/Avatar'
import { Mascot } from '../components/Mascot'
import { useStore, actions } from '../lib/store'
import { useDerived } from '../lib/hooks'
import { communityFeed } from '../lib/seed'
import { firstName, greeting, longDate, num, relativeTime } from '../lib/format'
import type { FeedEntry, MealEntry } from '../lib/types'

export function Home({ onOpenCapture, onAddActivity }: { onOpenCapture: () => void; onAddActivity: () => void }) {
  const { account, data } = useStore()
  const d = useDerived()
  const now = d?.now ?? Date.now()

  const feed = useMemo<(FeedEntry & { cheered: boolean; cheerCount: number })[]>(() => {
    if (!data) return []
    const mine = data.feed
    const merged = [...mine, ...communityFeed(now)].sort((a, b) => b.at - a.at).slice(0, 14)
    return merged.map((f) => ({ ...f, cheered: !!data.cheers[f.id], cheerCount: f.baseCheers + (data.cheers[f.id] ? 1 : 0) }))
  }, [data, now])

  if (!account || !data || !d) return null

  return (
    <div data-screen-label="Home" style={{ padding: '56px 18px 116px' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#9B91B8' }}>{longDate(now)}</div>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 26, lineHeight: 1.05, color: '#241544' }}>
            {greeting(now)}, {firstName(account.name)}!
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', borderRadius: 16, padding: '8px 13px', boxShadow: '0 4px 12px rgba(120,60,180,.08)' }}>
          <svg width="20" height="22" viewBox="0 0 24 24">
            <path d="M12 3c2.4 3.2 4.4 5 4.4 8.1a4.4 4.4 0 1 1-8.8 0c0-1.3.5-2.4 1.2-3.3.3 1.1 1 1.8 1.9 1.8 1 0 1.3-.9 1.3-2.4 0-1.7-.4-2.9-1.4-4.2Z" fill={d.streak > 0 ? '#FF8A1E' : '#D9CEF0'} />
            <path d="M12 9.6c1 1.4 1.9 2.3 1.9 3.7a1.9 1.9 0 1 1-3.8 0c0-.9.5-1.6 1.1-2.2.1.5.4.8.8.8.4 0 .6-.4.6-1 0-.5-.2-.8-.6-1.3Z" fill={d.streak > 0 ? '#FFC53D' : '#EBE3F8'} />
          </svg>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: d.streak > 0 ? '#FF8A1E' : '#B6AEC9' }}>{d.streak}</span>
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
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#9B91B8' }}>{d.xpInto} / {d.xpNeed} XP</span>
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
            <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#9B91B8' }}>of {num(d.caloriesTarget)} kcal</span>
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
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#fff', marginBottom: 10 }}>
          Snap {d.quest.target} meals today <span style={{ opacity: 0.8 }}>· {d.quest.done}/{d.quest.target}</span>
        </div>
        <ProgressBar pct={d.quest.pct} fill="linear-gradient(90deg,#FFC53D,#FF8A1E)" track="rgba(255,255,255,.25)" height={10} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#FFE6B8' }}>Reward: +50 XP &amp; a Streak Shield</span>
          {d.quest.claimable && (
            <button onClick={() => actions.claimQuest()} className="pressable" style={{ background: '#FFC53D', color: '#241544', border: 'none', borderRadius: 12, padding: '7px 14px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: '0 3px 0 #D9A21F', ['--press-shadow' as string]: '0 1px 0 #D9A21F' }}>
              Claim
            </button>
          )}
          {d.quest.claimed && <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#fff' }}>Claimed ✓</span>}
        </div>
      </div>

      {/* today's meals */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544' }}>Today's meals</span>
        <button onClick={onOpenCapture} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#7C3AF6' }}>+ Add</button>
      </div>
      {d.todayMeals.length === 0 ? (
        <button onClick={onOpenCapture} style={{ width: '100%', background: '#fff', border: '2px dashed #E0D6F4', borderRadius: 22, padding: '22px 16px', cursor: 'pointer', marginBottom: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 30 }}>🍽️</span>
          <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544' }}>No meals yet today</span>
          <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#9B91B8' }}>Snap your first to start tracking</span>
        </button>
      ) : (
        <div style={{ background: '#fff', borderRadius: 22, padding: 6, marginBottom: 18, boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
          {d.todayMeals.map((m) => (
            <MealRow key={m.id} meal={m} now={now} onDelete={() => actions.deleteMeal(m.id)} />
          ))}
        </div>
      )}

      {/* feed */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '0 2px' }}>
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 19, color: '#241544' }}>Squad activity</span>
        <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#7C3AF6' }}>See all</span>
      </div>
      {feed.map((f) => (
        <FeedCard key={f.id} f={f} now={now} onCheer={() => actions.toggleCheer(f.id)} />
      ))}
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
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, color: '#9B91B8' }}>{label}</div>
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
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8', textTransform: 'capitalize' }}>{meal.type} · {relativeTime(meal.at, now)}</div>
      </div>
      <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544', flex: 'none' }}>{num(meal.kcal)}</span>
      <button onClick={onDelete} aria-label="Delete meal" style={{ width: 28, height: 28, borderRadius: 9, background: '#F7F2FE', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C3BBD6" strokeWidth="2.4" strokeLinecap="round"><path d="M5 7h14M10 7V5h4v2M8 7l1 12h6l1-12" /></svg>
      </button>
    </div>
  )
}

function FeedCard({ f, now, onCheer }: { f: FeedEntry & { cheered: boolean; cheerCount: number }; now: number; onCheer: () => void }) {
  return (
    <div style={{ background: '#fff', borderRadius: 24, padding: 14, marginBottom: 12, boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: f.photo || f.badge || f.stat ? 10 : 4 }}>
        <Avatar initial={f.initial} gradient={f.avatar} size={44} radius={15} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>{f.name}{f.author === 'me' ? ' (You)' : ''}</div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#9B91B8' }}>{f.action}</div>
        </div>
        <span style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#C3BBD6', flex: 'none' }}>{relativeTime(f.at, now)}</span>
      </div>

      {f.photo && (
        f.photo.startsWith('data:') ? (
          <img src={f.photo} alt="" style={{ width: '100%', height: 148, objectFit: 'cover', borderRadius: 18, marginBottom: 10 }} />
        ) : (
          <div style={{ position: 'relative', height: 148, borderRadius: 18, background: f.photo, marginBottom: 10, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 10, bottom: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(36,21,68,.78)', backdropFilter: 'blur(6px)', padding: '6px 11px', borderRadius: 14 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#FFC53D"><path d="M12 2l2 5 5 .5-4 3.5 1 5-4-2.5L8 19l1-5-4-3.5 5-.5 2-5Z" /></svg>
              <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#fff' }}>Fettle counted it</span>
            </div>
          </div>
        )
      )}

      {f.badge && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#F4EFFF', borderRadius: 16, padding: 12, marginBottom: 10 }}>
          <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#FFC53D,#FF8A1E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 4px 10px rgba(255,138,30,.35)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 20.4l1.5-6.8L2.2 9l6.9-.7L12 2Z" /></svg>
          </div>
          <div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#9B91B8', textTransform: 'uppercase', letterSpacing: '.4px' }}>New badge</div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544' }}>{f.badge}</div>
          </div>
        </div>
      )}

      {f.stat && !f.photo && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#F4EFFF', borderRadius: 14, padding: '7px 12px', marginBottom: 10 }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#5B22C9' }}>{f.stat}</span>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, borderTop: '1px solid #F2ECFB', paddingTop: 10 }}>
        <button onClick={onCheer} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill={f.cheered ? '#FF4D6D' : 'none'} stroke={f.cheered ? '#FF4D6D' : '#B6AEC9'} strokeWidth="2" style={{ animation: f.cheered ? 'pep-cheer .35s ease' : undefined }}>
            <path d="M12 20S4 14.5 4 9a3.6 3.6 0 0 1 8-2 3.6 3.6 0 0 1 8 2c0 5.5-8 11-8 11Z" />
          </svg>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: f.cheered ? '#FF4D6D' : '#B6AEC9' }}>{f.cheerCount}</span>
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px' }}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B6AEC9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-12 7.6L3 21l1.9-5.6A8.4 8.4 0 1 1 21 11.5Z" /></svg>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#B6AEC9' }}>Cheer on</span>
        </button>
      </div>
    </div>
  )
}
