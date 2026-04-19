import { useEffect, useRef } from 'react'
import SidebarNavContent from './SidebarNavContent'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Slide-in drawer for mobile (≤768px). GPU transform only; focus trap + Escape.
 */
export default function MobileDrawer({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const panel = panelRef.current
    if (!panel) return
    const focusable = panel.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    )
    const first = focusable[0]
    first?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key !== 'Tab' || focusable.length === 0) return
      const last = focusable[focusable.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
      else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <>
      <div
        className={[
          'fixed inset-x-0 z-[35] bg-black/50 transition-opacity duration-200 desktop:hidden',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
          'top-12 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]',
        ].join(' ')}
        style={{ visibility: open ? 'visible' : 'hidden' }}
        aria-hidden={!open}
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        id="mobile-app-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Coaching und Chats"
        className={[
          'fixed left-0 z-[40] flex w-[min(280px,80vw)] flex-col bg-sidebar shadow-xl transition-transform duration-[250ms] ease-out desktop:hidden',
          'top-12 bottom-[calc(3.5rem+env(safe-area-inset-bottom))]',
          open ? 'translate-x-0' : '-translate-x-full pointer-events-none',
        ].join(' ')}
      >
        <SidebarNavContent density="full" onNavClick={onClose} />
      </aside>
    </>
  )
}
