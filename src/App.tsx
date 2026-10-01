import { useEffect, useState } from 'react'
import { NavBar } from './components/NavBar'
import { ToastProvider } from './components/Toast'
import { useDraft } from './hooks/useDraft'
import { useSession } from './hooks/useSession'
import { getProfile } from './lib/api'
import type { Profile as ProfileData, Tab } from './lib/types'
import { Auth } from './screens/Auth'
import { Feed } from './screens/Feed'
import { Friends } from './screens/Friends'
import { Log } from './screens/Log'
import { Profile } from './screens/Profile'
import { Ranks } from './screens/Ranks'

export default function App() {
  const session = useSession()
  const [tab, setTab] = useState<Tab>('profile')
  const [me, setMe] = useState<ProfileData | null>(null)
  const draft = useDraft()
  const userId = session?.user.id

  useEffect(() => {
    if (userId) getProfile(userId).then(setMe).catch(() => {})
    else setMe(null)
  }, [userId])

  if (session === undefined) return null // on vérifie encore si une session existe

  return (
    <div id="app">
      <ToastProvider>
        <main>
          {!userId ? (
            <Auth />
          ) : (
            <>
              {tab === 'profile' && <Profile userId={userId} me={me} />}
              {tab === 'feed' && <Feed userId={userId} onLog={() => setTab('log')} />}
              {tab === 'log' && <Log draft={draft} onShared={() => setTab('feed')} />}
              {tab === 'friends' && <Friends userId={userId} />}
              {tab === 'ranks' && <Ranks userId={userId} />}
            </>
          )}
        </main>
        {userId && <NavBar tab={tab} onTab={setTab} />}
      </ToastProvider>
    </div>
  )
}
