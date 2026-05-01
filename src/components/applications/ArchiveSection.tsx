import { ChevronDown, ChevronUp } from 'lucide-react'
import type React from 'react'
import type { ApplicationStatusApi, JobApplicationApi } from '../../api/client'
import PipelineBoard from './PipelineBoard'

interface ArchiveSectionProps {
  open: boolean
  count: number
  statuses: ApplicationStatusApi[]
  grouped: Map<ApplicationStatusApi, JobApplicationApi[]>
  draggingAppId: string | null
  dropStatus: ApplicationStatusApi | null
  onToggle: () => void
  onDragStart: (event: React.DragEvent<HTMLDivElement>, appId: string) => void
  onDragEnd: () => void
  onDragOver: (event: React.DragEvent<HTMLElement>, status: ApplicationStatusApi) => void
  onDrop: (event: React.DragEvent<HTMLElement>, status: ApplicationStatusApi) => void
  onDragLeave: (status: ApplicationStatusApi) => void
  onOpenInfo: (app: JobApplicationApi) => void
}

export default function ArchiveSection({
  open,
  count,
  statuses,
  grouped,
  draggingAppId,
  dropStatus,
  onToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
  onOpenInfo,
}: ArchiveSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#120e0b]/70 p-3.5">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-1.5 py-1 text-left text-stone-100 transition hover:bg-white/5"
      >
        <span className="inline-flex items-center gap-2 text-sm font-semibold">
          Archiv - Absagen und erledigt
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums text-stone-200">{count}</span>
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open ? (
        <div className="mt-3">
          <PipelineBoard
            statuses={statuses}
            grouped={grouped}
            draggingAppId={draggingAppId}
            dropStatus={dropStatus}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDrop={onDrop}
            onDragLeave={onDragLeave}
            onOpenInfo={onOpenInfo}
          />
        </div>
      ) : null}
    </section>
  )
}

