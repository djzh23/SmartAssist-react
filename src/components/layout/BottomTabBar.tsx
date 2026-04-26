import { NavLink } from 'react-router-dom'
import { Home, MessageCircle, UserCircle, LayoutGrid } from 'lucide-react'
import { useChatSessions, TOOL_TO_QUERY } from '../../hooks/useChatSessions'
import { useLayoutChrome } from '../../context/LayoutChromeContext'

export default function BottomTabBar() {
  const store = useChatSessions()
  const { setMoreSheetOpen, keyboardLikelyOpen } = useLayoutChrome()

  const q = TOOL_TO_QUERY[store.currentToolType]
  const chatTo = `/chat?tool=${encodeURIComponent(q)}`

  const tabClass = (active: boolean) =>
    [
      'flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-transform duration-100 active:scale-95',
      active ? 'text-primary' : 'text-white/50',
    ].join(' ')

  if (keyboardLikelyOpen) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 hidden max-[768px]:flex desktop:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Hauptnavigation"
    >
      <div className="flex h-14 w-full items-stretch border-t border-white/10 bg-sidebar px-1 pt-0.5">
        <NavLink to="/overview" className={({ isActive }) => tabClass(isActive)} end>
          {({ isActive }) => (
            <>
              <Home size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span>Übersicht</span>
            </>
          )}
        </NavLink>

        <NavLink to="/career-profile" className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (
            <>
              <UserCircle size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span>Karriere</span>
            </>
          )}
        </NavLink>

        <NavLink to={chatTo} className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (
            <>
              <MessageCircle size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span>Chats</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          className={tabClass(false)}
          onClick={() => setMoreSheetOpen(true)}
          aria-label="Mehr Optionen"
        >
          <LayoutGrid size={20} aria-hidden />
          <span>Mehr</span>
        </button>
      </div>
    </nav>
  )
}
