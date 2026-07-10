import { useEffect, useState } from 'react'
import { Avatar } from '../components/Avatar'
import { api } from '../lib/api'
import type { FriendProfile, Friendships } from '../lib/api/contract'
import { useStore, actions } from '../lib/store'
import { useDerived } from '../lib/hooks'
import { num, relativeTime } from '../lib/format'
import { MOOD_BY_ID } from '../lib/social'
import { CIRCLES, CIRCLE_BY_ID, MEMBERS } from '../lib/seed'
import type { Derived, LeaderRow } from '../lib/selectors'
import type { SeedMember } from '../lib/seed'
import { T, card, inset, eyebrow, softTile, hexA } from '../lib/theme'

const TABS = ['Leaderboard', 'Friends', 'Circles'] as const
type Tab = (typeof TABS)[number]

export function Squad({ onOpenMember, onOpenCircle, onCheckIn }: { onOpenMember: (id: string) => void; onOpenCircle: (id: string) => void; onCheckIn: () => void }) {
  const { data } = useStore()
  const d = useDerived()
  const [tab, setTab] = useState<Tab>('Leaderboard')
  // On a real backend there is no seeded "everyone" pool, so the leaderboard is
  // friends-only (you until you add friends) and Circles (no real backend yet)
  // is hidden. Local/demo mode keeps the full seeded experience.
  const [scope, setScope] = useState<'everyone' | 'friends'>(api.realFriends ? 'friends' : 'everyone')
  const visibleTabs = TABS.filter((t) => t !== 'Circles' || !api.realFriends)
  if (!d || !data) return null

  const board = scope === 'friends' ? d.friendsLeaderboard : d.leaderboard
  const top = board.slice(0, 3)
  const friendSet = new Set(d.friendIds)
  const suggestions = MEMBERS.filter((m) => !friendSet.has(m.id))
  const joinedCircles = d.circleIds.map((id) => CIRCLE_BY_ID[id]).filter(Boolean)
  const browseCircles = CIRCLES.filter((c) => !d.circleIds.includes(c.id))

  return (
    <div data-screen-label="Squad" style={{ padding: '56px 18px 116px' }}>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 30, color: T.text, marginBottom: 14 }}>Squad</div>

      {/* main tabs */}
      <div style={{ display: 'flex', background: T.glass, border: `1px solid ${T.lineSoft}`, borderRadius: 16, padding: 4, marginBottom: 18 }}>
        {visibleTabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, textAlign: 'center', background: tab === t ? T.accent : 'transparent', borderRadius: 13, padding: 9, fontFamily: T.display, fontWeight: 600, fontSize: 14, color: tab === t ? T.ink : T.dim, border: 'none', cursor: 'pointer' }}>{t}</button>
        ))}
      </div>

      {tab === 'Leaderboard' && (
        <>
          {/* scope toggle (seeded "everyone" pool only exists in demo mode) */}
          {!api.realFriends && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {(['everyone', 'friends'] as const).map((s) => (
                <button key={s} onClick={() => setScope(s)} style={{ flex: 1, background: scope === s ? T.accent : T.glass, color: scope === s ? T.ink : T.dim, border: scope === s ? 'none' : `1px solid ${T.line}`, borderRadius: 14, padding: '9px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {s === 'everyone' ? '🌍 Everyone' : '🤝 My friends'}
                </button>
              ))}
            </div>
          )}

          {scope === 'friends' && d.friendCount === 0 ? (
            <Empty emoji="🤝" title="No friends yet" body="Add friends to race up a private leaderboard and keep each other accountable." cta="Find friends" onCta={() => setTab('Friends')} />
          ) : (
            <>
              {top.length >= 3 && (
                <div style={{ ...card, padding: '18px 14px 16px', marginBottom: 16 }}>
                  <div style={{ textAlign: 'center', fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text, marginBottom: 14 }}>This Week's Champions</div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10 }}>
                    <Podium row={top[1]} place={2} avatarSize={54} fontSize={20} barHeight={42} barBg="rgba(40,33,22,0.08)" ring={T.line} badge={T.dim} xpColor={T.dim} onOpen={() => !top[1].you && onOpenMember(top[1].id)} />
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <svg width="22" height="18" viewBox="0 0 24 20" style={{ marginBottom: 2 }}><path d="M2 5l5 4 5-7 5 7 5-4-2 12H4L2 5Z" fill={T.accent} /></svg>
                      <button onClick={() => !top[0].you && onOpenMember(top[0].id)} style={{ border: 'none', background: 'none', padding: 0, cursor: top[0].you ? 'default' : 'pointer', display: 'block', margin: '0 auto' }}>
                        <div style={{ position: 'relative', width: 64, height: 64, margin: '0 auto 6px' }}>
                          <Avatar initial={top[0].initial} gradient={top[0].avatar} size={64} fontSize={24} ring={T.accent} />
                          <PlaceBadge n={1} bg={T.accent} size={24} />
                        </div>
                      </button>
                      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 13, color: T.text, marginTop: 6 }}>{top[0].name}</div>
                      <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.accent }}>{num(top[0].xp)} XP</div>
                      <div style={{ height: 62, marginTop: 6, borderRadius: '12px 12px 0 0', background: T.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 26, color: T.accent, lineHeight: 1 }}>1</span>
                      </div>
                    </div>
                    <Podium row={top[2]} place={3} avatarSize={54} fontSize={20} barHeight={32} barBg="rgba(40,33,22,0.08)" ring={T.amber} badge={T.amber} xpColor={T.dim} onOpen={() => !top[2].you && onOpenMember(top[2].id)} />
                  </div>
                </div>
              )}

              <div style={{ ...card, padding: 8 }}>
                {board.map((l) => (
                  <button key={l.rank} onClick={() => !l.you && onOpenMember(l.id)} style={{ width: '100%', textAlign: 'left', border: 'none', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', borderRadius: 16, background: l.you ? T.accentDim : 'transparent', marginBottom: 2, cursor: l.you ? 'default' : 'pointer' }}>
                    <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: l.you ? T.accent : T.faint, width: 20, textAlign: 'center', flex: 'none' }}>{l.rank}</span>
                    <Avatar initial={l.initial} gradient={l.avatar} size={40} fontSize={16} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: l.you ? T.accent : T.text }}>{l.name}</div>
                      <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim }}>{num(l.xp)} XP</div>
                    </div>
                    <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.green, background: 'rgba(91,227,154,0.14)', padding: '4px 9px', borderRadius: 12, flex: 'none' }}>{l.move}</span>
                  </button>
                ))}
              </div>
              <div style={{ textAlign: 'center', fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.faint, marginTop: 12 }}>
                {scope === 'friends' ? `You're #${board.find((r) => r.you)?.rank ?? 1} among friends` : `Log meals & activities to climb, you're #${d.myRank} this week.`}
              </div>
            </>
          )}
        </>
      )}

      {tab === 'Friends' && api.realFriends && <RealFriends />}

      {tab === 'Friends' && !api.realFriends && (
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
          <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim, margin: '-6px 2px 12px' }}>Smaller communities rallying around a shared goal. Find your people.</div>
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

// ── real (Supabase) friends ──────────────────────────────────────────────────
function RealFriends() {
  const [username, setUsername] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [editing, setEditing] = useState(false)
  const [fs, setFs] = useState<Friendships>({ friends: [], incoming: [], outgoing: [] })
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FriendProfile[]>([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [u, f] = await Promise.all([api.myUsername(), api.listFriendships()])
    setUsername(u)
    setFs(f)
    setLoading(false)
  }
  useEffect(() => {
    refresh()
  }, [])

  async function search(q: string) {
    setQuery(q)
    if (q.trim().length < 2) return setResults([])
    setResults(await api.searchUsers(q))
  }
  async function saveUsername() {
    const res = await api.setUsername(draft)
    if (res.ok) {
      setEditing(false)
      actions.toast('Username saved')
      refresh()
    } else actions.toast(res.error || 'Could not save')
  }
  async function add(p: FriendProfile) {
    const res = await api.sendFriendRequest(p.id)
    actions.toast(res.ok ? `Request sent to ${p.name}` : res.error || 'Could not send')
    if (res.ok) refresh()
  }
  async function respond(p: FriendProfile, accept: boolean) {
    await api.respondToRequest(p.id, accept)
    actions.toast(accept ? `You're now friends with ${p.name} 🤝` : 'Request declined')
    refresh()
    actions.refreshFriends() // keep the leaderboard's friend scope in sync
  }
  function invite() {
    if (!username) return actions.toast('Pick a username first')
    const link = `${window.location.origin}/?add=${encodeURIComponent(username)}`
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
    if (nav.share) nav.share({ title: 'Add me on Pippin', text: 'Be my friend on Pippin 💪', url: link }).catch(() => {})
    else {
      navigator.clipboard?.writeText(link)
      actions.toast('Invite link copied')
    }
  }

  const friendIds = new Set(fs.friends.map((f) => f.id))
  const outgoingIds = new Set(fs.outgoing.map((f) => f.id))

  if (loading) return <div style={{ textAlign: 'center', padding: 30, fontFamily: T.body, fontWeight: 700, color: T.dim }}>Loading friends…</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* username + invite */}
      <div style={{ ...card, padding: 16 }}>
        {username && !editing ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ ...eyebrow }}>Your handle</div>
              <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 19, color: T.text }}>@{username}</div>
            </div>
            <button onClick={() => { setDraft(username); setEditing(true) }} style={{ background: T.glassHi, color: T.text, border: `1px solid ${T.line}`, borderRadius: 12, padding: '8px 12px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none' }}>Edit</button>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div style={{ ...eyebrow, marginBottom: 8 }}>{username ? 'Edit handle' : 'Pick a username so friends can find you'}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="username" autoFocus style={{ ...inset, flex: 1, minWidth: 0, padding: '10px 12px', fontFamily: T.body, fontWeight: 700, fontSize: 15, color: T.text, outline: 'none' }} />
              <button onClick={saveUsername} style={{ background: T.accent, color: T.ink, border: 'none', borderRadius: 12, padding: '10px 16px', fontFamily: T.display, fontWeight: 600, fontSize: 14, cursor: 'pointer', flex: 'none' }}>Save</button>
            </div>
          </div>
        )}
        <button onClick={invite} className="pressable" style={{ width: '100%', background: T.accent, color: T.ink, border: 'none', borderRadius: 14, padding: 13, fontFamily: T.display, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>🔗 Share your invite link</button>
      </div>

      {/* search */}
      <div>
        <input value={query} onChange={(e) => search(e.target.value)} placeholder="Search by username or name…" style={{ ...inset, width: '100%', padding: '13px 16px', fontFamily: T.body, fontWeight: 700, fontSize: 15, color: T.text, outline: 'none' }} />
        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            {results.map((p) => (
              <RFRow key={p.id} p={p} action={
                friendIds.has(p.id) ? <Tag text="Friends ✓" /> : outgoingIds.has(p.id) ? <Tag text="Requested" /> : <AddBtn onClick={() => add(p)} />
              } />
            ))}
          </div>
        )}
        {query.trim().length >= 2 && results.length === 0 && (
          <div style={{ textAlign: 'center', padding: '14px 0', fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.faint }}>No one found. Share your invite link instead.</div>
        )}
      </div>

      {/* incoming requests */}
      {fs.incoming.length > 0 && (
        <div>
          <SectionLabel>Friend requests · {fs.incoming.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fs.incoming.map((p) => (
              <RFRow key={p.id} p={p} action={
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => respond(p, true)} style={{ background: T.accent, color: T.ink, border: 'none', borderRadius: 12, padding: '8px 12px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Accept</button>
                  <button onClick={() => respond(p, false)} style={{ background: T.glass, color: T.dim, border: `1px solid ${T.line}`, borderRadius: 12, padding: '8px 10px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>✕</button>
                </div>
              } />
            ))}
          </div>
        </div>
      )}

      {/* your friends */}
      <div>
        <SectionLabel>Your friends · {fs.friends.length}</SectionLabel>
        {fs.friends.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fs.friends.map((p) => (
              <RFRow key={p.id} p={p} action={<button onClick={() => respond(p, false)} aria-label="Remove" style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.faint }}>Remove</button>} />
            ))}
          </div>
        ) : (
          <Empty emoji="🤝" title="No friends yet" body="Search a username above, or share your invite link to add your first friend." />
        )}
      </div>

      {/* outgoing pending */}
      {fs.outgoing.length > 0 && (
        <div>
          <SectionLabel>Sent · {fs.outgoing.length}</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {fs.outgoing.map((p) => <RFRow key={p.id} p={p} action={<Tag text="Pending" />} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function RFRow({ p, action }: { p: FriendProfile; action: React.ReactNode }) {
  return (
    <div style={{ ...inset, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 18, padding: '12px 14px' }}>
      <Avatar initial={(p.name[0] || 'F').toUpperCase()} gradient={p.avatar} size={42} radius={14} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
        {p.username && <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim }}>@{p.username}</div>}
      </div>
      {action}
    </div>
  )
}

function Tag({ text }: { text: string }) {
  return <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.green, background: 'rgba(91,227,154,0.14)', padding: '6px 11px', borderRadius: 12, flex: 'none' }}>{text}</span>
}

// ── friends ──────────────────────────────────────────────────────────────────
function FriendRow({ m, onOpen, action }: { m: SeedMember; onOpen: () => void; action: React.ReactNode }) {
  return (
    <div style={{ ...inset, display: 'flex', alignItems: 'center', gap: 12, borderRadius: 18, padding: '12px 14px' }}>
      <button onClick={onOpen} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
        <Avatar initial={m.initial} gradient={m.avatar} size={46} radius={15} />
      </button>
      <button onClick={onOpen} style={{ flex: 1, minWidth: 0, border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text }}>{m.name}</div>
        <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim }}>Level {m.level ?? 1} · 🔥 {m.streak ?? 0}-day streak</div>
      </button>
      {action}
    </div>
  )
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} className="pressable" style={{ background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: '9px 16px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none' }}>+ Add</button>
}
function NudgeBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={{ background: hexA(T.amber, 0.14), color: T.amber, border: 'none', borderRadius: 13, padding: '9px 14px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none' }}>👋 Nudge</button>
}

function BuddySection({ d, onCheckIn, onOpenMember }: { d: Derived; onCheckIn: () => void; onOpenMember: (id: string) => void }) {
  const buddy = d.buddy
  if (buddy) {
    const last = d.buddyLastCheckIn
    const lastMood = last ? MOOD_BY_ID[last.mood] : null
    const mine = d.todayCheckIn
    const myMood = mine ? MOOD_BY_ID[mine.mood] : null
    return (
      <div style={{ ...card, padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ ...eyebrow }}>🤝 Accountability buddy</span>
          <button onClick={() => actions.removeBuddy()} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: T.body, fontWeight: 800, fontSize: 12, color: T.dim }}>Change</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={() => onOpenMember(buddy.id)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', flex: 'none' }}>
            <Avatar initial={buddy.initial} gradient={buddy.avatar} size={48} radius={16} ring={T.line} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16, color: T.text }}>{buddy.name}</div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim }}>Level {buddy.level ?? 1} · 🔥 {buddy.streak ?? 0}-day streak</div>
          </div>
          <button onClick={() => actions.nudgeFriend(buddy.name)} style={{ background: T.glassHi, color: T.text, border: `1px solid ${T.line}`, borderRadius: 12, padding: '8px 12px', fontFamily: T.display, fontWeight: 600, fontSize: 13, cursor: 'pointer', flex: 'none' }}>👋 Nudge</button>
        </div>
        {last && lastMood && (
          <div style={{ ...inset, padding: '10px 12px', marginBottom: 12 }}>
            <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.dim, marginBottom: 2 }}>{buddy.name.split(' ')[0]} · {lastMood.emoji} {lastMood.label} · {relativeTime(last.at)}</div>
            <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13.5, color: T.text, lineHeight: 1.4 }}>"{last.note}"</div>
          </div>
        )}
        <button onClick={onCheckIn} className="pressable" style={{ width: '100%', background: T.accent, color: T.ink, border: 'none', borderRadius: 14, padding: 13, fontFamily: T.display, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
          {mine && myMood ? `Today: ${myMood.emoji} ${myMood.label} (update)` : 'Check in for today'}
        </button>
      </div>
    )
  }
  if (d.friends.length > 0) {
    return (
      <div style={{ ...card, padding: 16, marginBottom: 20 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 17, color: T.text, marginBottom: 4 }}>🤝 Pick an accountability buddy</div>
        <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim, marginBottom: 14 }}>Pair up with a friend to check in daily and keep each other on track.</div>
        <div className="pippin-scroll" style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {d.friends.map((f) => (
            <button key={f.id} onClick={() => actions.setBuddy(f.id)} style={{ flex: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', width: 64 }}>
              <Avatar initial={f.initial} gradient={f.avatar} size={48} radius={16} />
              <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 64 }}>{f.name.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div style={{ ...card, padding: '18px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 30 }}>🤝</span>
      <div>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 15, color: T.text }}>Want an accountability buddy?</div>
        <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 13, color: T.dim }}>Add a friend below first, then pair up to check in daily.</div>
      </div>
    </div>
  )
}

// ── circles ──────────────────────────────────────────────────────────────────
function CircleRow({ c, joined, onOpen }: { c: (typeof CIRCLES)[number]; joined?: boolean; onOpen: () => void }) {
  return (
    <button onClick={onOpen} style={{ ...card, display: 'flex', alignItems: 'center', gap: 13, width: '100%', borderRadius: 22, padding: 14, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ ...softTile(T.violet), width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flex: 'none' }}>{c.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 16, color: T.text }}>{c.name}</div>
        <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 12, color: T.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.count} members · {c.goal}</div>
      </div>
      {joined ? (
        <span style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: T.green, background: 'rgba(91,227,154,0.14)', padding: '5px 11px', borderRadius: 12, flex: 'none' }}>Joined</span>
      ) : (
        <span style={{ fontFamily: T.display, fontWeight: 600, fontSize: 13, color: T.ink, background: T.accent, padding: '8px 14px', borderRadius: T.r.pill, flex: 'none' }}>View</span>
      )}
    </button>
  )
}

// ── shared ───────────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 18, color: T.text, margin: '0 2px 12px' }}>{children}</div>
}

function Empty({ emoji, title, body, cta, onCta }: { emoji: string; title: string; body: string; cta?: string; onCta?: () => void }) {
  return (
    <div style={{ ...card, padding: '32px 24px', textAlign: 'center', marginBottom: 20 }}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 20, color: T.text, marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: T.body, fontWeight: 700, fontSize: 14, color: T.dim, marginBottom: cta ? 18 : 0, lineHeight: 1.45 }}>{body}</div>
      {cta && onCta && (
        <button onClick={onCta} className="pressable" style={{ background: T.accent, color: T.ink, border: 'none', borderRadius: 16, padding: '13px 22px', fontFamily: T.display, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>{cta}</button>
      )}
    </div>
  )
}

function Podium({ row, place, avatarSize, fontSize, barHeight, barBg, ring, badge, xpColor, onOpen }: { row: LeaderRow; place: number; avatarSize: number; fontSize: number; barHeight: number; barBg: string; ring: string; badge: string; xpColor: string; onOpen?: () => void }) {
  return (
    <div style={{ flex: 1, textAlign: 'center' }}>
      <button onClick={onOpen} style={{ border: 'none', background: 'none', padding: 0, cursor: row.you ? 'default' : 'pointer', display: 'block', margin: '0 auto' }}>
        <div style={{ position: 'relative', width: avatarSize, height: avatarSize, margin: '0 auto 6px' }}>
          <Avatar initial={row.initial} gradient={row.avatar} size={avatarSize} fontSize={fontSize} ring={ring} />
          <PlaceBadge n={place} bg={badge} size={22} />
        </div>
      </button>
      <div style={{ fontFamily: T.display, fontWeight: 600, fontSize: 12, color: T.text, marginTop: 6 }}>{row.name}</div>
      <div style={{ fontFamily: T.body, fontWeight: 800, fontSize: 11, color: xpColor }}>{num(row.xp)} XP</div>
      <div style={{ height: barHeight, marginTop: 6, borderRadius: '12px 12px 0 0', background: barBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: T.display, fontWeight: 700, fontSize: 22, color: T.faint, lineHeight: 1 }}>{place}</span>
      </div>
    </div>
  )
}

function PlaceBadge({ n, bg, size }: { n: number; bg: string; size: number }) {
  return (
    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.display, fontWeight: 700, fontSize: size * 0.55, color: T.ink }}>{n}</div>
  )
}
