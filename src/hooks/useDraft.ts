import { useEffect, useState } from 'react'
import type { Draft, SetEntry, Template } from '../lib/types'

const KEY = 'squadlift:draft:v2'

const blank = (): Draft => ({ name: 'Workout', start: Date.now(), exercises: [] })

const fromTemplate = (t: Template): Draft => ({
  name: t.name,
  start: Date.now(),
  exercises: t.exercises.map((e) => ({
    name: e.name,
    equipment: e.equipment,
    sets: e.sets.map((s) => ({ w: s.lbs, r: s.reps, d: false })),
  })),
})

function load(): Draft | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Draft
  } catch {
    /* brouillon illisible : pas de séance en cours */
  }
  return null
}

// `draft` vaut null tant qu'aucune séance n'est en cours. Elle survit à la fermeture de l'app.
export function useDraft() {
  const [draft, setDraft] = useState<Draft | null>(load)

  useEffect(() => {
    try {
      if (draft) localStorage.setItem(KEY, JSON.stringify(draft))
      else localStorage.removeItem(KEY)
    } catch {
      /* stockage plein ou désactivé */
    }
  }, [draft])

  const edit = (fn: (d: Draft) => Draft) => setDraft((d) => (d ? fn(d) : d))

  return {
    draft,
    start: (template?: Template) => setDraft(template ? fromTemplate(template) : blank()),
    reset: () => setDraft(null),
    setName: (name: string) => edit((d) => ({ ...d, name })),
    updateSet: (ei: number, si: number, patch: Partial<SetEntry>) =>
      edit((d) => ({
        ...d,
        exercises: d.exercises.map((e, i) =>
          i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) },
        ),
      })),
    addSet: (ei: number) =>
      edit((d) => ({
        ...d,
        exercises: d.exercises.map((e, i) => {
          if (i !== ei) return e
          const last = e.sets[e.sets.length - 1]
          return { ...e, sets: [...e.sets, { w: last?.w ?? 45, r: last?.r ?? 8, d: false }] }
        }),
      })),
    addExercise: (name: string) =>
      edit((d) => ({
        ...d,
        exercises: [...d.exercises, { name, equipment: 'Barbell', sets: [{ w: 45, r: 10, d: false }] }],
      })),
  }
}
