import { useEffect, useState } from 'react'
import { NavBar } from './components/NavBar'
import { ToastProvider } from './components/Toast'
import { useDraft } from './hooks/useDraft'
import { useSession } from './hooks/useSession'
import { getProfile } from './lib/api'
import { I18nProvider } from './lib/i18n'
import type { Profile as ProfileData, Tab } from './lib/types'
import { Auth } from './screens/Auth'
import { Feed } from './screens/Feed'
import { Friends } from './screens/Friends'
import { Log } from './screens/Log'
import { Profile } from './screens/Profile'
import { Ranks } from './screens/Ranks'
import { Start } from './screens/Start'

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  )
}

function AppContent() {
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
      {__APP_LABEL__ && <div className="envbar">{__APP_LABEL__}</div>}
      <ToastProvider>
        <main>
          {!userId ? (
            <Auth />
          ) : (
            <>
              {tab === 'profile' && <Profile userId={userId} me={me} />}
              {tab === 'feed' && <Feed userId={userId} onLog={() => setTab('log')} />}
              {tab === 'log' &&
                (draft.draft ? (
                  <Log draft={draft} onShared={() => setTab('feed')} />
                ) : (
                  <Start userId={userId} onStart={draft.start} />
                ))}
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
