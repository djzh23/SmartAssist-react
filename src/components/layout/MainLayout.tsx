import { Outlet } from 'react-router-dom'
import { AppUiProvider } from '../../context/AppUiContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import TopNavBar from './TopNavBar'
import BottomTabBar from './BottomTabBar'
import '../../styles/landing.css'

/**
 * App shell: the main navigation sits in the top bar on tablet and desktop and in a bottom tab bar on
 * phones. Pages scroll inside <main>, so the bars stay put.
 */
export default function MainLayout() {
  const bp = useBreakpoint()

  return (
    <AppUiProvider>
      <div className="app-main-shell relative flex h-screen flex-col overflow-hidden bg-app-canvas text-[#f0ebe0]">
        <TopNavBar />
        <main
          id="main-content"
          className={[
            'relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto',
            bp === 'mobile' ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : '',
          ].join(' ')}
        >
          <Outlet />
        </main>
        {bp === 'mobile' && <BottomTabBar />}
      </div>
    </AppUiProvider>
  )
}
