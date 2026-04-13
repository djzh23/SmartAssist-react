import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'

/**
 * Prüft ob der aktuelle User Admin ist (GET /api/admin/dashboard).
 * Ergebnis wird pro Clerk userId gecacht — bei Userwechsel wird neu geprüft.
 */
let cachedResult: { userId: string; isAdmin: boolean } | null = null

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const currentUserId = user?.id ?? null

  const [isAdmin, setIsAdmin] = useState(() => {
    if (!currentUserId || !cachedResult || cachedResult.userId !== currentUserId) return false
    return cachedResult.isAdmin
  })
  const [loading, setLoading] = useState(() => {
    if (!isSignedIn) return false
    if (!currentUserId) return true
    return cachedResult?.userId !== currentUserId
  })

  useEffect(() => {
    if (!isSignedIn || !currentUserId) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    if (cachedResult?.userId === currentUserId) {
      setIsAdmin(cachedResult.isAdmin)
      setLoading(false)
      return
    }

    setLoading(true)

    const check = async () => {
      try {
        const token = await getToken()
        if (!token) {
          cachedResult = { userId: currentUserId, isAdmin: false }
          setIsAdmin(false)
          return
        }

        const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        const admin = res.ok
        cachedResult = { userId: currentUserId, isAdmin: admin }
        setIsAdmin(admin)
      } catch {
        cachedResult = { userId: currentUserId, isAdmin: false }
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    void check()
  }, [isSignedIn, currentUserId, getToken])

  return { isAdmin, loading }
}
