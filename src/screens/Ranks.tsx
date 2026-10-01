import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useLoad } from '../hooks/useLoad'
import { getLeaderboard } from '../lib/api'
import type { Metric } from '../lib/types'

const TABS: { metric: Metric; label: string; unit: string }[] = [
  { metric: 'streak', label: 'Streak', unit: ' Days' },
  { metric: 'volume', label: 'Volume (Lbs)', unit: ' lbs' },
  { metric: 'sessions', label: 'Sessions', unit: '' },
]

export function Ranks({ userId }: { userId: string }) {
  const [metric, setMetric] = useState<Metric>('streak')
  const { data: rows } = useLoad(() => getLeaderboard(metric), [metric])
  const unit = TABS.find((t) => t.metric === metric)!.unit

  return (
    <>
      <div className="row hd">
        <h1>Squad Standings</h1>
        <button className="ib" aria-label="Add friend"><Icon name="uadd" /></button>
      </div>
      <div className="seg" role="tablist">
        {TABS.map((t) => (
          <button key={t.metric} role="tab" aria-selected={t.metric === metric} className={t.metric === metric ? 'on' : ''} onClick={() => setMetric(t.metric)}>
            {t.label}
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
            <b className="g" style={{ fontSize: 13 }}>{r.display_name}{me ? ' (Me)' : ''}</b>
            <b style={{ fontSize: 12, color: me ? 'var(--lime)' : undefined }}>{Math.round(r.value).toLocaleString('en-US')}{unit}</b>
          </div>
        )
      })}
    </>
  )
}
