import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import { X } from 'lucide-react'
import {
  APP_TOAST_EVENT,
  type AppConfirmOptions,
  type AppToastDetail,
  type AppToastVariant,
} from './appUiBridge'

export type { AppConfirmOptions } from './appUiBridge'

type ConfirmState = AppConfirmOptions & { resolve: (value: boolean) => void }

type ToastItem = { id: string; message: string; variant: AppToastVariant }

type AppUiValue = {
  requestConfirm: (opts: AppConfirmOptions) => Promise<boolean>
  showToast: (message: string, variant?: AppToastVariant) => void
}

const AppUiContext = createContext<AppUiValue | null>(null)

export function useAppUi(): AppUiValue {
  const ctx = useContext(AppUiContext)
  if (!ctx) {
    throw new Error('useAppUi must be used within AppUiProvider')
  }
  return ctx
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger,
  onConfirm,
  onCancel,
}: AppConfirmOptions & { onConfirm: () => void; onCancel: () => void }) {
  const titleId = useId()
  const descId = useId()

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#1c1917] shadow-2xl">
        <button
          type="button"
          onClick={onCancel}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-white/10 hover:text-stone-300"
          aria-label="Schließen"
        >
          <X size={18} aria-hidden />
        </button>
        <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6 sm:pt-5">
          <h2 id={titleId} className="pr-10 text-lg font-semibold text-white">
            {title}
          </h2>
          <p id={descId} className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-300">
            {message}
          </p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-white/15 px-4 py-2.5 text-sm font-medium text-stone-200 transition-colors hover:bg-white/5"
            >
              {cancelLabel ?? 'Abbrechen'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={[
                'rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors',
                danger
                  ? 'bg-rose-600 hover:bg-rose-500'
                  : 'bg-primary hover:bg-primary-hover',
              ].join(' ')}
            >
              {confirmLabel ?? 'Bestätigen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ToastStack({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  if (items.length === 0) return null
  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-[190] flex w-[min(100vw-1.5rem,28rem)] -translate-x-1/2 flex-col gap-2"
      aria-live="polite"
    >
      {items.map(t => (
        <div
          key={t.id}
          className={[
            'pointer-events-auto flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg',
            t.variant === 'error'
              ? 'border-rose-500/40 bg-rose-950/90 text-rose-50'
              : t.variant === 'success'
                ? 'border-emerald-500/35 bg-emerald-950/90 text-emerald-50'
                : 'border-white/15 bg-stone-900/95 text-stone-100',
          ].join(' ')}
        >
          <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            className="shrink-0 rounded p-0.5 text-current opacity-70 hover:opacity-100"
            aria-label="Meldung schließen"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}

export function AppUiProvider({ children }: { children: React.ReactNode }) {
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, variant: AppToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    setToasts(prev => [...prev, { id, message, variant }])
    window.setTimeout(() => {
      setToasts(prev => prev.filter(x => x.id !== id))
    }, 6000)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  useEffect(() => {
    const onToast = (e: Event) => {
      const ce = e as CustomEvent<AppToastDetail>
      const d = ce.detail
      if (d?.message) showToast(d.message, d.variant ?? 'info')
    }
    window.addEventListener(APP_TOAST_EVENT, onToast as EventListener)
    return () => window.removeEventListener(APP_TOAST_EVENT, onToast as EventListener)
  }, [showToast])

  const requestConfirm = useCallback((opts: AppConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setConfirmState({ ...opts, resolve })
    })
  }, [])

  const settleConfirm = useCallback((value: boolean) => {
    setConfirmState(s => {
      if (s) s.resolve(value)
      return null
    })
  }, [])

  const value = useMemo(
    () => ({ requestConfirm, showToast }),
    [requestConfirm, showToast],
  )

  return (
    <AppUiContext.Provider value={value}>
      {children}
      <ToastStack items={toasts} onDismiss={dismissToast} />
      {confirmState ? (
        <ConfirmModal
          title={confirmState.title}
          message={confirmState.message}
          confirmLabel={confirmState.confirmLabel}
          cancelLabel={confirmState.cancelLabel}
          danger={confirmState.danger}
          onConfirm={() => settleConfirm(true)}
          onCancel={() => settleConfirm(false)}
        />
      ) : null}
    </AppUiContext.Provider>
  )
}
