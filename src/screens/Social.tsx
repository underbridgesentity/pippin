import { useEffect, useRef, useState } from 'react'
import { Sheet } from '../components/Sheet'
import { Avatar } from '../components/Avatar'
import { actions, useStore } from '../lib/store'
import { useFeed } from '../lib/hooks'
import { REACTIONS } from '../lib/social'
import { POST_TYPES, POST_TYPE_BY_TYPE } from '../lib/social'
import { MEMBER_BY_ID } from '../lib/seed'
import { relativeTime } from '../lib/format'
import type { DecoratedFeed } from '../lib/selectors'
import type { Comment, PostType } from '../lib/types'

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
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, color: '#241544' }}>{post.name}{isMine ? ' (You)' : ''}</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 12, color: '#9B91B8' }}>{post.action} · {relativeTime(post.at)}</div>
          </div>
        </div>

        {post.text && <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#3A2B5C', lineHeight: 1.45, marginBottom: 12 }}>{post.text}</div>}
        {post.stat && <div style={{ display: 'inline-flex', background: '#F4EFFF', borderRadius: 12, padding: '6px 12px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: '#5B22C9', marginBottom: 12 }}>{post.stat}</div>}

        {/* reaction bar */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          {REACTIONS.map((r) => {
            const active = post.myReaction === r.kind
            const count = post.reactionCounts[r.kind] ?? 0
            return (
              <button
                key={r.kind}
                onClick={() => actions.react(post.id, r.kind)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: active ? r.color : '#fff', border: `2px solid ${active ? r.color : '#ECE6FA'}`, borderRadius: 14, padding: '7px 12px', cursor: 'pointer' }}
              >
                <span style={{ fontSize: 16, animation: active ? 'pep-cheer .35s ease' : undefined }}>{r.emoji}</span>
                <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 13, color: active ? '#fff' : '#7A719B' }}>{count}</span>
              </button>
            )
          })}
        </div>

        {/* comments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
          {post.comments.length === 0 && (
            <div style={{ textAlign: 'center', padding: '14px 0', fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#B6AEC9' }}>Be the first to cheer them on 💛</div>
          )}
          {post.comments.map((com) => (
            <CommentRow key={com.id} com={com} onOpenMember={onOpenMember} />
          ))}
          <div ref={endRef} />
        </div>
      </div>

      {/* composer */}
      <div style={{ position: 'sticky', bottom: 0, background: '#F4EFFF', borderTop: '1px solid #E7DEF7', padding: '12px 18px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <Avatar initial={(account.name[0] || 'Y').toUpperCase()} gradient={account.avatar} size={36} radius={12} />
          <div style={{ flex: 1, background: '#fff', border: '2px solid #ECE6FA', borderRadius: 18, padding: '6px 6px 6px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
              placeholder={tip ? 'Share a helpful tip…' : 'Add some encouragement…'}
              style={{ flex: 1, border: 'none', outline: 'none', background: 'none', fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#241544', minWidth: 0 }}
            />
            <button onClick={() => setTip((t) => !t)} aria-label="Mark as tip" title="Mark as tip" style={{ width: 30, height: 30, borderRadius: 9, background: tip ? '#FFF0DC' : 'transparent', border: 'none', cursor: 'pointer', fontSize: 15 }}>💡</button>
            <button onClick={send} disabled={!text.trim()} aria-label="Send" style={{ width: 34, height: 34, borderRadius: 11, background: text.trim() ? '#7C3AF6' : '#D9CEF0', border: 'none', cursor: text.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" /></svg>
            </button>
          </div>
        </div>
      </div>
    </Sheet>
  )
}

function CommentRow({ com, onOpenMember }: { com: Comment; onOpenMember: (id: string) => void }) {
  const mine = com.author === 'me'
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button onClick={() => !mine && onOpenMember(com.author)} style={{ border: 'none', background: 'none', padding: 0, cursor: mine ? 'default' : 'pointer', flex: 'none' }}>
        <Avatar initial={com.initial} gradient={com.avatar} size={34} radius={11} />
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: '#fff', borderRadius: '4px 16px 16px 16px', padding: '9px 13px', boxShadow: '0 3px 10px rgba(120,60,180,.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 2 }}>
            <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 13, color: '#241544' }}>{com.name}{mine ? ' (You)' : ''}</span>
            {com.tip && <span style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 10, color: '#FF8A1E', background: '#FFF0DC', padding: '2px 7px', borderRadius: 8 }}>💡 TIP</span>}
          </div>
          <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#3A2B5C', lineHeight: 1.4 }}>{com.text}</div>
        </div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, color: '#C3BBD6', padding: '3px 0 0 6px' }}>{relativeTime(com.at)}</div>
      </div>
    </div>
  )
}

// ── Composer ─────────────────────────────────────────────────────────────────
export function ComposeSheet({ open, initialType, onClose }: { open: boolean; initialType?: PostType; onClose: () => void }) {
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
    actions.post({ type, text })
    onClose()
  }

  const def = POST_TYPE_BY_TYPE[type]

  return (
    <Sheet open={open} onClose={onClose} title="Share with your squad">
      <div style={{ padding: '4px 18px 22px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {POST_TYPES.map((p) => (
            <button
              key={p.type}
              onClick={() => setType(p.type)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: type === p.type ? p.tint : '#fff', border: `2.5px solid ${type === p.type ? p.color : '#ECE6FA'}`, borderRadius: 16, padding: '11px 4px', cursor: 'pointer' }}
            >
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <span style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 12, color: type === p.type ? p.color : '#241544' }}>{p.label}</span>
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={def.prompt}
          autoFocus
          rows={5}
          style={{ width: '100%', background: '#fff', border: '2.5px solid #ECE6FA', borderRadius: 18, padding: 16, fontFamily: 'Nunito', fontWeight: 700, fontSize: 15, color: '#241544', outline: 'none', resize: 'none', lineHeight: 1.45 }}
        />

        <button
          onClick={share}
          disabled={!text.trim()}
          className="pressable"
          style={{ width: '100%', marginTop: 16, background: text.trim() ? def.color : '#C9BFE0', color: '#fff', border: 'none', borderRadius: 18, padding: 16, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 18, cursor: text.trim() ? 'pointer' : 'default', boxShadow: text.trim() ? '0 5px 0 rgba(0,0,0,.12)' : 'none', ['--press-y' as string]: '3px', ['--press-shadow' as string]: '0 2px 0 rgba(0,0,0,.12)' }}
        >
          Share {def.label.toLowerCase()} · +20 XP
        </button>
      </div>
    </Sheet>
  )
}

// ── Member profile ───────────────────────────────────────────────────────────
export function MemberProfileSheet({ memberId, onClose }: { memberId: string | null; onClose: () => void }) {
  if (!memberId || memberId === 'me') return null
  const m = MEMBER_BY_ID[memberId]
  if (!m) return null

  const stats = [
    { value: m.level ?? 1, label: 'Level', color: '#7C3AF6' },
    { value: m.streak ?? 0, label: 'Streak', color: '#FF8A1E' },
    { value: m.wins ?? 0, label: 'Wins', color: '#18C98A' },
    { value: m.badges ?? 0, label: 'Badges', color: '#FF4D6D' },
  ]

  return (
    <Sheet open={!!memberId} onClose={onClose} title={m.name}>
      <div style={{ padding: '4px 18px 24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 18 }}>
          <Avatar initial={m.initial} gradient={m.avatar} size={84} fontSize={34} />
          <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 22, color: '#241544', marginTop: 10 }}>{m.name}</div>
          {m.bio && <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#9B91B8', lineHeight: 1.45, marginTop: 4, maxWidth: 300 }}>{m.bio}</div>}
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ flex: 1, background: '#fff', borderRadius: 16, padding: '13px 4px', textAlign: 'center', boxShadow: '0 4px 12px rgba(120,60,180,.05)' }}>
              <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 20, color: s.color }}>{s.value}</div>
              <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 10, color: '#9B91B8' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { actions.cheerMember(m.name); onClose() }}
            className="pressable"
            style={{ flex: 1, background: '#FF8A1E', color: '#fff', border: 'none', borderRadius: 16, padding: 14, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 4px 0 #D9740F', ['--press-shadow' as string]: '0 2px 0 #D9740F' }}
          >
            👏 Cheer on
          </button>
          <button
            onClick={() => { actions.cheerMember(m.name); onClose() }}
            style={{ flex: 1, background: '#EFE7FF', color: '#7C3AF6', border: 'none', borderRadius: 16, padding: 14, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          >
            + Follow
          </button>
        </div>
      </div>
    </Sheet>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg,#FF8A1E,#FF4D6D)', borderRadius: 18, padding: 16, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>💛</span>
          <div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#fff' }}>Your squad's got you</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: 'rgba(255,255,255,.9)' }}>Every post you share, the community shows up for you.</div>
          </div>
        </div>

        {notifs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 16px' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>📣</div>
            <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 16, color: '#241544', marginBottom: 4 }}>Nothing yet</div>
            <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 13, color: '#9B91B8' }}>Share a win or a tip — your squad will cheer you on.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {notifs.map(({ c, post }) => (
              <button key={c.id} onClick={() => onOpenMember(c.author)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', background: '#fff', border: 'none', borderRadius: 16, padding: 12, cursor: 'pointer', textAlign: 'left', boxShadow: '0 4px 12px rgba(120,60,180,.05)' }}>
                <Avatar initial={c.initial} gradient={c.avatar} size={42} radius={14} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#3A2B5C', lineHeight: 1.35 }}>
                    <b style={{ fontFamily: 'Fredoka', fontWeight: 600 }}>{c.name}</b> on your {post.postType ?? 'post'}: “{c.text}”
                  </div>
                  <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 11, color: '#C3BBD6', marginTop: 2 }}>{relativeTime(c.at)}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  )
}
