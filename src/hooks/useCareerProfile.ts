import { useCallback, useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { fetchProfile, skipOnboardingApi, type CareerProfile } from '../api/profileClient'
import type { ProfileContextToggles } from '../types'

function togglesKey(userId: string | null): string {
  return userId ? `privateprep_profile_toggles_${userId}` : 'privateprep_profile_toggles_guest'
}

const defaultToggles = (): ProfileContextToggles => ({
  includeBasicProfile: true,
  includeSkills: true,
  includeExperience: true,
  includeCv: false,
  activeTargetJobId: null,
})

function loadToggles(userId: string | null): ProfileContextToggles {
  try {
    const saved = localStorage.getItem(togglesKey(userId))
    if (!saved) return defaultToggles()
    const parsed = JSON.parse(saved) as Partial<ProfileContextToggles>
    return { ...defaultToggles(), ...parsed }
  } catch {
    return defaultToggles()
  }
}

export function useCareerProfile() {
  const { getToken, isSignedIn } = useAuth()
  const { user } = useUser()
  const clerkUserId = user?.id ?? null

  const [profile, setProfile] = useState<CareerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [toggles, setToggles] = useState<ProfileContextToggles>(() => loadToggles(null))

  useEffect(() => {
    setToggles(loadToggles(isSignedIn ? clerkUserId : null))
  }, [clerkUserId, isSignedIn])

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
  }, [loadProfile, clerkUserId])

  const updateToggles = useCallback(
    (newToggles: Partial<ProfileContextToggles>) => {
      const uid = isSignedIn ? clerkUserId : null
      setToggles(prev => {
        const updated = { ...prev, ...newToggles }
        localStorage.setItem(togglesKey(uid), JSON.stringify(updated))
        return updated
      })
    },
    [clerkUserId, isSignedIn],
  )

  const skipOnboarding = useCallback(async () => {
    const token = await getToken()
    if (!token) throw new Error('Nicht angemeldet')
    await skipOnboardingApi(token)
    await loadProfile()
  }, [getToken, loadProfile])

  const needsOnboarding =
    isSignedIn && !loading && !error && profile != null && !profile.onboardingCompleted

  return {
    profile,
    toggles,
    updateToggles,
    loading,
    error,
    reload: loadProfile,
    skipOnboarding,
    needsOnboarding,
    hasProfile: isSignedIn && !loading && profile != null && profile.onboardingCompleted,
  }
}
