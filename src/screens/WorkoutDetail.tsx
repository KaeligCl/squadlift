import { Icon } from '../components/Icon'
import { ago, fdate } from '../lib/format'
import type { PastWorkout } from '../lib/types'

type Props = {
  workout: PastWorkout
  saved: boolean
  onSave: () => void
  onBack: () => void
}

// Vue en lecture seule d'une séance terminée : ni chrono, ni champs modifiables.
export function WorkoutDetail({ workout: w, saved, onSave, onBack }: Props) {
  const sets = w.exercises.reduce((n, e) => n + e.sets.length, 0)
  const volume = w.exercises.reduce((n, e) => n + e.sets.reduce((v, s) => v + s.lbs * s.reps, 0), 0)

  return (
    <>
      <div className="row hd" style={{ justifyContent: 'flex-start', gap: 12 }}>
        <button className="ib" aria-label="Back" onClick={onBack}><Icon name="back" /></button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 20 }}>{w.name}</h1>
          <div className="mute">{fdate(w.created_at)} · {ago(w.created_at)}</div>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card stat"><span className="mute">EXERCISES</span><b>{w.exercises.length}</b></div>
        <div className="card stat"><span className="mute">SETS</span><b>{sets}</b></div>
        <div className="card stat"><span className="mute">VOLUME</span><b className="lime">{Math.round(volume).toLocaleString('en-US')}</b></div>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>
        <button className={`cta ${saved ? 'saved' : ''}`} onClick={onSave} disabled={saved}>
          {saved ? 'Already in My sessions' : 'Add to My sessions'}
        </button>
      </div>

      {w.exercises.map((ex, i) => (
        <div key={i}>
          <div className="row sec"><span>{ex.name}</span><span className="mute">{ex.equipment}</span></div>
          <div className="tbl ro h"><span>SET</span><span>LBS</span><span>REPS</span></div>
          {ex.sets.map((s, j) => (
            <div key={j} className="tbl ro">
              <div className="sn">{j + 1}</div>
              <div className="cell">{s.lbs}</div>
              <div className="cell">{s.reps}</div>
            </div>
          ))}
        </div>
      ))}
    </>
  )
}
