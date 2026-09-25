import { clearCachedCv } from './cvSessionCache'

export const PENDING_CV_PARSED_KEY = 'privateprep_pending_cv_parsed'
export const LAST_ANALYZE_REPORT_PREFIX = 'privateprep_last_analyze_report_'

function togglesKey(userId: string): string {
  return `privateprep_profile_toggles_${userId}`
}

/** Clears CV text, leftover parse drafts and the last ad-hoc report on this device. */
export function clearLocalCvDerivedState(userId: string | null | undefined): void {
  clearCachedCv(userId)
  try {
    sessionStorage.removeItem(PENDING_CV_PARSED_KEY)
  } catch {
    /* ignore */
  }
  if (!userId) return
  try {
    sessionStorage.removeItem(LAST_ANALYZE_REPORT_PREFIX + userId)
  } catch {
    /* ignore */
  }
  try {
    const raw = localStorage.getItem(togglesKey(userId))
    if (!raw) return
    const parsed = JSON.parse(raw) as { includeCv?: boolean }
    if (parsed.includeCv) {
      localStorage.setItem(togglesKey(userId), JSON.stringify({ ...parsed, includeCv: false }))
    }
  } catch {
    /* ignore */
  }
}
