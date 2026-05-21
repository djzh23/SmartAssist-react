import { useEffect, useRef } from 'react'
import { ChevronDown, Search, SlidersHorizontal } from 'lucide-react'
import type { ApplicationSort } from '../../utils/applicationListUtils'

interface ApplicationListToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  sort: ApplicationSort
  onSortChange: (value: ApplicationSort) => void
  filterOpen: boolean
  onFilterOpenChange: (open: boolean) => void
}

const SORT_OPTIONS: { value: ApplicationSort; label: string }[] = [
  { value: 'updatedDesc', label: 'Neueste zuerst' },
  { value: 'updatedAsc', label: 'Älteste zuerst' },
  { value: 'titleAsc', label: 'Position A–Z' },
]

export default function ApplicationListToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  filterOpen,
  onFilterOpenChange,
}: ApplicationListToolbarProps) {
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!filterOpen) return
    function onPointerDown(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        onFilterOpenChange(false)
      }
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [filterOpen, onFilterOpenChange])

  return (
    <div className="flex items-stretch gap-2">
      <label className="relative min-w-0 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-500"
          size={16}
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Suchen…"
          className="w-full rounded-xl border border-white/10 bg-app-raised py-2.5 pl-9 pr-3 text-sm text-stone-100 placeholder:text-stone-500 transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 sm:pl-10 sm:pr-4"
        />
      </label>

      <div ref={filterRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => onFilterOpenChange(!filterOpen)}
          aria-expanded={filterOpen}
          aria-haspopup="listbox"
          className="inline-flex h-full min-w-[4.25rem] flex-col items-center justify-center gap-0.5 rounded-xl border border-white/10 bg-app-raised px-3 py-2 text-stone-200 transition hover:border-white/20 hover:bg-[#252019] sm:min-w-0 sm:flex-row sm:gap-2 sm:px-4 sm:py-2.5"
        >
          <SlidersHorizontal size={16} aria-hidden />
          <span className="text-[11px] font-medium sm:text-sm">Filter</span>
          <ChevronDown size={14} className={`hidden transition sm:block ${filterOpen ? 'rotate-180' : ''}`} aria-hidden />
        </button>

        {filterOpen ? (
          <div
            role="listbox"
            aria-label="Sortierung"
            className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#1a1512] py-1 shadow-landing-md"
          >
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
              Sortierung
            </p>
            {SORT_OPTIONS.map(option => (
              <button
                key={option.value}
                type="button"
                role="option"
                aria-selected={sort === option.value}
                onClick={() => {
                  onSortChange(option.value)
                  onFilterOpenChange(false)
                }}
                className={[
                  'flex w-full px-3 py-2 text-left text-sm transition hover:bg-white/5',
                  sort === option.value ? 'font-semibold text-primary' : 'text-stone-300',
                ].join(' ')}
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
