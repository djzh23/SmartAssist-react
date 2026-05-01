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
  const updated = new Date(resume.updatedAtUtc).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <article className="rounded-xl border border-white/10 bg-[#16100c]/90 p-3.5 transition-all hover:border-white/20 hover:shadow-[0_10px_28px_-18px_rgba(0,0,0,0.8)]">
      <div className="flex items-start gap-2">
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-sky-500/15 text-sky-300">
          <FileText size={14} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-stone-100">{resume.title}</p>
          <p className="mt-1 text-xs text-stone-400">
            {resume.templateKey ? `Typ: ${resume.templateKey}` : 'Typ: Arbeitsversion'}
          </p>
          <p className="mt-0.5 text-xs text-stone-500">Aktualisiert: {updated}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-stone-100 transition hover:bg-white/5"
        >
          <Pencil size={12} aria-hidden />
          Öffnen
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs font-semibold text-stone-200 transition hover:bg-white/5"
        >
          <Copy size={12} aria-hidden />
          Duplizieren
        </button>
        <button
          type="button"
          onClick={onExportPdf}
          className="inline-flex items-center gap-1 rounded-md border border-amber-400/30 bg-amber-500/10 px-2.5 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
        >
          <Download size={12} aria-hidden />
          PDF
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-md border border-rose-400/25 bg-rose-500/5 px-2.5 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-500/15"
        >
          <Trash2 size={12} aria-hidden />
          Löschen
        </button>
      </div>
    </article>
  )
}

