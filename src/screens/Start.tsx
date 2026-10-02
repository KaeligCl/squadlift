import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { deleteTemplate, getRecentWorkouts, getTemplates, saveTemplateFrom, setTemplateShared } from '../lib/api'
import { ago, fdate } from '../lib/format'
import type { PastWorkout, Startable, Template } from '../lib/types'
import { TemplateEditor } from './TemplateEditor'
import { WorkoutDetail } from './WorkoutDetail'

type List = 'mine' | 'friends'
// Ce qu'on est en train de regarder (aperçu), sans avoir démarré de séance
type View = { kind: 'template'; t: Template } | { kind: 'edit'; t: Template } | { kind: 'past'; w: PastWorkout }

const LISTS: { id: List; label: string }[] = [
  { id: 'mine', label: 'My sessions' },
  { id: 'friends', label: 'Shared by friends' },
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
  const [view, setView] = useState<View | null>(null)
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

  // ---- modifier une de mes séances enregistrées, sans la démarrer ----
  if (view?.kind === 'edit') {
    const original = view.t
    return (
      <TemplateEditor
        template={original}
        onCancel={() => setView({ kind: 'template', t: original })}
        onSaved={(updated) => {
          setData((all) => (all ?? []).map((x) => (x.id === updated.id ? updated : x)))
          setView({ kind: 'template', t: updated })
          toast('Session updated.')
        }}
      />
    )
  }

  // ---- aperçu d'une séance : on voit tous les exercices, puis on choisit de la lancer ----
  if (view?.kind === 'template') {
    const t = view.t
    const author = t.profiles?.display_name ?? 'A friend'
    return (
      <WorkoutDetail
        name={t.name}
        subtitle={t.user_id === userId ? 'My session' : `Shared by ${author}`}
        exercises={t.exercises}
        onBack={() => setView(null)}
      >
        <button className="cta" onClick={() => onStart(t)}>Start session</button>
        {t.user_id === userId && (
          <button className="cta ghost" onClick={() => setView({ kind: 'edit', t })}>Edit session</button>
        )}
      </WorkoutDetail>
    )
  }

  // ---- séance passée : la refaire telle quelle, ou l'ajouter à My sessions ----
  if (view?.kind === 'past') {
    const w = view.w
    const isSaved = saved.has(signature(w))
    return (
      <WorkoutDetail
        name={w.name}
        subtitle={`${fdate(w.created_at)} · ${ago(w.created_at)}`}
        exercises={w.exercises}
        onBack={() => setView(null)}
      >
        <button className="cta" onClick={() => onStart(w)}>Do it again</button>
        <button className={`cta ${isSaved ? 'saved' : 'ghost'}`} onClick={() => saveOld(w)} disabled={isSaved}>
          {isSaved ? 'Already in My sessions' : 'Add to My sessions'}
        </button>
      </WorkoutDetail>
    )
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
          <button className="g" onClick={() => setView({ kind: 'template', t })}>
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
        <p className="empty">No saved session yet. Open one from “Last workout” below, or use “Save as template” during a workout.</p>
      )}

      {list === 'friends' && fromFriends.map((t) => {
        const author = t.profiles?.display_name ?? 'A friend'
        return (
          <button key={t.id} className="card li" onClick={() => setView({ kind: 'template', t })}>
            <Avatar name={author} size={40} />
            <div className="g"><b>{t.name}</b><span className="mute">by {author} · {summary(t)}</span></div>
          </button>
        )
      })}
      {list === 'friends' && templates && !fromFriends.length && (
        <p className="empty">Nothing shared yet. Friends can share a saved session from this screen.</p>
      )}

      <div className="sec">Last workout</div>
      {past?.map((w) => (
        <button key={w.id} className="card li" onClick={() => setView({ kind: 'past', w })}>
          <div className="g"><b>{w.name}</b><span className="mute">{ago(w.created_at)} · {summary(w)}</span></div>
        </button>
      ))}
      {past && !past.length && <p className="empty">No workout yet. Finish a session and it will show up here.</p>}
    </>
  )
}
