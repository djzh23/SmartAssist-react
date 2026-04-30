import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  Flame,
  FileText,
  FolderOpen,
  GraduationCap,
  Lightbulb,
  LayoutDashboard,
  Loader2,
  MessageCircle,
  NotebookPen,
  Radar,
  Target,
  TrendingUp,
  Wrench,
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
  { to: '/tools', label: 'Tools', hint: 'Stellenanalyse, Interview, Code', icon: Wrench },
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

function formatTrend(value: number): string {
  if (value > 0) return `+${value}%`
  return `${value}%`
}

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
  const yesterdayCount = weekHistory[weekHistory.length - 2]?.count ?? 0
  const todayCount = weekHistory[weekHistory.length - 1]?.count ?? 0
  const trendTodayVsYesterday = yesterdayCount === 0
    ? (todayCount > 0 ? 100 : 0)
    : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)

  const interviewAndOfferCount
    = (overview.pipeline.find(p => p.status === 'interview')?.count ?? 0)
    + (overview.pipeline.find(p => p.status === 'assessment')?.count ?? 0)
    + (overview.pipeline.find(p => p.status === 'offer')?.count ?? 0)

  const nextStepLabel = interviewAndOfferCount > 0
    ? 'Fokus auf Interviewphasen und konkrete Nachbereitung'
    : (overview.activeInPipeline > 0
      ? 'Nächste Entwürfe in echte Bewerbungen überführen'
      : 'Pipeline mit ersten Bewerbungen aufbauen')

  const heroCtaTo = interviewAndOfferCount > 0 ? '/applications' : '/applications/new'
  const heroCtaLabel = interviewAndOfferCount > 0 ? 'Weiterarbeiten' : 'Bewerbung starten'

  const metrics = [
    {
      label: 'Bewerbungen',
      value: overview.total,
      sub: 'alle Status',
      icon: FolderOpen,
      trend: overview.total > 0 ? formatTrend(Math.min(32, Math.round((overview.activeInPipeline / Math.max(overview.total, 1)) * 100 - 20))) : '0%',
      trendUp: true,
    },
    {
      label: 'Pipeline',
      value: overview.activeInPipeline,
      sub: 'aktiv',
      icon: Radar,
      trend: formatTrend(Math.max(-40, Math.min(40, trendTodayVsYesterday))),
      trendUp: trendTodayVsYesterday >= 0,
    },
    {
      label: 'Lebensläufe',
      value: cvCount ?? '-',
      sub: 'in CV.Studio',
      icon: FileText,
      trend: formatTrend((cvCount ?? 0) > 0 ? 8 : 0),
      trendUp: (cvCount ?? 0) > 0,
    },
    {
      label: 'Notizen',
      value: notesCount ?? '-',
      sub: 'gespeichert',
      icon: NotebookPen,
      trend: formatTrend((notesCount ?? 0) > 0 ? 14 : 0),
      trendUp: (notesCount ?? 0) > 0,
    },
  ] as const

  return (
    <div id="app-uebersicht-start" className="relative min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-amber-500/16 blur-3xl" />
        <div className="absolute left-[18%] top-[22%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-teal-500/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <header
          id="ueberblick-start"
          className="scroll-mt-24 overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-r from-[#21140b]/95 via-[#29190d]/95 to-[#1f140c]/95 p-6 shadow-landing-lg sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 flex-1 gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-300/25 bg-amber-500/14 text-amber-200 shadow-[0_0_24px_-8px_rgba(217,119,6,0.65)]">
                <LayoutDashboard className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/75">Dein nächster Schritt</p>
                <h1 className="mt-1 text-3xl font-bold tracking-tight text-amber-50 sm:text-[2.15rem]">
                  Dein nächster sinnvoller Schritt
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-amber-100/80">
                  {nextStepLabel}, alle Kernzahlen und dein Pipeline-Fluss sind hier als Control Center gebündelt.
                </p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-xs font-medium text-amber-100/85">
                  <Lightbulb size={13} className="text-amber-200" />
                  KI Insight: {hint}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={heroCtaTo}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-700/20 transition hover:bg-primary-hover"
                >
                  <Target size={16} aria-hidden />
                  {heroCtaLabel}
                </Link>
                <Link
                  to="/applications"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200/25 bg-white/5 px-4 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-white/10"
                >
                  Zur Pipeline
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
              </div>
              <InfoExplainerButton
                variant="onDark"
                modalTitle="Übersicht vs. Profil"
                ariaLabel="Unterschied Übersicht und Profil"
                className="shrink-0 border-amber-200/20 text-amber-100/85 hover:bg-white/12"
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
                  Abo-Verwaltung, alles rund ums Konto, nicht einzelne Bewerbungen.
                </p>
              </InfoExplainerButton>
            </div>
          </div>
          <nav className="mt-6 flex flex-wrap gap-2" aria-label="Abschnitte">
            {ANCHORS.map(([id, label]) => (
              <a
                key={id}
                href={`#${id}`}
                className="inline-flex items-center rounded-full border border-amber-200/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-amber-100/80 transition hover:border-amber-200/35 hover:bg-white/10"
              >
                {label}
              </a>
            ))}
          </nav>
        </header>

        {error && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
            {error}
          </div>
        )}

        {/* Metrics */}
        <section
          id="ueberblick-zahlen"
          className="scroll-mt-24 rounded-3xl border border-amber-200/10 bg-[#1b120d]/85 p-5 shadow-landing-md sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2 sm:mb-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">Key Metrics</h2>
            <InfoExplainerButton
              variant="onDark"
              modalTitle="Zahlenquellen"
              ariaLabel="Woher die Zahlen kommen"
              className="border-amber-200/20 text-amber-100/75 hover:bg-white/12"
            >
              <p>Bewerbungen und Lebensläufe kommen vom Server. Notizen aus dem synchronisierten Chat-Speicher.</p>
              <p className="mt-3">Die KI-Nutzung (heute / Gesamt) stammt wie im Profil aus dem lokalen Zähler.</p>
            </InfoExplainerButton>
          </div>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-amber-100/75">
              <Loader2 className="animate-spin" size={20} aria-hidden />
              Lädt…
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {metrics.map(row => {
                const Icon = row.icon
                return (
                  <div
                    key={row.label}
                    className="group rounded-2xl border border-amber-200/10 bg-[#221610]/90 px-4 py-3.5 shadow-md transition duration-200 hover:border-amber-200/25 hover:shadow-xl"
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100/60">
                        <Icon className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                        {row.label}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.trendUp ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                        <TrendingUp size={10} aria-hidden className={row.trendUp ? '' : 'rotate-180'} />
                        {row.trend}
                      </span>
                    </div>
                    <p className="text-[1.7rem] font-bold leading-none tabular-nums text-amber-50">
                      {row.value}
                    </p>
                    <p className="mt-1.5 text-[11px] text-amber-100/65">{row.sub}</p>
                  </div>
                )
              })}
            </div>
          )}
          {!loading && user.isLoaded ? (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-amber-100/10 pt-4 md:grid-cols-3">
              <div className="rounded-xl border border-amber-100/10 bg-[#231812]/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/60">KI heute</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-amber-50">
                  {user.usageToday}
                  {' / '}
                  {user.dailyLimit === Infinity ? '∞' : user.dailyLimit}
                </p>
              </div>
              <div className="rounded-xl border border-amber-100/10 bg-[#231812]/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/60">Antworten gesamt</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-amber-50">{user.totalResponses}</p>
              </div>
              <div className="rounded-xl border border-amber-100/10 bg-[#231812]/80 px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/60">Lieblingstool</p>
                <p className="mt-1 truncate text-sm font-semibold text-amber-100">{user.favoriteTool ?? '-'}</p>
              </div>
            </div>
          ) : null}
        </section>

        {/* Centerpiece + right rail */}
        <section id="ueberblick-bewerbungen" className="scroll-mt-24 grid gap-4 xl:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
          <div className="rounded-3xl border border-amber-200/10 bg-[#1b120d]/85 p-5 shadow-landing-md sm:p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">Pipeline Visual</h2>
                <p className="mt-1 text-sm text-amber-100/70">
                  Sankey als zentrales Produkt-Feature, klar für Statusfortschritt und Priorisierung.
                </p>
              </div>
              <Link
                to="/applications"
                className="inline-flex items-center gap-1 rounded-lg border border-amber-200/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-amber-100 transition hover:bg-white/10"
              >
                Zur Pipeline
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
            {!loading ? <ApplicationPipelinePanel overview={overview} hint={hint} /> : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-amber-200/10 bg-[#1b120d]/85 p-5 shadow-landing-md">
              <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">
                <Flame size={14} className="text-amber-300" />
                Fokus heute
              </h3>
              <ul className="mt-3 space-y-2.5 text-sm text-amber-100/75">
                <li className="rounded-xl border border-amber-100/10 bg-[#241913]/75 px-3 py-2">
                  {overview.activeInPipeline} aktive Bewerbungen priorisiert bearbeiten.
                </li>
                <li className="rounded-xl border border-amber-100/10 bg-[#241913]/75 px-3 py-2">
                  {interviewAndOfferCount} Bewerbungen in später Pipelinephase.
                </li>
                <li className="rounded-xl border border-amber-100/10 bg-[#241913]/75 px-3 py-2">
                  {overview.inArchive} im Archiv, sauber dokumentiert.
                </li>
              </ul>
              <Link
                to="/applications"
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
              >
                Bewerbungen öffnen
                <ArrowRight size={12} />
              </Link>
            </div>

            <div className="rounded-3xl border border-amber-200/10 bg-[#1b120d]/85 p-5 shadow-landing-md">
              <h3 className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">
                <GraduationCap size={14} className="text-violet-300" />
                Nächster Lernimpuls
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-amber-100/75">
                Nutze aktuelle Interviewphasen, um direkt passende Antworten und Notizen im Karriereprofil zu verfeinern.
              </p>
              <Link
                to="/career-profile"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-violet-300/25 bg-violet-400/10 px-3 py-2 text-xs font-semibold text-violet-100 transition hover:bg-violet-400/20"
              >
                Karriereprofil öffnen
                <ArrowRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* Secondary content */}
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)]">
          <section
            id="ueberblick-chat"
            className="scroll-mt-24 rounded-3xl border border-amber-200/10 bg-[#1b120d]/85 p-5 shadow-landing-md sm:p-6"
          >
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">Aktivität, letzte 7 Tage</h2>
              <InfoExplainerButton
                variant="onDark"
                modalTitle="Chat-Aktivität"
                ariaLabel="Erklärung zum Chat-Verlauf"
                className="border-amber-200/20 text-amber-100/75 hover:bg-white/12"
              >
                <p>Zähler pro Kalendertag auf diesem Gerät, gleiche Logik wie im Profil, hier in der Übersicht für den Kontext neben Bewerbungen.</p>
              </InfoExplainerButton>
            </div>
            <div className="rounded-2xl border border-amber-200/10 bg-[#241913]/85 p-4 shadow-card sm:p-5">
              {weekHistory.every(d => d.count === 0) ? (
                <p className="py-4 text-center text-sm text-amber-100/65">Noch keine Chat-Antworten in den letzten 7 Tagen.</p>
              ) : (
                <div className="flex h-28 items-end gap-2">
                  {weekHistory.map(day => {
                    const heightPct = Math.max(4, (day.count / maxCount) * 100)
                    const isToday = day.date === todayDate
                    return (
                      <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                        <span className="min-h-[12px] text-[10px] font-bold tabular-nums text-amber-100/75">
                          {day.count > 0 ? day.count : ''}
                        </span>
                        <div className="flex h-[72px] w-full flex-col justify-end overflow-hidden rounded-t-lg bg-[#2f221b]/95">
                          <div
                            className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-stone-400/70'}`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className={`text-[10px] font-semibold ${isToday ? 'text-amber-200' : 'text-amber-100/55'}`}>
                          {day.day}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <section
            id="ueberblick-app"
            className="scroll-mt-24 rounded-3xl border border-amber-200/10 bg-[#1b120d]/85 p-5 shadow-landing-md sm:p-6"
          >
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-amber-100/60">Schnellzugriff</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {WORKSPACE_LINKS.map(({ to, label, hint, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex min-h-[4.35rem] items-center gap-3 rounded-2xl border border-amber-100/10 bg-[#241913]/75 px-4 py-3 shadow-card transition duration-200 hover:border-amber-200/25 hover:bg-[#2a1c15]/85 hover:shadow-landing-md"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/14 text-amber-200">
                      <Icon size={18} strokeWidth={2.1} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-amber-50 group-hover:text-white">{label}</span>
                      <span className="mt-0.5 block text-xs text-amber-100/65">{hint}</span>
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 text-amber-100/50 transition group-hover:translate-x-0.5 group-hover:text-amber-100" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </section>
      </div>
    </div>
  )
}
