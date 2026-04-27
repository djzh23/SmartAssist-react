import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'
import CvMiniDocPreview from './CvMiniDocPreview'

interface CvResumeCardProps {
  resume: CvStudioResumeSummary
  onDelete: () => void | Promise<void>
  categoryName?: string | null
}

export default function CvResumeCard({ resume, onDelete, categoryName }: CvResumeCardProps) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.025] transition-colors hover:border-white/[0.15] hover:bg-white/[0.04]">
      {/* Document preview */}
      <Link
        to={`/cv-studio/edit/${resume.id}`}
        className="flex items-start justify-center bg-black/20 px-4 pt-4 pb-2"
        tabIndex={-1}
        aria-hidden
      >
        <CvMiniDocPreview resume={resume} />
      </Link>

      {/* Info section */}
      <div className="flex min-w-0 flex-1 flex-col p-3">
        <Link
          to={`/cv-studio/edit/${resume.id}`}
          className="min-w-0 flex-1 text-sm font-semibold leading-snug text-white line-clamp-2 hover:text-primary-light"
        >
          {resume.title}
        </Link>

        {(resume.targetCompany || resume.targetRole) && (
          <p className="mt-0.5 truncate text-[11px] text-stone-400">
            {[resume.targetCompany, resume.targetRole].filter(Boolean).join(' · ')}
          </p>
        )}

        {categoryName && (
          <span className="mt-1 inline-block self-start rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary-light">
            {categoryName}
          </span>
        )}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-stone-500">{updated}</span>
          <div className="flex gap-1">
            <Link
              to={`/cv-studio/edit/${resume.id}`}
              className="rounded-lg border border-white/10 p-1.5 text-stone-400 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary-light"
              title="Bearbeiten"
              aria-label={`${resume.title} bearbeiten`}
            >
              <Pencil size={13} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={e => { e.preventDefault(); void onDelete() }}
              className="rounded-lg border border-white/10 p-1.5 text-stone-500 transition-colors hover:border-rose-500/30 hover:bg-rose-950/40 hover:text-rose-300"
              title="Lebenslauf löschen"
              aria-label={`Lebenslauf „${resume.title}" löschen`}
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
