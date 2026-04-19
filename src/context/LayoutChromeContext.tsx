import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

export interface LayoutChromeState {
  drawerOpen: boolean
  setDrawerOpen: (v: boolean | ((p: boolean) => boolean)) => void
  moreSheetOpen: boolean
  setMoreSheetOpen: (v: boolean | ((p: boolean) => boolean)) => void
  tabletSidebarExpanded: boolean
  setTabletSidebarExpanded: (v: boolean | ((p: boolean) => boolean)) => void
  keyboardLikelyOpen: boolean
  setKeyboardLikelyOpen: (v: boolean) => void
  /** Ref to restore focus after closing drawer (hamburger) */
  drawerTriggerRef: React.RefObject<HTMLButtonElement | null>
}

const LayoutChromeContext = createContext<LayoutChromeState | null>(null)

export function LayoutChromeProvider({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [moreSheetOpen, setMoreSheetOpen] = useState(false)
  const [tabletSidebarExpanded, setTabletSidebarExpanded] = useState(() => {
    try {
      return sessionStorage.getItem('privateprep_tablet_sidebar_expanded') === '1'
    } catch {
      return false
    }
  })
  const [keyboardLikelyOpen, setKeyboardLikelyOpen] = useState(false)
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    const vv = typeof window !== 'undefined' ? window.visualViewport : null
    if (!vv) return
    const sync = () => {
      const gap = window.innerHeight - vv.height
      setKeyboardLikelyOpen(gap > 120)
    }
    vv.addEventListener('resize', sync)
    vv.addEventListener('scroll', sync)
    sync()
    return () => {
      vv.removeEventListener('resize', sync)
      vv.removeEventListener('scroll', sync)
    }
  }, [])

  const persistTablet = useCallback((v: boolean | ((p: boolean) => boolean)) => {
    setTabletSidebarExpanded(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      try {
        sessionStorage.setItem('privateprep_tablet_sidebar_expanded', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }, [])

  const value = useMemo<LayoutChromeState>(
    () => ({
      drawerOpen,
      setDrawerOpen,
      moreSheetOpen,
      setMoreSheetOpen,
      tabletSidebarExpanded,
      setTabletSidebarExpanded: persistTablet,
      keyboardLikelyOpen,
      setKeyboardLikelyOpen,
      drawerTriggerRef,
    }),
    [drawerOpen, moreSheetOpen, tabletSidebarExpanded, persistTablet, keyboardLikelyOpen],
  )

  return <LayoutChromeContext.Provider value={value}>{children}</LayoutChromeContext.Provider>
}

export function useLayoutChrome(): LayoutChromeState {
  const ctx = useContext(LayoutChromeContext)
  if (!ctx) throw new Error('useLayoutChrome must be used within LayoutChromeProvider')
  return ctx
}
