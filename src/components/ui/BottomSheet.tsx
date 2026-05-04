import { useEffect } from 'react'
import type { ReactNode } from 'react'

interface BottomSheetProps {
  open: boolean
  title?: string
  onClose: () => void
  children: ReactNode
}

export default function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label={title ?? 'Menü'}>
      <button
        type="button"
        className="absolute inset-0 bg-black/55"
        onClick={onClose}
        aria-label="Schließen"
      />
      <div className="relative z-10 max-h-[70vh] w-full overflow-hidden rounded-t-2xl border border-white/10 bg-[#1b120d] shadow-2xl sm:mx-4 sm:max-w-lg sm:rounded-2xl">
        <div className="flex justify-center py-2">
          <span className="h-1 w-10 rounded-full bg-white/20" aria-hidden />
        </div>
        {title ? (
          <p className="px-4 pb-2 text-sm font-semibold text-stone-100">{title}</p>
        ) : null}
        <div className="overflow-y-auto px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">{children}</div>
      </div>
    </div>
  )
}
