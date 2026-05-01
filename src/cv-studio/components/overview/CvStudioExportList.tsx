import { useState } from 'react'
import { Download, FileDown, Trash2 } from 'lucide-react'
import type { CvStudioPdfExportRow } from '../../../types'

interface CvStudioExportListProps {
  rows: CvStudioPdfExportRow[]
  onDelete: (id: string) => Promise<void>
  onDownload: (row: CvStudioPdfExportRow) => Promise<void>
  compact?: boolean
}

export default function CvStudioExportList({ rows, onDelete, onDownload, compact = false }: CvStudioExportListProps) {
  const [showAll, setShowAll] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const visibleRows = showAll ? rows : rows.slice(0, 5)
  const hasMore = rows.length > 5

  return (
    <section className="overflow-hidden rounded-2xl bg-[#120e0b]/78 ring-1 ring-white/[0.07]">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-white/[0.05] px-4 py-3">
        <h3 className="text-sm font-semibold text-stone-100">Export-Verlauf</h3>
        {rows.length > 0 ? (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-stone-400">
            {rows.length}
          </span>
        ) : null}
      </div>

      {/* List */}
      <div className={compact ? 'px-3 py-2' : 'px-3 py-2.5'}>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <FileDown size={22} className="text-stone-700" aria-hidden />
            <p className="text-xs text-stone-500">Noch keine PDF-Exporte.</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {visibleRows.map(row => {
              const date = new Date(row.createdAtUtc).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })
              const isDownloading = downloadingId === row.id
              const isDeleting = deletingId === row.id

              return (
                <li
                  key={row.id}
                  className="group flex items-center gap-2 rounded-lg bg-black/12 px-3 py-2 ring-1 ring-white/[0.06] transition-colors hover:ring-white/[0.11]"
                >
                  <FileDown size={13} className="shrink-0 text-amber-400/60" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-stone-100">{row.fileLabel}</p>
                    <p className="text-[10px] text-stone-500">
                      {date}
                      <span className="mx-1 text-stone-700">·</span>
                      Design {row.design}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      disabled={isDownloading}
                      onClick={async () => {
                        setDownloadingId(row.id)
                        try { await onDownload(row) } finally { setDownloadingId(null) }
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-white/8 hover:text-stone-100 disabled:opacity-40"
                      aria-label="Herunterladen"
                    >
                      <Download size={13} aria-hidden />
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={async () => {
                        setDeletingId(row.id)
                        try { await onDelete(row.id) } finally { setDeletingId(null) }
                      }}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-600 transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40"
                      aria-label="Export entfernen"
                    >
                      <Trash2 size={13} aria-hidden />
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
            className="mt-2.5 text-xs font-semibold text-amber-400/80 transition hover:text-amber-300"
          >
            {showAll ? 'Weniger anzeigen' : `Alle ${rows.length} Exporte anzeigen →`}
          </button>
        ) : null}
      </div>
    </section>
  )
}
