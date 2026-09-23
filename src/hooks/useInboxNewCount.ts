import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { InboxJobStatus, listInboxJobs } from '../api/inboxClient'

const CACHE_MS = 30_000

// Module-level cache shared by every hook instance (nav bar, tab bar, ...) so switching
// pages or re-rendering the nav does not refetch within the cache window.
let cachedCount: number | null = null
let cachedAt = 0
let inFlight: Promise<number> | null = null

/** Count of inbox jobs with status "New", refreshed at most every 30 seconds. */
export function useInboxNewCount(): number {
  const { getToken, isSignedIn } = useAuth()
  const [count, setCount] = useState(cachedCount ?? 0)

  useEffect(() => {
    if (!isSignedIn) return

    const fresh = Date.now() - cachedAt < CACHE_MS
    if (fresh && cachedCount !== null) {
      setCount(cachedCount)
      return
    }

    let cancelled = false
    const load = async (): Promise<number> => {
      const token = await getToken()
      if (!token) return 0
      const jobs = await listInboxJobs(token)
      return jobs.filter(job => job.status === InboxJobStatus.New).length
    }

    inFlight ??= load().finally(() => {
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

    return () => {
      cancelled = true
    }
  }, [isSignedIn, getToken])

  return isSignedIn ? count : 0
}
