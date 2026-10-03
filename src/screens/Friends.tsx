import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { acceptFriendRequest, findProfile, getFriends, sendFriendRequest } from '../lib/api'
import { ago } from '../lib/format'
import { useI18n } from '../lib/i18n'

export function Friends({ userId }: { userId: string }) {
  const toast = useToast()
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const { data, reload } = useLoad(() => getFriends(userId), [userId])

  const friends = (data?.friends ?? []).filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
  const requests = data?.requests ?? []

  async function addFriend() {
    const q = prompt(t('friends.prompt'))
    if (!q) return
    const found = await findProfile(q, userId)
    if (!found) return toast(t('friends.notFound'))
    if (!confirm(t('friends.confirm', { name: found.display_name }))) return
    try {
      await sendFriendRequest(userId, found.id)
      toast(t('friends.sent'))
      reload()
    } catch {
      toast(t('friends.sentFail'))
    }
  }

  async function accept(id: number) {
    try {
      await acceptFriendRequest(id)
    } catch {
      toast(t('friends.acceptFail'))
    }
    reload()
  }

  return (
    <>
      <div className="row hd">
        <h1>{t('friends.title')}</h1>
        <button className="ib" aria-label={t('common.addFriend')} onClick={addFriend}><Icon name="uadd" /></button>
      </div>
      <label className="card srch">
        <span className="mute"><Icon name="search" /></span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('friends.search')} autoComplete="off" />
      </label>

      {requests.map((r) => (
        <div key={r.id} className="card li">
          <Avatar name={r.name} size={44} />
          <div className="g"><b>{r.name}</b><span className="mute">{r.incoming ? t('friends.wants') : t('friends.pending')}</span></div>
          {r.incoming && <button className="sm" onClick={() => accept(r.id)}>{t('friends.accept')}</button>}
        </div>
      ))}

      {friends.map((f) => (
        <div key={f.id} className="card li">
          <Avatar name={f.name} size={44} />
          <div className="g">
            <b>{f.name}</b>
            <span className="mute">{f.last ? `${ago(f.last.created_at, t)} - ${f.last.name}` : t('friends.noSession')}</span>
          </div>
          <b className={f.streak ? 'lime' : 'mute'} style={{ fontSize: 12 }}>{t('common.day', { n: f.streak })} {f.streak ? '🔥' : '💤'}</b>
        </div>
      ))}
      {data && !friends.length && !requests.length && (
        <p className="empty">{t('friends.empty')}</p>
      )}
    </>
  )
}
