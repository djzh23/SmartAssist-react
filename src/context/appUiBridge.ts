/** Options for the global confirm modal (`AppUiProvider`). */
export type AppConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  /** Red confirm button (delete, reset, …) */
  danger?: boolean
}

/** Dispatched on `window`; `AppUiProvider` shows a toast. Keeps non-React helpers (e.g. CV notify) free of React imports. */
export const APP_TOAST_EVENT = 'smartassist-app-toast'

export type AppToastVariant = 'info' | 'success' | 'error'

export type AppToastDetail = { message: string; variant: AppToastVariant }

export function emitAppToast(message: string, variant: AppToastVariant = 'info'): void {
  const detail: AppToastDetail = { message, variant }
  window.dispatchEvent(new CustomEvent(APP_TOAST_EVENT, { detail }))
}
