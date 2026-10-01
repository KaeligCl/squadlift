import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import type { useDraft } from '../hooks/useDraft'
import { saveWorkout } from '../lib/api'
import { clock } from '../lib/format'

export function Log({ draft: d, onShared }: { draft: ReturnType<typeof useDraft>; onShared: () => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const [, tick] = useState(0)
  const { draft } = d

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  async function finish() {
    if (!draft.exercises.some((e) => e.sets.some((s) => s.d))) return toast('Mark at least one set as done first.')
    setBusy(true)
    try {
      await saveWorkout(draft)
      d.reset()
      toast('Workout shared with the squad.')
      onShared()
    } catch (e) {
      toast(`Could not save: ${(e as Error).message}`)
      setBusy(false)
    }
  }

  return (
    <>
      <div className="row hd">
        <h1>Active Session</h1>
        <div className="timer"><i className="dot" /><span>{clock(draft.start)}</span></div>
      </div>

      <div className="mute" style={{ marginBottom: 6, fontWeight: 700 }}>SESSION NAME</div>
      <div className="fld row">
        <input
          value={draft.name}
          onChange={(e) => d.setName(e.target.value)}
          style={{ background: 'none', border: 0, outline: 0, flex: 1, fontWeight: 600 }}
          aria-label="Session name"
        />
        <span className="mute"><Icon name="edit" /></span>
      </div>

      {draft.exercises.map((ex, ei) => (
        <div key={ei}>
          <div className="row sec"><span>Exercise {ei + 1}: {ex.name}</span><span className="mute">{ex.equipment}</span></div>
          <div className="tbl h"><span>SET</span><span>LBS</span><span>REPS</span><span>DONE</span></div>
          {ex.sets.map((s, si) => (
            <div key={si} className="tbl">
              <div className="sn">{si + 1}</div>
              <input type="number" inputMode="decimal" value={s.w} aria-label={`Pounds, set ${si + 1}`} onChange={(e) => d.updateSet(ei, si, { w: Number(e.target.value) || 0 })} />
              <input type="number" inputMode="numeric" value={s.r} aria-label={`Reps, set ${si + 1}`} onChange={(e) => d.updateSet(ei, si, { r: Number(e.target.value) || 0 })} />
              <button className={`ck ${s.d ? 'on' : ''}`} aria-pressed={s.d} aria-label={`Mark set ${si + 1} done`} onClick={() => d.updateSet(ei, si, { d: !s.d })}>
                <Icon name="check" />
              </button>
            </div>
          ))}
          <div className="two">
            <button onClick={() => d.addSet(ei)}>+ Add Set</button>
            <button onClick={() => { const n = prompt('Exercise name?')?.trim(); if (n) d.addExercise(n) }}>+ Add Exercise</button>
          </div>
        </div>
      ))}

      <button className="cta" onClick={finish} disabled={busy}>Finish &amp; Share Workout</button>
    </>
  )
}
