import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ChatSessionsProvider } from '../../hooks/useChatSessions'
import { ChatNotesProvider } from '../../hooks/useChatNotes'
import ChatNotesStorageBanner from './ChatNotesStorageBanner'
import Sidebar from './Sidebar'
import TopNavBar from './TopNavBar'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <ChatSessionsProvider>
      <ChatNotesProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-white">
          <TopNavBar onMenuClick={() => setMobileOpen(v => !v)} menuOpen={mobileOpen} />

          <div className="flex min-h-0 flex-1 overflow-hidden">
            {/* App sidebar — desktop: column; mobile: drawer below 52px top bar */}
            <aside
              className={[
                'w-60 flex-shrink-0 bg-sidebar',
                'fixed top-[52px] bottom-0 left-0 z-40',
                'transition-transform duration-200 ease-in-out',
                'md:static md:top-auto md:bottom-auto md:translate-x-0 md:flex md:flex-col',
                mobileOpen ? 'translate-x-0' : '-translate-x-full',
              ].join(' ')}
            >
              <Sidebar onNavClick={() => setMobileOpen(false)} />
            </aside>

            {mobileOpen && (
              <div
                className="animate-fade-in fixed inset-x-0 bottom-0 top-[52px] z-30 bg-black/40 md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden
              />
            )}

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <main className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
                <ChatNotesStorageBanner />
                <Outlet />
              </main>
            </div>
          </div>
        </div>
      </ChatNotesProvider>
    </ChatSessionsProvider>
  )
}
