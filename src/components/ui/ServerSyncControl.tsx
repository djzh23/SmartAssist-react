import { Loader2, RefreshCw } from 'lucide-react'

export function formatLastSyncedShort(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })
  }
  catch {
    return null
  }
}

type Variant = 'light' | 'dark'

const variantClasses: Record<
  Variant,
  { button: string; meta: string; error: string }
> = {
  light: {
    button:
      'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50',
    meta: 'text-xs text-slate-500',
    error: 'text-xs text-red-600',
  },
  dark: {
    button:
      'inline-flex items-center gap-1.5 rounded-xl border border-stone-600/45 bg-app-raised/95 px-3 py-1.5 text-xs font-medium text-stone-200 transition-colors hover:bg-stone-800/80 disabled:opacity-50',
    meta: 'text-xs text-stone-500',
    error: 'text-xs text-amber-300',
  },
}

export interface ServerSyncControlProps {
  onSync: () => void | Promise<void>
  syncing: boolean
  lastSyncedAt?: string | null
  error?: string | null
  disabled?: boolean
  variant?: Variant
  className?: string
}

/**
 * Shared “Synchronisieren” control: loading spinner, optional error and last-synced line.
 */
export function ServerSyncControl({
  onSync,
  syncing,
  lastSyncedAt = null,
  error = null,
  disabled = false,
  variant = 'light',
  className = '',
}: ServerSyncControlProps) {
  const v = variantClasses[variant]
  const last = formatLastSyncedShort(lastSyncedAt)

  return (
    <div className={`flex flex-col items-stretch gap-1 sm:items-end ${className}`.trim()}>
      <button
        type="button"
        onClick={() => void onSync()}
        disabled={disabled || syncing}
        className={v.button}
        aria-busy={syncing}
        aria-label="Mit Server synchronisieren"
      >
        {syncing
          ? <Loader2 size={variant === 'dark' ? 14 : 16} className="animate-spin shrink-0" aria-hidden />
          : <RefreshCw size={variant === 'dark' ? 14 : 16} className="shrink-0" aria-hidden />}
        Synchronisieren
      </button>
      {error
        ? <p className={v.error} role="alert">{error}</p>
        : null}
      {last && !error
        ? <p className={v.meta}>Zuletzt synchronisiert: {last}</p>
        : null}
    </div>
  )
}
