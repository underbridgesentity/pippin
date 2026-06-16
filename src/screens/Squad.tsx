import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { useDerived } from '../lib/hooks'
import { num } from '../lib/format'
import type { LeaderRow } from '../lib/selectors'

const TABS = ['Leaderboard', 'Friends', 'My Squad'] as const
type Tab = (typeof TABS)[number]

export function Squad() {
  const d = useDerived()
  const [tab, setTab] = useState<Tab>('Leaderboard')
  if (!d) return null

  const top = d.leaderboard.slice(0, 3)

  return (
    <div data-screen-label="Squad" style={{ padding: '56px 18px 116px' }}>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 30, color: '#241544', marginBottom: 14 }}>Squad</div>

      {/* segmented */}
      <div style={{ display: 'flex', background: '#EDE6FA', borderRadius: 16, padding: 4, marginBottom: 18 }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{ flex: 1, textAlign: 'center', background: tab === t ? '#fff' : 'transparent', borderRadius: 13, padding: 9, fontFamily: 'Fredoka', fontWeight: 600, fontSize: 14, color: tab === t ? '#7C3AF6' : '#9B91B8', border: 'none', cursor: 'pointer', boxShadow: tab === t ? '0 2px 6px rgba(120,60,180,.1)' : 'none' }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Leaderboard' && (
        <>
          {/* podium */}
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

          {/* full list */}
          <div style={{ background: '#fff', borderRadius: 24, padding: 8, boxShadow: '0 6px 16px rgba(120,60,180,.06)' }}>
            {d.leaderboard.map((l) => (
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
            Log meals &amp; activities to climb — you're #{d.myRank} this week.
          </div>
        </>
      )}

      {tab === 'Friends' && (
        <EmptyTab
          emoji="👋"
          title="Bring your crew"
          body="Fettle is better with friends. Invite people to do challenges together and cheer each other on."
          cta="Invite friends"
        />
      )}

      {tab === 'My Squad' && (
        <EmptyTab
          emoji="🤝"
          title="The Early Birds"
          body="You're riding with The Early Birds on the Move Marathon. Keep logging to push the squad past the goal."
          cta="View squad goal"
        />
      )}
    </div>
  )
}

function Podium({
  row, place, avatarSize, fontSize, barHeight, barBg, ring, badge, xpColor,
}: {
  row: LeaderRow; place: number; avatarSize: number; fontSize: number; barHeight: number; barBg: string; ring: string; badge: string; xpColor: string
}) {
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
    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: size, height: size, borderRadius: '50%', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Fredoka', fontWeight: 700, fontSize: size * 0.55, color: '#fff' }}>
      {n}
    </div>
  )
}

function EmptyTab({ emoji, title, body, cta }: { emoji: string; title: string; body: string; cta: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 26, padding: '34px 24px', textAlign: 'center', boxShadow: '0 6px 16px rgba(120,60,180,.06)' }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>{emoji}</div>
      <div style={{ fontFamily: 'Fredoka', fontWeight: 600, fontSize: 20, color: '#241544', marginBottom: 8 }}>{title}</div>
      <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 14, color: '#9B91B8', marginBottom: 18, lineHeight: 1.4 }}>{body}</div>
      <button className="pressable" style={{ background: '#7C3AF6', color: '#fff', border: 'none', borderRadius: 16, padding: '13px 22px', fontFamily: 'Fredoka', fontWeight: 600, fontSize: 15, cursor: 'pointer', boxShadow: '0 4px 0 #5B22C9', ['--press-shadow' as string]: '0 2px 0 #5B22C9' }}>
        {cta}
      </button>
    </div>
  )
}
