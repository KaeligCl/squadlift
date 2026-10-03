import { useState } from 'react'
import { useI18n } from '../lib/i18n'
import { supabase } from '../lib/supabase'

export function Auth() {
  const { t } = useI18n()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!email || !password) return setError(t('auth.enterCreds'))
    setError('')
    setBusy(true)
    const { data, error: err } =
      mode === 'up'
        ? await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: (displayName || email.split('@')[0]).trim() } },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (err) setError(err.message)
    else if (!data.session) {
      setError(t('auth.checkInbox'))
      setMode('in')
    }
  }

  return (
    <div className="auth">
      <h1>SquadLift</h1>
      <p className="mute" style={{ fontSize: 13 }}>{t('auth.tagline')}</p>
      {mode === 'up' && (
        <input className="fld" placeholder={t('auth.displayName')} autoComplete="nickname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      )}
      <input className="fld" type="email" placeholder={t('auth.email')} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        className="fld"
        type="password"
        placeholder={t('auth.password')}
        autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="err" role="alert">{error}</div>}
      <button className="cta" onClick={submit} disabled={busy}>
        {mode === 'up' ? t('auth.createAccount') : t('auth.signIn')}
      </button>
      <button className="lnk" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError('') }}>
        {mode === 'up' ? t('auth.haveAccount') : t('auth.noAccount')}
      </button>
    </div>
  )
}
