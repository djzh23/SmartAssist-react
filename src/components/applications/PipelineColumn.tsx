import type React from 'react'
import type { ApplicationStatusApi, JobApplicationApi } from '../../api/client'
import ApplicationCard from './ApplicationCard'
import PipelineEmptyState from './PipelineEmptyState'

interface PipelineColumnProps {
  status: ApplicationStatusApi
  title: string
  count: number
  accentClass: string
  applications: JobApplicationApi[]
  draggingAppId: string | null
  isDropTarget: boolean
  onDragStart: (event: React.DragEvent<HTMLDivElement>, appId: string) => void
  onDragEnd: () => void
  onDragOver: (event: React.DragEvent<HTMLElement>, status: ApplicationStatusApi) => void
  onDrop: (event: React.DragEvent<HTMLElement>, status: ApplicationStatusApi) => void
  onDragLeave: (status: ApplicationStatusApi) => void
  onOpenInfo: (app: JobApplicationApi) => void
}

export default function PipelineColumn({
  status,
  title,
  count,
  accentClass,
  applications,
  draggingAppId,
  isDropTarget,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
  onOpenInfo,
}: PipelineColumnProps) {
  return (
    <section
      className={[
        'w-[280px] shrink-0 rounded-2xl border border-white/10 bg-[#120e0b]/88 p-2.5 shadow-[0_12px_30px_-20px_rgba(0,0,0,0.9)] sm:w-[300px]',
        isDropTarget ? 'ring-2 ring-primary/45' : '',
      ].join(' ')}
      onDragOver={event => onDragOver(event, status)}
      onDrop={event => onDrop(event, status)}
      onDragLeave={() => onDragLeave(status)}
    >
      <header className="mb-2 flex items-center justify-between rounded-xl border border-white/10 bg-black/15 px-3 py-2">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-300">{title}</h3>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-stone-100">
          {count}
        </span>
      </header>
      <div className="space-y-2 overflow-visible">
        {applications.length === 0 ? (
          <PipelineEmptyState />
        ) : (
          applications.map(app => (
            <ApplicationCard
              key={app.id}
              app={app}
              accentClass={accentClass}
              dragging={draggingAppId === app.id}
              onDragStart={event => onDragStart(event, app.id)}
              onDragEnd={onDragEnd}
              onOpenInfo={() => onOpenInfo(app)}
            />
          ))
        )}
      </div>
    </section>
  )
}

