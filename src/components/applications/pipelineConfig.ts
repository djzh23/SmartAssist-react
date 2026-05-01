import type { ApplicationStatusApi } from '../../api/client'

export const PIPELINE_STATUSES: ApplicationStatusApi[] = [
  'draft',
  'applied',
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
  interview: 'bg-indigo-500',
  assessment: 'bg-orange-500',
  offer: 'bg-emerald-500',
  accepted: 'bg-emerald-600',
  rejected: 'bg-slate-500',
  withdrawn: 'bg-slate-500',
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

