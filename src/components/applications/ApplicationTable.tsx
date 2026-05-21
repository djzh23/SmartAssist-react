import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Code2,
  MoreHorizontal,
} from 'lucide-react'
import type { ApplicationStatusApi, JobApplicationApi } from '../../api/client'
import {
  applicationDateLabel,
  STATUS_LABEL,
  STATUS_THEME,
} from './pipelineConfig'

interface ApplicationTableProps {
  apps: JobApplicationApi[]
  rangeStart: number
  rangeEnd: number
  total: number
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  onOpenInfo: (app: JobApplicationApi) => void
  onStatusChange: (appId: string, status: ApplicationStatusApi) => void
  emptyMessage?: string
}

const DEV_TITLE_PATTERN = /\b(developer|engineer|software|frontend|backend|devops|full[\s-]?stack|programmier|entwickler|sap)\b/i

function positionIcon(title: string) {
  return DEV_TITLE_PATTERN.test(title) ? Code2 : Briefcase
}

const ICON_GLOW: Record<ApplicationStatusApi, string> = {
  draft: 'shadow-[0_0_14px_-2px_rgba(251,191,36,0.35)] ring-amber-500/30',
  applied: 'shadow-[0_0_14px_-2px_rgba(56,189,248,0.35)] ring-sky-500/35',
  phoneScreen: 'shadow-[0_0_14px_-2px_rgba(139,92,246,0.35)] ring-violet-500/35',
  interview: 'shadow-[0_0_14px_-2px_rgba(45,212,191,0.35)] ring-teal-500/35',
  assessment: 'shadow-[0_0_14px_-2px_rgba(250,204,21,0.3)] ring-yellow-500/30',
  offer: 'shadow-[0_0_14px_-2px_rgba(52,211,153,0.35)] ring-emerald-500/35',
  accepted: 'shadow-[0_0_14px_-2px_rgba(16,185,129,0.35)] ring-emerald-600/35',
  rejected: 'shadow-[0_0_14px_-2px_rgba(100,116,139,0.25)] ring-slate-500/25',
  withdrawn: 'shadow-[0_0_14px_-2px_rgba(100,116,139,0.25)] ring-slate-500/25',
}

function StatusBadge({ status }: { status: ApplicationStatusApi }) {
  const theme = STATUS_THEME[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${theme.badgeBg} ${theme.badgeText}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${theme.badgeDot}`} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  )
}

interface RowMenuProps {
  app: JobApplicationApi
  onOpenInfo: (app: JobApplicationApi) => void
  onStatusChange: (appId: string, status: ApplicationStatusApi) => void
}

function ApplicationRowMenu({ app, onOpenInfo, onStatusChange }: RowMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    return () => window.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Aktionen für ${app.jobTitle || 'Bewerbung'}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/5 hover:text-stone-100"
      >
        <MoreHorizontal size={16} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-xl border border-white/10 bg-[#1a1512] py-1 shadow-landing-md"
        >
          <Link
            to={`/applications/${encodeURIComponent(app.id)}`}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-stone-200 transition hover:bg-white/5"
          >
            Bewerbung öffnen
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onOpenInfo(app)
            }}
            className="block w-full px-3 py-2 text-left text-sm text-stone-200 transition hover:bg-white/5"
          >
            Fortschritt anzeigen
          </button>
          <div className="my-1 border-t border-white/10" />
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-stone-500">
            Status
          </p>
          {(['draft', 'applied', 'phoneScreen', 'interview', 'assessment', 'offer'] as ApplicationStatusApi[]).map(status => (
            <button
              key={status}
              type="button"
              role="menuitem"
              disabled={app.status === status}
              onClick={() => {
                setOpen(false)
                onStatusChange(app.id, status)
              }}
              className="block w-full px-3 py-2 text-left text-sm text-stone-300 transition hover:bg-white/5 disabled:cursor-default disabled:opacity-40"
            >
              {STATUS_LABEL[status]}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ApplicationMobileCard({ app }: { app: JobApplicationApi }) {
  const theme = STATUS_THEME[app.status]
  const PositionIcon = positionIcon(app.jobTitle || '')

  return (
    <Link
      to={`/applications/${encodeURIComponent(app.id)}`}
      className="group flex items-center gap-3 rounded-xl border border-white/10 bg-app-raised px-3 py-3.5 transition active:scale-[0.99] active:bg-[#252019] sm:hidden"
    >
      <span
        className={[
          'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
          theme.iconBg,
          ICON_GLOW[app.status],
        ].join(' ')}
      >
        <PositionIcon className={theme.iconText} size={18} strokeWidth={2} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-stone-50 group-hover:text-white">
          {app.jobTitle || 'Ohne Titel'}
        </p>
        <p className="mt-0.5 truncate text-xs text-stone-400">
          {app.company || '–'}
        </p>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <span className="text-[11px] tabular-nums text-stone-500">
          {applicationDateLabel(app)}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${theme.badgeDot}`} aria-hidden />
          <ChevronRight size={14} className="text-stone-500" aria-hidden />
        </div>
      </div>
    </Link>
  )
}

function ApplicationDesktopRow({
  app,
  onOpenInfo,
  onStatusChange,
}: {
  app: JobApplicationApi
  onOpenInfo: (app: JobApplicationApi) => void
  onStatusChange: (appId: string, status: ApplicationStatusApi) => void
}) {
  const theme = STATUS_THEME[app.status]
  const PositionIcon = positionIcon(app.jobTitle || '')

  return (
    <article className="group relative hidden rounded-xl border border-white/10 bg-app-raised transition hover:border-white/15 hover:bg-[#252019] sm:block">
      <span
        className={`absolute bottom-3 left-0 top-3 w-1 rounded-r-full ${theme.accent}`}
        aria-hidden
      />
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto_auto_auto] items-center gap-4 px-4 py-3.5 pl-5">
        <Link
          to={`/applications/${encodeURIComponent(app.id)}`}
          className="flex min-w-0 items-center gap-3"
        >
          <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${theme.iconBg}`}>
            <PositionIcon className={theme.iconText} size={16} strokeWidth={2} aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold text-stone-50 group-hover:text-white">
            {app.jobTitle || 'Ohne Titel'}
          </span>
        </Link>

        <p className="truncate text-sm text-stone-400">
          {app.company || '–'}
        </p>

        <div className="justify-self-start">
          <StatusBadge status={app.status} />
        </div>

        <p className="min-w-[6.5rem] text-right text-sm text-stone-500">
          {applicationDateLabel(app)}
        </p>

        <div className="justify-self-end">
          <ApplicationRowMenu
            app={app}
            onOpenInfo={onOpenInfo}
            onStatusChange={onStatusChange}
          />
        </div>
      </div>
    </article>
  )
}

export default function ApplicationTable({
  apps,
  rangeStart,
  rangeEnd,
  total,
  page,
  pageCount,
  onPageChange,
  onOpenInfo,
  onStatusChange,
  emptyMessage = 'Keine Bewerbungen in dieser Ansicht.',
}: ApplicationTableProps) {
  const pageNumbers = buildPageNumbers(page, pageCount)

  return (
    <div className="space-y-3">
      <div
        className="hidden px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_auto_auto_auto] sm:gap-4 sm:pl-5"
        aria-hidden
      >
        <span>Position</span>
        <span>Unternehmen</span>
        <span>Status</span>
        <span className="text-right">Beworben am</span>
        <span className="w-8" />
      </div>

      {apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-app-raised/50 px-6 py-12 text-center text-sm text-stone-400">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-2">
          {apps.map(app => (
            <div key={app.id}>
              <ApplicationMobileCard app={app} />
              <ApplicationDesktopRow
                app={app}
                onOpenInfo={onOpenInfo}
                onStatusChange={onStatusChange}
              />
            </div>
          ))}
        </div>
      )}

      {total > 0 ? (
        <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-400 sm:text-sm">
            <span className="tabular-nums text-stone-200">{rangeStart}–{rangeEnd}</span>
            {' '}von{' '}
            <span className="tabular-nums text-stone-200">{total}</span>
          </p>

          <nav
            aria-label="Seiten"
            className="flex items-center justify-center gap-1 sm:justify-end"
          >
            <button
              type="button"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              aria-label="Vorherige Seite"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/5 hover:text-stone-100 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>

            {pageNumbers.map((n, i) => (
              n === '…' ? (
                <span key={`ellipsis-${i}`} className="px-1 text-stone-500">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => onPageChange(n)}
                  aria-current={n === page ? 'page' : undefined}
                  className={[
                    'inline-flex h-8 min-w-8 items-center justify-center text-sm tabular-nums transition',
                    n === page
                      ? 'rounded-full bg-primary font-semibold text-white shadow-sm sm:rounded-lg'
                      : 'rounded-lg text-stone-400 hover:bg-white/5 hover:text-stone-100',
                  ].join(' ')}
                >
                  {n}
                </button>
              )
            ))}

            <button
              type="button"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= pageCount}
              aria-label="Nächste Seite"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-white/5 hover:text-stone-100 disabled:opacity-30"
            >
              <ChevronRight size={16} />
            </button>
          </nav>
        </div>
      ) : null}
    </div>
  )
}

function buildPageNumbers(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 3) return [1, 2, 3, 4, '…', total]
  if (current >= total - 2) return [1, '…', total - 3, total - 2, total - 1, total]
  return [1, '…', current - 1, current, current + 1, '…', total]
}
