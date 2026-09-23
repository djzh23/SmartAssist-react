import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { AlertTriangle, ExternalLink, Inbox as InboxIcon } from 'lucide-react'
import PageHeader from '../components/layout/PageHeader'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import AppCtaButton from '../components/ui/AppCtaButton'
import {
  InboxJobStatus,
  inboxSourceLabel,
  listInboxJobs,
  type InboxJobListItem,
} from '../api/inboxClient'

type FilterKey = 'all' | 'new' | 'analyzed'

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'Alle' },
  { key: 'new', label: 'Neu' },
  { key: 'analyzed', label: 'Analysiert' },
]

/** Matches PrivatePrep/Controllers/InboxController.cs InboxJobResponse.ExtractedAt formatting expectations. */
function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return ''
  const diffMs = Date.now() - then
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 1) return 'vor wenigen Minuten'
  if (diffHours < 24) return `vor ${Math.floor(diffHours)} Stunden`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return 'gestern'
  if (diffDays < 7) return `vor ${diffDays} Tagen`
  return new Date(iso).toLocaleDateString('de-DE')
}

function statusBadge(status: InboxJobStatus): { label: string; className: string } {
  if (status === InboxJobStatus.Analyzed) {
    return { label: 'Analysiert', className: 'bg-[rgba(111,143,109,0.16)] text-[#8fae8c]' }
  }
  if (status === InboxJobStatus.Archived) {
    return { label: 'Archiviert', className: 'bg-white/[0.08] text-stone-400' }
  }
  return { label: 'Neu', className: 'bg-[rgba(217,119,87,0.18)] text-[#e89372]' }
}

function matchesFilter(job: InboxJobListItem, filter: FilterKey): boolean {
  if (filter === 'all') return true
  if (filter === 'new') return job.status === InboxJobStatus.New
  return job.status === InboxJobStatus.Analyzed
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#3a332d] bg-[#232019] p-4">
      <div className="h-4 w-2/3 rounded bg-white/10" />
      <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.06]" />
      <div className="mt-3 h-3 w-full rounded bg-white/[0.05]" />
      <div className="mt-1.5 h-3 w-4/5 rounded bg-white/[0.05]" />
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#3a332d] bg-[#232019] px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(217,119,87,0.14)] text-[#d97757]">
        <InboxIcon size={26} aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-[#f5f1eb]">Deine Inbox ist leer</h2>
      <p className="max-w-sm text-sm leading-relaxed text-[#a89e91]">
        Speichere Jobs mit einem Klick von LinkedIn und anderen Job-Portalen direkt hier.
      </p>
      <div className="group relative mt-1">
        <AppCtaButton disabled>Browser-Erweiterung installieren</AppCtaButton>
        <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-max -translate-x-1/2 rounded-lg bg-[#1a1613] px-2.5 py-1.5 text-xs text-[#f0ebe0] opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
          Bald verfügbar
        </span>
      </div>
      <p className="max-w-sm text-xs text-[#8a7f70]">
        Alternativ kannst du Jobs auch weiterhin manuell in der Analyse-Seite einfügen.
      </p>
    </div>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-900/40 bg-rose-950/20 px-6 py-12 text-center">
      <AlertTriangle size={24} className="text-rose-400" aria-hidden />
      <p className="text-sm text-rose-200">Inbox konnte nicht geladen werden.</p>
      <AppCtaButton size="sm" variant="secondary" onClick={onRetry}>
        Erneut versuchen
      </AppCtaButton>
    </div>
  )
}

export default function InboxPage() {
  const { getToken, isLoaded: authLoaded } = useAuth()
  const navigate = useNavigate()
  const [jobs, setJobs] = useState<InboxJobListItem[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [filter, setFilter] = useState<FilterKey>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      const list = await listInboxJobs(token)
      setJobs(list)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    if (!authLoaded) return
    void load()
  }, [authLoaded, load])

  const visibleJobs = (jobs ?? []).filter(job => matchesFilter(job, filter))
  const count = jobs?.length ?? 0

  return (
    <StandardPageContainer className="w-full pt-3 pb-6 sm:py-6">
      <PageHeader
        pageKey="inbox"
        subtitle={count === 1 ? '1 Job gesammelt' : `${count} Jobs gesammelt`}
        className="mb-4 sm:mb-6"
        actions={
          jobs && jobs.length > 0 ? (
            <div className="flex gap-1.5 rounded-full bg-white/[0.05] p-1">
              {FILTERS.map(f => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={[
                    'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                    filter === f.key ? 'bg-[#d97757] text-[#1a1613]' : 'text-[#a89e91] hover:text-[#f5f1eb]',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : error ? (
        <ErrorState onRetry={() => void load()} />
      ) : count === 0 ? (
        <EmptyState />
      ) : visibleJobs.length === 0 ? (
        <p className="rounded-2xl border border-[#3a332d] bg-[#232019] px-6 py-10 text-center text-sm text-[#a89e91]">
          Keine Jobs in diesem Filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleJobs.map(job => {
            const badge = statusBadge(job.status)
            const relative = formatRelativeTime(job.extractedAt)
            const metaParts = [job.location, inboxSourceLabel(job.sourceKind), relative].filter(Boolean)

            return (
              <li key={job.id}>
                <button
                  type="button"
                  onClick={() => navigate(`/inbox/${job.id}`)}
                  className="w-full rounded-2xl border border-[#3a332d] bg-[#232019] p-4 text-left transition hover:border-[#d97757]/50 hover:bg-[#28241d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#f5f1eb]">{job.title}</p>
                      <p className="mt-0.5 text-sm text-[#a89e91]">{job.company}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  {metaParts.length > 0 ? (
                    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-xs text-[#8a7f70]">
                      {metaParts.join(' · ')}
                    </p>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#c9c0b3]">
                    {job.rawTextPreview}
                    {job.rawTextPreview.length >= 200 ? '...' : ''}
                  </p>
                  {job.sourceUrl ? (
                    <span className="mt-2 inline-flex items-center gap-1 text-xs text-[#8a7f70]">
                      <ExternalLink size={12} aria-hidden />
                      Originalanzeige verlinkt
                    </span>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </StandardPageContainer>
  )
}
