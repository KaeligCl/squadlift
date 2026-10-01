import { useEffect, useState } from 'react'
import type { Draft, SetEntry } from '../lib/types'

const KEY = 'squadlift:draft'

const fresh = (): Draft => ({
  name: 'Workout',
  start: Date.now(),
  exercises: [{ name: 'Bench Press', equipment: 'Barbell', sets: [{ w: 135, r: 10, d: false }] }],
})

function load(): Draft {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Draft
  } catch {
    /* brouillon illisible : on repart de zéro */
  }
  return fresh()
}

// Le brouillon de séance survit à la fermeture de l'app.
export function useDraft() {
  const [draft, setDraft] = useState<Draft>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(draft))
    } catch {
      /* stockage plein ou désactivé */
    }
  }, [draft])

  return {
    draft,
    setName: (name: string) => setDraft((d) => ({ ...d, name })),
    updateSet: (ei: number, si: number, patch: Partial<SetEntry>) =>
      setDraft((d) => ({
        ...d,
        exercises: d.exercises.map((e, i) =>
          i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j !== si ? s : { ...s, ...patch })) },
        ),
      })),
    addSet: (ei: number) =>
      setDraft((d) => ({
        ...d,
        exercises: d.exercises.map((e, i) => {
          if (i !== ei) return e
          const last = e.sets[e.sets.length - 1]
          return { ...e, sets: [...e.sets, { w: last?.w ?? 45, r: last?.r ?? 8, d: false }] }
        }),
      })),
    addExercise: (name: string) =>
      setDraft((d) => ({
        ...d,
        exercises: [...d.exercises, { name, equipment: 'Barbell', sets: [{ w: 45, r: 10, d: false }] }],
      })),
    reset: () => setDraft(fresh()),
  }
}
