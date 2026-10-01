import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { deleteTemplate, getTemplates, setTemplateShared } from '../lib/api'
import type { Template } from '../lib/types'

const summary = (t: Template) => {
  const sets = t.exercises.reduce((n, e) => n + e.sets.length, 0)
  return `${t.exercises.length} exercise${t.exercises.length === 1 ? '' : 's'} · ${sets} sets`
}

export function Start({ userId, onStart }: { userId: string; onStart: (template?: Template) => void }) {
  const toast = useToast()
  const [list, setList] = useState<'mine' | 'friends'>('mine')
  const { data: templates, setData, reload } = useLoad(getTemplates, [])

  const mine = templates?.filter((t) => t.user_id === userId) ?? []
  const fromFriends = templates?.filter((t) => t.user_id !== userId) ?? []

  async function toggleShared(t: Template) {
    setData((all) => (all ?? []).map((x) => (x.id === t.id ? { ...x, is_shared: !x.is_shared } : x)))
    try {
      await setTemplateShared(t.id, !t.is_shared)
    } catch {
      toast('Could not update sharing.')
      reload()
    }
  }

  async function remove(t: Template) {
    if (!confirm(`Delete "${t.name}"?`)) return
    setData((all) => (all ?? []).filter((x) => x.id !== t.id))
    try {
      await deleteTemplate(t.id)
    } catch {
      toast('Could not delete the session.')
      reload()
    }
  }

  return (
    <>
      <div className="row hd"><h1>Start a workout</h1></div>
      <div className="stack">
        <button className="cta" onClick={() => onStart()}>Start empty session</button>
      </div>

      <div className="sec">Or pick a session</div>
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={list === 'mine'} className={list === 'mine' ? 'on' : ''} onClick={() => setList('mine')}>
          My sessions
        </button>
        <button role="tab" aria-selected={list === 'friends'} className={list === 'friends' ? 'on' : ''} onClick={() => setList('friends')}>
          Shared by friends
        </button>
      </div>

      {list === 'mine' && mine.map((t) => (
        <div key={t.id} className="card li">
          <button className="g" onClick={() => onStart(t)}>
            <b>{t.name}</b><span className="mute">{summary(t)}</span>
          </button>
          <button className={`sm ${t.is_shared ? '' : 'off'}`} aria-pressed={t.is_shared} onClick={() => toggleShared(t)}>
            {t.is_shared ? 'Shared' : 'Private'}
          </button>
          <button className="ib" style={{ width: 34, height: 34 }} aria-label={`Delete ${t.name}`} onClick={() => remove(t)}>
            <Icon name="trash" />
          </button>
        </div>
      ))}
      {list === 'mine' && templates && !mine.length && (
        <p className="empty">No saved session yet. During a workout, tap “Save as template”.</p>
      )}

      {list === 'friends' && fromFriends.map((t) => {
        const author = t.profiles?.display_name ?? 'A friend'
        return (
          <button key={t.id} className="card li" onClick={() => onStart(t)}>
            <Avatar name={author} size={40} />
            <div className="g"><b>{t.name}</b><span className="mute">by {author} · {summary(t)}</span></div>
          </button>
        )
      })}
      {list === 'friends' && templates && !fromFriends.length && (
        <p className="empty">Nothing shared yet. Friends can share a saved session from this screen.</p>
      )}
    </>
  )
}
