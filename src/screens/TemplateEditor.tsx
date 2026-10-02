import { useState } from 'react'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { updateTemplate } from '../lib/api'
import type { Template, TemplateExercise } from '../lib/types'

type Props = {
  template: Template
  onCancel: () => void
  onSaved: (updated: Template) => void
}

const clone = (list: TemplateExercise[]): TemplateExercise[] =>
  list.map((e) => ({ ...e, sets: e.sets.map((s) => ({ ...s })) }))

// Modifier une séance enregistrée : pas de chrono, rien n'est démarré. Rien n'est enregistré avant « Save changes ».
export function TemplateEditor({ template, onCancel, onSaved }: Props) {
  const toast = useToast()
  const [name, setName] = useState(template.name)
  const [exercises, setExercises] = useState(() => clone(template.exercises))
  const [busy, setBusy] = useState(false)

  const dirty = name !== template.name || JSON.stringify(exercises) !== JSON.stringify(template.exercises)

  const patchExercise = (i: number, patch: Partial<TemplateExercise>) =>
    setExercises((list) => list.map((e, k) => (k === i ? { ...e, ...patch } : e)))

  const patchSet = (i: number, j: number, patch: { lbs?: number; reps?: number }) =>
    setExercises((list) =>
      list.map((e, k) => (k !== i ? e : { ...e, sets: e.sets.map((s, m) => (m === j ? { ...s, ...patch } : s)) })),
    )

  const addSet = (i: number) =>
    setExercises((list) =>
      list.map((e, k) => {
        if (k !== i) return e
        const last = e.sets[e.sets.length - 1]
        return { ...e, sets: [...e.sets, { lbs: last?.lbs ?? 45, reps: last?.reps ?? 8 }] }
      }),
    )

  const removeSet = (i: number, j: number) =>
    setExercises((list) => list.map((e, k) => (k !== i ? e : { ...e, sets: e.sets.filter((_, m) => m !== j) })))

  const removeExercise = (i: number) => setExercises((list) => list.filter((_, k) => k !== i))

  const addExercise = () => {
    const n = prompt('Exercise name?')?.trim()
    if (n) setExercises((list) => [...list, { name: n, equipment: 'Barbell', sets: [{ lbs: 45, reps: 10 }] }])
  }

  const cancel = () => {
    if (dirty && !confirm('Discard your changes?')) return
    onCancel()
  }

  const save = async () => {
    if (!name.trim()) return toast('Give the session a name.')
    if (!exercises.length) return toast('Add at least one exercise.')
    if (exercises.some((e) => !e.name.trim())) return toast('Every exercise needs a name.')
    const clean = exercises.map((e) => ({ ...e, name: e.name.trim(), equipment: e.equipment.trim() || 'Barbell' }))
    setBusy(true)
    try {
      await updateTemplate(template.id, name, clean)
      onSaved({ ...template, name: name.trim(), exercises: clean })
    } catch (e) {
      toast(`Could not save: ${(e as Error).message}`)
      setBusy(false)
    }
  }

  return (
    <>
      <div className="row hd" style={{ justifyContent: 'flex-start', gap: 12 }}>
        <button className="ib" aria-label="Back" onClick={cancel}><Icon name="back" /></button>
        <h1 style={{ fontSize: 20 }}>Edit session</h1>
      </div>

      <div className="mute" style={{ marginBottom: 6, fontWeight: 700 }}>SESSION NAME</div>
      <input className="fld" value={name} onChange={(e) => setName(e.target.value)} aria-label="Session name" />

      {exercises.map((ex, i) => (
        <div key={i}>
          <div className="row sec" style={{ gap: 8 }}>
            <input
              className="fld"
              style={{ flex: 1, padding: '9px 12px', minWidth: 0 }}
              value={ex.name}
              aria-label={`Exercise ${i + 1} name`}
              onChange={(e) => patchExercise(i, { name: e.target.value })}
            />
            <input
              className="fld"
              style={{ width: 96, padding: '9px 12px', color: 'var(--mute)' }}
              value={ex.equipment}
              aria-label={`Equipment for ${ex.name}`}
              onChange={(e) => patchExercise(i, { equipment: e.target.value })}
            />
            <button className="ib" style={{ width: 36, height: 36, flex: 'none' }} aria-label={`Remove ${ex.name}`} onClick={() => removeExercise(i)}>
              <Icon name="trash" />
            </button>
          </div>
          <div className="tbl h"><span>SET</span><span>LBS</span><span>REPS</span><span /></div>
          {ex.sets.map((s, j) => (
            <div key={j} className="tbl">
              <div className="sn">{j + 1}</div>
              <input type="number" inputMode="decimal" value={s.lbs} aria-label={`Pounds, ${ex.name} set ${j + 1}`} onChange={(e) => patchSet(i, j, { lbs: Number(e.target.value) || 0 })} />
              <input type="number" inputMode="numeric" value={s.reps} aria-label={`Reps, ${ex.name} set ${j + 1}`} onChange={(e) => patchSet(i, j, { reps: Number(e.target.value) || 0 })} />
              <button className="ck" disabled={ex.sets.length === 1} aria-label={`Remove set ${j + 1} of ${ex.name}`} onClick={() => removeSet(i, j)}>
                <Icon name="trash" />
              </button>
            </div>
          ))}
          <div className="two" style={{ gridTemplateColumns: '1fr' }}>
            <button onClick={() => addSet(i)}>+ Add Set</button>
          </div>
        </div>
      ))}

      <div className="two" style={{ gridTemplateColumns: '1fr', marginTop: 4 }}>
        <button onClick={addExercise}>+ Add Exercise</button>
      </div>

      <button className="cta" onClick={save} disabled={busy || !dirty}>Save changes</button>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="cta ghost" onClick={cancel}>Cancel</button>
      </div>
    </>
  )
}
