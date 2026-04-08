import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* ── Main content ────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Mobile topbar — always visible, sits above all sidebars (z-50) */}
        <div className="sticky top-0 z-50 flex h-11 flex-shrink-0 items-center gap-2 bg-sidebar px-3 md:hidden">
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
            aria-label={mobileOpen ? 'Navigation schließen' : 'Navigation öffnen'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <img src="/favicon.png" alt="" className="h-5 w-5 rounded-md" aria-hidden="true" />
          <span className="flex-1 text-[13px] font-bold tracking-wide text-white">SmartAssist</span>
        </div>

        {/* Mobile overlay — starts below the 44 px topbar (top-11) */}
        {mobileOpen && (
          <div
            className="fixed inset-x-0 top-11 bottom-0 z-30 bg-black/40 md:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Mobile sidebar — starts below the topbar (top-11) */}
        <aside
          className={[
            'fixed top-11 bottom-0 left-0 z-40 w-60 bg-sidebar flex-shrink-0',
            'transition-transform duration-200 ease-in-out',
            'md:sticky md:top-0 md:h-screen md:translate-x-0',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <Sidebar onNavClick={() => setMobileOpen(false)} />
        </aside>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
