import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  NotebookPen,
  Sparkles,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fetchJobApplications, listCvStudioResumes } from '../api/client'
import type { JobApplicationApi } from '../api/client'
import ApplicationPipelinePanel from '../components/overview/ApplicationPipelinePanel'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import { useChatNotes } from '../hooks/useChatNotes'
import { useUserPlan } from '../hooks/useUserPlan'
import { applicationOverviewHint, buildApplicationOverview } from '../utils/applicationOverview'

const WORKSPACE_LINKS: { to: string; label: string; hint: string; icon: LucideIcon }[] = [
  { to: '/chat', label: 'Chat', hint: 'Sessions, Tools und Kontext', icon: MessageCircle },
  { to: '/career-profile', label: 'Karriereprofil', hint: 'Profildaten für KI & Bewerbungen', icon: ClipboardList },
  { to: '/applications', label: 'Bewerbungen', hint: 'Pipeline und Details', icon: FolderOpen },
  { to: '/cv-studio', label: 'CV.Studio', hint: 'Lebensläufe und PDFs', icon: FileText },
  { to: '/guides', label: 'Ratgeber', hint: 'Anleitungen und Abläufe', icon: BookOpen },
  { to: '/notes', label: 'Notizen', hint: 'Gespeicherte Antworten', icon: NotebookPen },
]

const ANCHORS = [
  ['ueberblick-start', 'Übersicht'],
  ['ueberblick-zahlen', 'Zahlen'],
  ['ueberblick-bewerbungen', 'Bewerbungen'],
  ['ueberblick-chat', 'Chat-Aktivität'],
  ['ueberblick-app', 'Features'],
] as const

export default function OverviewPage() {
  const location = useLocation()
  const { getToken } = useAuth()
  const user = useUserPlan()
  const { notes, isSignedIn: notesSignedIn } = useChatNotes()
  const [apps, setApps] = useState<JobApplicationApi[]>([])
  const [cvCount, setCvCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        setApps([])
        setCvCount(0)
        return
      }
      const [list, cvs] = await Promise.all([
        fetchJobApplications(token).catch(() => [] as JobApplicationApi[]),
        listCvStudioResumes(token).catch(() => []),
      ])
      setApps(list)
      setCvCount(cvs.length)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
      setApps([])
      setCvCount(null)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    requestAnimationFrame(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [location.hash, location.pathname])

  const overview = buildApplicationOverview(apps)
  const hint = applicationOverviewHint(overview)
  const notesCount = notesSignedIn ? notes.length : null

  const weekHistory = user.weekHistory
  const maxCount = Math.max(...weekHistory.map(d => d.count), 1)
  const todayDate = new Date().toISOString().split('T')[0]

  return (
    <div id="app-uebersicht-start" className="relative min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-amber-600/12 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header
          id="ueberblick-start"
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
                <LayoutDashboard className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">Übersicht</p>
                <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                  Deine App auf einen Blick
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  Kennzahlen zu Bewerbungen und Lebensläufen, Flussdiagramm der Bewerbungs-Status, Chat-Aktivität der
                  letzten Woche und Schnellzugriffe — Konto, Plan und Profil erreichst du im Benutzermenü unter{' '}
                  <span className="font-semibold text-stone-800">Konto & Plan → Profil</span>.
                </p>
              </div>
            </div>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Übersicht vs. Profil"
              ariaLabel="Unterschied Übersicht und Profil"
              className="shrink-0 text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
            >
              <p>
                <strong>Übersicht</strong>
                {' '}
                bündelt Arbeitsdaten: Bewerbungen, CVs, Kurzstatistik und Wege in die Hauptbereiche.
              </p>
              <p className="mt-3">
                <strong>Profil</strong>
                {' '}
                (Avatar-Menü → Konto & Plan → Profil) enthält Anmeldung, Tarif, tägliches KI-Limit und
                Abo-Verwaltung — alles rund ums Konto, nicht einzelne Bewerbungen.
              </p>
            </InfoExplainerButton>
          </div>
          <nav className="mt-5 border-t border-stone-400/35 pt-4" aria-label="Abschnitte">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Springe zu</p>
            <div className="flex flex-wrap gap-2">
              {ANCHORS.map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="inline-flex items-center rounded-full border border-stone-400/45 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-primary/45 hover:bg-primary-light/50"
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </header>

        {error && (
          <div className="rounded-xl border border-rose-200/90 bg-rose-50 px-4 py-3 text-sm text-rose-900" role="alert">
            {error}
          </div>
        )}

        {/* Zahlen */}
        <section
          id="ueberblick-zahlen"
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Zahlen</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Zahlenquellen"
              ariaLabel="Woher die Zahlen kommen"
              className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
            >
              <p>Bewerbungen und Lebensläufe kommen vom Server. Notizen aus dem synchronisierten Chat-Speicher.</p>
              <p className="mt-3">Die KI-Nutzung (heute / Gesamt) stammt wie im Profil aus dem lokalen Zähler.</p>
            </InfoExplainerButton>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-stone-600">
              <Loader2 className="animate-spin" size={20} aria-hidden />
              Lädt…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Bewerbungen', value: overview.total, sub: 'alle Status', icon: FolderOpen },
                { label: 'In Pipeline', value: overview.activeInPipeline, sub: 'aktiv', icon: Sparkles },
                { label: 'Lebensläufe', value: cvCount ?? '—', sub: 'CV.Studio', icon: FileText },
                { label: 'Notizen', value: notesCount ?? '—', sub: 'Chat', icon: NotebookPen },
              ].map(row => {
                const Icon = row.icon
                return (
                  <div
                    key={row.label}
                    className="rounded-xl border border-stone-400/35 bg-white/95 px-3 py-3 shadow-sm sm:px-4"
                  >
                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                      <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
                      {row.label}
                    </div>
                    <p className="text-xl font-bold tabular-nums text-stone-900 sm:text-2xl">{row.value}</p>
                    <p className="mt-0.5 text-[11px] text-stone-600">{row.sub}</p>
                  </div>
                )
              })}
            </div>
          )}
          {!loading && user.isLoaded ? (
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-stone-200 pt-4 sm:grid-cols-3">
              <div className="rounded-lg border border-stone-400/30 bg-white/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-stone-500">KI heute</p>
                <p className="text-lg font-bold tabular-nums text-stone-900">
                  {user.usageToday}
                  {' / '}
                  {user.dailyLimit === Infinity ? '∞' : user.dailyLimit}
                </p>
              </div>
              <div className="rounded-lg border border-stone-400/30 bg-white/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase text-stone-500">Antworten gesamt</p>
                <p className="text-lg font-bold tabular-nums text-stone-900">{user.totalResponses}</p>
              </div>
              <div className="hidden rounded-lg border border-stone-400/30 bg-white/80 px-3 py-2 sm:block">
                <p className="text-[10px] font-bold uppercase text-stone-500">Lieblingstool</p>
                <p className="truncate text-sm font-semibold text-stone-900">{user.favoriteTool ?? '—'}</p>
              </div>
            </div>
          ) : null}
        </section>

        {/* Bewerbungsbaum / Graph */}
        <section
          id="ueberblick-bewerbungen"
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Bewerbungen — Stand</h2>
            <Link
              to="/applications"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Zur Pipeline
              <ArrowRight className="h-3 w-3" aria-hidden />
            </Link>
          </div>
          {!loading ? <ApplicationPipelinePanel overview={overview} hint={hint} /> : null}
        </section>

        {/* Chat 7 Tage */}
        <section
          id="ueberblick-chat"
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Chat — letzte 7 Tage</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Chat-Aktivität"
              ariaLabel="Erklärung zum Chat-Verlauf"
              className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
            >
              <p>Zähler pro Kalendertag auf diesem Gerät — gleiche Logik wie im Profil, hier in der Übersicht für den Kontext neben Bewerbungen.</p>
            </InfoExplainerButton>
          </div>
          <div className="rounded-xl border border-stone-400/35 bg-white/95 p-4 shadow-card sm:p-5">
            {weekHistory.every(d => d.count === 0) ? (
              <p className="py-4 text-center text-sm text-stone-600">Noch keine Chat-Antworten in den letzten 7 Tagen.</p>
            ) : (
              <div className="flex h-28 items-end gap-2">
                {weekHistory.map(day => {
                  const heightPct = Math.max(4, (day.count / maxCount) * 100)
                  const isToday = day.date === todayDate
                  return (
                    <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                      <span className="min-h-[12px] text-[10px] font-bold tabular-nums text-stone-600">
                        {day.count > 0 ? day.count : ''}
                      </span>
                      <div className="flex h-[72px] w-full flex-col justify-end overflow-hidden rounded-t-lg bg-stone-200/90">
                        <div
                          className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-stone-500/85'}`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-semibold ${isToday ? 'text-primary' : 'text-stone-500'}`}>
                        {day.day}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        {/* Features */}
        <section
          id="ueberblick-app"
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Schnellzugriff</h2>
          <ul className="grid gap-2.5 sm:grid-cols-2">
            {WORKSPACE_LINKS.map(({ to, label, hint, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group flex min-h-[4.25rem] items-center gap-3 rounded-xl border border-stone-400/40 bg-white/95 px-4 py-3 shadow-card transition hover:border-primary/40 hover:shadow-landing-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon size={18} strokeWidth={2.1} aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-stone-900 group-hover:text-primary">{label}</span>
                    <span className="mt-0.5 block text-xs text-stone-600">{hint}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
