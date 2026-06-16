import { useState } from 'react'
import { IOSDevice } from './components/IOSDevice'
import { TabBar, type Tab } from './components/TabBar'
import { Toast } from './components/Toast'
import { Mascot } from './components/Mascot'
import { Home } from './screens/Home'
import { Quests } from './screens/Quests'
import { Squad } from './screens/Squad'
import { Profile } from './screens/Profile'
import { Auth } from './screens/Auth'
import { Welcome } from './screens/Welcome'
import { Capture } from './screens/Capture'
import { AddActivity } from './screens/AddActivity'
import { Settings } from './screens/Settings'
import { StoreProvider, useStore } from './lib/store'
import { firstName } from './lib/format'

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
  const { status, account, data, toast } = useStore()
  const [tab, setTab] = useState<Tab>('home')
  const [capture, setCapture] = useState(false)
  const [activity, setActivity] = useState(false)
  const [settings, setSettings] = useState(false)

  if (status === 'loading') return <Splash />
  if (!account || !data) return <Auth />
  if (!data.welcomed) return <Welcome name={firstName(account.name)} />

  return (
    <>
      <div className="fettle-scroll" style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden' }}>
        {tab === 'home' && <Home onOpenCapture={() => setCapture(true)} onAddActivity={() => setActivity(true)} />}
        {tab === 'challenges' && <Quests />}
        {tab === 'squad' && <Squad />}
        {tab === 'profile' && <Profile onOpenSettings={() => setSettings(true)} />}
      </div>

      <TabBar tab={tab} onTab={setTab} onCapture={() => setCapture(true)} />

      {capture && <Capture onClose={() => setCapture(false)} />}
      <AddActivity open={activity} onClose={() => setActivity(false)} />
      <Settings open={settings} onClose={() => setSettings(false)} />

      {toast && <Toast key={toast.key} message={toast.msg} />}
    </>
  )
}

function Splash() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'radial-gradient(circle at 50% 30%,#FBEBFF,#F4EFFF 60%)' }}>
      <Mascot stage="Sprout" size={92} float />
      <div style={{ fontFamily: 'Fredoka', fontWeight: 700, fontSize: 34, color: '#7C3AF6' }}>Fettle</div>
    </div>
  )
}
