import { useEffect, useState, type ReactNode } from 'react'
import { Info, X } from 'lucide-react'

export interface InfoExplainerButtonProps {
  /** Modal title */
  modalTitle: string
  /** Accessible name for the trigger */
  ariaLabel: string
  children: ReactNode
  /** Trigger colors: dark headers vs. parchment/light surfaces */
  variant?: 'onLight' | 'onDark'
  /** Extra classes on the trigger button */
  className?: string
}

/**
 * Compact info (i) trigger; opens a modal with explanatory copy so pages stay scannable.
 */
export default function InfoExplainerButton({
  modalTitle,
  ariaLabel,
  children,
  variant = 'onLight',
  className = '',
}: InfoExplainerButtonProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const triggerBase =
    variant === 'onDark'
      ? 'text-stone-400 hover:bg-white/10 hover:text-stone-100'
      : 'text-stone-500 hover:bg-stone-200/70 hover:text-stone-900'

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'inline-flex shrink-0 items-center justify-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent',
          triggerBase,
          className,
        ].join(' ')}
        aria-label={ariaLabel}
      >
        <Info size={18} strokeWidth={2.25} aria-hidden />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="relative w-full max-w-lg rounded-2xl border border-stone-300/40 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-explainer-title"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 id="info-explainer-title" className="text-base font-semibold text-stone-900">
                {modalTitle}
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                aria-label="Schließen"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <div className="max-h-[62vh] overflow-y-auto px-5 py-5 text-sm text-stone-700 leading-relaxed">
              {children}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
