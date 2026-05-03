import type { ApplicationStatusApi, JobApplicationApi } from '../api/client'

/** Active pipeline (left → right), aligned with ApplicationsPage. */
export const OVERVIEW_PIPELINE: ApplicationStatusApi[] = [
  'draft',
  'applied',
  'phoneScreen',
  'interview',
  'assessment',
  'offer',
]

export const OVERVIEW_TERMINAL: ApplicationStatusApi[] = ['accepted', 'rejected', 'withdrawn']

export const STATUS_LABEL_DE: Record<ApplicationStatusApi, string> = {
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

export interface StatusCount {
  status: ApplicationStatusApi
  label: string
  count: number
}

export interface ApplicationOverview {
  total: number
  activeInPipeline: number
  inArchive: number
  pipeline: StatusCount[]
  archive: StatusCount[]
  /** Share of apps currently in draft (0–1) */
  draftShare: number
  /** Share in terminal states */
  terminalShare: number
}

function emptyCounts(): Map<ApplicationStatusApi, number> {
  const keys: ApplicationStatusApi[] = [
    ...OVERVIEW_PIPELINE,
    ...OVERVIEW_TERMINAL,
  ]
  return new Map(keys.map(k => [k, 0]))
}

export function buildApplicationOverview(apps: JobApplicationApi[]): ApplicationOverview {
  const m = emptyCounts()
  for (const a of apps) {
    m.set(a.status, (m.get(a.status) ?? 0) + 1)
  }
  const total = apps.length
  const activeInPipeline = OVERVIEW_PIPELINE.reduce((s, k) => s + (m.get(k) ?? 0), 0)
  const inArchive = OVERVIEW_TERMINAL.reduce((s, k) => s + (m.get(k) ?? 0), 0)
  const draft = m.get('draft') ?? 0
  const pipeline: StatusCount[] = OVERVIEW_PIPELINE.map(status => ({
    status,
    label: STATUS_LABEL_DE[status],
    count: m.get(status) ?? 0,
  }))
  const archive: StatusCount[] = OVERVIEW_TERMINAL.map(status => ({
    status,
    label: STATUS_LABEL_DE[status],
    count: m.get(status) ?? 0,
  }))
  return {
    total,
    activeInPipeline,
    inArchive,
    pipeline,
    archive,
    draftShare: total > 0 ? draft / total : 0,
    terminalShare: total > 0 ? inArchive / total : 0,
  }
}

/**
 * Short, actionable hint from distribution (deterministic heuristics for UX only).
 */
export function applicationOverviewHint(o: ApplicationOverview): string {
  if (o.total === 0) {
    return 'Noch keine Bewerbung angelegt - starte mit einer Stelle, um die Pipeline zu füllen.'
  }
  if (o.draftShare >= 0.55 && o.total >= 3) {
    return 'Viele Entwürfe: prüfe, welche du versenden oder archivieren möchtest, damit die Übersicht stimmt.'
  }
  if (o.terminalShare >= 0.6 && o.total >= 4) {
    return 'Großer Anteil im Archiv - das ist in Ordnung; für den Fokus kannst du aktive Phasen oben in der Pipeline priorisieren.'
  }
  const interviewPlus = (o.pipeline.find(p => p.status === 'interview')?.count ?? 0)
    + (o.pipeline.find(p => p.status === 'assessment')?.count ?? 0)
    + (o.pipeline.find(p => p.status === 'offer')?.count ?? 0)
  const applied = o.pipeline.find(p => p.status === 'applied')?.count ?? 0
  if (interviewPlus >= 2 && applied >= 3) {
    return 'Du hast mehrere Gespräche oder späte Phasen - nutze die Bewerbungsdetails für Notizen und nächste Schritte.'
  }
  if (o.activeInPipeline >= o.inArchive * 2 && o.activeInPipeline >= 5) {
    return 'Aktive Pipeline wächst: Status in den Details aktuell halten, damit diese Grafik deinen echten Stand abbildet.'
  }
  return 'Verteilung wirkt ausgewogen - passe Status an, sobald sich etwas bei einer Stelle ändert.'
}
