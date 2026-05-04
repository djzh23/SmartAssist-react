import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  FolderOpen,
  NotebookPen,
  X,
} from 'lucide-react'
import { useLayoutChrome } from '../../context/LayoutChromeContext'

export default function MobileMoreSheet() {
  const navigate = useNavigate()
  const location = useLocation()
  const { moreSheetOpen, setMoreSheetOpen } = useLayoutChrome()

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
    <div className="fixed inset-0 z-[100] max-[768px]:block desktop:hidden" role="dialog" aria-modal="true" aria-label="Mehr Navigation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Menü schließen"
        onClick={() => setMoreSheetOpen(false)}
      />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[88vh] origin-bottom transform rounded-t-2xl bg-sidebar pb-[env(safe-area-inset-bottom)] text-sidebar-text shadow-xl transition-transform duration-200 ease-out"
      >
        <div className="flex items-center justify-end px-5 py-3">
          <button
            type="button"
            onClick={() => setMoreSheetOpen(false)}
            className="flex h-11 w-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-400 hover:bg-sidebar-hover hover:text-white"
            aria-label="Schließen"
          >
            <X size={22} />
          </button>
        </div>
        <nav className="max-h-[66vh] overflow-y-auto px-3 py-3">
          <section className="rounded-xl bg-black/10 p-2">
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
      </div>
    </div>
  )
}
