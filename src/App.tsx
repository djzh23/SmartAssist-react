import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import DocumentHead from './components/layout/DocumentHead'
import MainLayout from './components/layout/MainLayout'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './pages/LandingPage'
import { useCareerProfile } from './hooks/useCareerProfile'
const ChatPage = lazy(() => import('./pages/ChatPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'))

const OverviewPage = lazy(() => import('./pages/OverviewPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const CareerProfilePage = lazy(() => import('./pages/CareerProfilePage'))
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'))
const ApplicationsPage = lazy(() => import('./pages/ApplicationsPage'))
const ApplicationNewPage = lazy(() => import('./pages/ApplicationNewPage'))
const ApplicationDetailPage = lazy(() => import('./pages/ApplicationDetailPage'))
const GuidesIndexPage = lazy(() => import('./pages/guides/GuidesIndexPage'))
const GuideArticlePage = lazy(() => import('./pages/guides/GuideArticlePage'))
const NotesPage = lazy(() => import('./pages/NotesPage'))
const CvStudioRouter = lazy(() => import('./cv-studio/CvStudioRouter'))

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

function RouteFallback() {
  return <LoadingScreen />
}

// ClerkProvider must be inside BrowserRouter so useNavigate is available
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

// Requires authentication - redirects to landing if not signed in, to /onboarding if not yet onboarded
function ProtectedApp() {
  const { isSignedIn, isLoaded } = useUser()
  const { needsOnboarding, loading: profileLoading } = useCareerProfile()

  if (!isLoaded || profileLoading) return <LoadingScreen />
  if (!isSignedIn) return <Navigate to="/" replace />
  if (needsOnboarding) return <Navigate to="/onboarding" replace />
  return <MainLayout />
}

/** Signed-in only, no MainLayout - /admin (sidebar shows link only for admins). */
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
      {/* Public standalone pages */}
      <Route path="/" element={<LandingPage />} />

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

      {/* Protected app - requires sign in, renders MainLayout with sidebar */}
      <Route element={<ProtectedApp />}>
        <Route
          path="/chat"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <ChatPage />
            </Suspense>
          )}
        />
        <Route
          path="/overview"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <OverviewPage />
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
        <Route
          path="/applications"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <ApplicationsPage />
            </Suspense>
          )}
        />
        <Route
          path="/applications/new"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <ApplicationNewPage />
            </Suspense>
          )}
        />
        <Route
          path="/applications/:id"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <ApplicationDetailPage />
            </Suspense>
          )}
        />
        <Route
          path="/guides"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <GuidesIndexPage />
            </Suspense>
          )}
        />
        <Route
          path="/guides/:slug"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <GuideArticlePage />
            </Suspense>
          )}
        />
        <Route
          path="/notes"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <NotesPage />
            </Suspense>
          )}
        />
        <Route
          path="/cv-studio/*"
          element={(
            <Suspense fallback={<RouteFallback />}>
              <CvStudioRouter />
            </Suspense>
          )}
        />
      </Route>

      <Route
        path="/admin"
        element={(
          <RequireSignedIn>
            <Suspense fallback={<RouteFallback />}>
              <AdminDashboardPage />
            </Suspense>
          </RequireSignedIn>
        )}
      />

      {/* Fallback */}
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
