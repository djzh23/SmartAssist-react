import { FolderOpen, MoreHorizontal, Trash2, Pencil } from 'lucide-react'

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
      className={[
        'rounded-2xl border bg-[#120d0a]/90 p-4 shadow-[0_14px_30px_-22px_rgba(0,0,0,0.85)] transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-amber-400/35 hover:shadow-[0_14px_34px_-16px_rgba(245,158,11,0.3)]',
        active
          ? 'border-amber-400/65 bg-[#171009] ring-1 ring-amber-400/45 shadow-[0_16px_36px_-14px_rgba(245,158,11,0.35)]'
          : 'border-white/10',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-300">
              <FolderOpen size={15} aria-hidden />
            </span>
            <h3 className="line-clamp-2 text-base font-semibold leading-tight text-stone-100">{name}</h3>
          </div>
          <p className="mt-2 text-xs text-stone-400">Aktualisiert: {updatedLabel}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-stone-200">
            {count} CV{count === 1 ? '' : 's'}
          </span>
          {active ? (
            <span className="rounded-full bg-amber-500/25 px-2 py-0.5 text-[11px] font-semibold text-amber-300">
              Aktiv
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-stone-100 transition hover:border-white/25 hover:bg-white/5"
        >
          Öffnen
        </button>

        {showMenu ? (
          <details className="relative">
            <summary className="list-none rounded-md p-1.5 text-stone-400 transition hover:bg-white/5 hover:text-stone-200 [&::-webkit-details-marker]:hidden">
              <MoreHorizontal size={15} aria-hidden />
            </summary>
            <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#1b1410] p-1 shadow-xl">
              <button
                type="button"
                onClick={onRename}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-stone-200 hover:bg-white/5"
              >
                <Pencil size={12} aria-hidden />
                Umbenennen
              </button>
              <button
                type="button"
                onClick={onDelete}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10"
              >
                <Trash2 size={12} aria-hidden />
                Löschen
              </button>
            </div>
          </details>
        ) : (
          <span className="h-7 w-7" aria-hidden />
        )}
      </div>
    </article>
  )
}

