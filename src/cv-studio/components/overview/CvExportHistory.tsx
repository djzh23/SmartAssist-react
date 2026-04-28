import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react'
import type { AppConfirmOptions } from '../../../context/appUiBridge'
import type { CvStudioPdfExportRow } from '../../../types'
import CvQuotaBadge from './CvQuotaBadge'

interface CvExportHistoryProps {
  rows: CvStudioPdfExportRow[]
  used: number
  limit: number
  onDelete: (id: string) => Promise<void>
  requestConfirm: (opts: AppConfirmOptions) => Promise<boolean>
}

export default function CvExportHistory({ rows, used, limit, onDelete, requestConfirm }: CvExportHistoryProps) {
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    const ok = await requestConfirm({
      title: 'PDF-Eintrag löschen?',
      message: 'Der Eintrag wird entfernt und das Kontingent wieder freigegeben.',
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!ok) return
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl rounded-xl border border-sky-200/70 bg-sky-50/70">
      {/* Header toggle */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-sky-100/60"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <Download size={16} className="text-sky-700" aria-hidden />
          <span className="text-sm font-semibold text-sky-900">PDF-Export-Verlauf</span>
        </div>
        <div className="flex items-center gap-3">
          <CvQuotaBadge used={used} limit={limit} />
          {open ? (
            <ChevronDown size={16} className="text-sky-700" aria-hidden />
          ) : (
            <ChevronRight size={16} className="text-sky-700" aria-hidden />
          )}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-sky-200/70 px-4 py-3">
          {rows.length === 0 ? (
            <p className="py-4 text-center text-xs text-sky-700/80">
              Noch keine PDF-Exports. Nach jedem Download erscheint ein Eintrag.
            </p>
          ) : (
            <ul className="divide-y divide-sky-200/70">
              {rows.map(row => {
                const date = new Date(row.createdAtUtc).toLocaleString('de-DE')
                const context = [row.targetCompany, row.targetRole]
                  .filter(Boolean)
                  .join(' — ')
                return (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-sky-950">{row.fileLabel}</p>
                      <p className="text-xs text-sky-800/80">
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
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300/80 bg-white/70 px-2 py-1 text-xs text-rose-700 transition-colors hover:bg-rose-50 disabled:opacity-40"
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
