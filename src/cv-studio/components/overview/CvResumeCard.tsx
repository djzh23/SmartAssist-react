import { FileText, MessageSquare, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'

interface CvResumeCardProps {
  resume: CvStudioResumeSummary
  onDelete: () => void | Promise<void>
}

export default function CvResumeCard({ resume, onDelete }: CvResumeCardProps) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="group flex items-stretch gap-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] transition-colors hover:border-primary/40 hover:bg-white/[0.07]">
      <Link
        to={`/cv-studio/edit/${resume.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-light">
            <FileText size={18} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{resume.title}</p>
            <p className="flex items-center gap-1.5 truncate text-xs text-stone-500">
              <span>{updated}</span>
              {resume.notes && (
                <>
                  <span aria-hidden>·</span>
                  <MessageSquare size={11} aria-hidden />
                  <span className="sr-only">Notiz vorhanden</span>
                </>
              )}
              {resume.templateKey && (
                <>
                  <span aria-hidden>·</span>
                  <span className="capitalize">{resume.templateKey.replace(/-/g, ' ')}</span>
                </>
              )}
            </p>
          </div>
        </div>
        <span className="hidden flex-shrink-0 text-xs text-primary-light opacity-0 transition-opacity sm:inline group-hover:opacity-100">
          Bearbeiten →
        </span>
      </Link>
      <div className="flex w-11 flex-shrink-0 border-l border-white/10 bg-black/20">
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            void onDelete()
          }}
          className="flex w-full items-center justify-center text-stone-500 transition-colors hover:bg-rose-950/50 hover:text-rose-200"
          title="Lebenslauf löschen"
          aria-label={`Lebenslauf „${resume.title}“ löschen`}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </div>
    </div>
  )
}
