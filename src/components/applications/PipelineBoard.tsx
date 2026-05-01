import type React from 'react'
import type { ApplicationStatusApi, JobApplicationApi } from '../../api/client'
import PipelineColumn from './PipelineColumn'
import { STATUS_ACCENT, STATUS_LABEL } from './pipelineConfig'

interface PipelineBoardProps {
  statuses: ApplicationStatusApi[]
  grouped: Map<ApplicationStatusApi, JobApplicationApi[]>
  draggingAppId: string | null
  dropStatus: ApplicationStatusApi | null
  onDragStart: (event: React.DragEvent<HTMLDivElement>, appId: string) => void
  onDragEnd: () => void
  onDragOver: (event: React.DragEvent<HTMLElement>, status: ApplicationStatusApi) => void
  onDrop: (event: React.DragEvent<HTMLElement>, status: ApplicationStatusApi) => void
  onDragLeave: (status: ApplicationStatusApi) => void
  onOpenInfo: (app: JobApplicationApi) => void
}

export default function PipelineBoard({
  statuses,
  grouped,
  draggingAppId,
  dropStatus,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onDragLeave,
  onOpenInfo,
}: PipelineBoardProps) {
  return (
    <div className="overflow-x-auto overflow-y-visible pb-2 [scrollbar-width:thin]">
      <div className="flex min-w-max gap-3 pr-1" style={{ scrollBehavior: 'smooth' }}>
        {statuses.map(status => {
          const list = [...(grouped.get(status) ?? [])].sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          )
          return (
            <PipelineColumn
              key={status}
              status={status}
              title={STATUS_LABEL[status]}
              count={list.length}
              accentClass={STATUS_ACCENT[status]}
              applications={list}
              draggingAppId={draggingAppId}
              isDropTarget={dropStatus === status}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragLeave={onDragLeave}
              onOpenInfo={onOpenInfo}
            />
          )
        })}
      </div>
    </div>
  )
}

