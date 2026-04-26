import { FileText, MessageSquare, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvGroupVisualVariant } from './CvApplicationGroup'

interface CvResumeCardProps {
  resume: CvStudioResumeSummary
  onDelete: () => void | Promise<void>
  /** Accent for left rail — matches parent group */
  nestStyle?: CvGroupVisualVariant
}

function nestAccentClass(nestStyle: CvGroupVisualVariant | undefined): string {
  switch (nestStyle) {
    case 'linked':
      return 'border-l-teal-400/45 hover:border-l-teal-300/70'
    case 'context':
      return 'border-l-amber-400/40 hover:border-l-amber-300/65'
    case 'general':
      return 'border-l-primary/50 hover:border-l-primary/75'
    default:
      return 'border-l-white/15 hover:border-l-primary/40'
  }
}

function iconClass(nestStyle: CvGroupVisualVariant | undefined): string {
  switch (nestStyle) {
    case 'linked':
      return 'bg-teal-950/50 text-teal-100'
    case 'context':
      return 'bg-amber-950/45 text-amber-100'
    case 'general':
      return 'bg-primary/20 text-primary-light'
    default:
      return 'bg-primary/20 text-primary-light'
  }
}

export default function CvResumeCard({ resume, onDelete, nestStyle }: CvResumeCardProps) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  const rail = nestAccentClass(nestStyle)

  return (
    <div
      className={`group flex items-stretch gap-0 overflow-hidden rounded-lg border border-white/10 border-l-[3px] bg-white/[0.035] transition-colors hover:border-white/18 hover:bg-white/[0.06] ${rail}`}
    >
      <Link
        to={`/cv-studio/edit/${resume.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5 sm:px-3.5 sm:py-3"
      >
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md sm:h-9 sm:w-9 sm:rounded-lg ${iconClass(nestStyle)}`}
          >
            <FileText size={17} aria-hidden />
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
