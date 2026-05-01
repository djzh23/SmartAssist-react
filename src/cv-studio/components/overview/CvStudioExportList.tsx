import { useState } from 'react'
import { ChevronDown, Download, Trash2 } from 'lucide-react'
import type { CvStudioPdfExportRow } from '../../../types'

interface CvStudioExportListProps {
  rows: CvStudioPdfExportRow[]
  onDelete: (id: string) => Promise<void>
  onDownload: (row: CvStudioPdfExportRow) => Promise<void>
  compact?: boolean
}

export default function CvStudioExportList({ rows, onDelete, onDownload, compact = false }: CvStudioExportListProps) {
  const [open, setOpen] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const visibleRows = showAll ? rows : rows.slice(0, 5)
  const hasMore = rows.length > 5

  return (
    <section className="rounded-2xl border border-white/10 bg-[#120e0b]/76">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
        aria-expanded={open}
      >
        <h3 className="text-sm font-semibold text-stone-100">Export-Verlauf</h3>
        <span className="inline-flex items-center gap-2 text-xs text-stone-400">
          {rows.length}
          <ChevronDown size={14} className={open ? 'rotate-180' : ''} />
        </span>
      </button>

      {open ? (
        <div className="border-t border-white/10 px-4 py-3">
          {rows.length === 0 ? (
            <p className="py-6 text-center text-xs text-stone-500">Noch keine Exporte.</p>
          ) : (
            <ul className="space-y-2">
              {visibleRows.map(row => {
                const date = new Date(row.createdAtUtc).toLocaleString('de-DE')
                return (
                  <li key={row.id} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-100">{row.fileLabel}</p>
                      <p className="truncate text-xs text-stone-400">
                        {date}
                        <span className="mx-1.5 text-stone-600">·</span>
                        Design {row.design}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={downloadingId === row.id}
                        onClick={async () => {
                          setDownloadingId(row.id)
                          try {
                            await onDownload(row)
                          } finally {
                            setDownloadingId(null)
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/15 text-stone-200 transition hover:bg-white/5 disabled:opacity-40"
                        aria-label="Export herunterladen"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={deletingId === row.id}
                        onClick={async () => {
                          setDeletingId(row.id)
                          try {
                            await onDelete(row.id)
                          } finally {
                            setDeletingId(null)
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-rose-400/20 text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-40"
                        aria-label="Export entfernen"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          {hasMore ? (
            <button
              type="button"
              onClick={() => setShowAll(v => !v)}
              className="mt-3 text-xs font-semibold text-amber-300 transition hover:text-amber-200"
            >
              {showAll ? 'Weniger anzeigen' : 'Alle Exporte anzeigen →'}
            </button>
          ) : null}
          {!hasMore && !compact && rows.length > 0 ? (
            <p className="mt-3 text-xs font-semibold text-amber-300">Alle Exporte anzeigen →</p>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

