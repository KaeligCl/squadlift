import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { deleteTemplate, getRecentWorkouts, getTemplates, saveTemplateFrom, setTemplateShared } from '../lib/api'
import { ago } from '../lib/format'
import type { PastWorkout, Startable, Template } from '../lib/types'

type List = 'mine' | 'friends' | 'last'

const LISTS: { id: List; label: string }[] = [
  { id: 'mine', label: 'My sessions' },
  { id: 'friends', label: 'Friends' },
  { id: 'last', label: 'Last workout' },
]

const summary = (x: Startable) => {
  const sets = x.exercises.reduce((n, e) => n + e.sets.length, 0)
  return `${x.exercises.length} exercise${x.exercises.length === 1 ? '' : 's'} · ${sets} sets`
}

// Empreinte d'une séance, pour savoir si elle est déjà dans "My sessions"
const signature = (x: Startable) =>
  x.name + '|' + x.exercises.map((e) => `${e.name}:${e.sets.map((s) => `${s.lbs}x${s.reps}`).join(',')}`).join(';')

export function Start({ userId, onStart }: { userId: string; onStart: (session?: Startable) => void }) {
  const toast = useToast()
  const [list, setList] = useState<List>('mine')
  const { data: templates, setData, reload } = useLoad(getTemplates, [])
  const { data: past } = useLoad(() => getRecentWorkouts(userId), [userId])

  const mine = templates?.filter((t) => t.user_id === userId) ?? []
  const fromFriends = templates?.filter((t) => t.user_id !== userId) ?? []
  const saved = new Set(mine.map(signature))

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

  async function saveOld(w: PastWorkout) {
    if (saved.has(signature(w))) return toast('Already in My sessions.')
    try {
      await saveTemplateFrom(w.name, w.exercises)
      toast('Saved to My sessions.')
      reload()
    } catch {
      toast('Could not save the session.')
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
        {LISTS.map((l) => (
          <button key={l.id} role="tab" aria-selected={list === l.id} className={list === l.id ? 'on' : ''} onClick={() => setList(l.id)}>
            {l.label}
          </button>
        ))}
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
        <p className="empty">No saved session yet. Save one from “Last workout”, or during a workout with “Save as template”.</p>
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

      {list === 'last' && past?.map((w) => {
        const isSaved = saved.has(signature(w))
        return (
          <div key={w.id} className="card li">
            <button className="g" onClick={() => onStart(w)}>
              <b>{w.name}</b><span className="mute">{ago(w.created_at)} · {summary(w)}</span>
            </button>
            <button className={`sm ${isSaved ? 'off' : ''}`} onClick={() => saveOld(w)}>{isSaved ? 'Saved' : 'Save'}</button>
          </div>
        )
      })}
      {list === 'last' && past && !past.length && (
        <p className="empty">No workout yet. Finish a session and it will show up here.</p>
      )}
    </>
  )
}
