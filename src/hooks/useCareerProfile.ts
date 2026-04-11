import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { fetchProfile, skipOnboardingApi, type CareerProfile } from '../api/profileClient'
import type { ProfileContextToggles } from '../types'

const TOGGLES_KEY = 'privateprep_profile_toggles'

const defaultToggles = (): ProfileContextToggles => ({
  includeBasicProfile: true,
  includeSkills: true,
  includeExperience: false,
  includeCv: false,
  activeTargetJobId: null,
})

function loadToggles(): ProfileContextToggles {
  try {
    const saved = localStorage.getItem(TOGGLES_KEY)
    if (!saved) return defaultToggles()
    const parsed = JSON.parse(saved) as Partial<ProfileContextToggles>
    return { ...defaultToggles(), ...parsed }
  } catch {
    return defaultToggles()
  }
}

export function useCareerProfile() {
  const { getToken, isSignedIn } = useAuth()
  const [profile, setProfile] = useState<CareerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [toggles, setToggles] = useState<ProfileContextToggles>(loadToggles)

  const loadProfile = useCallback(async () => {
    if (!isSignedIn) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setProfile(null)
        return
      }
      const data = await fetchProfile(token)
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profil konnte nicht geladen werden')
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [isSignedIn, getToken])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile])

  const updateToggles = useCallback((newToggles: Partial<ProfileContextToggles>) => {
    setToggles(prev => {
      const updated = { ...prev, ...newToggles }
      localStorage.setItem(TOGGLES_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const skipOnboarding = useCallback(async () => {
    const token = await getToken()
    if (!token) throw new Error('Nicht angemeldet')
    await skipOnboardingApi(token)
    await loadProfile()
  }, [getToken, loadProfile])

  const needsOnboarding =
    isSignedIn && !loading && !error && profile !== null && !profile.onboardingCompleted

  return {
    profile,
    toggles,
    updateToggles,
    loading,
    error,
    reload: loadProfile,
    skipOnboarding,
    needsOnboarding,
    hasProfile: isSignedIn && !loading && profile !== null && profile.onboardingCompleted,
  }
}
