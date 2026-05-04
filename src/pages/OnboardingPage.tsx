import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useCareerProfile } from '../hooks/useCareerProfile'
import LoadingScreen from '../components/LoadingScreen'
import OnboardingWizard from '../components/onboarding/OnboardingWizard'
import AppCtaButton from '../components/ui/AppCtaButton'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const {
    loading: profileLoading,
    needsOnboarding,
    reload,
    error: profileError,
    skipOnboarding,
  } = useCareerProfile()

  useEffect(() => {
    if (!isLoaded || profileLoading) return
    if (!isSignedIn) {
      navigate('/', { replace: true })
      return
    }
    if (!needsOnboarding && !profileError) {
      // Already onboarded — redirect handled inside wizard after completion,
      // but if user lands here directly with completed profile, go to chat.
      navigate('/chat', { replace: true })
    }
  }, [isLoaded, profileLoading, isSignedIn, needsOnboarding, profileError, navigate])

  if (!isLoaded || profileLoading) return <LoadingScreen />
  if (!isSignedIn) return <LoadingScreen />

  if (profileError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-app-canvas px-6 text-stone-100">
        <p className="mb-4 text-center text-sm text-stone-400">{profileError}</p>
        <AppCtaButton onClick={() => void reload()}>Erneut versuchen</AppCtaButton>
        <button
          type="button"
          onClick={() => navigate('/chat', { replace: true })}
          className="mt-3 text-sm text-stone-500 hover:text-stone-300"
        >
          Zum Chat ohne Profil
        </button>
      </div>
    )
  }

  if (!needsOnboarding) return <LoadingScreen />

  return (
    <OnboardingWizard
      getToken={getToken}
      reload={reload}
      skipOnboarding={skipOnboarding}
    />
  )
}
