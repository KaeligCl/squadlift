import { useState } from 'react'
import { supabase } from '../lib/supabase'

export function Auth() {
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!email || !password) return setError('Enter your email and password.')
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
      setError('Check your inbox to confirm your email, then sign in.')
      setMode('in')
    }
  }

  return (
    <div className="auth">
      <h1>SquadLift</h1>
      <p className="mute" style={{ fontSize: 13 }}>Log your lifts and compare with your squad.</p>
      {mode === 'up' && (
        <input className="fld" placeholder="Display name" autoComplete="nickname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      )}
      <input className="fld" type="email" placeholder="Email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input
        className="fld"
        type="password"
        placeholder="Password (6+ characters)"
        autoComplete={mode === 'up' ? 'new-password' : 'current-password'}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <div className="err" role="alert">{error}</div>}
      <button className="cta" onClick={submit} disabled={busy}>
        {mode === 'up' ? 'Create account' : 'Sign in'}
      </button>
      <button className="lnk" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setError('') }}>
        {mode === 'up' ? 'I already have an account' : 'Create an account'}
      </button>
    </div>
  )
}
