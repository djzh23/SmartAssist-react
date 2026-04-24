import { FileText, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'

interface CvResumeCardProps {
  resume: CvStudioResumeSummary
}

export default function CvResumeCard({ resume }: CvResumeCardProps) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <Link
      to={`/cv-studio/edit/${resume.id}`}
      className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-primary/40 hover:bg-white/[0.07]"
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
      <span className="flex-shrink-0 text-xs text-primary-light opacity-0 transition-opacity group-hover:opacity-100">
        Bearbeiten →
      </span>
    </Link>
  )
}
