import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { fetchSkills } from '../api/client'
import type { SkillSummary } from '../types'

export function useSkills() {
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const [skills, setSkills] = useState<SkillSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!isLoaded) return
    setLoading(true)
    setError(null)
    try {
      const token = isSignedIn ? await getToken() : null
      const data = await fetchSkills(token ?? undefined)
      const filtered = data.filter(s => {
        const t = s.apiToolType.toLowerCase()
        const id = s.id.toLowerCase()
        return t !== 'weather' && t !== 'jokes' && id !== 'weather' && id !== 'jokes'
      })
      setSkills(filtered)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Skills konnten nicht geladen werden')
      setSkills(null)
    } finally {
      setLoading(false)
    }
  }, [getToken, isLoaded, isSignedIn])

  useEffect(() => {
    void reload()
  }, [reload])

  return { skills, loading, error, reload }
}
