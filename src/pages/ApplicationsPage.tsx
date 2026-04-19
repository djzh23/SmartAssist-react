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
} from '../api/client'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

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
      const list = await fetchJobApplications(token)
      setApps(list)
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
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-stone-50 sm:text-3xl">
                Meine Bewerbungen
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-stone-400">
                Pipeline von Entwurf bis Angebot — darunter findest du immer den Bereich{' '}
                <span className="font-semibold text-stone-300">Abgesagt, Zurückgezogen und Angenommen</span>
                {' '}
                im Archiv. Jede Karte öffnet die Detailansicht.
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
                    — fehlt u. a.: {getProfileCompletenessGapHint(careerProfile)}
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
            {/* Horizontal Kanban — scroll on small screens */}
            <section aria-label="Bewerbungspipeline" className="mb-10">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-stone-600">
                Pipeline
              </h2>
              <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 pt-1 [-ms-overflow-style:none] [scrollbar-width:thin] sm:grid sm:snap-none sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3 xl:grid-cols-6">
                {PIPELINE.map(status => {
                  const list = (grouped.get(status) ?? []).sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                  )
                  return (
                    <div
                      key={status}
                      className="flex w-[min(100%,18rem)] shrink-0 snap-start flex-col rounded-2xl border border-stone-400/45 bg-app-parchment/95 shadow-card backdrop-blur-sm sm:min-h-[min(22rem,50vh)] sm:w-auto"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-stone-400/35 px-3 py-3 sm:px-4">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                          {STATUS_LABEL[status]}
                        </h3>
                        <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-xs font-bold tabular-nums text-stone-900">
                          {list.length}
                        </span>
                      </div>
                      <div className="flex min-h-[7rem] flex-1 flex-col gap-2 p-2 sm:p-3">
                        {list.length === 0 ? (
                          <p className="rounded-lg border border-dashed border-stone-400/45 bg-app-parchmentDeep/80 px-2 py-6 text-center text-xs leading-relaxed text-stone-700">
                            Leer — neue Bewerbung anlegen oder hierher ziehen (manuell per Status in den Details).
                          </p>
                        ) : (
                          list.map(app => (
                            <Link
                              key={app.id}
                              to={`/applications/${app.id}`}
                              className={[
                                'group flex flex-col rounded-xl border border-stone-400/35 bg-white/95 p-3 text-left shadow-sm transition',
                                'border-l-4 hover:border-stone-400/55 hover:shadow-md',
                                COLUMN_ACCENT[status],
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <Briefcase size={16} className="mt-0.5 shrink-0 text-primary/90" aria-hidden />
                                <ChevronRight
                                  size={16}
                                  className="shrink-0 text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-primary"
                                  aria-hidden
                                />
                              </div>
                              <p className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-stone-900 group-hover:text-primary">
                                {app.jobTitle || 'Ohne Titel'}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-700">
                                <Building2 size={12} className="shrink-0 opacity-70" aria-hidden />
                                <span className="truncate">{app.company || '—'}</span>
                              </p>
                              <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                {formatRelative(app.updatedAt)}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {/* Archiv: Absagen & erledigt — immer sichtbar (nicht nur bei Einträgen) */}
            <section aria-label="Archiv: abgeschlossene Bewerbungen" className="rounded-2xl border border-stone-400/40 bg-app-parchment/90 p-5 shadow-landing sm:p-6">
              <h2 className="mb-1 flex flex-wrap items-center gap-2 text-sm font-bold text-stone-900">
                Archiv — Absagen und erledigt
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold tabular-nums text-stone-700 shadow-sm">
                  {archiveTotal}
                </span>
              </h2>
              <p className="mb-5 text-xs leading-relaxed text-stone-600">
                Abgesagte und beendete Bewerbungen erscheinen hier automatisch, sobald du den Status in den Details setzt.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {ARCHIVE.map(status => {
                  const list = (grouped.get(status) ?? []).sort(
                    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                  )
                  return (
                    <div
                      key={status}
                      className="flex min-h-[10rem] flex-col rounded-xl border border-stone-400/40 bg-app-parchmentDeep/80 p-3 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2 border-b border-stone-400/35 pb-2">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-stone-600">
                          {STATUS_LABEL[status]}
                        </h3>
                        <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-xs font-bold tabular-nums text-stone-900">
                          {list.length}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-2">
                        {list.length === 0 ? (
                          <p className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-stone-400/45 bg-white/60 px-2 py-6 text-center text-xs leading-relaxed text-stone-700">
                            {status === 'rejected'
                              ? 'Noch keine abgesagte Bewerbung — Status „Abgesagt“ in den Details wählen.'
                              : status === 'withdrawn'
                                ? 'Noch keine zurückgezogene Bewerbung.'
                                : 'Noch keine Zusage — Status „Angenommen“ setzen, sobald du unterschrieben hast.'}
                          </p>
                        ) : (
                          list.map(app => (
                            <Link
                              key={app.id}
                              to={`/applications/${app.id}`}
                              className={[
                                'group flex flex-col rounded-lg border border-stone-400/35 bg-white/95 p-2.5 text-left shadow-sm transition',
                                'border-l-4 hover:border-stone-400/55 hover:shadow-md',
                                COLUMN_ACCENT[status],
                              ].join(' ')}
                            >
                              <div className="flex items-start justify-between gap-1">
                                <p className="line-clamp-2 min-w-0 text-sm font-semibold text-stone-900 group-hover:text-primary">
                                  {app.jobTitle || 'Ohne Titel'}
                                </p>
                                <ChevronRight
                                  size={14}
                                  className="shrink-0 text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-primary"
                                  aria-hidden
                                />
                              </div>
                              <p className="mt-0.5 truncate text-xs text-stone-700">{app.company || '—'}</p>
                              <p className="mt-1.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                {formatRelative(app.updatedAt)}
                              </p>
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            {apps.length === 0 && !loading && (
              <div className="mx-auto max-w-md rounded-2xl border border-dashed border-stone-500/35 bg-app-parchment/50 px-6 py-14 text-center text-stone-900">
                <Briefcase className="mx-auto text-stone-500" size={40} strokeWidth={1.5} />
                <p className="mt-4 text-sm font-semibold text-stone-900">Noch keine Bewerbungen</p>
                <p className="mt-2 text-sm text-stone-700">
                  Lege deine erste Stelle an — Titel, Firma und optional Stellentext. Alles bleibt mit deinem Konto synchron.
                </p>
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
