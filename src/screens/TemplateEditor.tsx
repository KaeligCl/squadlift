import { useState } from 'react'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import { updateTemplate } from '../lib/api'
import { useI18n } from '../lib/i18n'
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
  const { t } = useI18n()
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
    const n = prompt(t('common.exercisePrompt'))?.trim()
    if (n) setExercises((list) => [...list, { name: n, equipment: t('common.defaultEquipment'), sets: [{ lbs: 45, reps: 10 }] }])
  }

  const cancel = () => {
    if (dirty && !confirm(t('edit.confirmDiscard'))) return
    onCancel()
  }

  const save = async () => {
    if (!name.trim()) return toast(t('edit.needName'))
    if (!exercises.length) return toast(t('edit.needExercise'))
    if (exercises.some((e) => !e.name.trim())) return toast(t('edit.needExName'))
    const clean = exercises.map((e) => ({ ...e, name: e.name.trim(), equipment: e.equipment.trim() || t('common.defaultEquipment') }))
    setBusy(true)
    try {
      await updateTemplate(template.id, name, clean)
      onSaved({ ...template, name: name.trim(), exercises: clean })
    } catch (e) {
      toast(t('common.couldNotSave', { msg: (e as Error).message }))
      setBusy(false)
    }
  }

  return (
    <>
      <div className="row hd" style={{ justifyContent: 'flex-start', gap: 12 }}>
        <button className="ib" aria-label={t('common.back')} onClick={cancel}><Icon name="back" /></button>
        <h1 style={{ fontSize: 20 }}>{t('edit.title')}</h1>
      </div>

      <div className="mute" style={{ marginBottom: 6, fontWeight: 700 }}>{t('common.sessionName')}</div>
      <input className="fld" value={name} onChange={(e) => setName(e.target.value)} aria-label={t('common.sessionNameAria')} />

      {exercises.map((ex, i) => (
        <div key={i}>
          <div className="row sec" style={{ gap: 8 }}>
            <input
              className="fld"
              style={{ flex: 1, padding: '9px 12px', minWidth: 0 }}
              value={ex.name}
              aria-label={t('edit.exName', { n: i + 1 })}
              onChange={(e) => patchExercise(i, { name: e.target.value })}
            />
            <input
              className="fld"
              style={{ width: 96, padding: '9px 12px', color: 'var(--mute)' }}
              value={ex.equipment}
              aria-label={t('edit.equipment', { name: ex.name })}
              onChange={(e) => patchExercise(i, { equipment: e.target.value })}
            />
            <button className="ib" style={{ width: 36, height: 36, flex: 'none' }} aria-label={t('edit.remove', { name: ex.name })} onClick={() => removeExercise(i)}>
              <Icon name="trash" />
            </button>
          </div>
          <div className="tbl h"><span>{t('common.hSet')}</span><span>{t('common.hLbs')}</span><span>{t('common.hReps')}</span><span /></div>
          {ex.sets.map((s, j) => (
            <div key={j} className="tbl">
              <div className="sn">{j + 1}</div>
              <input type="number" inputMode="decimal" value={s.lbs} aria-label={t('edit.pounds', { name: ex.name, n: j + 1 })} onChange={(e) => patchSet(i, j, { lbs: Number(e.target.value) || 0 })} />
              <input type="number" inputMode="numeric" value={s.reps} aria-label={t('edit.reps', { name: ex.name, n: j + 1 })} onChange={(e) => patchSet(i, j, { reps: Number(e.target.value) || 0 })} />
              <button className="ck" disabled={ex.sets.length === 1} aria-label={t('edit.removeSet', { n: j + 1, name: ex.name })} onClick={() => removeSet(i, j)}>
                <Icon name="trash" />
              </button>
            </div>
          ))}
          <div className="two" style={{ gridTemplateColumns: '1fr' }}>
            <button onClick={() => addSet(i)}>{t('common.addSet')}</button>
          </div>
        </div>
      ))}

      <div className="two" style={{ gridTemplateColumns: '1fr', marginTop: 4 }}>
        <button onClick={addExercise}>{t('common.addExercise')}</button>
      </div>

      <button className="cta" onClick={save} disabled={busy || !dirty}>{t('edit.save')}</button>
      <div className="stack" style={{ marginTop: 12 }}>
        <button className="cta ghost" onClick={cancel}>{t('common.cancel')}</button>
      </div>
    </>
  )
}
