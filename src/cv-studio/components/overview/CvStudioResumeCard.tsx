import { Copy, Download, FileText, Trash2 } from 'lucide-react'
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
        {/* Tier 4 — soft neutral: utility action */}
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1 rounded-lg bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-stone-300 transition hover:bg-white/10 hover:text-stone-100"
        >
          <Copy size={11} aria-hidden />
          Duplizieren
        </button>

        {/* Tier — amber tinted: export-specific */}
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1 rounded-lg bg-amber-500/12 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/22"
        >
          <Download size={11} aria-hidden />
          PDF
        </button>

        {/* Tier 5 — danger ghost: destructive, minimal presence */}
        <button
          type="button"
          onClick={onDelete}
          className="ml-auto inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg text-stone-500 transition hover:bg-rose-500/10 hover:text-rose-400"
          title="Lebenslauf löschen"
        >
          <Trash2 size={12} aria-hidden />
        </button>
      </div>
    </article>
  )
}
