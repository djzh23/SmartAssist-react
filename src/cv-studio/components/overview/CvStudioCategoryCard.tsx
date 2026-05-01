import { FolderOpen, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'

interface CvStudioCategoryCardProps {
  name: string
  count: number
  updatedLabel: string
  active?: boolean
  onOpen: () => void
  onRename: () => void
  onDelete: () => void
  showMenu?: boolean
}

export default function CvStudioCategoryCard({
  name,
  count,
  updatedLabel,
  active = false,
  onOpen,
  onRename,
  onDelete,
  showMenu = true,
}: CvStudioCategoryCardProps) {
  return (
    <article
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
      className={[
        'group cursor-pointer rounded-xl border p-3 transition-all duration-200 select-none',
        active
          ? 'border-amber-400/55 bg-[#1c1208] ring-1 ring-amber-400/35 shadow-[0_0_24px_-8px_rgba(245,158,11,0.28)]'
          : 'border-white/10 bg-[#120d0a]/90 hover:border-amber-400/25 hover:shadow-[0_6px_20px_-10px_rgba(245,158,11,0.18)] hover:-translate-y-px',
      ].join(' ')}
    >
      {/* Row 1: icon + name + count + Aktiv badge */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
          <FolderOpen size={13} aria-hidden />
        </span>
        <h3 className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight text-stone-100">
          {name}
        </h3>
        <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-stone-300">
          {count}
        </span>
        {active ? (
          <span className="shrink-0 rounded-full bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            Aktiv
          </span>
        ) : null}
      </div>

      {/* Row 2: date */}
      <p className="mt-1.5 text-[11px] text-stone-500">Zuletzt {updatedLabel}</p>

      {/* Row 3: Öffnen + overflow menu — stop propagation so card click doesn't double-fire */}
      <div
        className="mt-2.5 flex items-center justify-between gap-2"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onOpen}
          className="rounded-md border border-white/15 px-2.5 py-1 text-xs font-semibold text-stone-200 transition hover:border-white/25 hover:bg-white/5"
        >
          Öffnen
        </button>

        {showMenu ? (
          <details className="relative">
            <summary className="list-none rounded-md p-1.5 text-stone-500 transition hover:bg-white/5 hover:text-stone-200 [&::-webkit-details-marker]:hidden">
              <MoreHorizontal size={14} aria-hidden />
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#1b1410] p-1 shadow-xl">
              <button
                type="button"
                onClick={() => { (document.activeElement as HTMLElement)?.blur?.(); onRename() }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-stone-200 hover:bg-white/5"
              >
                <Pencil size={12} aria-hidden />
                Umbenennen
              </button>
              <button
                type="button"
                onClick={() => { (document.activeElement as HTMLElement)?.blur?.(); onDelete() }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 size={12} aria-hidden />
                Löschen
              </button>
            </div>
          </details>
        ) : (
          <span className="h-7 w-7 shrink-0" aria-hidden />
        )}
      </div>
    </article>
  )
}
