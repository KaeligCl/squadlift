import { useCallback, useEffect, useState } from 'react'

// Charge des données quand l'écran s'affiche (et à chaque changement de `deps`).
export function useLoad<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(() => fetcher().then(setData).catch(() => {}), deps)
  useEffect(() => {
    reload()
  }, [reload])
  return { data, setData, reload }
}
