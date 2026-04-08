import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react'
import MainLayout from './components/layout/MainLayout'
import LoadingScreen from './components/LoadingScreen'
import LandingPage from './pages/LandingPage'
import ChatPage from './pages/ChatPage'
import ToolsPage from './pages/ToolsPage'
import PricingPage from './pages/PricingPage'
import ProfilePage from './pages/ProfilePage'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string

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

// Requires authentication — redirects to landing if not signed in
function ProtectedApp() {
  const { isSignedIn, isLoaded } = useUser()

  if (!isLoaded) return <LoadingScreen />
  if (!isSignedIn) return <Navigate to="/" replace />
  return <MainLayout />
}

function AppRoutes() {
  const { isLoaded } = useAuth()

  if (!isLoaded) return <LoadingScreen />

  return (
    <Routes>
      {/* Public standalone pages */}
      <Route path="/" element={<LandingPage />} />

      {/* Protected app — requires sign in, renders MainLayout with sidebar */}
      <Route element={<ProtectedApp />}>
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/tools" element={<ToolsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/pricing" element={<PricingPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <AppRoutes />
      </ClerkProviderWithRouter>
    </BrowserRouter>
  )
}
