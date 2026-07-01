import { useEffect, useRef, useState } from 'react'
import { IOSDevice } from './components/IOSDevice'
import { TabBar, type Tab } from './components/TabBar'
import { Toast } from './components/Toast'
import { Mascot } from './components/Mascot'
import { CelebrationOverlay } from './components/Celebration'
import { StoryComposer } from './components/StoryComposer'
import { T } from './lib/theme'
import { Home } from './screens/Home'
import { Quests } from './screens/Quests'
import { Squad } from './screens/Squad'
import { Profile } from './screens/Profile'
import { Auth } from './screens/Auth'
import { Welcome } from './screens/Welcome'
import { Capture } from './screens/Capture'
import { AddActivity } from './screens/AddActivity'
import { Settings } from './screens/Settings'
import { CheckInSheet, CircleSheet, CommentsSheet, ComposeSheet, MemberProfileSheet, NotificationsSheet } from './screens/Social'
import { StoreProvider, useStore, actions, type Celebration } from './lib/store'
import { api } from './lib/api'
import { findDecoratedPost } from './lib/selectors'
import { firstName } from './lib/format'
import type { PostType } from './lib/types'

export function App() {
  return (
    <StoreProvider>
      <div className="fettle-stage">
        <IOSDevice>
          <Root />
        </IOSDevice>
      </div>
    </StoreProvider>
  )
}

function Root() {
  const { status, account, data, toast, celebration } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [capture, setCapture] = useState(false)
  const [activity, setActivity] = useState(false)
  const [settings, setSettings] = useState(false)
  const [compose, setCompose] = useState<{ open: boolean; type?: PostType; circleId?: string }>({ open: false })
  const [postId, setPostId] = useState<string | null>(null)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [circleId, setCircleId] = useState<string | null>(null)
  const [notifs, setNotifs] = useState(false)
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [storyCeleb, setStoryCeleb] = useState<Celebration | null>(null)

  // The four tabs share one scroll container, so reset it to the top on each
  // tab change (otherwise a tab opens at the previous tab's scroll position).
  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => { scrollRef.current?.scrollTo(0, 0) }, [tab])

  // Invite link: ?add=<username> sends that person a friend request once signed in.
  useEffect(() => {
    if (!account || !api.realFriends) return
    const handle = new URLSearchParams(window.location.search).get('add')
    if (!handle) return
    void (async () => {
      const target = await api.findByUsername(handle)
      if (target && target.id !== account.id) {
        const res = await api.sendFriendRequest(target.id)
        actions.toast(res.ok ? `Friend request sent to ${target.name} 🤝` : res.error || 'Could not send request')
      }
      const url = new URL(window.location.href)
      url.searchParams.delete('add')
      window.history.replaceState(null, '', url.pathname + url.search)
    })()
  }, [account?.id])

  // Surface OAuth redirect errors (e.g. a provider that is not configured).
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, '')
    const search = window.location.search.replace(/^\?/, '')
    const p = new URLSearchParams(hash.includes('error') ? hash : search)
    const desc = p.get('error_description') || p.get('error')
    if (desc) {
      actions.toast(`Sign-in failed: ${decodeURIComponent(desc).replace(/\+/g, ' ')}`)
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  if (status === 'loading') return <Splash />
  if (!account || !data) return <Auth />
  if (!data.welcomed) return <Welcome name={firstName(account.name)} />

  const openPost = postId && data ? findDecoratedPost(data, postId) : null

  return (
    <>
      <div ref={scrollRef} className="fettle-scroll" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
        {tab === 'home' && (
          <Home
            onOpenCapture={() => setCapture(true)}
            onAddActivity={() => setActivity(true)}
            onCompose={() => setCompose({ open: true, type: 'update' })}
            onOpenPost={setPostId}
            onOpenMember={setMemberId}
            onOpenNotifications={() => setNotifs(true)}
          />
        )}
        {tab === 'challenges' && <Quests />}
        {tab === 'squad' && <Squad onOpenMember={setMemberId} onOpenCircle={setCircleId} onCheckIn={() => setCheckInOpen(true)} />}
        {tab === 'profile' && <Profile onOpenSettings={() => setSettings(true)} onShareWin={() => setCompose({ open: true, type: 'win' })} onSnap={() => setCapture(true)} />}
      </div>

      <TabBar tab={tab} onTab={setTab} onCapture={() => setCapture(true)} />

      {capture && <Capture onClose={() => setCapture(false)} />}
      <AddActivity open={activity} onClose={() => setActivity(false)} />
      <Settings open={settings} onClose={() => setSettings(false)} />

      {/* social overlays, DOM order = stacking order (later sits on top).
          Circle (bottom) < its post thread < member profile (top). */}
      <CircleSheet
        circleId={circleId}
        onClose={() => setCircleId(null)}
        onOpenMember={setMemberId}
        onOpenPost={setPostId}
        onCompose={(cid) => setCompose({ open: true, type: 'update', circleId: cid })}
      />
      <ComposeSheet open={compose.open} initialType={compose.type} circleId={compose.circleId} onClose={() => setCompose({ open: false })} />
      <CheckInSheet open={checkInOpen} onClose={() => setCheckInOpen(false)} />
      <NotificationsSheet open={notifs} onClose={() => setNotifs(false)} onOpenMember={(id) => { setNotifs(false); setMemberId(id) }} />
      <CommentsSheet post={openPost} onClose={() => setPostId(null)} onOpenMember={setMemberId} />
      <MemberProfileSheet memberId={memberId} onClose={() => setMemberId(null)} />

      {toast && <Toast key={toast.key} message={toast.msg} />}
      {celebration && <CelebrationOverlay data={celebration} onDismiss={() => actions.dismissCelebration()} onShare={() => setStoryCeleb(celebration)} />}
      <StoryComposer story={storyCeleb ? { type: 'milestone', celebration: storyCeleb } : null} name={account?.name ?? ''} onClose={() => setStoryCeleb(null)} />
    </>
  )
}

function Splash() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: `radial-gradient(circle at 50% 30%,${T.bgElev},${T.bg} 60%)` }}>
      <Mascot stage="Sprout" size={92} float />
      <div style={{ fontFamily: T.display, fontWeight: 700, fontSize: 34, color: T.accent }}>Pippin</div>
    </div>
  )
}
