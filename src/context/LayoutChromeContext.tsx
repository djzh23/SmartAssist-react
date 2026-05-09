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
  notesTheme: 'dark' | 'light'
  setNotesTheme: (v: 'dark' | 'light' | ((p: 'dark' | 'light') => 'dark' | 'light')) => void
  /** Desktop chat: session history column open (feature click). */
  desktopChatHistoryOpen: boolean
  setDesktopChatHistoryOpen: (v: boolean | ((p: boolean) => boolean)) => void
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
  const [notesTheme, setNotesTheme] = useState<'dark' | 'light'>(() => {
    try {
      return localStorage.getItem('privateprep_notes_theme') === 'light' ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  })
  const drawerTriggerRef = useRef<HTMLButtonElement | null>(null)
  const [desktopChatHistoryOpen, setDesktopChatHistoryOpen] = useState(false)

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

  const persistNotesTheme = useCallback((v: 'dark' | 'light' | ((p: 'dark' | 'light') => 'dark' | 'light')) => {
    setNotesTheme(prev => {
      const next = typeof v === 'function' ? v(prev) : v
      try {
        localStorage.setItem('privateprep_notes_theme', next)
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
      notesTheme,
      setNotesTheme: persistNotesTheme,
      desktopChatHistoryOpen,
      setDesktopChatHistoryOpen,
    }),
    [
      drawerOpen,
      moreSheetOpen,
      tabletSidebarExpanded,
      persistTablet,
      keyboardLikelyOpen,
      notesTheme,
      persistNotesTheme,
      desktopChatHistoryOpen,
    ],
  )

  return <LayoutChromeContext.Provider value={value}>{children}</LayoutChromeContext.Provider>
}

export function useLayoutChrome(): LayoutChromeState {
  const ctx = useContext(LayoutChromeContext)
  if (!ctx) throw new Error('useLayoutChrome must be used within LayoutChromeProvider')
  return ctx
}
