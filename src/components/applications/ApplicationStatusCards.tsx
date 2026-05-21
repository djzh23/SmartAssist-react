import {
  Briefcase,
  ClipboardList,
  FileText,
  MessageCircle,
  Pencil,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ApplicationStatusApi, JobApplicationApi } from '../../api/client'
import { LIST_VIEW_STATUSES, STATUS_LABEL, STATUS_THEME } from './pipelineConfig'

const STATUS_ICON: Record<ApplicationStatusApi, LucideIcon> = {
  draft: Pencil,
  applied: FileText,
  phoneScreen: MessageCircle,
  interview: Users,
  assessment: ClipboardList,
  offer: Briefcase,
  accepted: Briefcase,
  rejected: Briefcase,
  withdrawn: Briefcase,
}

interface ApplicationStatusCardsProps {
  apps: JobApplicationApi[]
  activeStatus: ApplicationStatusApi | null
  onSelectStatus: (status: ApplicationStatusApi | null) => void
}

export default function ApplicationStatusCards({
  apps,
  activeStatus,
  onSelectStatus,
}: ApplicationStatusCardsProps) {
  const counts = new Map<ApplicationStatusApi, number>()
  for (const status of LIST_VIEW_STATUSES) counts.set(status, 0)
  for (const app of apps) {
    if (LIST_VIEW_STATUSES.includes(app.status)) {
      counts.set(app.status, (counts.get(app.status) ?? 0) + 1)
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
      {LIST_VIEW_STATUSES.map(status => {
        const theme = STATUS_THEME[status]
        const Icon = STATUS_ICON[status]
        const count = counts.get(status) ?? 0
        const isActive = activeStatus === status

        return (
          <button
            key={status}
            type="button"
            onClick={() => onSelectStatus(isActive ? null : status)}
            aria-pressed={isActive}
            className={[
              'group relative flex min-h-[88px] flex-col rounded-xl border bg-app-raised px-3 py-3 text-left transition-all duration-200',
              'hover:border-white/20 hover:bg-[#252019]',
              isActive
                ? `${theme.cardActiveBorder} border-b-[3px] shadow-[0_0_0_1px_rgba(255,255,255,0.06)]`
                : 'border-white/10',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${theme.iconBg}`}>
                <Icon className={theme.iconText} size={16} strokeWidth={2} aria-hidden />
              </span>
              <span className="truncate text-[11px] font-medium text-stone-400">
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-stone-50">
              {count}
            </p>
          </button>
        )
      })}
    </div>
  )
}
