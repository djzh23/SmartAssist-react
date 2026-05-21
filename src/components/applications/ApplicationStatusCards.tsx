import {
  Briefcase,
  Building2,
  ClipboardList,
  MessageCircle,
  Pencil,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ApplicationStatusApi, JobApplicationApi } from '../../api/client'
import { LIST_VIEW_STATUSES, STATUS_LABEL, STATUS_THEME } from './pipelineConfig'

const STATUS_ICON: Record<ApplicationStatusApi, LucideIcon> = {
  draft: Pencil,
  applied: Building2,
  phoneScreen: MessageCircle,
  interview: Users,
  assessment: ClipboardList,
  offer: Briefcase,
  accepted: Briefcase,
  rejected: Briefcase,
  withdrawn: Briefcase,
}

const ACTIVE_CARD_GLOW: Record<ApplicationStatusApi, string> = {
  draft: 'bg-amber-500/10 shadow-[0_0_22px_-6px_rgba(251,191,36,0.5)]',
  applied: 'bg-sky-500/10 shadow-[0_0_22px_-6px_rgba(56,189,248,0.5)]',
  phoneScreen: 'bg-violet-500/10 shadow-[0_0_22px_-6px_rgba(139,92,246,0.5)]',
  interview: 'bg-teal-500/10 shadow-[0_0_22px_-6px_rgba(45,212,191,0.45)]',
  assessment: 'bg-yellow-500/10 shadow-[0_0_22px_-6px_rgba(250,204,21,0.45)]',
  offer: 'bg-emerald-500/10 shadow-[0_0_22px_-6px_rgba(52,211,153,0.45)]',
  accepted: 'bg-emerald-600/10 shadow-[0_0_22px_-6px_rgba(16,185,129,0.45)]',
  rejected: 'bg-slate-500/10 shadow-[0_0_22px_-6px_rgba(100,116,139,0.4)]',
  withdrawn: 'bg-slate-500/10 shadow-[0_0_22px_-6px_rgba(100,116,139,0.4)]',
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
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-0.5 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6 lg:gap-3 [&::-webkit-scrollbar]:hidden">
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
              'group relative flex min-h-[84px] min-w-[104px] shrink-0 snap-start flex-col rounded-xl border bg-app-raised px-3 py-2.5 text-left transition-all duration-200',
              'sm:min-h-[88px] sm:min-w-0 sm:shrink',
              'hover:border-white/20 hover:bg-[#252019]',
              isActive
                ? `${theme.cardActiveBorder} border-b-[3px] ${ACTIVE_CARD_GLOW[status]}`
                : 'border-white/10',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-1.5">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${theme.iconBg}`}>
                <Icon className={theme.iconText} size={16} strokeWidth={2} aria-hidden />
              </span>
              <span className="truncate text-[10px] font-medium leading-tight text-stone-400 sm:text-[11px]">
                {STATUS_LABEL[status]}
              </span>
            </div>
            <p className="mt-2.5 text-xl font-bold tabular-nums tracking-tight text-stone-50 sm:mt-3 sm:text-2xl">
              {count}
            </p>
          </button>
        )
      })}
    </div>
  )
}
