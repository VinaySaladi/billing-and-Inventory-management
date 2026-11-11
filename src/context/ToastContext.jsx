import { createContext, useCallback, useContext, useState } from 'react'
import { CheckCircle2, AlertCircle, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback((message, type = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, message, type }])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="no-print fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} role="status" className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
            {t.type === 'error'
              ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />}
            <p className="flex-1 text-sm text-slate-700">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="text-slate-400 hover:text-slate-600" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)
