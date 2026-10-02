import type { ReactNode } from 'react'
import { Icon } from '../components/Icon'
import type { TemplateExercise } from '../lib/types'

type Props = {
  name: string
  subtitle: string
  exercises: TemplateExercise[]
  onBack: () => void
  children: ReactNode // les boutons d'action, affichés sous les chiffres clés
}

// Vue en lecture seule d'une séance (modèle ou séance passée) : ni chrono, ni champs modifiables.
export function WorkoutDetail({ name, subtitle, exercises, onBack, children }: Props) {
  const sets = exercises.reduce((n, e) => n + e.sets.length, 0)
  const volume = exercises.reduce((n, e) => n + e.sets.reduce((v, s) => v + s.lbs * s.reps, 0), 0)

  return (
    <>
      <div className="row hd" style={{ justifyContent: 'flex-start', gap: 12 }}>
        <button className="ib" aria-label="Back" onClick={onBack}><Icon name="back" /></button>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 20 }}>{name}</h1>
          <div className="mute">{subtitle}</div>
        </div>
      </div>

      <div className="stats" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        <div className="card stat"><span className="mute">EXERCISES</span><b>{exercises.length}</b></div>
        <div className="card stat"><span className="mute">SETS</span><b>{sets}</b></div>
        <div className="card stat"><span className="mute">VOLUME</span><b className="lime">{Math.round(volume).toLocaleString('en-US')}</b></div>
      </div>

      <div className="stack" style={{ marginTop: 16 }}>{children}</div>

      {exercises.map((ex, i) => (
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
