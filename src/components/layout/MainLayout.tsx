import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ChatSessionsProvider } from '../../hooks/useChatSessions'
import { ChatNotesProvider } from '../../hooks/useChatNotes'
import { AppUiProvider } from '../../context/AppUiContext'
import { LayoutChromeProvider, useLayoutChrome } from '../../context/LayoutChromeContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import ChatNotesStorageBanner from './ChatNotesStorageBanner'
import SidebarNavContent from './SidebarNavContent'
import TopNavBar from './TopNavBar'
import MobileDrawer from './MobileDrawer'
import BottomTabBar from './BottomTabBar'
import MobileMoreSheet from './MobileMoreSheet'
import '../../styles/landing.css'

function MainLayoutShell() {
  const bp = useBreakpoint()
  const {
    drawerOpen,
    setDrawerOpen,
    tabletSidebarExpanded,
    setTabletSidebarExpanded,
    drawerTriggerRef,
    desktopChatHistoryOpen,
    setDesktopChatHistoryOpen,
    collapseDesktopRail,
    registerDesktopRailCollapse,
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
    tabletSidebarExpanded ? 'w-60' : 'w-14'

  /** Desktop (≥1025px): icon rail + hover overlay expand — chat column stays full width (overlay). */
  const [railWide, setRailWide] = useState(false)
  const [railLabelsShown, setRailLabelsShown] = useState(false)
  const railEnterTimerRef = useRef<number>()
  const railLeaveCollapseTimerRef = useRef<number>()

  const onDesktopRailEnter = () => {
    /** Hover rail wins over chat history: one desktop overlay at a time. */
    if (desktopChatHistoryOpen)
      setDesktopChatHistoryOpen(false)
    if (railLeaveCollapseTimerRef.current) {
      window.clearTimeout(railLeaveCollapseTimerRef.current)
      railLeaveCollapseTimerRef.current = undefined
    }
    if (railEnterTimerRef.current)
      window.clearTimeout(railEnterTimerRef.current)
    railEnterTimerRef.current = window.setTimeout(() => {
      setRailWide(true)
      setRailLabelsShown(true)
    }, 80)
  }

  const onDesktopRailLeave = (e: React.MouseEvent) => {
    const rel = e.relatedTarget as Node | null
    if (rel) {
      const hist = document.querySelector('[data-desktop-history-panel]')
      if (hist?.contains(rel))
        return
    }
    if (railEnterTimerRef.current) {
      window.clearTimeout(railEnterTimerRef.current)
      railEnterTimerRef.current = undefined
    }
    setRailLabelsShown(false)
    railLeaveCollapseTimerRef.current = window.setTimeout(() => {
      setRailWide(false)
      railLeaveCollapseTimerRef.current = undefined
    }, 120)
  }

  const collapseRailTimersAndWidth = useCallback(() => {
    if (railEnterTimerRef.current) {
      window.clearTimeout(railEnterTimerRef.current)
      railEnterTimerRef.current = undefined
    }
    if (railLeaveCollapseTimerRef.current) {
      window.clearTimeout(railLeaveCollapseTimerRef.current)
      railLeaveCollapseTimerRef.current = undefined
    }
    setRailLabelsShown(false)
    setRailWide(false)
  }, [])

  useEffect(() => {
    registerDesktopRailCollapse(collapseRailTimersAndWidth)
    return () => registerDesktopRailCollapse(null)
  }, [collapseRailTimersAndWidth, registerDesktopRailCollapse])

  useEffect(() => {
    if (!desktopChatHistoryOpen)
      return
    collapseRailTimersAndWidth()
  }, [desktopChatHistoryOpen, collapseRailTimersAndWidth])

  /** Desktop: click/tap outside rail + history panel closes both (smooth CSS transitions). */
  useEffect(() => {
    if (bp !== 'desktop')
      return
    const panelsOpen = railWide || railLabelsShown || desktopChatHistoryOpen
    if (!panelsOpen)
      return

    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node
      if (document.querySelector('[data-desktop-sidebar-hover]')?.contains(t))
        return
      if (document.querySelector('[data-desktop-history-panel]')?.contains(t))
        return
      const el = e.target as HTMLElement
      if (el.closest?.('[role="dialog"]'))
        return
      setDesktopChatHistoryOpen(false)
      collapseDesktopRail()
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [
    bp,
    railWide,
    railLabelsShown,
    desktopChatHistoryOpen,
    setDesktopChatHistoryOpen,
    collapseDesktopRail,
  ])

  useEffect(() => {
    return () => {
      if (railEnterTimerRef.current)
        window.clearTimeout(railEnterTimerRef.current)
      if (railLeaveCollapseTimerRef.current)
        window.clearTimeout(railLeaveCollapseTimerRef.current)
    }
  }, [])

  return (
    <div className="app-main-shell relative flex h-screen flex-col overflow-hidden bg-app-canvas text-stone-100">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_520px_at_58%_-12%,rgba(217,119,6,0.18),transparent_60%),radial-gradient(900px_420px_at_24%_18%,rgba(56,189,248,0.08),transparent_58%),linear-gradient(135deg,#120c08_0%,#1a100a_45%,#17110d_100%)]"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 landing-dot-grid opacity-[0.42]" aria-hidden />
      <div className="relative z-10 flex h-full min-h-0 flex-col">
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

        {showTabletDesktopSidebar && bp === 'desktop' && (
          <aside
            data-desktop-sidebar-hover
            className="relative z-30 hidden min-[1025px]:flex h-full w-12 shrink-0 flex-col border-r border-sidebar-border bg-sidebar/90 backdrop-blur"
          >
            <motion.div
              className="absolute left-0 top-0 z-10 flex h-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 backdrop-blur"
              initial={false}
              animate={{
                width: railWide && !desktopChatHistoryOpen ? 200 : 48,
                boxShadow:
                  railWide && !desktopChatHistoryOpen
                    ? '8px 0 28px rgba(0,0,0,0.32)'
                    : '0 0 0 rgba(0,0,0,0)',
              }}
              transition={{
                width: { duration: 0.38, ease: [0.22, 1, 0.36, 1] },
                boxShadow: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
              }}
              onMouseEnter={onDesktopRailEnter}
              onMouseLeave={onDesktopRailLeave}
            >
              <div className="min-h-0 flex-1 overflow-hidden">
                <SidebarNavContent
                  density="full"
                  desktopRail={{ wide: railWide, labelsShown: railLabelsShown }}
                  desktopHistoryOpen={desktopChatHistoryOpen}
                />
              </div>
            </motion.div>
          </aside>
        )}

        {showTabletDesktopSidebar && bp !== 'desktop' && (
          <aside
            className={[
              'hidden flex-shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/90 backdrop-blur transition-[width] duration-200 ease-out min-[769px]:flex',
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
            id="main-content"
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
    </div>
  )
}

export default function MainLayout() {
  return (
    <ChatSessionsProvider>
      <ChatNotesProvider>
        <LayoutChromeProvider>
          <AppUiProvider>
            <MainLayoutShell />
          </AppUiProvider>
        </LayoutChromeProvider>
      </ChatNotesProvider>
    </ChatSessionsProvider>
  )
}
