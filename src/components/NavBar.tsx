import { Icon, type IconName } from './Icon'
import { useI18n, type TKey } from '../lib/i18n'
import type { Tab } from '../lib/types'

const TABS: { tab: Tab; icon: IconName; label: TKey }[] = [
  { tab: 'profile', icon: 'user', label: 'nav.profile' },
  { tab: 'feed', icon: 'activity', label: 'nav.feed' },
  { tab: 'friends', icon: 'users', label: 'nav.friends' },
  { tab: 'ranks', icon: 'award', label: 'nav.ranks' },
]

export function NavBar({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const { t: tr } = useI18n()
  const item = ({ tab: t, icon, label }: (typeof TABS)[number]) => (
    <button key={t} className={`t ${tab === t ? 'on' : ''}`} onClick={() => onTab(t)}>
      <Icon name={icon} />
      {tr(label)}
    </button>
  )
  return (
    <nav>
      {TABS.slice(0, 2).map(item)}
      <button className="fab" onClick={() => onTab('log')} aria-label={tr('nav.log')}>
        <Icon name="plus" />
      </button>
      {TABS.slice(2).map(item)}
    </nav>
  )
}
