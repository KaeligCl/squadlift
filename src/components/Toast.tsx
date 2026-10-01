import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

const ToastContext = createContext<(message: string) => void>(() => {})
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const show = useCallback((m: string) => {
    setMessage(m)
    setVisible(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setVisible(false), 1800)
  }, [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div id="toast" className={visible ? 's' : ''} role="status">
        {message}
      </div>
    </ToastContext.Provider>
  )
}
