import { Avatar } from '../components/Avatar'
import { useLoad } from '../hooks/useLoad'
import { getProfileStats } from '../lib/api'
import { fdate } from '../lib/format'
import { LANGS, useI18n, type TFn } from '../lib/i18n'
import { supabase } from '../lib/supabase'
import type { Profile as ProfileData } from '../lib/types'

export function Profile({ userId, me }: { userId: string; me: ProfileData | null }) {
  const { t, lang, setLang, locale } = useI18n()
  const { data: stats } = useLoad(() => getProfileStats(userId), [userId])
  const name = me?.display_name ?? t('profile.you')

  return (
    <>
      <div className="row hd" style={{ height: 100, justifyContent: 'flex-start', gap: 16 }}>
        <div style={{ border: '2px solid var(--lime)', borderRadius: '50%', padding: 2 }}>
          <Avatar name={name} size={56} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 20 }}>{name}</h1>
          <div className="lime" style={{ fontSize: 12 }}>@{me?.username}</div>
        </div>
        <div className="lang" role="group" aria-label={t('profile.language')}>
          {LANGS.map((l) => (
            <button key={l} className={l === lang ? 'on' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {!stats ? (
        <p className="empty">{t('common.loading')}</p>
      ) : (
        <>
          <div className="stats">
            <div className="card stat"><span className="mute">{t('profile.workouts')}</span><b>{stats.workouts}</b></div>
            <div className="card stat"><span className="mute">{t('profile.streak')}</span><b className="lime">{t('common.day', { n: stats.streak })} 🔥</b></div>
            <div className="card stat"><span className="mute">{t('profile.prs')}</span><b className="cyan">{stats.records.length}</b></div>
          </div>
          <BenchChart weekly={stats.weeklyBench} t={t} />
          <div className="sec">{t('profile.records')}</div>
          {stats.records.slice(0, 3).map((r) => (
            <div key={r.name} className="card pr row">
              <div><b>{r.name}</b><div className="mute">{fdate(r.date, locale)}</div></div>
              <span className="badge">{t('common.lbs', { n: r.lbs })}</span>
            </div>
          ))}
          {!stats.records.length && <p className="empty">{t('profile.noRecords')}</p>}
          <button className="signout" onClick={() => confirm(t('profile.confirmSignOut')) && supabase.auth.signOut()}>
            {t('profile.signOut')}
          </button>
        </>
      )}
    </>
  )
}

function BenchChart({ weekly, t }: { weekly: number[]; t: TFn }) {
  const max = Math.max(...weekly, 1)
  const point = (v: number, i: number) => ({ x: i * 53.3 + 4, y: 84 - (v / max) * 80 })
  const points = weekly.map(point)
  const lastWeek = weekly[5]
  const pct = lastWeek > 0 ? Math.round(((weekly[6] - lastWeek) / lastWeek) * 100) : null

  return (
    <>
      <div className="row sec">
        <span>{t('profile.benchTrend')}</span>
        <span className="cyan" style={{ fontSize: 11 }}>{pct === null ? '' : t('profile.vsLastWeek', { pct: `${pct >= 0 ? '+' : ''}${pct}` })}</span>
      </div>
      <div className="card" style={{ padding: '16px 16px 10px' }}>
        <svg viewBox="0 0 328 88" style={{ width: '100%', height: 'auto', strokeWidth: 1.5 }} role="img" aria-label={t('profile.benchAria')}>
          <g stroke="#1d232e"><path d="M4 4h320M4 44h320M4 84h320" /></g>
          <polyline points={points.map((p) => `${p.x},${p.y}`).join(' ')} stroke="#ccff00" strokeWidth={2} />
          {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#ccff00" stroke="none" />)}
        </svg>
        <div className="row mute" style={{ marginTop: 8 }}>
          {weekly.map((_, i) => <span key={i}>{t('profile.week', { n: i + 1 })}</span>)}
        </div>
      </div>
    </>
  )
}
