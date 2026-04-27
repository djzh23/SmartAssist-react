import { Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'
import CvMiniDocPreview from './CvMiniDocPreview'

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
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-stone-600/40 bg-stone-800/50 transition-colors hover:border-stone-500/60 hover:bg-stone-700/50">
      {/* Document preview — fixed height */}
      <Link
        to={`/cv-studio/edit/${resume.id}`}
        className="flex shrink-0 items-center justify-center bg-black/20 px-3 pt-3 pb-2"
        tabIndex={-1}
        aria-hidden
      >
        <CvMiniDocPreview resume={resume} compact />
      </Link>

      {/* Info section — fills remaining height */}
      <div className="flex min-w-0 flex-1 flex-col px-2.5 pb-2.5 pt-2">
        <Link
          to={`/cv-studio/edit/${resume.id}`}
          className="min-w-0 text-[11px] font-semibold leading-tight text-stone-100 line-clamp-2 hover:text-primary-light"
        >
          {resume.title}
        </Link>

        {(resume.targetCompany || resume.targetRole) && (
          <p className="mt-0.5 truncate text-[10px] leading-tight text-stone-400">
            {[resume.targetCompany, resume.targetRole].filter(Boolean).join(' · ')}
          </p>
        )}

        {/* Spacer pushes actions to bottom */}
        <div className="flex-1" />

        <div className="mt-1.5 flex items-center justify-between gap-1">
          <span className="text-[9px] text-stone-500">{updated}</span>
          <div className="flex gap-1">
            <Link
              to={`/cv-studio/edit/${resume.id}`}
              className="rounded-md border border-stone-600/50 p-1 text-stone-400 transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary-light"
              title="Bearbeiten"
              aria-label={`${resume.title} bearbeiten`}
            >
              <Pencil size={11} aria-hidden />
            </Link>
            <button
              type="button"
              onClick={e => { e.preventDefault(); void onDelete() }}
              className="rounded-md border border-stone-600/50 p-1 text-stone-500 transition-colors hover:border-rose-500/40 hover:bg-rose-950/40 hover:text-rose-300"
              title="Lebenslauf löschen"
              aria-label={`Lebenslauf „${resume.title}" löschen`}
            >
              <Trash2 size={11} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
