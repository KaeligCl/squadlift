import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { acceptFriendRequest, findProfile, getFriends, sendFriendRequest } from '../lib/api'
import { ago } from '../lib/format'

export function Friends({ userId }: { userId: string }) {
  const toast = useToast()
  const [query, setQuery] = useState('')
  const { data, reload } = useLoad(() => getFriends(userId), [userId])

  const friends = (data?.friends ?? []).filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
  const requests = data?.requests ?? []

  async function addFriend() {
    const q = prompt("Friend's name or username?")
    if (!q) return
    const found = await findProfile(q, userId)
    if (!found) return toast('Nobody found with that name.')
    if (!confirm(`Send a request to ${found.display_name}?`)) return
    try {
      await sendFriendRequest(userId, found.id)
      toast('Request sent.')
      reload()
    } catch {
      toast('Request already sent or already friends.')
    }
  }

  async function accept(id: number) {
    try {
      await acceptFriendRequest(id)
    } catch {
      toast('Could not accept the request.')
    }
    reload()
  }

  return (
    <>
      <div className="row hd">
        <h1>My Squad</h1>
        <button className="ib" aria-label="Add friend" onClick={addFriend}><Icon name="uadd" /></button>
      </div>
      <label className="card srch">
        <span className="mute"><Icon name="search" /></span>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search friends..." autoComplete="off" />
      </label>

      {requests.map((r) => (
        <div key={r.id} className="card li">
          <Avatar name={r.name} size={44} />
          <div className="g"><b>{r.name}</b><span className="mute">{r.incoming ? 'Wants to join your squad' : 'Request sent'}</span></div>
          {r.incoming && <button className="sm" onClick={() => accept(r.id)}>Accept</button>}
        </div>
      ))}

      {friends.map((f) => (
        <div key={f.id} className="card li">
          <Avatar name={f.name} size={44} />
          <div className="g">
            <b>{f.name}</b>
            <span className="mute">{f.last ? `${ago(f.last.created_at)} - ${f.last.name}` : 'No session yet'}</span>
          </div>
          <b className={f.streak ? 'lime' : 'mute'} style={{ fontSize: 12 }}>{f.streak} Days {f.streak ? '🔥' : '💤'}</b>
        </div>
      ))}
      {data && !friends.length && !requests.length && (
        <p className="empty">No friends yet. Tap the add button and enter their name or username.</p>
      )}
    </>
  )
}
