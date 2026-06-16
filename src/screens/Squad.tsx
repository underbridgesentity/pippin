import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { useStore, actions } from '../lib/store'
import { useDerived } from '../lib/hooks'
import { num, relativeTime } from '../lib/format'
import { MOOD_BY_ID } from '../lib/social'
import { CIRCLES, CIRCLE_BY_ID, MEMBERS } from '../lib/seed'
import type { Derived, LeaderRow } from '../lib/selectors'
import type { SeedMember } from '../lib/seed'

const TABS = ['Leaderboard', 'Friends', 'Circles'] as const
type Tab = (typeof TABS)[number]

export function Squad({ onOpenMember, onOpenCircle, onCheckIn }: { onOpenMember: (id: string) => void; onOpenCircle: (id: string) => void; onCheckIn: () => void }) {
  const { data } = useStore()
  const d = useDerived()
  const [tab, setTab] = useState<Tab>('Leaderboard')
  const [scope, setScope] = useState<'everyone' | 'friends'>('everyone')
  if (!d || !data) return null

  const board = scope === 'friends' ? d.friendsLeaderboard : d.leaderboard
  const top = board.slice(0, 3)
  const friendSet = new Set(d.friendIds)
  const suggestions = MEMBERS.filter((m) => !friendSet.has(m.id))
  const joinedCircles = d.circleIds.map((id) => CIRCLE_BY_ID[id]).filter(Boolean)
  const browseCircles = CIRCLES.filter((c) => !d.circleIds.includes(c.id))

  return (
    <div data-screen-label="Squad" style={{ padding: '56px 18px 116px' }}>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 30, color: '#241544', marginBottom: 14 }}>Squad</div>

      {/* main tabs */}
      <div style={{ display: 'flex', background: '#EDE6FA', borderRadius: 16, padding: 4, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: 'center', background: tab === t ? '#fff' : 'transparent', borderRadius: 13, padding: 9, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14, color: tab === t ? '#7C3AF6' : '#9B91B8', border: 'none', cursor: 'pointer', boxShadow: tab === t ? '0 2px 6px rgba(120,60,180,.1)' : 'none' }}>{t}</button>
        ))}
      </div>

      {tab === 'Leaderboard' && (
        <>
          {/* scope toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {(['everyone', 'friends'] as const).map((s) => (
              <button key={s} onClick={() => setScope(s)} style={{ flex: 1, background: scope === s ? '#7C3AF6' : '#fff', color: scope === s ? '#fff' : '#7A719B', border: scope === s ? 'none' : '2px solid #ECE6FA', borderRadius: 14, padding: '9px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                {s === 'everyone' ? '🌍 Everyone' : '🤝 Friends'}
              </button>
            ))}
          </div>

          {scope === 'friends' && d.friendCount === 0 ? (
            <Empty emoji="🤝" title="No friends yet" body="Add friends to race up a private leaderboard and keep each other accountable." cta="Find friends" onCta={() => setTab('Friends')} />
          ) : (
            <>
              {top.length >= 3 && (
                <div style={{ background: 'linear-gradient(160deg,#7C3AF6,#9B5CFF)', borderRadius: 26, padding: '18px 14px 16px', marginBottom: 16, boxShadow: '0 10px 26px rgba(124,58,246,.28)' }}>
                  <div style={{ textAlign: 'center', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 14 }}>This Week's Champions</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
                    <Podium row={top[1]} place={2} avatarSize={54} fontSize={20} barHeight={42} barBg="rgba(255,255,255,.18)" ring="#E8E8F0" badge="#D7D7E0" xpColor="rgba(255,255,255,.7)" />
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <svg width="22" height="18" viewBox="0 0 24 20" style={{ marginBottom: 2 }}><path d="M2 5l5 4 5-7 5 7 5-4-2 12H4L2 5Z" fill="#FFC53D" /></svg>
                      <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 6px' }}>
                        <Avatar initial={top[0].initial} gradient={top[0].avatar} size={64} fontSize={24} ring="#FFC53D" />
                        <PlaceBadge n={1} bg="#FFC53D" size={24} />
                      </div>
                      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: '#fff', marginTop: 6 }}>{top[0].name}</div>
                      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#FFE6B8' }}>{num(top[0].xp)} XP</div>
                      <div style={{ height: 62, marginTop: 6, borderRadius: '12px 12px 0 0', background: 'rgba(255,255,255,.28)' }} />
                    </div>
                    <Podium row={top[2]} place={3} avatarSize={54} fontSize={20} barHeight={32} barBg="rgba(255,255,255,.14)" ring="#E2A878" badge="#E2A878" xpColor="rgba(255,255,255,.7)" />
                  </div>
                </div>
              )}

              <div style={{ background: '#fff', borderRadius: 24, padding: 8, boxShadow: '0 6px 16px rgba(120,60,180,.06)' }}>
                {board.map((l) => (
                  <div key={l.rank} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', borderRadius: 16, background: l.you ? '#F1ECFF' : 'transparent', marginBottom: 2 }}>
                    <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: l.you ? '#7C3AF6' : '#C3BBD6', width: 20, textAlign: 'center', flex: 'none' }}>{l.rank}</span>
                    <Avatar initial={l.initial} gradient={l.avatar} size={40} fontSize={16} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: l.you ? '#7C3AF6' : '#241544' }}>{l.name}</div>
                      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8' }}>{num(l.xp)} XP</div>
                    </div>
                    <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: '#18C98A', background: '#E2F8EF', padding: '4px 9px', borderRadius: 12, flex: 'none' }}>{l.move}</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#B6AEC9', marginTop: 12 }}>
                {scope === 'friends' ? `You're #${board.find((r) => r.you)?.rank ?? 1} among friends` : `Log meals & activities to climb, you're #${d.myRank} this week.`}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'Friends' && (
        <>
          <BuddySection d={d} onCheckIn={onCheckIn} onOpenMember={onOpenMember} />
          {d.friends.length > 0 ? (
            <>
              <SectionLabel>Your friends · {d.friendCount}</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {d.friends.map((f) => (
                  <FriendRow key={f.id} m={f} onOpen={() => onOpenMember(f.id)} action={<NudgeBtn onClick={() => actions.nudgeFriend(f.name)} />} />
                ))}
              </div>
            </>
          ) : (
            <Empty emoji="🤝" title="Build your crew" body="Friends keep you accountable, cheer each other on, nudge a friend who's quiet, and race a private leaderboard." />
          )}

          {suggestions.length > 0 && (
            <>
              <SectionLabel>Suggested for you</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {suggestions.map((m) => (
                  <FriendRow key={m.id} m={m} onOpen={() => onOpenMember(m.id)} action={<AddBtn onClick={() => actions.addFriend(m.id)} />} />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'Circles' && (
        <>
          {joinedCircles.length > 0 && (
            <>
              <SectionLabel>Your circles</SectionLabel>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                {joinedCircles.map((c) => (
                  <CircleRow key={c.id} c={c} joined onOpen={() => onOpenCircle(c.id)} />
                ))}
              </div>
            </>
          )}
          <SectionLabel>{joinedCircles.length > 0 ? 'Discover more' : 'Find your circle'}</SectionLabel>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#9B91B8', margin: '-6px 2px 12px' }}>Smaller communities rallying around a shared goal. Find your people.</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {browseCircles.map((c) => (
              <CircleRow key={c.id} c={c} onOpen={() => onOpenCircle(c.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ── friends ──────────────────────────────────────────────────────────────────
function FriendRow({ m, onOpen, action }: { m: SeedMember; onOpen: () => void; action: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 18, padding: '12px 14px', boxShadow: '0 5px 14px rgba(120,60,180,.05)' }}>
      <button onClick={onOpen} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
        <Avatar initial={m.initial} gradient={m.avatar} size={46} radius={15} />
      </button>
      <button onClick={onOpen} style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>{m.name}</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8' }}>Level {m.level ?? 1} · 🔥 {m.streak ?? 0}-day streak</div>
      </button>
      {action}
    </div>
  )
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="pressable" style={{ background: '#7C3AF6', color: '#fff', border: 'none', borderRadius: 13, padding: '9px 16px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none', boxShadow: '0 3px 0 #5B22C9', ['--press-shadow' as string]: '0 1px 0 #5B22C9' }}>+ Add</button>
}
function NudgeBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{ background: '#FFF0DC', color: '#FF8A1E', border: 'none', borderRadius: 13, padding: '9px 14px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none' }}>👋 Nudge</button>
}

function BuddySection({ d, onCheckIn, onOpenMember }: { d: Derived; onCheckIn: () => void; onOpenMember: (id: string) => void }) {
  const buddy = d.buddy
  if (buddy) {
    const last = d.buddyLastCheckIn
    const lastMood = last ? MOOD_BY_ID[last.mood] : null
    const mine = d.todayCheckIn
    const myMood = mine ? MOOD_BY_ID[mine.mood] : null
    return (
      <div style={{ background: 'linear-gradient(135deg,#7C3AF6,#9B5CFF)', borderRadius: 22, padding: 16, marginBottom: 20, boxShadow: '0 8px 20px rgba(124,58,246,.22)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,.85)', textTransform: 'uppercase', letterSpacing: '.5px' }}>🤝 Accountability buddy</span>
          <button onClick={() => actions.removeBuddy()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Nunito', fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,.7)' }}>Change</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => onOpenMember(buddy.id)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
            <Avatar initial={buddy.initial} gradient={buddy.avatar} size={48} radius={16} ring="rgba(255,255,255,.5)" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#fff' }}>{buddy.name}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: 'rgba(255,255,255,.8)' }}>Level {buddy.level ?? 1} · 🔥 {buddy.streak ?? 0}-day streak</div>
          </div>
          <button onClick={() => actions.nudgeFriend(buddy.name)} style={{ background: 'rgba(255,255,255,.2)', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 12px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none' }}>👋 Nudge</button>
        </div>
        {last && lastMood && (
          <div style={{ background: 'rgba(255,255,255,.16)', borderRadius: 14, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,.8)', marginBottom: 2 }}>{buddy.name.split(' ')[0]} · {lastMood.emoji} {lastMood.label} · {relativeTime(last.at)}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13.5, color: '#fff', lineHeight: 1.4 }}>"{last.note}"</div>
          </div>
        )}
        <button onClick={onCheckIn} className="pressable" style={{ width: '100%', background: '#fff', color: '#7C3AF6', border: 'none', borderRadius: 14, padding: 13, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,.12)', ['--press-shadow' as string]: '0 2px 0 rgba(0,0,0,.12)' }}>
          {mine && myMood ? `Today: ${myMood.emoji} ${myMood.label} (update)` : 'Check in for today'}
        </button>
      </div>
    )
  }
  if (d.friends.length > 0) {
    return (
      <div style={{ background: '#fff', borderRadius: 22, padding: 16, marginBottom: 20, boxShadow: '0 6px 16px rgba(120,60,180,.06)' }}>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 17, color: '#241544', marginBottom: 4 }}>🤝 Pick an accountability buddy</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#9B91B8', marginBottom: 14 }}>Pair up with a friend to check in daily and keep each other on track.</div>
        <div className="fettle-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {d.friends.map((f) => (
            <button key={f.id} onClick={() => actions.setBuddy(f.id)} style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', width: 64 }}>
              <Avatar initial={f.initial} gradient={f.avatar} size={48} radius={16} />
              <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#241544', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 64 }}>{f.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', borderRadius: 22, padding: '18px 16px', marginBottom: 20, boxShadow: '0 6px 16px rgba(120,60,180,.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 30 }}>🤝</span>
      <div>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>Want an accountability buddy?</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#9B91B8' }}>Add a friend below first, then pair up to check in daily.</div>
      </div>
    </div>
  )
}

// ── circles ──────────────────────────────────────────────────────────────────
function CircleRow({ c, joined, onOpen }: { c: (typeof CIRCLES)[number]; joined?: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', background: '#fff', border: 'none', borderRadius: 22, padding: 14, cursor: 'pointer', textAlign: 'left', boxShadow: '0 5px 16px rgba(120,60,180,.06)' }}>
      <div style={{ width: 52, height: 52, borderRadius: 16, background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flex: 'none' }}>{c.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544' }}>{c.name}</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.count} members · {c.goal}</div>
      </div>
      {joined ? (
        <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: '#18C98A', background: '#E2F8EF', padding: '5px 11px', borderRadius: 12, flex: 'none' }}>Joined</span>
      ) : (
        <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: c.color, background: c.tint, padding: '8px 14px', borderRadius: 13, flex: 'none' }}>View</span>
      )}
    </button>
  )
}

// ── shared ───────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, color: '#241544', margin: '0 2px 12px' }}>{children}</div>
}

function Empty({ emoji, title, body, cta, onCta }: { emoji: string; title: string; body: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ background: '#fff', borderRadius: 26, padding: '32px 24px', textAlign: 'center', boxShadow: '0 6px 16px rgba(120,60,180,.06)', marginBottom: 20 }}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 20, color: '#241544', marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#9B91B8', marginBottom: cta ? 18 : 0, lineHeight: 1.45 }}>{body}</div>
      {cta && onCta && (
        <button onClick={onCta} className="pressable" style={{ background: '#7C3AF6', color: '#fff', border: 'none', borderRadius: 16, padding: '13px 22px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #5B22C9', ['--press-shadow' as string]: '0 2px 0 #5B22C9' }}>{cta}</button>
      )}
    </div>
  )
}

function Podium({ row, place, avatarSize, fontSize, barHeight, barBg, ring, badge, xpColor }: { row: LeaderRow; place: number; avatarSize: number; fontSize: number; barHeight: number; barBg: string; ring: string; badge: string; xpColor: string }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ position: 'relative', width: avatarSize, height: avatarSize, margin: '0 auto 6px' }}>
        <Avatar initial={row.initial} gradient={row.avatar} size={avatarSize} fontSize={fontSize} ring={ring} />
        <PlaceBadge n={place} bg={badge} size={22} />
      </div>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 12, color: '#fff', marginTop: 6 }}>{row.name}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 11, color: xpColor }}>{num(row.xp)} XP</div>
      <div style={{ height: barHeight, marginTop: 6, borderRadius: '12px 12px 0 0', background: barBg }} />
    </div>
  )
}

function PlaceBadge({ n, bg, size }: { n: number; bg: string; size: number }) {
  return (
    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: size * 0.55, color: '#fff' }}>{n}</div>
  )
}
