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
  active = false,
  onOpen,
  onRename,
  onDelete,
  showMenu = true,
}: CvStudioCategoryCardProps) {
  return (
    <div
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onOpen() }}
      className={[
        'group inline-flex cursor-pointer select-none items-center gap-1.5 rounded-full border py-1 pl-2.5 pr-1.5 transition-all duration-150',
        active
          ? 'border-amber-400/55 bg-amber-500/12 text-amber-200 shadow-[0_0_10px_-5px_rgba(245,158,11,0.28)]'
          : 'border-white/10 bg-white/[0.02] text-stone-300 hover:border-amber-400/28 hover:bg-amber-500/7 hover:text-stone-100',
      ].join(' ')}
    >
      {/* Icon */}
      <FolderOpen
        size={11}
        className={active ? 'text-amber-300' : 'text-stone-500 group-hover:text-amber-400/70'}
        aria-hidden
      />

      {/* Name */}
      <span className="max-w-[140px] truncate text-xs font-medium leading-none">{name}</span>

      {/* Count badge */}
      <span
        className={[
          'rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums leading-none',
          active ? 'bg-amber-500/18 text-amber-300' : 'bg-white/8 text-stone-400',
        ].join(' ')}
      >
        {count}
      </span>

      {/* Overflow menu — stop propagation so chip click doesn't double-fire */}
      {showMenu ? (
        <div
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          className="relative"
        >
          <details>
            <summary className="list-none rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white/10 [&::-webkit-details-marker]:hidden">
              <MoreHorizontal size={12} className="text-stone-400" aria-hidden />
            </summary>
            <div className="absolute left-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#1e1510] p-1 shadow-xl">
              <button
                type="button"
                onClick={() => { (document.activeElement as HTMLElement)?.blur?.(); onRename() }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-stone-200 hover:bg-white/5"
              >
                <Pencil size={11} aria-hidden />
                Umbenennen
              </button>
              <button
                type="button"
                onClick={() => { (document.activeElement as HTMLElement)?.blur?.(); onDelete() }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 size={11} aria-hidden />
                Löschen
              </button>
            </div>
          </details>
        </div>
      ) : null}
    </div>
  )
}
