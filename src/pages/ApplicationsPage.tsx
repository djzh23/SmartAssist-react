import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Briefcase,
  Building2,
  ChevronRight,
  LayoutGrid,
  Loader2,
  Plus,
} from 'lucide-react'
import { ServerSyncControl } from '../components/ui/ServerSyncControl'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  fetchJobApplications,
  listCvStudioResumes,
} from '../api/client'
import ApplicationInfoModal from '../components/applications/ApplicationInfoModal'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import type { CvStudioResumeSummary } from '../types'
import { useCareerProfile } from '../hooks/useCareerProfile'
import { getProfileCompleteness, getProfileCompletenessGapHint } from '../utils/profileCompleteness'

/** Active pipeline (left → right). */
const PIPELINE: ApplicationStatusApi[] = [
  'draft',
  'applied',
  'phoneScreen',
  'interview',
  'assessment',
  'offer',
]

const TERMINAL: ApplicationStatusApi[] = ['accepted', 'rejected', 'withdrawn']

const STATUS_LABEL: Record<ApplicationStatusApi, string> = {
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

/** Archiv-Spalten (unterhalb der Pipeline), immer sichtbar. */
const ARCHIVE: ApplicationStatusApi[] = ['rejected', 'withdrawn', 'accepted']

const COLUMN_ACCENT: Record<ApplicationStatusApi, string> = {
  draft: 'border-l-amber-400',
  applied: 'border-l-blue-500',
  phoneScreen: 'border-l-violet-500',
  interview: 'border-l-indigo-500',
  assessment: 'border-l-orange-500',
  offer: 'border-l-emerald-500',
  accepted: 'border-l-emerald-600',
  rejected: 'border-l-slate-400',
  withdrawn: 'border-l-slate-400',
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return 'Heute'
  if (days === 1) return 'Gestern'
  if (days < 7) return `Vor ${days} Tagen`
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

function isActiveStatus(s: ApplicationStatusApi): boolean {
  return !TERMINAL.includes(s)
}

export default function ApplicationsPage() {
  const { getToken } = useAuth()
  const { profile: careerProfile, loading: careerProfileLoading } = useCareerProfile()
  const [apps, setApps] = useState<JobApplicationApi[]>([])
  const [cvSummaries, setCvSummaries] = useState<CvStudioResumeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [infoApp, setInfoApp] = useState<JobApplicationApi | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        setApps([])
        return
      }
      const [list, cvs] = await Promise.all([
        fetchJobApplications(token),
        listCvStudioResumes(token).catch(() => [] as CvStudioResumeSummary[]),
      ])
      setApps(list)
      setCvSummaries(cvs)
      setLastSyncedAt(new Date().toISOString())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  const grouped = useMemo(() => {
    const m = new Map<ApplicationStatusApi, JobApplicationApi[]>()
    for (const s of [...PIPELINE, ...TERMINAL])
      m.set(s, [])
    for (const a of apps) {
      const key = a.status
      const list = m.get(key) ?? []
      list.push(a)
      m.set(key, list)
    }
    return m
  }, [apps])

  const activeCount = useMemo(
    () => apps.filter(a => isActiveStatus(a.status)).length,
    [apps],
  )

  const archiveTotal = useMemo(
    () => ARCHIVE.reduce((n, s) => n + (grouped.get(s)?.length ?? 0), 0),
    [grouped],
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-stone-500/30 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
              <LayoutGrid size={24} strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-stone-50 sm:text-3xl">
                  Meine Bewerbungen
                </h1>
                <InfoExplainerButton
                  variant="onDark"
                  modalTitle="So funktioniert die Übersicht"
                  ariaLabel="Erklärung zur Bewerbungsübersicht, Pipeline und Archiv"
                  className="shrink-0"
                >
                  <p>
                    Pipeline von Entwurf bis Angebot - darunter Archiv für{' '}
                    <span className="font-semibold text-stone-900">Abgesagt, Zurückgezogen und Angenommen</span>
                    .
                  </p>
                  <p className="mt-3">
                    Karten sind bewusst schmal: ein Klick öffnet die Bewerbung, der runde Button „!“ zeigt Fortschritt
                    und nächste Schritte in einem Fenster. Nur die jeweilige Spalte scrollt, wenn viele Bewerbungen in
                    einer Phase liegen.
                  </p>
                  <div className="mt-4 border-t border-stone-200 pt-4">
                    <p className="font-semibold text-stone-900">Leere Spalten</p>
                    <p className="mt-1">
                      Wenn eine Phase noch leer ist, lege eine neue Bewerbung an oder ändere den Status in den
                      Bewerbungsdetails - die Karte wandert dann in die passende Spalte.
                    </p>
                    <p className="mt-2">
                      Im Archiv: abgeschlossene Bewerbungen erscheinen automatisch, sobald du den Status in den Details
                      setzt (z. B. Abgesagt, Zurückgezogen, Angenommen).
                    </p>
                  </div>
                </InfoExplainerButton>
              </div>
              <p className="mt-1 max-w-xl text-sm text-stone-400">
                Pipeline und Archiv - Details über das Info-Symbol.
              </p>
              <p className="mt-2 text-sm font-medium text-stone-200">
                <span className="tabular-nums text-primary">{activeCount}</span>
                {' '}
                {activeCount === 1 ? 'aktive Bewerbung' : 'aktive Bewerbungen'}
                <span className="mx-2 text-stone-600">·</span>
                <span className="tabular-nums">{apps.length}</span>
                {' '}
                gesamt
                <span className="mx-2 text-stone-600">·</span>
                <span className="tabular-nums text-stone-400">{archiveTotal}</span>
                {' '}
                im Archiv
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <ServerSyncControl
              variant="dark"
              onSync={() => void load()}
              syncing={loading}
              lastSyncedAt={lastSyncedAt}
            />
            <Link
              to="/applications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-amber-700"
            >
              <Plus size={18} strokeWidth={2.5} />
              Neue Bewerbung
            </Link>
          </div>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
            {error}
          </div>
        )}

        {!careerProfileLoading && careerProfile && getProfileCompleteness(careerProfile) < 90 && (
          <div className="mb-6 rounded-xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
            <span className="font-semibold">Karriereprofil {getProfileCompleteness(careerProfile)}%</span>
            {getProfileCompletenessGapHint(careerProfile)
              ? (
                  <>
                    {' '}
                    - fehlt u. a.: {getProfileCompletenessGapHint(careerProfile)}
                  </>
                )
              : null}
            {' '}
            <Link to="/career-profile" className="font-medium text-primary underline-offset-2 hover:underline">
              Jetzt vervollständigen
            </Link>
            {' '}
            für bessere KI-Antworten in Analyse und Chat.
          </div>
        )}

        {loading && apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-400">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm font-medium">Bewerbungen werden geladen…</p>
          </div>
        ) : (
          <>
            {/* Horizontal Kanban - scroll on small screens */}
            <section aria-label="Bewerbungspipeline" className="mb-10">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-600">
                Pipeline
              </h2>
              <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:grid sm:snap-none sm:grid-cols-2 sm:gap-3 sm:overflow-x-visible lg:grid-cols-3 xl:grid-cols-6">
                {PIPELINE.map(status => {
                  const list = (grouped.get(status) ?? []).sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                  )
                  return (
                    <div
                      key={status}
                      className="flex min-h-0 max-h-[min(70vh,26rem)] w-[min(100%,14.5rem)] shrink-0 snap-start flex-col rounded-2xl border border-stone-400/45 bg-app-parchment/95 shadow-card backdrop-blur-sm sm:w-auto sm:max-h-[min(72vh,28rem)]"
                    >
                      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-stone-400/35 px-2 py-1.5 sm:px-2.5">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                          {STATUS_LABEL[status]}
                        </h3>
                        <span className="rounded-full bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-900">
                          {list.length}
                        </span>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain p-1 sm:p-1.5 [scrollbar-width:thin]">
                        {list.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-stone-400/45 bg-app-parchmentDeep/80 px-2 py-4 text-center text-[10px] font-medium text-stone-600">
                            Keine Einträge
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1">
                            {list.map(app => (
                              <div
                                key={app.id}
                                className={[
                                  'relative rounded-md border border-stone-400/35 bg-white/95 shadow-sm transition',
                                  'border-l-[3px] hover:border-stone-400/55 hover:shadow-md',
                                  COLUMN_ACCENT[status],
                                ].join(' ')}
                              >
                                <Link
                                  to={`/applications/${app.id}`}
                                  className="group flex min-w-0 flex-col gap-0.5 py-1 pl-1.5 pr-7"
                                >
                                  <div className="flex items-start gap-1">
                                    <Briefcase size={11} className="mt-0.5 shrink-0 text-primary/90" aria-hidden />
                                    <span className="line-clamp-1 text-[11px] font-semibold leading-tight text-stone-900 group-hover:text-primary">
                                      {app.jobTitle || 'Ohne Titel'}
                                    </span>
                                    <ChevronRight
                                      size={12}
                                      className="ml-auto shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-primary"
                                      aria-hidden
                                    />
                                  </div>
                                  <div className="flex min-w-0 items-center gap-0.5 pl-[1.125rem] text-[10px] text-stone-600">
                                    <Building2 size={9} className="shrink-0 opacity-70" aria-hidden />
                                    <span className="truncate">{app.company || '-'}</span>
                                  </div>
                                  <p className="pl-[1.125rem] text-[9px] font-medium uppercase tracking-wide text-stone-500">
                                    {formatRelative(app.updatedAt)}
                                  </p>
                                </Link>
                                <button
                                  type="button"
                                  className="absolute right-0.5 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-amber-600/40 bg-amber-50 text-xs font-extrabold text-amber-900 shadow-sm hover:bg-amber-100"
                                  aria-label={`Infos und Fortschritt: ${app.jobTitle || 'Bewerbung'}`}
                                  onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setInfoApp(app)
                                  }}
                                >
                                  !
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Archiv: Absagen & erledigt - immer sichtbar (nicht nur bei Einträgen) */}
            <section aria-label="Archiv: abgeschlossene Bewerbungen" className="rounded-2xl border border-stone-400/40 bg-app-parchment/90 p-5 shadow-landing sm:p-6">
              <h2 className="mb-4 flex flex-wrap items-center gap-2 text-sm font-bold text-stone-900">
                Archiv - Absagen und erledigt
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-stone-700 shadow-sm">
                  {archiveTotal}
                </span>
                <InfoExplainerButton
                  variant="onLight"
                  modalTitle="Archiv"
                  ariaLabel="Erklärung zum Archiv"
                  className="text-stone-500 hover:bg-stone-200/80 hover:text-stone-900"
                >
                  <p>
                    Abgesagte und beendete Bewerbungen erscheinen hier automatisch, sobald du den Status in den
                    Bewerbungsdetails setzt.
                  </p>
                </InfoExplainerButton>
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {ARCHIVE.map(status => {
                  const list = (grouped.get(status) ?? []).sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                  )
                  return (
                    <div
                      key={status}
                      className="flex max-h-[min(52vh,22rem)] min-h-[10rem] flex-col rounded-xl border border-stone-400/40 bg-app-parchmentDeep/80 p-2.5 shadow-sm"
                    >
                      <div className="mb-1.5 flex shrink-0 items-center justify-between gap-2 border-b border-stone-400/35 pb-1.5">
                        <h3 className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                          {STATUS_LABEL[status]}
                        </h3>
                        <span className="rounded-full bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-stone-900">
                          {list.length}
                        </span>
                      </div>
                      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
                        {list.length === 0 ? (
                          <p className="flex min-h-[6rem] items-center justify-center rounded-lg border border-dashed border-stone-400/45 bg-white/60 px-2 py-4 text-center text-[11px] font-medium text-stone-600">
                            Keine Einträge
                          </p>
                        ) : (
                          <div className="flex flex-col gap-1 pr-0.5">
                            {list.map(app => (
                              <div
                                key={app.id}
                                className={[
                                  'relative rounded-md border border-stone-400/35 bg-white/95 shadow-sm transition',
                                  'border-l-[3px] hover:border-stone-400/55 hover:shadow-md',
                                  COLUMN_ACCENT[status],
                                ].join(' ')}
                              >
                                <Link
                                  to={`/applications/${app.id}`}
                                  className="group flex min-w-0 flex-col gap-0.5 py-1 pl-1.5 pr-7"
                                >
                                  <div className="flex items-start gap-1">
                                    <Briefcase size={11} className="mt-0.5 shrink-0 text-primary/90" aria-hidden />
                                    <span className="line-clamp-1 text-[11px] font-semibold leading-tight text-stone-900 group-hover:text-primary">
                                      {app.jobTitle || 'Ohne Titel'}
                                    </span>
                                    <ChevronRight
                                      size={12}
                                      className="ml-auto shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-primary"
                                      aria-hidden
                                    />
                                  </div>
                                  <div className="flex min-w-0 items-center gap-0.5 pl-[1.125rem] text-[10px] text-stone-600">
                                    <Building2 size={9} className="shrink-0 opacity-70" aria-hidden />
                                    <span className="truncate">{app.company || '-'}</span>
                                  </div>
                                  <p className="pl-[1.125rem] text-[9px] font-medium uppercase tracking-wide text-stone-500">
                                    {formatRelative(app.updatedAt)}
                                  </p>
                                </Link>
                                <button
                                  type="button"
                                  className="absolute right-0.5 top-0.5 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-amber-600/40 bg-amber-50 text-xs font-extrabold text-amber-900 shadow-sm hover:bg-amber-100"
                                  aria-label={`Infos und Fortschritt: ${app.jobTitle || 'Bewerbung'}`}
                                  onClick={e => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setInfoApp(app)
                                  }}
                                >
                                  !
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {infoApp ? (
              <ApplicationInfoModal
                app={infoApp}
                cvSummaries={cvSummaries}
                onClose={() => setInfoApp(null)}
              />
            ) : null}

            {apps.length === 0 && !loading && (
              <div className="relative mx-auto max-w-md rounded-2xl border border-dashed border-stone-500/35 bg-app-parchment/50 px-6 py-14 text-center text-stone-900">
                <div className="absolute right-3 top-3">
                  <InfoExplainerButton
                    variant="onLight"
                    modalTitle="Erste Bewerbung"
                    ariaLabel="Erklärung zum Anlegen der ersten Bewerbung"
                  >
                    <p>
                      Lege deine erste Stelle mit Titel und Firma an - optional mit Link zur Anzeige und Stellentext.
                      Alles bleibt mit deinem Konto synchron.
                    </p>
                  </InfoExplainerButton>
                </div>
                <Briefcase className="mx-auto text-stone-500" size={40} strokeWidth={1.5} />
                <p className="mt-4 text-sm font-semibold text-stone-900">Noch keine Bewerbungen</p>
                <p className="mt-2 text-sm text-stone-600">Starte mit „Erste Bewerbung anlegen“.</p>
                <Link
                  to="/applications/new"
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-amber-700"
                >
                  <Plus size={18} />
                  Erste Bewerbung anlegen
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
