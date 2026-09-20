const KEY_PREFIX = 'privateprep_cv_cache_'

export interface CachedCv {
  text: string
  hash: string
  length: number
}

function key(userId: string): string {
  return KEY_PREFIX + userId
}

export function readCachedCv(userId: string | null | undefined): CachedCv | null {
  if (!userId) return null
  try {
    const raw = sessionStorage.getItem(key(userId))
    if (!raw) return null
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

export function storeCachedCv(userId: string, cache: CachedCv): void {
  try {
    sessionStorage.setItem(key(userId), JSON.stringify({
      text: cache.text,
      hash: cache.hash.trim().toLowerCase(),
      length: cache.length,
    }))
  } catch {
    /* quota */
  }
}

export function clearCachedCv(userId: string | null | undefined): void {
  if (!userId) return
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
