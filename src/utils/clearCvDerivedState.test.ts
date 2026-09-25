import { afterEach, describe, expect, it } from 'vitest'
import { clearLocalCvDerivedState, LAST_ANALYZE_REPORT_PREFIX, PENDING_CV_PARSED_KEY } from './clearCvDerivedState'
import { readCachedCv, storeCachedCv } from './cvSessionCache'

const USER = 'user_clear_cv'
const HASH = 'b'.repeat(64)

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('clearLocalCvDerivedState', () => {
  it('removes CV cache, pending parse and last analyze report', () => {
    storeCachedCv(USER, { text: 'Berufliche Stationen und Skills fuer die Analyse. '.repeat(3), hash: HASH, length: 180 })
    sessionStorage.setItem(PENDING_CV_PARSED_KEY, '{"skills":["Excel"]}')
    sessionStorage.setItem(LAST_ANALYZE_REPORT_PREFIX + USER, '{"report":{}}')
    localStorage.setItem(`privateprep_profile_toggles_${USER}`, JSON.stringify({ includeCv: true }))

    clearLocalCvDerivedState(USER)

    expect(readCachedCv(USER)).toBeNull()
    expect(sessionStorage.getItem(PENDING_CV_PARSED_KEY)).toBeNull()
    expect(sessionStorage.getItem(LAST_ANALYZE_REPORT_PREFIX + USER)).toBeNull()
    expect(JSON.parse(localStorage.getItem(`privateprep_profile_toggles_${USER}`) ?? '{}').includeCv).toBe(false)
  })
})
