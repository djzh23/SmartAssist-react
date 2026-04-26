import { FileText, MessageSquare, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvGroupVisualVariant } from './CvApplicationGroup'

interface CvResumeCardProps {
  resume: CvStudioResumeSummary
  onDelete: () => void | Promise<void>
  nestStyle?: CvGroupVisualVariant
}

function railClass(nestStyle: CvGroupVisualVariant | undefined): string {
  switch (nestStyle) {
    case 'linked':
      return 'border-l-stone-400/35'
    case 'context':
      return 'border-l-amber-400/25'
    case 'general':
      return 'border-l-primary/30'
    default:
      return 'border-l-white/10'
  }
}

function iconWrap(nestStyle: CvGroupVisualVariant | undefined): string {
  switch (nestStyle) {
    case 'linked':
      return 'bg-white/[0.06] text-stone-200'
    case 'context':
      return 'bg-white/[0.06] text-amber-100/85'
    case 'general':
      return 'bg-white/[0.06] text-primary-light/90'
    default:
      return 'bg-white/[0.06] text-stone-200'
  }
}

export default function CvResumeCard({ resume, onDelete, nestStyle }: CvResumeCardProps) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div
      className={`group flex items-stretch gap-0 overflow-hidden rounded-lg border border-white/[0.07] border-l-[2px] bg-white/[0.02] transition-colors hover:border-white/12 hover:bg-white/[0.04] ${railClass(nestStyle)}`}
    >
      <Link
        to={`/cv-studio/edit/${resume.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2 sm:py-2.5"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${iconWrap(nestStyle)}`}
          >
            <FileText size={16} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-stone-100">{resume.title}</p>
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
        <span className="hidden flex-shrink-0 text-xs text-stone-400 opacity-0 transition-opacity sm:inline group-hover:opacity-100">
          Bearbeiten →
        </span>
      </Link>
      <div className="flex w-10 flex-shrink-0 border-l border-white/[0.06] bg-black/15 sm:w-11">
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            void onDelete()
          }}
          className="flex w-full items-center justify-center text-stone-500 transition-colors hover:bg-rose-950/40 hover:text-rose-200"
          title="Lebenslauf löschen"
          aria-label={`Lebenslauf „${resume.title}“ löschen`}
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </div>
    </div>
  )
}
