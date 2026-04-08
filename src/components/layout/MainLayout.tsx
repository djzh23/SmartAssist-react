import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { Menu, X } from 'lucide-react'

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      {/* ── Nav sidebar ─────────────────────────────────────────────────────
           Desktop : static flex column (left panel in the root flex row)
           Mobile  : fixed off-canvas, slides in from left BELOW the topbar   */}
      <aside
        className={[
          'w-60 flex-shrink-0 bg-sidebar',
          // Mobile: fixed overlay, starts at top-11 (below 44 px topbar)
          'fixed top-11 bottom-0 left-0 z-40',
          'transition-transform duration-200 ease-in-out',
          // Desktop: back in the normal flex row, full height via flex stretch
          'md:static md:top-auto md:bottom-auto md:translate-x-0 md:flex md:flex-col',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <Sidebar onNavClick={() => setMobileOpen(false)} />
      </aside>

      {/* ── Content column ────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* Mobile topbar — first flex child, always at top of column.
            z-50 keeps it visually above any fixed sidebars/overlays.          */}
        <div className="relative z-50 flex h-11 flex-shrink-0 items-center gap-2 bg-sidebar px-3 md:hidden">
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

        {/* Mobile backdrop — sits above content but below topbar */}
        {mobileOpen && (
          <div
            className="fixed inset-x-0 top-11 bottom-0 z-30 animate-fade-in bg-black/40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <main className="flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
