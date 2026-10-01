import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// undefined = on ne sait pas encore, null = déconnecté
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      if (event !== 'TOKEN_REFRESHED') setSession(s)
    })
    return () => data.subscription.unsubscribe()
  }, [])
  return session
}
