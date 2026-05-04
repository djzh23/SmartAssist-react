import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { SignOutButton } from '@clerk/clerk-react'
import {
  BookOpen,
  FileText,
  FolderOpen,
  Moon,
  NotebookPen,
  ShieldCheck,
  Sun,
  Tag,
  User,
  X,
} from 'lucide-react'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useLayoutChrome } from '../../context/LayoutChromeContext'

export default function MobileMoreSheet() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAdmin } = useIsAdmin()
  const { moreSheetOpen, setMoreSheetOpen, notesTheme, setNotesTheme } = useLayoutChrome()
  const notesDark = notesTheme === 'dark'

  useEffect(() => {
    if (!moreSheetOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreSheetOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [moreSheetOpen, setMoreSheetOpen])

  if (!moreSheetOpen) return null

  const go = (path: string) => {
    navigate(path)
    setMoreSheetOpen(false)
  }

  const itemClass = (active: boolean) => [
    'flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
    active
      ? 'border border-amber-300/35 bg-amber-500/12 text-amber-100'
      : 'border border-transparent text-sidebar-text hover:bg-sidebar-hover',
  ].join(' ')

  return (
    <div className="fixed inset-0 z-[100] max-[768px]:block desktop:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-more-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Menü schließen"
        onClick={() => setMoreSheetOpen(false)}
      />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[85vh] origin-bottom transform rounded-t-2xl border border-white/10 bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-text shadow-xl transition-transform duration-200 ease-out"
      >
        <div className="flex items-center justify-between border-b border-sidebar-border px-4 py-3">
          <h2 id="mobile-more-title" className="text-sm font-semibold text-white">
            Mehr
          </h2>
          <button
            type="button"
            onClick={() => setMoreSheetOpen(false)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:bg-sidebar-hover hover:text-white"
            aria-label="Schließen"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="max-h-[60vh] overflow-y-auto px-2 py-2">
          <section className="mb-3 rounded-xl border border-sidebar-border bg-black/15 p-1.5">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Konto & Plan
            </p>
            <button
              type="button"
              className={itemClass(location.pathname.startsWith('/profile'))}
              onClick={() => go('/profile')}
            >
              <User size={18} className="text-slate-400" aria-hidden />
              Profil
            </button>
            <button
              type="button"
              className={itemClass(location.pathname.startsWith('/pricing'))}
              onClick={() => go('/pricing')}
            >
              <Tag size={18} className="text-slate-400" aria-hidden />
              Preise
            </button>
            {isAdmin && (
              <button
                type="button"
                className={itemClass(location.pathname.startsWith('/admin'))}
                onClick={() => go('/admin')}
              >
                <ShieldCheck size={18} className="text-slate-400" aria-hidden />
                Admin
              </button>
            )}
            <button
              type="button"
              onClick={() => setNotesTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="mt-1 flex min-h-[44px] w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-left text-sm text-sidebar-text transition-colors hover:bg-white/10"
            >
              {notesDark ? <Sun size={18} className="text-slate-400" aria-hidden /> : <Moon size={18} className="text-slate-400" aria-hidden />}
              {notesDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </section>

          <section className="rounded-xl border border-sidebar-border/80 bg-black/10 p-1.5">
            <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Seiten
            </p>

          <button
            type="button"
            className={itemClass(location.pathname.startsWith('/applications'))}
            onClick={() => go('/applications')}
          >
            <FolderOpen size={18} className="text-slate-400" aria-hidden />
            Bewerbungen
          </button>
          <button
            type="button"
            className={itemClass(location.pathname.startsWith('/cv-studio'))}
            onClick={() => go('/cv-studio')}
          >
            <FileText size={18} className="text-slate-400" aria-hidden />
            CV.Studio
          </button>
          <button
            type="button"
            className={itemClass(location.pathname.startsWith('/guides'))}
            onClick={() => go('/guides')}
          >
            <BookOpen size={18} className="text-slate-400" aria-hidden />
            Ratgeber
          </button>
          <button
            type="button"
            className={itemClass(location.pathname.startsWith('/notes'))}
            onClick={() => go('/notes')}
          >
            <NotebookPen size={18} className="text-slate-400" aria-hidden />
            Notizen
          </button>
          </section>
        </nav>
        <div className="border-t border-sidebar-border px-2 py-2">
          <SignOutButton>
            <button
              type="button"
              className="flex min-h-[44px] w-full items-center justify-center rounded-lg py-2 text-sm font-medium text-rose-300 hover:bg-rose-500/10"
            >
              Abmelden
            </button>
          </SignOutButton>
        </div>
      </div>
    </div>
  )
}
