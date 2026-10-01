import { Icon, type IconName } from './Icon'
import type { Tab } from '../lib/types'

const TABS: { tab: Tab; icon: IconName; label: string }[] = [
  { tab: 'profile', icon: 'user', label: 'Profile' },
  { tab: 'feed', icon: 'activity', label: 'Feed' },
  { tab: 'friends', icon: 'users', label: 'Friends' },
  { tab: 'ranks', icon: 'award', label: 'Ranks' },
]

export function NavBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const item = ({ tab: t, icon, label }: (typeof TABS)[number]) => (
    <button key={t} className={`t ${tab === t ? 'on' : ''}`} onClick={() => onTab(t)}>
      <Icon name={icon} />
      {label}
    </button>
  )
  return (
    <nav>
      {TABS.slice(0, 2).map(item)}
      <button className="fab" onClick={() => onTab('log')} aria-label="Log a workout">
        <Icon name="plus" />
      </button>
      {TABS.slice(2).map(item)}
    </nav>
  )
}
