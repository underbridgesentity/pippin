import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Avatar } from '../components/Avatar'
import { actions, useStore } from '../lib/store'
import { useFeed } from '../lib/hooks'
import { REACTIONS, REACTION_BY_KIND, MOODS } from '../lib/social'
import { POST_TYPES, POST_TYPE_BY_TYPE } from '../lib/social'
import { CIRCLE_BY_ID, MEMBER_BY_ID } from '../lib/seed'
import { relativeTime, num } from '../lib/format'
import { buildCircleFeed, circleGoalProgress, type DecoratedFeed } from '../lib/selectors'
import type { Comment, Mood, PostType } from '../lib/types'
import { T, card, inset, eyebrow, hexA } from '../lib/theme'

// ── Comments + reactions thread ──────────────────────────────────────────────
export function CommentsSheet({ post, onClose, onOpenMember }: { post: DecoratedFeed | null; onClose: () => void; onOpenMember: (id: string) => void }) {
  const { account } = useStore()
  const [text, setText] = useState('')
  const [tip, setTip] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (post) endRef.current?.scrollIntoView({ block: 'nearest' })
  }, [post?.commentCount])

  if (!post || !account) return null

  function send() {
    if (!text.trim() || !post) return
    actions.comment(post.id, text, tip)
    setText('')
    setTip(false)
  }

  const isMine = post.author === 'me'

  return (
    <Sheet open={!!post} onClose={onClose} title="Cheers & comments">
      <div style={{ padding: '4px 18px 18px' }}>
        {/* post header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 10 }}>
          <button onClick={() => !isMine && onOpenMember(post.author)} style={{ border: 'none', background: 'none', padding: 0, cursor: isMine ? 'default' : 'pointer' }}>
            <Avatar initial={post.initial} gradient={post.avatar} size={42} radius={14} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 15, color: T.text }}>{post.name}{isMine ? ' (You)' : ''}</div>
            <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 12, color: T.dim }}>{post.action} · {relativeTime(post.at)}</div>
          </div>
          {isMine && (
            <button onClick={() => { actions.deletePost(post.id); onClose() }} aria-label="Delete post" style={{ width: 34, height: 34, borderRadius: 11, background: hexA(T.rose, 0.14), border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.rose} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" /></svg>
            </button>
          )}
        </div>

        {post.text && <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 15, color: T.text, lineHeight: 1.45, marginBottom: 12 }}>{post.text}</div>}
        {post.stat && <div style={{ display: 'inline-flex', ...inset, borderRadius: 12, padding: '6px 12px', fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 13, color: T.accent, marginBottom: 12 }}>{post.stat}</div>}

        {/* reaction bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {REACTIONS.map((r) => {
            const active = post.myReaction === r.kind
            const count = post.reactionCounts[r.kind] ?? 0
            return (
              <button
                key={r.kind}
                onClick={() => actions.react(post.id, r.kind)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: active ? hexA(r.color, 0.15) : T.glass, border: `2px solid ${active ? r.color : T.line}`, borderRadius: 14, padding: '7px 12px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 16, animation: active ? 'pep-cheer .35s ease' : undefined }}>{r.emoji}</span>
                <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 13, color: active ? r.color : T.dim }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {post.comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '14px 0', fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 13, color: T.faint }}>Be the first to cheer them on 💛</div>
          )}
          {post.comments.map((com) => (
            <CommentRow key={com.id} com={com} onOpenMember={onOpenMember} onDelete={() => actions.deleteComment(post.id, com.id)} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* composer */}
      <div style={{ position: 'sticky', bottom: 0, background: T.solid, borderTop: `1px solid ${T.lineSoft}`, padding: '12px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <Avatar initial={(account.name[0] || 'Y').toUpperCase()} gradient={account.avatar} size={36} radius={12} />
          <div style={{ flex: 1, background: T.glass, border: `1px solid ${T.line}`, borderRadius: 18, padding: '6px 6px 6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
              placeholder={tip ? 'Share a helpful tip…' : 'Add some encouragement…'}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 14, color: T.text, minWidth: 0 }}
            />
            <button onClick={() => setTip((t) => !t)} aria-label="Mark as tip" title="Mark as tip" style={{ width: 30, height: 30, borderRadius: 9, background: tip ? T.accentDim : 'transparent', border: 'none', cursor: 'pointer', fontSize: 15 }}>💡</button>
            <button onClick={send} disabled={!text.trim()} aria-label="Send" style={{ width: 34, height: 34, borderRadius: T.r.pill, background: text.trim() ? T.accent : T.glass, border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={text.trim() ? T.ink : T.faint} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function CommentRow({ com, onOpenMember, onDelete }: { com: Comment; onOpenMember: (id: string) => void; onDelete: () => void }) {
  const mine = com.author === 'me'
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => !mine && onOpenMember(com.author)} style={{ border: 'none', background: 'none', padding: 0, cursor: mine ? 'default' : 'pointer', flex: 'none' }}>
        <Avatar initial={com.initial} gradient={com.avatar} size={34} radius={11} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...inset, borderRadius: '4px 16px 16px 16px', padding: '9px 13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 13, color: T.text }}>{com.name}{mine ? ' (You)' : ''}</span>
            {com.tip && <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 10, color: T.amber, background: hexA(T.amber, 0.14), padding: '2px 7px', borderRadius: 8 }}>💡 TIP</span>}
          </div>
          <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 14, color: T.text, lineHeight: 1.4 }}>{com.text}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '3px 0 0 6px' }}>
          <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 11, color: T.faint }}>{relativeTime(com.at)}</span>
          {mine && (
            <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 11, color: T.faint, padding: 0 }}>Delete</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Composer ─────────────────────────────────────────────────────────────────
export function ComposeSheet({ open, initialType, circleId, onClose }: { open: boolean; initialType?: PostType; circleId?: string; onClose: () => void }) {
  const [type, setType] = useState<PostType>(initialType ?? 'update')
  const [text, setText] = useState('')

  useEffect(() => {
    if (open) {
      setType(initialType ?? 'update')
      setText('')
    }
  }, [open, initialType])

  function share() {
    if (!text.trim()) return
    actions.post({ type, text, circleId })
    onClose()
  }

  const def = POST_TYPE_BY_TYPE[type]
  const circle = circleId ? CIRCLE_BY_ID[circleId] : null

  return (
    <Sheet open={open} onClose={onClose} title={circle ? `Share with ${circle.name}` : 'Share with your squad'}>
      <div style={{ padding: '4px 18px 22px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {POST_TYPES.map((p) => (
            <button
              key={p.type}
              onClick={() => setType(p.type)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: type === p.type ? hexA(p.color, 0.12) : T.glass, border: `2px solid ${type === p.type ? p.color : T.line}`, borderRadius: 16, padding: '11px 4px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 12, color: type === p.type ? p.color : T.text }}>{p.label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={def.prompt}
          autoFocus
          rows={5}
          style={{ width: '100%', background: T.glass, border: `1px solid ${T.line}`, borderRadius: 18, padding: 16, fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 15, color: T.text, outline: 'none', resize: 'none', lineHeight: 1.45 }}
        />

        <button
          onClick={share}
          disabled={!text.trim()}
          className="pressable"
          style={{ width: '100%', marginTop: 16, background: text.trim() ? T.accent : T.glass, color: text.trim() ? T.ink : T.faint, border: 'none', borderRadius: T.r.pill, padding: 16, fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 18, cursor: text.trim() ? 'pointer' : 'default', ['--press-y' as string]: '3px' }}
        >
          Share {def.label.toLowerCase()} · +20 XP
        </button>
      </div>
    </Sheet>
  )
}

// ── Daily check-in (accountability buddies) ─────────────────────────────────
export function CheckInSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mood, setMood] = useState<Mood>('ok')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (open) {
      setMood('ok')
      setNote('')
    }
  }, [open])

  function submit() {
    actions.checkIn(mood, note)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="Daily check-in">
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 18, color: T.text, marginBottom: 14 }}>How's today going?</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => setMood(m.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: mood === m.id ? m.tint : T.glass, border: `2.5px solid ${mood === m.id ? m.color : T.line}`, borderRadius: 18, padding: '14px 4px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 30 }}>{m.emoji}</span>
              <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 13, color: mood === m.id ? m.color : T.text }}>{m.label}</span>
            </button>
          ))}
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything on your mind? Your buddy will see it. (optional)"
          rows={3}
          style={{ width: '100%', background: T.glass, border: `1px solid ${T.line}`, borderRadius: 18, padding: 16, fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 15, color: T.text, outline: 'none', resize: 'none', lineHeight: 1.45, marginBottom: 16 }}
        />
        <button
          onClick={submit}
          className="pressable"
          style={{ width: '100%', background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: 16, fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 18, cursor: 'pointer', ['--press-y' as string]: '3px' }}
        >
          Check in for today
        </button>
      </div>
    </Sheet>
  )
}

// ── Member profile ───────────────────────────────────────────────────────────
export function MemberProfileSheet({ memberId, onClose }: { memberId: string | null; onClose: () => void }) {
  const { data } = useStore()
  const m = memberId && memberId !== 'me' ? MEMBER_BY_ID[memberId] : null
  if (!m || !memberId) return null

  const isFriend = !!data?.friends.includes(memberId)
  const stats = [
    { value: m.level ?? 1, label: 'Level', color: T.accent },
    { value: m.streak ?? 0, label: 'Streak', color: T.amber },
    { value: m.wins ?? 0, label: 'Wins', color: T.green },
    { value: m.badges ?? 0, label: 'Badges', color: T.rose },
  ]

  return (
    <Sheet open={!!memberId} onClose={onClose} title={m.name}>
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 18 }}>
          <Avatar initial={m.initial} gradient={m.avatar} size={84} fontSize={34} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 22, color: T.text }}>{m.name}</span>
            {isFriend && <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 11, color: T.green, background: hexA(T.green, 0.14), padding: '3px 9px', borderRadius: 10 }}>✓ Friends</span>}
          </div>
          {m.bio && <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 14, color: T.dim, lineHeight: 1.45, marginTop: 4, maxWidth: 300 }}>{m.bio}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ flex: 1, ...inset, padding: '13px 4px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 20, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 10, color: T.dim }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: isFriend ? 10 : 0 }}>
          <button
            onClick={() => { actions.cheerMember(m.name); onClose() }}
            className="pressable"
            style={{ flex: 1, background: T.amber, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: 14, fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          >
            👏 Cheer on
          </button>
          {isFriend ? (
            <button onClick={() => { actions.nudgeFriend(m.name); onClose() }} style={{ flex: 1, background: T.solid, color: T.text, border: `1px solid ${T.line}`, borderRadius: T.r.pill, padding: 14, fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
              👋 Nudge
            </button>
          ) : (
            <button onClick={() => actions.addFriend(m.id)} className="pressable" style={{ flex: 1, background: T.accent, color: T.ink, border: 'none', borderRadius: T.r.pill, padding: 14, fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
              + Add friend
            </button>
          )}
        </div>
        {isFriend && (
          <button onClick={() => actions.removeFriend(m.id)} style={{ width: '100%', background: 'none', border: 'none', color: T.faint, fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 13, padding: 8, cursor: 'pointer' }}>Remove friend</button>
        )}
      </div>
    </Sheet>
  )
}

// ── Circle (support group) detail ────────────────────────────────────────────
export function CircleSheet({
  circleId, onClose, onOpenMember, onOpenPost, onCompose,
}: {
  circleId: string | null
  onClose: () => void
  onOpenMember: (id: string) => void
  onOpenPost: (id: string) => void
  onCompose: (circleId: string) => void
}) {
  const { data } = useStore()
  const c = circleId ? CIRCLE_BY_ID[circleId] : null
  if (!c || !circleId || !data) return null

  const joined = data.circles.includes(circleId)
  const members = c.members.map((id) => MEMBER_BY_ID[id]).filter(Boolean)
  const goal = circleGoalProgress(data, c)
  const feed = buildCircleFeed(data, circleId)

  return (
    <Sheet open={!!circleId} onClose={onClose} title={c.name}>
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ width: 60, height: 60, borderRadius: 19, background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flex: 'none' }}>{c.emoji}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 700, fontSize: 20, color: T.text }}>{c.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex' }}>
                {members.slice(0, 4).map((m, i) => (
                  <div key={m.id} style={{ marginLeft: i ? -8 : 0 }}>
                    <Avatar initial={m.initial} gradient={m.avatar} size={22} fontSize={10} ring={T.solid} />
                  </div>
                ))}
              </div>
              <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 12, color: c.color }}>{c.count} members</span>
            </div>
          </div>
        </div>

        <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 14, color: T.text, lineHeight: 1.5, marginBottom: 16 }}>{c.blurb}</div>

        {/* collective goal */}
        <div style={{ background: `linear-gradient(135deg,${c.color},${c.color}cc)`, borderRadius: 20, padding: 16, marginBottom: 16, boxShadow: `0 8px 20px ${c.color}40` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 11, color: 'rgba(255,255,255,.9)', textTransform: 'uppercase', letterSpacing: '.4px' }}>🎯 This week, together</span>
            <span style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 13, color: '#fff' }}>{Math.round(goal.pct * 100)}%</span>
          </div>
          <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 17, color: '#fff', marginBottom: 10 }}>{c.goal}</div>
          <div style={{ height: 12, borderRadius: 8, background: 'rgba(255,255,255,.28)', overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${goal.pct * 100}%`, height: '100%', borderRadius: 8, background: '#fff', transition: 'width .5s ease' }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,.95)' }}>{num(goal.collective)} / {num(goal.target)} {c.goalUnit}</span>
            {joined && <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 12, color: '#fff', background: 'rgba(255,255,255,.25)', padding: '3px 10px', borderRadius: 10 }}>You: +{num(goal.yours)}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,.25)' }}>
            <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 12, color: '#fff' }}>{c.rewardEmoji} Reward: {c.reward}</span>
            <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 12, color: 'rgba(255,255,255,.92)' }}>{goal.pct >= 1 ? '🎉 Smashed it!' : `⏳ ${c.daysLeft} days left`}</span>
          </div>
        </div>

        {goal.pct >= 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: hexA(T.amber, 0.12), border: `1px solid ${T.amber}`, borderRadius: 16, padding: '12px 14px', marginBottom: 16 }}>
            <span style={{ fontSize: 26 }}>{c.rewardEmoji}</span>
            <div>
              <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 15, color: T.text }}>Reward unlocked!</div>
              <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 13, color: T.amber }}>The circle earned the {c.reward} together.</div>
            </div>
          </div>
        )}

        {/* your personal reward toward the circle */}
        {joined && (
          <div style={{ background: goal.youEarned ? hexA(T.amber, 0.12) : T.glass, border: `1px solid ${goal.youEarned ? T.amber : T.line}`, borderRadius: 16, padding: '13px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: goal.youEarned ? 0 : 8 }}>
              <span style={{ fontSize: 22 }}>{goal.youEarned ? c.rewardEmoji : '🎖️'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 14, color: T.text }}>{goal.youEarned ? `You earned the ${c.reward} badge!` : `Earn the ${c.reward} badge`}</div>
                <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 12, color: goal.youEarned ? T.amber : T.dim }}>{goal.youEarned ? "It's on your profile. Nice work." : `Your part: ${num(goal.yours)} / ${num(goal.youTarget)}`}</div>
              </div>
            </div>
            {!goal.youEarned && (
              <div style={{ height: 8, borderRadius: 6, background: T.glassHi, overflow: 'hidden' }}>
                <div style={{ width: `${goal.youPct * 100}%`, height: '100%', borderRadius: 6, background: c.color, transition: 'width .5s ease' }} />
              </div>
            )}
          </div>
        )}

        {/* share with circle */}
        {joined && (
          <button onClick={() => onCompose(c.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, ...inset, padding: '12px 14px', marginBottom: 18, cursor: 'pointer' }}>
            <span style={{ width: 32, height: 32, borderRadius: 10, background: c.tint, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flex: 'none' }}>{c.emoji}</span>
            <span style={{ flex: 1, textAlign: 'left', fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 14, color: T.dim }}>Share with this circle…</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={c.color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" /></svg>
          </button>
        )}

        {/* circle feed */}
        <div style={{ ...eyebrow, fontSize: 12, marginBottom: 10 }}>Circle feed</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {feed.map((p) => (
            <CirclePost key={p.id} post={p} onOpenPost={onOpenPost} onOpenMember={onOpenMember} />
          ))}
          {feed.length === 0 && <div style={{ textAlign: 'center', padding: '14px 0', fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 13, color: T.faint }}>No posts yet, say hi 👋</div>}
        </div>

        <button
          onClick={() => { joined ? actions.leaveCircle(c.id) : actions.joinCircle(c.id); if (!joined) onClose() }}
          className="pressable"
          style={{ width: '100%', background: joined ? T.solid : c.color, color: joined ? T.dim : T.ink, border: joined ? `1px solid ${T.line}` : 'none', borderRadius: T.r.pill, padding: 16, fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 17, cursor: 'pointer', ['--press-y' as string]: '3px' }}
        >
          {joined ? 'Leave circle' : `Join ${c.name} · +15 XP`}
        </button>
      </div>
    </Sheet>
  )
}

function CirclePost({ post, onOpenPost, onOpenMember }: { post: DecoratedFeed; onOpenPost: (id: string) => void; onOpenMember: (id: string) => void }) {
  const isMine = post.author === 'me'
  const present = (Object.keys(post.reactionCounts) as Array<keyof typeof post.reactionCounts>).filter((k) => (post.reactionCounts[k] ?? 0) > 0)
  return (
    <div style={{ ...card, borderRadius: 18, padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <button onClick={() => !isMine && onOpenMember(post.author)} style={{ border: 'none', background: 'none', padding: 0, cursor: isMine ? 'default' : 'pointer', flex: 'none' }}>
          <Avatar initial={post.initial} gradient={post.avatar} size={36} radius={12} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 14, color: T.text }}>{post.name}{isMine ? ' (You)' : ''}</div>
          <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 11, color: T.dim }}>{post.action} · {relativeTime(post.at)}</div>
        </div>
      </div>
      <button onClick={() => onOpenPost(post.id)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}>
        {post.text && <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 13.5, color: T.text, lineHeight: 1.4, marginBottom: 8 }}>{post.text}</div>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {present.length > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {present.slice(0, 3).map((k) => <span key={k} style={{ fontSize: 12 }}>{REACTION_BY_KIND[k].emoji}</span>)}
              <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 800, fontSize: 11, color: T.dim }}>{post.totalReactions}</span>
            </span>
          )}
          <span style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 11, color: T.accent }}>{post.commentCount > 0 ? `${post.commentCount} ${post.commentCount === 1 ? 'reply' : 'replies'}` : 'Encourage'}</span>
        </div>
      </button>
    </div>
  )
}

// ── Notifications (support received) ─────────────────────────────────────────
export function NotificationsSheet({ open, onClose, onOpenMember }: { open: boolean; onClose: () => void; onOpenMember: (id: string) => void }) {
  const feed = useFeed()
  const notifs = feed
    .filter((p) => p.author === 'me')
    .flatMap((p) => p.comments.filter((c) => c.author !== 'me').map((c) => ({ c, post: p })))
    .sort((a, b) => b.c.at - a.c.at)
    .slice(0, 20)

  return (
    <Sheet open={open} onClose={onClose} title="Cheers for you">
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: `linear-gradient(135deg,${T.amber},${T.rose})`, borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>💛</span>
          <div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 16, color: '#fff' }}>Your squad's got you</div>
            <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,.9)' }}>Every post you share, the community shows up for you.</div>
          </div>
        </div>

        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📣</div>
            <div style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600, fontSize: 16, color: T.text, marginBottom: 4 }}>Nothing yet</div>
            <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 13, color: T.dim }}>Share a win or a tip, your squad will cheer you on.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifs.map(({ c, post }) => (
              <button key={c.id} onClick={() => onOpenMember(c.author)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', ...card, borderRadius: 16, padding: 12, cursor: 'pointer', textAlign: 'left' }}>
                <Avatar initial={c.initial} gradient={c.avatar} size={42} radius={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 14, color: T.text, lineHeight: 1.35 }}>
                    <b style={{ fontFamily: 'Bricolage Grotesque', fontWeight: 600 }}>{c.name}</b> on your {post.postType ?? 'post'}: “{c.text}”
                  </div>
                  <div style={{ fontFamily: 'Hanken Grotesk', fontWeight: 700, fontSize: 11, color: T.faint, marginTop: 2 }}>{relativeTime(c.at)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}
