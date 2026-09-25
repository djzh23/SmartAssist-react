import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { countNewInboxJobs } from '../api/inboxClient'
import { waitForAuthToken } from '../utils/waitForAuthToken'

const CACHE_MS = 30_000
const INVALIDATE_EVENT = 'privateprep_inbox_count_invalidated'

// Module-level cache shared by every hook instance (nav bar, tab bar, ...) so switching
// pages or re-rendering the nav does not refetch within the cache window.
let cachedCount: number | null = null
let cachedAt = 0
let inFlight: Promise<number> | null = null

/**
 * Call this after any action that can change which jobs count as "New" (deleting a job today;
 * marking one Analyzed once a real analyze-completion call exists). Clears the shared cache and
 * broadcasts to every mounted useInboxNewCount instance (nav bar, tab bar, ...) so the badge
 * refetches immediately instead of showing a stale count for up to CACHE_MS.
 */
export function invalidateInboxCount(): void {
  cachedCount = null
  cachedAt = 0
  window.dispatchEvent(new Event(INVALIDATE_EVENT))
}

async function fetchNewCount(getToken: () => Promise<string | null>): Promise<number> {
  const token = await waitForAuthToken(getToken)
  if (!token) throw new Error('token_unavailable')
  return countNewInboxJobs(token)
}

/**
 * Count of inbox jobs with status "New", refreshed at most every 30 seconds, or immediately
 * whenever invalidateInboxCount() is called.
 */
export function useInboxNewCount(): number {
  const { getToken, isSignedIn } = useAuth()
  const [count, setCount] = useState(cachedCount ?? 0)

  useEffect(() => {
    if (!isSignedIn) return

    let cancelled = false

    const refresh = (force: boolean) => {
      const fresh = !force && Date.now() - cachedAt < CACHE_MS
      if (fresh && cachedCount !== null) {
        setCount(cachedCount)
        return
      }

      inFlight ??= fetchNewCount(getToken).finally(() => {
        inFlight = null
      })

      inFlight
        .then(next => {
          cachedCount = next
          cachedAt = Date.now()
          if (!cancelled) setCount(next)
        })
        .catch(() => {
          // Keep whatever count was last shown; the nav badge is a hint, not critical data.
        })
    }

    refresh(false)

    const onInvalidate = () => refresh(true)
    window.addEventListener(INVALIDATE_EVENT, onInvalidate)

    return () => {
      cancelled = true
      window.removeEventListener(INVALIDATE_EVENT, onInvalidate)
    }
  }, [isSignedIn, getToken])

  return isSignedIn ? count : 0
}
