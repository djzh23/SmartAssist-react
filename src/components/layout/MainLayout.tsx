import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ChatSessionsProvider } from '../../hooks/useChatSessions'
import { ChatNotesProvider } from '../../hooks/useChatNotes'
import { LayoutChromeProvider, useLayoutChrome } from '../../context/LayoutChromeContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import ChatNotesStorageBanner from './ChatNotesStorageBanner'
import SidebarNavContent from './SidebarNavContent'
import TopNavBar from './TopNavBar'
import MobileDrawer from './MobileDrawer'
import BottomTabBar from './BottomTabBar'
import MobileMoreSheet from './MobileMoreSheet'

function MainLayoutShell() {
  const bp = useBreakpoint()
  const {
    drawerOpen,
    setDrawerOpen,
    tabletSidebarExpanded,
    setTabletSidebarExpanded,
    drawerTriggerRef,
  } = useLayoutChrome()
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (bp !== 'mobile') setDrawerOpen(false)
  }, [bp, setDrawerOpen])

  useEffect(() => {
    if (bp === 'mobile' && drawerOpen) {
      mainRef.current?.setAttribute('aria-hidden', 'true')
    }
    else {
      mainRef.current?.removeAttribute('aria-hidden')
    }
  }, [bp, drawerOpen])

  const showTabletDesktopSidebar = bp === 'tablet' || bp === 'desktop'
  const sidebarDensity = bp === 'desktop' || (bp === 'tablet' && tabletSidebarExpanded) ? 'full' : 'icons'
  const asideWidthClass =
    bp === 'desktop'
      ? 'w-60'
      : tabletSidebarExpanded
        ? 'w-60'
        : 'w-14'

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      <TopNavBar onMenuClick={() => setDrawerOpen(v => !v)} menuOpen={drawerOpen} />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {bp === 'mobile' && (
          <MobileDrawer
            open={drawerOpen}
            onClose={() => {
              setDrawerOpen(false)
              queueMicrotask(() => drawerTriggerRef.current?.focus())
            }}
          />
        )}

        {showTabletDesktopSidebar && (
          <aside
            className={[
              'hidden flex-shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out min-[769px]:flex',
              asideWidthClass,
            ].join(' ')}
          >
            {bp === 'tablet' && (
              <button
                type="button"
                className="flex h-10 w-full flex-shrink-0 items-center justify-center border-b border-sidebar-border text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-text"
                onClick={() => setTabletSidebarExpanded(v => !v)}
                aria-label={tabletSidebarExpanded ? 'Seitenleiste einklappen' : 'Seitenleiste ausklappen'}
              >
                {tabletSidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>
            )}
            <div className="min-h-0 flex-1 overflow-hidden">
              <SidebarNavContent density={sidebarDensity} />
            </div>
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main
            ref={mainRef}
            className={[
              'relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto',
              bp === 'mobile' ? 'pb-[calc(3.5rem+env(safe-area-inset-bottom))]' : '',
            ].join(' ')}
          >
            <ChatNotesStorageBanner />
            <Outlet />
          </main>
        </div>
      </div>

      {bp === 'mobile' && (
        <>
          <BottomTabBar />
          <MobileMoreSheet />
        </>
      )}
    </div>
  )
}

export default function MainLayout() {
  return (
    <ChatSessionsProvider>
      <ChatNotesProvider>
        <LayoutChromeProvider>
          <MainLayoutShell />
        </LayoutChromeProvider>
      </ChatNotesProvider>
    </ChatSessionsProvider>
  )
}
