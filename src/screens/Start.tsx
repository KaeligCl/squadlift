import { useState } from 'react'
import { Avatar } from '../components/Avatar'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { useLoad } from '../hooks/useLoad'
import { deleteTemplate, getRecentWorkouts, getTemplates, saveTemplateFrom, setTemplateShared } from '../lib/api'
import { ago, fdate } from '../lib/format'
import { useI18n } from '../lib/i18n'
import type { PastWorkout, Startable, Template } from '../lib/types'
import { TemplateEditor } from './TemplateEditor'
import { WorkoutDetail } from './WorkoutDetail'

type List = 'mine' | 'friends'
// Ce qu'on est en train de regarder (aperçu), sans avoir démarré de séance
type View = { kind: 'template'; t: Template } | { kind: 'edit'; t: Template } | { kind: 'past'; w: PastWorkout }

// Empreinte d'une séance, pour savoir si elle est déjà dans "My sessions"
const signature = (x: Startable) =>
  x.name + '|' + x.exercises.map((e) => `${e.name}:${e.sets.map((s) => `${s.lbs}x${s.reps}`).join(',')}`).join(';')

export function Start({ userId, onStart }: { userId: string; onStart: (session?: Startable) => void }) {
  const toast = useToast()
  const { t: tr, locale } = useI18n() // "t" est déjà utilisé plus bas pour désigner un modèle de séance
  const [list, setList] = useState<List>('mine')
  const [view, setView] = useState<View | null>(null)
  const { data: templates, setData, reload } = useLoad(getTemplates, [])
  const { data: past } = useLoad(() => getRecentWorkouts(userId), [userId])

  const mine = templates?.filter((t) => t.user_id === userId) ?? []
  const fromFriends = templates?.filter((t) => t.user_id !== userId) ?? []
  const saved = new Set(mine.map(signature))

  const summary = (x: Startable) => {
    const sets = x.exercises.reduce((n, e) => n + e.sets.length, 0)
    return `${tr('common.exercise', { n: x.exercises.length })} · ${tr('common.set', { n: sets })}`
  }

  async function toggleShared(t: Template) {
    setData((all) => (all ?? []).map((x) => (x.id === t.id ? { ...x, is_shared: !x.is_shared } : x)))
    try {
      await setTemplateShared(t.id, !t.is_shared)
    } catch {
      toast(tr('start.shareError'))
      reload()
    }
  }

  async function remove(t: Template) {
    if (!confirm(tr('start.confirmDelete', { name: t.name }))) return
    setData((all) => (all ?? []).filter((x) => x.id !== t.id))
    try {
      await deleteTemplate(t.id)
    } catch {
      toast(tr('start.deleteError'))
      reload()
    }
  }

  async function saveOld(w: PastWorkout) {
    if (saved.has(signature(w))) return toast(tr('start.alreadySaved'))
    try {
      await saveTemplateFrom(w.name, w.exercises)
      toast(tr('start.saved'))
      reload()
    } catch {
      toast(tr('start.saveError'))
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
          toast(tr('start.updated'))
        }}
      />
    )
  }

  // ---- aperçu d'une séance : on voit tous les exercices, puis on choisit de la lancer ----
  if (view?.kind === 'template') {
    const t = view.t
    const author = t.profiles?.display_name ?? tr('start.aFriend')
    return (
      <WorkoutDetail
        name={t.name}
        subtitle={t.user_id === userId ? tr('start.mySession') : tr('start.sharedBy', { name: author })}
        exercises={t.exercises}
        onBack={() => setView(null)}
      >
        <button className="cta" onClick={() => onStart(t)}>{tr('start.begin')}</button>
        {t.user_id === userId && (
          <button className="cta ghost" onClick={() => setView({ kind: 'edit', t })}>{tr('start.edit')}</button>
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
        subtitle={`${fdate(w.created_at, locale)} · ${ago(w.created_at, tr)}`}
        exercises={w.exercises}
        onBack={() => setView(null)}
      >
        <button className="cta" onClick={() => onStart(w)}>{tr('start.again')}</button>
        <button className={`cta ${isSaved ? 'saved' : 'ghost'}`} onClick={() => saveOld(w)} disabled={isSaved}>
          {isSaved ? tr('start.inMine') : tr('start.addToMine')}
        </button>
      </WorkoutDetail>
    )
  }

  const lists: { id: List; label: string }[] = [
    { id: 'mine', label: tr('start.mine') },
    { id: 'friends', label: tr('start.friends') },
  ]

  return (
    <>
      <div className="row hd"><h1>{tr('start.title')}</h1></div>
      <div className="stack">
        <button className="cta" onClick={() => onStart()}>{tr('start.empty')}</button>
      </div>

      <div className="sec">{tr('start.pick')}</div>
      <div className="seg" role="tablist">
        {lists.map((l) => (
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
            {t.is_shared ? tr('start.shared') : tr('start.private')}
          </button>
          <button className="ib" style={{ width: 34, height: 34 }} aria-label={tr('start.delete', { name: t.name })} onClick={() => remove(t)}>
            <Icon name="trash" />
          </button>
        </div>
      ))}
      {list === 'mine' && templates && !mine.length && <p className="empty">{tr('start.emptyMine')}</p>}

      {list === 'friends' && fromFriends.map((t) => {
        const author = t.profiles?.display_name ?? tr('start.aFriend')
        return (
          <button key={t.id} className="card li" onClick={() => setView({ kind: 'template', t })}>
            <Avatar name={author} size={40} />
            <div className="g"><b>{t.name}</b><span className="mute">{tr('start.by', { name: author, summary: summary(t) })}</span></div>
          </button>
        )
      })}
      {list === 'friends' && templates && !fromFriends.length && <p className="empty">{tr('start.emptyFriends')}</p>}

      <div className="sec">{tr('start.last')}</div>
      {past?.map((w) => (
        <button key={w.id} className="card li" onClick={() => setView({ kind: 'past', w })}>
          <div className="g"><b>{w.name}</b><span className="mute">{ago(w.created_at, tr)} · {summary(w)}</span></div>
        </button>
      ))}
      {past && !past.length && <p className="empty">{tr('start.noWorkout')}</p>}
    </>
  )
}
