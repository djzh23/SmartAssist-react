import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react'
import type { CvStudioPdfExportRow } from '../../../types'
import CvQuotaBadge from './CvQuotaBadge'

interface CvExportHistoryProps {
  rows: CvStudioPdfExportRow[]
  used: number
  limit: number
  onDelete: (id: string) => Promise<void>
}

export default function CvExportHistory({ rows, used, limit, onDelete }: CvExportHistoryProps) {
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    if (!window.confirm('PDF-Eintrag löschen und Kontingent freigeben?')) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03]">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Download size={16} className="text-stone-500" aria-hidden />
          <span className="text-sm font-semibold text-white">PDF-Export-Verlauf</span>
        </div>
        <div className="flex items-center gap-3">
          <CvQuotaBadge used={used} limit={limit} />
          {open ? (
            <ChevronDown size={16} className="text-stone-500" aria-hidden />
          ) : (
            <ChevronRight size={16} className="text-stone-500" aria-hidden />
          )}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-white/10 px-4 py-3">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-xs text-stone-500">
              Noch keine PDF-Exports. Nach jedem Download erscheint ein Eintrag.
            </p>
          ) : (
            <ul className="divide-y divide-white/10">
              {rows.map(row => {
                const date = new Date(row.createdAtUtc).toLocaleString('de-DE')
                const context = [row.targetCompany, row.targetRole]
                  .filter(Boolean)
                  .join(' — ')
                return (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-stone-200">{row.fileLabel}</p>
                      <p className="text-xs text-stone-500">
                        Design {row.design}
                        {row.versionId ? ' · Variante' : ' · Arbeitsversion'}
                        {context ? ` · ${context}` : ''}
                        {' · '}{date}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={deletingId === row.id}
                      onClick={() => void handleDelete(row.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2 py-1 text-xs text-rose-300 transition-colors hover:bg-rose-950/40 disabled:opacity-40"
                    >
                      <Trash2 size={13} aria-hidden />
                      Löschen
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
