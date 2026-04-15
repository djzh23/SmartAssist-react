import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Briefcase, Loader2, Plus } from 'lucide-react'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  fetchJobApplications,
} from '../api/client'

const STATUS_ORDER: ApplicationStatusApi[] = [
  'draft',
  'applied',
  'phoneScreen',
  'interview',
  'assessment',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]

const STATUS_LABEL: Record<ApplicationStatusApi, string> = {
  draft: 'Entwurf',
  applied: 'Beworben',
  phoneScreen: 'Erstgespräch',
  interview: 'Interview',
  assessment: 'Assessment',
  offer: 'Angebot',
  accepted: 'Angenommen',
  rejected: 'Absage',
  withdrawn: 'Zurückgezogen',
}

function statusBadgeClass(s: ApplicationStatusApi): string {
  switch (s) {
    case 'interview':
    case 'phoneScreen':
      return 'bg-violet-100 text-violet-800'
    case 'applied':
      return 'bg-blue-100 text-blue-800'
    case 'offer':
    case 'accepted':
      return 'bg-emerald-100 text-emerald-800'
    case 'rejected':
    case 'withdrawn':
      return 'bg-slate-200 text-slate-700'
    default:
      return 'bg-amber-50 text-amber-900'
  }
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return 'Heute'
  if (days === 1) return 'Vor 1 Tag'
  if (days < 14) return `Vor ${days} Tagen`
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
}

export default function ApplicationsPage() {
  const { getToken } = useAuth()
  const [apps, setApps] = useState<JobApplicationApi[]>([])
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
        return
      }
      const list = await fetchJobApplications(token)
      setApps(list)
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
    for (const s of STATUS_ORDER)
      m.set(s, [])
    for (const a of apps) {
      const list = m.get(a.status) ?? []
      list.push(a)
      m.set(a.status, list)
    }
    return m
  }, [apps])

  const activeCount = useMemo(
    () => apps.filter(a => !['rejected', 'withdrawn', 'accepted'].includes(a.status)).length,
    [apps],
  )

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meine Bewerbungen</h1>
            <p className="mt-1 text-sm text-slate-600">
              {activeCount} aktive Bewerbungen · Karten nach Status gruppiert
            </p>
          </div>
          <Link
            to="/applications/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            <Plus size={18} />
            Neue Bewerbung
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-slate-600">
            <Loader2 className="animate-spin" size={20} />
            Bewerbungen werden geladen…
          </div>
        ) : (
          <div className="space-y-10">
            {STATUS_ORDER.filter(s => s !== 'rejected' && s !== 'withdrawn' && s !== 'accepted').map(status => {
              const list = grouped.get(status) ?? []
              return (
                <section key={status}>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-slate-500">
                    {STATUS_LABEL[status]}
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 shadow-sm">
                      {list.length}
                    </span>
                  </h2>
                  {list.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
                      Noch keine Bewerbungen in dieser Phase.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {list.map(app => (
                        <Link
                          key={app.id}
                          to={`/applications/${app.id}`}
                          className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary hover:shadow-md"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <Briefcase size={18} className="mt-0.5 shrink-0 text-primary" />
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(app.status)}`}
                            >
                              {STATUS_LABEL[app.status]}
                            </span>
                          </div>
                          <h3 className="font-semibold text-slate-900 group-hover:text-primary">
                            {app.jobTitle}
                          </h3>
                          <p className="text-sm text-slate-600">{app.company}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            Zuletzt: {formatRelative(app.updatedAt)}
                          </p>
                          <span className="mt-3 inline-block text-xs font-medium text-primary">
                            Details →
                          </span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
