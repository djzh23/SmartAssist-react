import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowRight,
  Flame,
  FileText,
  FolderOpen,
  Loader2,
  NotebookPen,
  Radar,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react'
import { fetchJobApplications, listCvStudioResumes } from '../api/client'
import type { JobApplicationApi } from '../api/client'
import PageHeader from '../components/layout/PageHeader'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import ApplicationPipelinePanel from '../components/overview/ApplicationPipelinePanel'
import { useChatNotes } from '../hooks/useChatNotes'
import { useUserPlan } from '../hooks/useUserPlan'
import { buildApplicationOverview } from '../utils/applicationOverview'

function formatTrend(value: number): string {
  if (value > 0) return `+${value}%`
  return `${value}%`
}

export default function OverviewPage() {
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

  const overview = buildApplicationOverview(apps)
  const notesCount = notesSignedIn ? notes.length : null

  const weekHistory = user.weekHistory
  const yesterdayCount = weekHistory[weekHistory.length - 2]?.count ?? 0
  const todayCount = weekHistory[weekHistory.length - 1]?.count ?? 0
  const trendTodayVsYesterday = yesterdayCount === 0
    ? (todayCount > 0 ? 100 : 0)
    : Math.round(((todayCount - yesterdayCount) / yesterdayCount) * 100)

  const interviewAndOfferCount
    = (overview.pipeline.find(p => p.status === 'interview')?.count ?? 0)
    + (overview.pipeline.find(p => p.status === 'assessment')?.count ?? 0)
    + (overview.pipeline.find(p => p.status === 'offer')?.count ?? 0)

  const activitySignals = [
    {
      icon: Target,
      label: 'Nächster Fokus',
      value: interviewAndOfferCount > 0
        ? `${interviewAndOfferCount} Interview-Schritte offen`
        : `${overview.activeInPipeline} aktive Bewerbungen`,
    },
    {
      icon: Flame,
      label: 'Heute',
      value: `${todayCount} Antworten im Chat`,
    },
    {
      icon: TrendingUp,
      label: 'Trend',
      value: formatTrend(Math.max(-40, Math.min(40, trendTodayVsYesterday))),
    },
    {
      icon: ShieldCheck,
      label: 'Archiv',
      value: `${overview.inArchive} dokumentiert`,
    },
  ] as const

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
  const focusItems = [
    `${overview.activeInPipeline} aktive Bewerbungen priorisieren`,
    `${interviewAndOfferCount} in später Pipelinephase`,
    `${overview.inArchive} im Archiv`,
  ] as const

  return (
    <div id="app-uebersicht-start" className="relative min-h-0 flex-1 overflow-y-auto bg-transparent xl:overflow-y-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -right-32 top-0 h-96 w-96 rounded-full bg-amber-500/16 blur-3xl" />
        <div className="absolute left-[18%] top-[22%] h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-[28rem] w-[28rem] rounded-full bg-teal-500/8 blur-3xl" />
      </div>

      <StandardPageContainer className="relative z-10 h-full py-4 sm:py-5 [@media(min-height:1080px)]:py-6">
        <PageHeader
          pageKey="overview"
          title="Übersicht"
          subtitle="Alle Kernzahlen und nächste Aktionen in einer kompakten Ansicht."
          className="mb-6"
          actions={(
            <Link
              to="/applications"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-primary-hover"
            >
              Zur Pipeline
              <ArrowRight size={12} />
            </Link>
          )}
        />

        {error && (
          <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100" role="alert">
            {error}
          </div>
        )}

        {/* One-view desktop layout */}
        <section className="grid gap-3 xl:grid-cols-[minmax(0,2.55fr)_minmax(340px,1fr)] xl:items-stretch [@media(min-height:1080px)]:gap-4">
          <div className="h-full xl:min-h-0">
            {!loading ? <ApplicationPipelinePanel overview={overview} /> : null}
          </div>

          <div className="flex flex-col gap-3 xl:min-h-0 xl:h-full [@media(min-height:1080px)]:gap-4">
            <div className="rounded-2xl bg-[#1b120d]/78 p-3 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)] [@media(min-height:1080px)]:p-3.5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100/60">Key Metrics</h2>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/70">
                  Live
                </span>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 py-6 text-amber-100/75">
                  <Loader2 className="animate-spin" size={18} aria-hidden />
                  Lädt…
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  {metrics.map(row => {
                    const Icon = row.icon
                    return (
                      <div key={row.label} className="rounded-xl bg-[#231811]/45 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                        <div className="mb-1 flex items-center justify-between gap-1">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/60">
                            <Icon className="h-3 w-3 text-amber-300" aria-hidden />
                            {row.label}
                          </span>
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${row.trendUp ? 'text-emerald-300' : 'text-rose-300'}`}>
                            <TrendingUp size={10} aria-hidden className={row.trendUp ? '' : 'rotate-180'} />
                            {row.trend}
                          </span>
                        </div>
                        <p className="text-xl font-bold leading-none tabular-nums text-amber-50">{row.value}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-[#1b120d]/78 p-3 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)] [@media(min-height:1080px)]:p-3.5">
              <h3 className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100/60">
                <Flame size={14} className="text-amber-300" />
                Fokus heute
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm text-amber-100/80">
                {focusItems.map(item => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300/80" aria-hidden />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 pt-3 [@media(min-height:1080px)]:mt-4 [@media(min-height:1080px)]:pt-4">
                <h4 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-100/60">Aktivität</h4>
                <div className="space-y-2">
                  {activitySignals.map(item => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-xl bg-[#231811]/45 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/12 text-amber-200">
                          <Icon size={14} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-100/55">{item.label}</p>
                          <p className="truncate text-sm font-medium text-amber-100/85">{item.value}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </StandardPageContainer>
    </div>
  )
}
