import { FileText, GripVertical, Pencil, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { CvStudioResumeSummary } from '../../../types'

interface Props {
  resume: CvStudioResumeSummary
  onDelete: () => void | Promise<void>
  isDragging?: boolean
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void
}

export default function CvResumeRow({ resume, onDelete, isDragging, onDragStart }: Props) {
  const updated = new Date(resume.updatedAtUtc).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const subtitle = [resume.targetCompany, resume.targetRole].filter(Boolean).join(' · ')

  return (
    <div
      draggable
      onDragStart={e => {
        e.stopPropagation()
        onDragStart?.(e)
      }}
      className={[
        'group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors',
        isDragging
          ? 'border-primary/40 bg-primary/10 opacity-40'
          : 'border-white/[0.06] bg-stone-900/40 hover:border-white/10 hover:bg-stone-800/50',
      ].join(' ')}
    >
      {/* Drag handle */}
      <GripVertical
        size={13}
        className="shrink-0 cursor-grab text-stone-700 hover:text-stone-500 active:cursor-grabbing"
        aria-hidden
      />

      {/* Doc icon */}
      <FileText size={13} className="shrink-0 text-stone-600" aria-hidden />

      {/* Title + subtitle */}
      <Link
        to={`/cv-studio/edit/${resume.id}`}
        className="min-w-0 flex-1"
        draggable={false}
      >
        <span className="block truncate text-sm font-semibold leading-snug text-stone-100 hover:text-primary-light">
          {resume.title}
        </span>
        {subtitle && (
          <span className="block truncate text-xs leading-snug text-stone-500">{subtitle}</span>
        )}
      </Link>

      {/* Date */}
      <span className="shrink-0 text-[11px] tabular-nums text-stone-600">{updated}</span>

      {/* Actions — visible on hover */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Link
          to={`/cv-studio/edit/${resume.id}`}
          className="rounded p-1 text-stone-500 hover:bg-stone-700/60 hover:text-stone-200"
          title="Bearbeiten"
          draggable={false}
          aria-label={`${resume.title} bearbeiten`}
        >
          <Pencil size={12} aria-hidden />
        </Link>
        <button
          type="button"
          onClick={e => { e.preventDefault(); void onDelete() }}
          className="rounded p-1 text-stone-600 hover:bg-rose-950/50 hover:text-rose-300"
          title="Lebenslauf löschen"
          aria-label={`„${resume.title}" löschen`}
        >
          <Trash2 size={12} aria-hidden />
        </button>
      </div>
    </div>
  )
}
