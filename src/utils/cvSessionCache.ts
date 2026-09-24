const KEY_PREFIX = 'privateprep_cv_cache_'

export interface CachedCv {
  text: string
  hash: string
  length: number
}

function key(userId: string): string {
  return KEY_PREFIX + userId
}

function parseCachedCv(raw: string | null): CachedCv | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<CachedCv>
    const text = typeof parsed.text === 'string' ? parsed.text : ''
    const hash = typeof parsed.hash === 'string' ? parsed.hash.trim().toLowerCase() : ''
    const length = typeof parsed.length === 'number' ? parsed.length : text.length
    if (!text.trim() || hash.length !== 64) return null
    return { text, hash, length }
  } catch {
    return null
  }
}

function readStorage(storage: Storage, userId: string): CachedCv | null {
  try {
    return parseCachedCv(storage.getItem(key(userId)))
  } catch {
    return null
  }
}

function writeStorage(storage: Storage, userId: string, cache: CachedCv): void {
  storage.setItem(key(userId), JSON.stringify({
    text: cache.text,
    hash: cache.hash.trim().toLowerCase(),
    length: cache.length,
  }))
}

/**
 * One current CV per signed-in user, on this origin. localStorage is shared across tabs
 * (including the tab the extension opens). A leftover sessionStorage copy is migrated once.
 */
export function readCachedCv(userId: string | null | undefined): CachedCv | null {
  if (!userId) return null
  const fromLocal = readStorage(localStorage, userId)
  if (fromLocal) return fromLocal

  const fromSession = readStorage(sessionStorage, userId)
  if (!fromSession) return null
  storeCachedCv(userId, fromSession)
  try {
    sessionStorage.removeItem(key(userId))
  } catch {
    /* ignore */
  }
  return fromSession
}

export function storeCachedCv(userId: string, cache: CachedCv): void {
  try {
    writeStorage(localStorage, userId, cache)
  } catch {
    /* quota or blocked storage */
  }
  try {
    sessionStorage.removeItem(key(userId))
  } catch {
    /* ignore */
  }
}

export function clearCachedCv(userId: string | null | undefined): void {
  if (!userId) return
  try {
    localStorage.removeItem(key(userId))
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(key(userId))
  } catch {
    /* ignore */
  }
}

export function isCachedCvReady(cache: CachedCv | null, serverHash?: string | null): boolean {
  if (!cache || cache.text.trim().length < 50) return false
  if (serverHash && serverHash.trim().toLowerCase() !== cache.hash) return false
  return true
}
