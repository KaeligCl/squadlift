import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useLoad } from '../hooks/useLoad'
import { getLeaderboard } from '../lib/api'
import { useI18n, type TKey } from '../lib/i18n'
import type { Metric } from '../lib/types'

const TABS: { metric: Metric; label: TKey }[] = [
  { metric: 'streak', label: 'ranks.streak' },
  { metric: 'volume', label: 'ranks.volume' },
  { metric: 'sessions', label: 'ranks.sessions' },
]

export function Ranks({ userId }: { userId: string }) {
  const { t, locale } = useI18n()
  const [metric, setMetric] = useState<Metric>('streak')
  const { data: rows } = useLoad(() => getLeaderboard(metric), [metric])
  const format = (n: number) =>
    metric === 'streak' ? t('common.day', { n }) : metric === 'volume' ? t('common.lbs', { n: n.toLocaleString(locale) }) : n.toLocaleString(locale)

  return (
    <>
      <div className="row hd">
        <h1>{t('ranks.title')}</h1>
        <button className="ib" aria-label={t('common.addFriend')}><Icon name="uadd" /></button>
      </div>
      <div className="seg" role="tablist">
        {TABS.map((tab) => (
          <button key={tab.metric} role="tab" aria-selected={tab.metric === metric} className={tab.metric === metric ? 'on' : ''} onClick={() => setMetric(tab.metric)}>
            {t(tab.label)}
          </button>
        ))}
      </div>

      {rows?.map((r, i) => {
        const me = r.user_id === userId
        const medal = i === 0 ? 'var(--lime)' : i === 1 ? 'var(--cyan)' : undefined
        return (
          <div key={r.user_id} className={`card li ${me ? 'me' : ''}`}>
            <div className="pos" style={medal ? { background: medal, color: '#050608' } : undefined}>{i + 1}</div>
            <Avatar name={r.display_name} size={36} />
            <b className="g" style={{ fontSize: 13 }}>{r.display_name}{me ? ` ${t('ranks.me')}` : ''}</b>
            <b style={{ fontSize: 12, color: me ? 'var(--lime)' : undefined }}>{format(Math.round(r.value))}</b>
          </div>
        )
      })}
    </>
  )
}
