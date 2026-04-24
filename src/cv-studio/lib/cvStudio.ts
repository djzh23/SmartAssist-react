import { emitAppToast } from '../../context/appUiBridge'
import type { AppToastVariant } from '../../context/appUiBridge'

const LAST_RESUME_KEY = 'smartassist_cv_studio_last_resume_id'

export function getLastResumeId(): string | null {
  try {
    return localStorage.getItem(LAST_RESUME_KEY)
  }
  catch {
    return null
  }
}

export function setLastResumeId(id: string): void {
  try {
    localStorage.setItem(LAST_RESUME_KEY, id)
  }
  catch {
    /* ignore */
  }
}

export function clearLastResumeId(): void {
  try {
    localStorage.removeItem(LAST_RESUME_KEY)
  }
  catch {
    /* ignore */
  }
}

export function downloadBlob(fileName: string, blob: Blob): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function notify(message: string, variant: AppToastVariant = 'info'): void {
  emitAppToast(message, variant)
}
