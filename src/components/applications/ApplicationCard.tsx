import type React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Building2, MoreVertical } from 'lucide-react'
import type { JobApplicationApi } from '../../api/client'
import { formatRelative } from './pipelineConfig'

interface ApplicationCardProps {
  app: JobApplicationApi
  accentClass: string
  dragging: boolean
  onDragStart: (event: React.DragEvent<HTMLDivElement>) => void
  onDragEnd: () => void
  onOpenInfo: () => void
}

export default function ApplicationCard({
  app,
  accentClass,
  dragging,
  onDragStart,
  onDragEnd,
  onOpenInfo,
}: ApplicationCardProps) {
  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={[
        'group relative cursor-grab active:cursor-grabbing rounded-xl border border-white/10 bg-[#17110d] p-3 shadow-[0_8px_20px_-16px_rgba(0,0,0,0.8)] transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-white/20 hover:shadow-[0_10px_28px_-14px_rgba(245,158,11,0.28)]',
        dragging ? 'opacity-45' : 'opacity-100',
      ].join(' ')}
    >
      <span className={`absolute inset-y-2 left-0 w-1 rounded-r-full ${accentClass}`} aria-hidden />
      <Link to={`/applications/${app.id}`} className="block pr-7">
        <p className="line-clamp-2 text-sm font-semibold leading-5 text-stone-100">{app.jobTitle || 'Ohne Titel'}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-stone-400">
          <Building2 size={12} aria-hidden />
          <span className="truncate">{app.company || '-'}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-stone-500">
          <Briefcase size={11} aria-hidden />
          <span>{formatRelative(app.updatedAt)}</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={onOpenInfo}
        className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-stone-400 transition hover:bg-white/5 hover:text-stone-100"
        aria-label={`Details öffnen: ${app.jobTitle || 'Bewerbung'}`}
      >
        <MoreVertical size={14} />
      </button>
    </article>
  )
}

