import { useEffect, type RefObject } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter(el => !el.hasAttribute('disabled') && el.offsetParent !== null)
}

/**
 * Trap Tab/Shift+Tab focus inside the container while `open` is true, focus the first
 * focusable element on mount, and restore focus to the previously-focused element on
 * close. Keyboard/SR users can no longer tab "behind" the overlay.
 *
 * Intentionally lightweight (no library) since we already render plain divs as dialogs.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement>, open: boolean): void {
  useEffect(() => {
    if (!open) return
    const container = containerRef.current
    if (!container) return

    const previouslyFocused = document.activeElement as HTMLElement | null

    // Defer to next frame so the dialog content has rendered before we focus into it.
    const initialFocusFrame = requestAnimationFrame(() => {
      const focusables = getFocusable(container)
      const target = focusables[0] ?? container
      if (target && !container.contains(document.activeElement)) {
        target.focus({ preventScroll: true })
      }
    })

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return
      const focusables = getFocusable(container)
      if (focusables.length === 0) {
        event.preventDefault()
        container.focus({ preventScroll: true })
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement as HTMLElement | null

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
      } else {
        if (active === last) {
          event.preventDefault()
          first.focus({ preventScroll: true })
        }
      }
    }

    container.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(initialFocusFrame)
      container.removeEventListener('keydown', onKeyDown)
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true })
      }
    }
  }, [containerRef, open])
}
