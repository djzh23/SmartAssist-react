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
      className="group cursor-pointer rounded-xl bg-[#22170f]/80 p-3 ring-1 ring-white/[0.06] transition-all duration-150 hover:-translate-y-px hover:ring-amber-400/20 hover:shadow-[0_6px_16px_-11px_rgba(0,0,0,0.7)]"
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
          className="inline-flex items-center gap-1 rounded-md bg-white/[0.05] px-2.5 py-1 text-[11px] font-semibold text-stone-200 transition hover:bg-white/[0.1]"
        >
          <Pencil size={11} aria-hidden />
          Öffnen
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1 rounded-md bg-white/[0.035] px-2.5 py-1 text-[11px] font-semibold text-stone-300 transition hover:bg-white/[0.08]"
        >
          <Copy size={11} aria-hidden />
          Duplizieren
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1 rounded-md bg-amber-500/12 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/20"
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
