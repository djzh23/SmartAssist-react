import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
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
        <div className="flex items-center gap-3 h-13 px-4 bg-sidebar md:hidden flex-shrink-0">
          <button
            onClick={() => setMobileOpen(v => !v)}
            className="text-white/70 hover:text-white transition-colors p-1"
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <span className="text-white font-bold text-sm tracking-wide">⚡ SmartAssist</span>
        </div>

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
