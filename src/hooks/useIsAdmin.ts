import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'

/**
 * Prüft ob der aktuelle User Admin ist,
 * indem ein GET auf /api/admin/dashboard gemacht wird.
 * Bei 200 → Admin. Bei 403/401 → kein Admin.
 *
 * Das Ergebnis wird für die Session gecacht,
 * damit nicht bei jedem Sidebar-Render ein API-Call passiert.
 */
let cachedResult: boolean | null = null

export function useIsAdmin(): { isAdmin: boolean; loading: boolean } {
  const { getToken, isSignedIn } = useAuth()
  const [isAdmin, setIsAdmin] = useState(cachedResult ?? false)
  const [loading, setLoading] = useState(cachedResult === null && !!isSignedIn)

  useEffect(() => {
    if (!isSignedIn) {
      cachedResult = null
      setIsAdmin(false)
      setLoading(false)
      return
    }

    if (cachedResult !== null) {
      setIsAdmin(cachedResult)
      setLoading(false)
      return
    }

    setLoading(true)

    const check = async () => {
      try {
        const token = await getToken()
        if (!token) {
          cachedResult = false
          setIsAdmin(false)
          return
        }

        const API_BASE = import.meta.env.VITE_API_BASE_URL || ''
        const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        })

        cachedResult = res.ok
        setIsAdmin(cachedResult)
      } catch {
        cachedResult = false
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    void check()
  }, [isSignedIn, getToken])

  return { isAdmin, loading }
}
