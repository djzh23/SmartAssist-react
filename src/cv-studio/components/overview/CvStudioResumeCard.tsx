import { Copy, Download, FileText, Pencil, Trash2 } from 'lucide-react'
import type { CvStudioResumeSummary } from '../../../types'

interface CvStudioResumeCardProps {
  resume: CvStudioResumeSummary
  onEdit: () => void
  onDuplicate: () => void
  onExportPdf: () => void
  onDelete: () => void
}

export default function CvStudioResumeCard({
  resume,
  onEdit,
  onDuplicate,
  onExportPdf,
  onDelete,
}: CvStudioResumeCardProps) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const subtitle = [resume.targetCompany, resume.targetRole].filter(Boolean).join(' · ')

  return (
    <article
      onClick={onEdit}
      className="group cursor-pointer rounded-xl border border-white/12 bg-[#28180a]/80 p-3 transition-all duration-150 hover:border-amber-400/25 hover:-translate-y-px hover:shadow-[0_6px_18px_-10px_rgba(0,0,0,0.7)]"
    >
      {/* Header: icon + title + meta */}
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/12 text-sky-300">
          <FileText size={14} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-100 transition-colors group-hover:text-amber-200">
            {resume.title}
          </p>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] text-stone-500">{subtitle}</p>
          ) : null}
          <p className="mt-0.5 text-[11px] text-stone-500">Aktualisiert {updated}</p>
        </div>
      </div>

      {/* Actions — stop propagation so card click doesn't fire onEdit a second time */}
      <div
        className="mt-2.5 flex flex-wrap items-center gap-1.5"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1 text-[11px] font-semibold text-stone-200 transition hover:bg-white/5"
        >
          <Pencil size={11} aria-hidden />
          Öffnen
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-stone-300 transition hover:bg-white/5"
        >
          <Copy size={11} aria-hidden />
          Duplizieren
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1 rounded-md border border-amber-400/25 bg-amber-500/8 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/18"
        >
          <Download size={11} aria-hidden />
          PDF
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold text-stone-600 transition hover:text-rose-400"
          title="Lebenslauf löschen"
        >
          <Trash2 size={11} aria-hidden />
        </button>
      </div>
    </article>
  )
}
