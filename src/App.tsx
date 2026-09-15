import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import DocumentHead from './components/layout/DocumentHead'
import MainLayout from './components/layout/MainLayout'
import LoadingScreen from './components/LoadingScreen'
import { useCareerProfile } from './hooks/useCareerProfile'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const CareerProfilePage = lazy(() => import('./pages/CareerProfilePage'))
const AnalyzePage = lazy(() => import('./pages/AnalyzePage'))
const ImpressumPage = lazy(() => import('./pages/ImpressumPage'))
const DatenschutzPage = lazy(() => import('./pages/DatenschutzPage'))

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

function RouteFallback() {
  return <LoadingScreen />
}

function ClerkProviderWithRouter({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  return (
    <ClerkProvider
      publishableKey={PUBLISHABLE_KEY}
      routerPush={(to: string) => navigate(to)}
      routerReplace={(to: string) => navigate(to, { replace: true })}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}

function ProtectedApp() {
  const { isSignedIn, isLoaded } = useUser()
  const { needsOnboarding, loading: profileLoading } = useCareerProfile()

  if (!isLoaded) return <LoadingScreen />
  if (!isSignedIn) return <Navigate to="/" replace />
  if (!profileLoading && needsOnboarding) return <Navigate to="/onboarding" replace />
  return <MainLayout />
}

function RequireSignedIn({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) return <LoadingScreen />
  if (!isSignedIn) return <Navigate to="/" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { isLoaded } = useAuth()

  if (!isLoaded) return <LoadingScreen />

  return (
    <Routes>
      <Route
        path="/"
        element={(
          <Suspense fallback={<RouteFallback />}>
            <LandingPage />
          </Suspense>
        )}
      />

      <Route
        path="/onboarding"
        element={
          <RequireSignedIn>
            <Suspense fallback={<RouteFallback />}>
              <OnboardingPage />
            </Suspense>
          </RequireSignedIn>
        }
      />

      <Route element={<ProtectedApp />}>
        <Route
          path="/analyze"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <AnalyzePage />
            </Suspense>
          )}
        />
        <Route
          path="/profile"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <ProfilePage />
            </Suspense>
          )}
        />
        <Route
          path="/career-profile"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <CareerProfilePage />
            </Suspense>
          )}
        />
        <Route
          path="/pricing"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <PricingPage />
            </Suspense>
          )}
        />
        <Route path="/chat" element={<Navigate to="/analyze" replace />} />
        <Route path="/overview" element={<Navigate to="/analyze" replace />} />
        <Route path="/applications/*" element={<Navigate to="/analyze" replace />} />
        <Route path="/guides/*" element={<Navigate to="/analyze" replace />} />
        <Route path="/notes" element={<Navigate to="/analyze" replace />} />
        <Route path="/cv-studio/*" element={<Navigate to="/career-profile" replace />} />
        <Route path="/admin" element={<Navigate to="/analyze" replace />} />
      </Route>

      <Route
        path="/impressum"
        element={(
          <Suspense fallback={<RouteFallback />}>
            <ImpressumPage />
          </Suspense>
        )}
      />
      <Route
        path="/datenschutz"
        element={(
          <Suspense fallback={<RouteFallback />}>
            <DatenschutzPage />
          </Suspense>
        )}
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <ClerkProviderWithRouter>
          <DocumentHead />
          <AppRoutes />
        </ClerkProviderWithRouter>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}
