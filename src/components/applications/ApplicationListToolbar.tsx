import { useEffect, useRef } from 'react'
import { ChevronDown, Filter, Search } from 'lucide-react'
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
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label className="relative flex-1">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500"
          size={16}
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Suchen…"
          className="w-full rounded-xl border border-white/10 bg-app-raised py-2.5 pl-10 pr-4 text-sm text-stone-100 placeholder:text-stone-500 transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <div ref={filterRef} className="relative shrink-0">
        <button
          type="button"
          onClick={() => onFilterOpenChange(!filterOpen)}
          aria-expanded={filterOpen}
          aria-haspopup="listbox"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-app-raised px-4 py-2.5 text-sm font-medium text-stone-200 transition hover:border-white/20 hover:bg-[#252019] sm:w-auto"
        >
          <Filter size={15} aria-hidden />
          Filter
          <ChevronDown size={14} className={`transition ${filterOpen ? 'rotate-180' : ''}`} aria-hidden />
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
