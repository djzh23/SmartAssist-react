import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white overscroll-none" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* ── Mobile overlay ──────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden animate-fade-in"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-60 bg-sidebar flex-shrink-0',
          'transition-transform duration-250 ease-in-out',
          'md:static md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main content ────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <div className="flex flex-shrink-0 items-center gap-2 bg-sidebar px-3 py-2.5 md:hidden">
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
            aria-label={mobileOpen ? 'Navigation schließen' : 'Navigation öffnen'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <img src="/favicon.png" alt="" className="h-6 w-6 rounded-lg" aria-hidden="true" />
          <span className="flex-1 text-sm font-bold tracking-wide text-white">SmartAssist</span>
        </div>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
