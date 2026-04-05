import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import MainLayout from './components/layout/MainLayout'
import HomePage from './pages/HomePage'
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
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      afterSignOutUrl="/"
    >
      {children}
    </ClerkProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ClerkProviderWithRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route index element={<HomePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </ClerkProviderWithRouter>
    </BrowserRouter>
  )
}
