import { useEffect, useState } from 'react'
import { Icon } from '../components/Icon'
import { useToast } from '../components/Toast'
import type { useDraft } from '../hooks/useDraft'
import { saveTemplate, saveWorkout } from '../lib/api'
import { clock } from '../lib/format'
import { useI18n } from '../lib/i18n'

export function Log({ draft: d, onShared }: { draft: ReturnType<typeof useDraft>; onShared: () => void }) {
  const toast = useToast()
  const { t } = useI18n()
  const [busy, setBusy] = useState(false)
  const [, tick] = useState(0)
  const { draft } = d

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 1000)
    return () => clearInterval(id)
  }, [])

  if (!draft) return null

  const addExercise = () => {
    const name = prompt(t('common.exercisePrompt'))?.trim()
    if (name) d.addExercise(name)
  }

  const finish = async () => {
    if (!draft.exercises.some((e) => e.sets.some((s) => s.d))) return toast(t('log.markOne'))
    setBusy(true)
    try {
      await saveWorkout(draft)
      d.reset()
      toast(t('log.shared'))
      onShared()
    } catch (e) {
      toast(t('common.couldNotSave', { msg: (e as Error).message }))
      setBusy(false)
    }
  }

  const saveAsTemplate = async () => {
    if (!draft.exercises.length) return toast(t('log.addFirst'))
    try {
      await saveTemplate(draft)
      toast(t('log.savedTemplate'))
    } catch (e) {
      toast(t('common.couldNotSave', { msg: (e as Error).message }))
    }
  }

  const discard = () => {
    if (confirm(t('log.confirmDiscard'))) d.reset()
  }

  return (
    <>
      <div className="row hd">
        <h1>{t('log.title')}</h1>
        <div className="timer"><i className="dot" /><span>{clock(draft.start)}</span></div>
      </div>

      <div className="mute" style={{ marginBottom: 6, fontWeight: 700 }}>{t('common.sessionName')}</div>
      <div className="fld row">
        <input
          value={draft.name}
          onChange={(e) => d.setName(e.target.value)}
          style={{ background: 'none', border: 0, outline: 0, flex: 1, fontWeight: 600 }}
          aria-label={t('common.sessionNameAria')}
        />
        <span className="mute"><Icon name="edit" /></span>
      </div>

      {draft.exercises.map((ex, ei) => (
        <div key={ei}>
          <div className="row sec"><span>{t('log.exercise', { n: ei + 1, name: ex.name })}</span><span className="mute">{ex.equipment}</span></div>
          <div className="tbl h"><span>{t('common.hSet')}</span><span>{t('common.hLbs')}</span><span>{t('common.hReps')}</span><span>{t('common.hDone')}</span></div>
          {ex.sets.map((s, si) => (
            <div key={si} className="tbl">
              <div className="sn">{si + 1}</div>
              <input type="number" inputMode="decimal" value={s.w} aria-label={t('log.pounds', { n: si + 1 })} onChange={(e) => d.updateSet(ei, si, { w: Number(e.target.value) || 0 })} />
              <input type="number" inputMode="numeric" value={s.r} aria-label={t('log.reps', { n: si + 1 })} onChange={(e) => d.updateSet(ei, si, { r: Number(e.target.value) || 0 })} />
              <button className={`ck ${s.d ? 'on' : ''}`} aria-pressed={s.d} aria-label={t('log.markDone', { n: si + 1 })} onClick={() => d.updateSet(ei, si, { d: !s.d })}>
                <Icon name="check" />
              </button>
            </div>
          ))}
          <div className="two">
            <button onClick={() => d.addSet(ei)}>{t('common.addSet')}</button>
            <button onClick={addExercise}>{t('common.addExercise')}</button>
          </div>
        </div>
      ))}

      {!draft.exercises.length && (
        <>
          <p className="empty">{t('log.empty')}</p>
          <div className="two" style={{ gridTemplateColumns: '1fr' }}>
            <button onClick={addExercise}>{t('common.addExercise')}</button>
          </div>
        </>
      )}

      <button className="cta" onClick={finish} disabled={busy}>{t('log.finish')}</button>
      <div className="two" style={{ marginTop: 12 }}>
        <button onClick={saveAsTemplate}>{t('log.saveTemplate')}</button>
        <button onClick={discard}>{t('log.discard')}</button>
      </div>
    </>
  )
}
