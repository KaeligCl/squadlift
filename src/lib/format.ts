import type { TFn } from './i18n'
import type { FeedWorkout } from './types'

export function ago(iso: string, t: TFn): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return t('ago.now')
  if (minutes < 60) return t('ago.min', { n: minutes })
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return t('ago.hour', { n: hours })
  return t('ago.day', { n: Math.floor(hours / 24) })
}

export const fdate = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' })

export function clock(startMs: number): string {
  const s = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(s / 3600))}:${p(Math.floor(s / 60) % 60)}:${p(s % 60)}`
}

// "Back Squat: 3 x 8 @ 225 lbs" pour chaque exercice qui a au moins une série terminée
export function summarize(w: FeedWorkout): string[] {
  return [...w.workout_exercises]
    .sort((a, b) => a.position - b.position)
    .flatMap((e) => {
      const done = e.workout_sets.filter((s) => s.done)
      if (!done.length) return []
      const top = Math.max(...done.map((s) => Number(s.lbs)))
      return [`${e.name}: ${done.length} x ${done[done.length - 1].reps} @ ${top} lbs`]
    })
}
