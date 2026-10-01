import { useEffect } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { addComment, getFeed, setLike, subscribeFeed } from '../lib/api'
import { ago, summarize } from '../lib/format'
import type { FeedWorkout } from '../lib/types'

export function Feed({ userId, onLog }: { userId: string; onLog: () => void }) {
  const toast = useToast()
  const { data: feed, setData, reload } = useLoad(getFeed, [])

  useEffect(() => subscribeFeed(reload), [reload])

  async function toggleLike(w: FeedWorkout) {
    const liked = !w.likes.some((l) => l.user_id === userId)
    // mise à jour immédiate de l'écran, puis envoi à Supabase
    setData((list) =>
      (list ?? []).map((x) =>
        x.id !== w.id ? x : { ...x, likes: liked ? [...x.likes, { user_id: userId }] : x.likes.filter((l) => l.user_id !== userId) },
      ),
    )
    try {
      await setLike(w.id, userId, liked)
    } catch {
      toast('Could not update the like.')
      reload()
    }
  }

  async function comment(w: FeedWorkout) {
    const text = prompt('Your comment?')?.trim()
    if (!text) return
    try {
      await addComment(w.id, text)
      reload()
    } catch {
      toast('Could not post the comment.')
    }
  }

  return (
    <>
      <div className="row hd">
        <h1>Squad Feed</h1>
        <button className="ib" aria-label="Notifications"><Icon name="bell" /></button>
      </div>
      <button className="card share" onClick={onLog}>
        <span className="lime"><Icon name="plus" /></span>Share a session with the squad...
      </button>

      {feed?.map((w) => {
        const liked = w.likes.some((l) => l.user_id === userId)
        const name = w.profiles?.display_name ?? 'Someone'
        const lines = summarize(w)
        return (
          <article key={w.id} className="card fc">
            <div className="row">
              <div className="row" style={{ gap: 10 }}>
                <Avatar name={name} size={36} />
                <div><b style={{ fontSize: 13 }}>{name}</b><div className="mute">{ago(w.created_at)}</div></div>
              </div>
              <span className="tag lime" style={{ borderColor: 'currentColor' }}>{w.tag}</span>
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 800, marginTop: 14 }}>{w.name}</h2>
            <div className="sum">{lines.length ? lines.map((l) => <div key={l}>• {l}</div>) : 'No completed sets'}</div>
            <div className="act">
              <button className={liked ? 'on' : ''} aria-pressed={liked} onClick={() => toggleLike(w)}>
                <Icon name="heart" />{w.likes.length}
              </button>
              <button onClick={() => comment(w)}><Icon name="msg" />{w.comments?.[0]?.count ?? 0} comments</button>
            </div>
          </article>
        )
      })}
      {feed?.length === 0 && <p className="empty">No sessions yet. Log one, then add friends from the Friends tab.</p>}
    </>
  )
}
