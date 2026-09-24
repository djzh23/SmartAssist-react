import { afterEach, describe, expect, it } from 'vitest'
import { clearCachedCv, isCachedCvReady, readCachedCv, storeCachedCv } from './cvSessionCache'

const USER = 'user_cv_cache'
const HASH = 'a'.repeat(64)
const SAMPLE = { text: 'Berufliche Stationen und Skills fuer die Analyse. '.repeat(3), hash: HASH, length: 180 }

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('cv browser cache', () => {
  it('stores and reads from localStorage so a new tab finds the same CV', () => {
    storeCachedCv(USER, SAMPLE)
    expect(localStorage.getItem(`privateprep_cv_cache_${USER}`)).toBeTruthy()
    expect(sessionStorage.getItem(`privateprep_cv_cache_${USER}`)).toBeNull()
    expect(readCachedCv(USER)?.hash).toBe(HASH)
    expect(isCachedCvReady(readCachedCv(USER), HASH)).toBe(true)
  })

  it('moves a leftover sessionStorage copy into localStorage once', () => {
    sessionStorage.setItem(`privateprep_cv_cache_${USER}`, JSON.stringify(SAMPLE))
    const cached = readCachedCv(USER)
    expect(cached?.text).toBe(SAMPLE.text)
    expect(localStorage.getItem(`privateprep_cv_cache_${USER}`)).toBeTruthy()
    expect(sessionStorage.getItem(`privateprep_cv_cache_${USER}`)).toBeNull()
  })

  it('clears both storages', () => {
    storeCachedCv(USER, SAMPLE)
    sessionStorage.setItem(`privateprep_cv_cache_${USER}`, JSON.stringify(SAMPLE))
    clearCachedCv(USER)
    expect(readCachedCv(USER)).toBeNull()
  })
})
