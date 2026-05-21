import type { ApplicationStatusApi } from '../../api/client'

export const PIPELINE_STATUSES: ApplicationStatusApi[] = [
  'draft',
  'applied',
  'phoneScreen',
  'interview',
  'assessment',
  'offer',
]

/** Summary cards + default list order (matches dashboard mock). */
export const LIST_VIEW_STATUSES: ApplicationStatusApi[] = [
  'applied',
  'draft',
  'phoneScreen',
  'interview',
  'assessment',
  'offer',
]

export const ARCHIVE_STATUSES: ApplicationStatusApi[] = ['rejected', 'withdrawn', 'accepted']

export const TERMINAL_STATUSES: ApplicationStatusApi[] = ['accepted', 'rejected', 'withdrawn']

export const STATUS_LABEL: Record<ApplicationStatusApi, string> = {
  draft: 'Entwurf',
  applied: 'Beworben',
  phoneScreen: 'Erstgespräch',
  interview: 'Interview',
  assessment: 'Assessment',
  offer: 'Angebot',
  accepted: 'Angenommen',
  rejected: 'Abgesagt',
  withdrawn: 'Zurückgezogen',
}

export const STATUS_ACCENT: Record<ApplicationStatusApi, string> = {
  draft: 'bg-amber-400',
  applied: 'bg-sky-500',
  phoneScreen: 'bg-violet-500',
  interview: 'bg-teal-400',
  assessment: 'bg-yellow-400',
  offer: 'bg-emerald-500',
  accepted: 'bg-emerald-600',
  rejected: 'bg-slate-500',
  withdrawn: 'bg-slate-500',
}

export interface StatusTheme {
  accent: string
  cardActiveBorder: string
  iconBg: string
  iconText: string
  badgeBg: string
  badgeText: string
  badgeDot: string
}

export const STATUS_THEME: Record<ApplicationStatusApi, StatusTheme> = {
  draft: {
    accent: 'bg-amber-400',
    cardActiveBorder: 'border-amber-400',
    iconBg: 'bg-amber-500/15',
    iconText: 'text-amber-400',
    badgeBg: 'bg-amber-500/12',
    badgeText: 'text-amber-300',
    badgeDot: 'bg-amber-400',
  },
  applied: {
    accent: 'bg-sky-500',
    cardActiveBorder: 'border-sky-500',
    iconBg: 'bg-sky-500/15',
    iconText: 'text-sky-400',
    badgeBg: 'bg-sky-500/12',
    badgeText: 'text-sky-300',
    badgeDot: 'bg-sky-400',
  },
  phoneScreen: {
    accent: 'bg-violet-500',
    cardActiveBorder: 'border-violet-500',
    iconBg: 'bg-violet-500/15',
    iconText: 'text-violet-400',
    badgeBg: 'bg-violet-500/12',
    badgeText: 'text-violet-300',
    badgeDot: 'bg-violet-400',
  },
  interview: {
    accent: 'bg-teal-400',
    cardActiveBorder: 'border-teal-400',
    iconBg: 'bg-teal-500/15',
    iconText: 'text-teal-400',
    badgeBg: 'bg-teal-500/12',
    badgeText: 'text-teal-300',
    badgeDot: 'bg-teal-400',
  },
  assessment: {
    accent: 'bg-yellow-400',
    cardActiveBorder: 'border-yellow-400',
    iconBg: 'bg-yellow-500/15',
    iconText: 'text-yellow-400',
    badgeBg: 'bg-yellow-500/12',
    badgeText: 'text-yellow-300',
    badgeDot: 'bg-yellow-400',
  },
  offer: {
    accent: 'bg-emerald-500',
    cardActiveBorder: 'border-emerald-500',
    iconBg: 'bg-emerald-500/15',
    iconText: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/12',
    badgeText: 'text-emerald-300',
    badgeDot: 'bg-emerald-400',
  },
  accepted: {
    accent: 'bg-emerald-600',
    cardActiveBorder: 'border-emerald-600',
    iconBg: 'bg-emerald-600/15',
    iconText: 'text-emerald-400',
    badgeBg: 'bg-emerald-600/12',
    badgeText: 'text-emerald-300',
    badgeDot: 'bg-emerald-500',
  },
  rejected: {
    accent: 'bg-slate-500',
    cardActiveBorder: 'border-slate-500',
    iconBg: 'bg-slate-500/15',
    iconText: 'text-slate-400',
    badgeBg: 'bg-slate-500/12',
    badgeText: 'text-slate-300',
    badgeDot: 'bg-slate-400',
  },
  withdrawn: {
    accent: 'bg-slate-500',
    cardActiveBorder: 'border-slate-500',
    iconBg: 'bg-slate-500/15',
    iconText: 'text-slate-400',
    badgeBg: 'bg-slate-500/12',
    badgeText: 'text-slate-300',
    badgeDot: 'bg-slate-400',
  },
}

export function applicationDateLabel(app: { status: ApplicationStatusApi; statusUpdatedAt: string; createdAt: string }): string {
  const iso = app.status === 'draft' ? app.createdAt : app.statusUpdatedAt
  return formatRelative(iso)
}

export function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return 'Heute'
  if (days === 1) return 'Gestern'
  if (days < 7) return `vor ${days} Tagen`
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

