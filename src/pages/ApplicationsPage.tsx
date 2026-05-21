import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Briefcase, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  fetchJobApplications,
  listCvStudioResumes,
  updateJobApplicationStatus,
} from '../api/client'
import ApplicationInfoModal from '../components/applications/ApplicationInfoModal'
import ApplicationListToolbar from '../components/applications/ApplicationListToolbar'
import ApplicationStatusCards from '../components/applications/ApplicationStatusCards'
import ApplicationTable from '../components/applications/ApplicationTable'
import { ARCHIVE_STATUSES, TERMINAL_STATUSES } from '../components/applications/pipelineConfig'
import type { CvStudioResumeSummary } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { appCtaButtonClasses } from '../components/ui/AppCtaButton'
import {
  APPLICATIONS_PAGE_SIZE,
  filterArchiveApplications,
  filterPipelineApplications,
  paginateItems,
  sortApplications,
  type ApplicationSort,
} from '../utils/applicationListUtils'

function isActiveStatus(s: ApplicationStatusApi): boolean {
  return !TERMINAL_STATUSES.includes(s)
}

export default function ApplicationsPage() {
  const { getToken } = useAuth()
  const [apps, setApps] = useState<JobApplicationApi[]>([])
  const [cvSummaries, setCvSummaries] = useState<CvStudioResumeSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [infoApp, setInfoApp] = useState<JobApplicationApi | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApplicationStatusApi | null>(null)
  const [sort, setSort] = useState<ApplicationSort>('updatedDesc')
  const [filterOpen, setFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [archivePage, setArchivePage] = useState(1)

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, sort])

  useEffect(() => {
    setArchivePage(1)
  }, [search, archiveOpen])

  const activeCount = useMemo(
    () => apps.filter(a => isActiveStatus(a.status)).length,
    [apps],
  )

  const archiveTotal = useMemo(
    () => apps.filter(a => ARCHIVE_STATUSES.includes(a.status)).length,
    [apps],
  )

  const filteredPipeline = useMemo(
    () => sortApplications(
      filterPipelineApplications(apps, { search, statusFilter }),
      sort,
    ),
    [apps, search, statusFilter, sort],
  )

  const paginatedPipeline = useMemo(
    () => paginateItems(filteredPipeline, page, APPLICATIONS_PAGE_SIZE),
    [filteredPipeline, page],
  )

  const filteredArchive = useMemo(
    () => sortApplications(filterArchiveApplications(apps, search), sort),
    [apps, search, sort],
  )

  const paginatedArchive = useMemo(
    () => paginateItems(filteredArchive, archivePage, APPLICATIONS_PAGE_SIZE),
    [filteredArchive, archivePage],
  )

  async function moveApplicationToStatus(appId: string, targetStatus: ApplicationStatusApi) {
    const current = apps.find(a => a.id === appId)
    if (!current || current.status === targetStatus) return

    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return
    }

    const previousApps = apps
    const nowIso = new Date().toISOString()
    setApps(prev => prev.map(a => (
      a.id === appId
        ? { ...a, status: targetStatus, statusUpdatedAt: nowIso, updatedAt: nowIso }
        : a
    )))

    try {
      await updateJobApplicationStatus(token, appId, { status: targetStatus })
    } catch (e) {
      setApps(previousApps)
      setError(e instanceof Error ? e.message : 'Status konnte nicht gespeichert werden.')
    }
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
      <div className="mx-auto w-full max-w-[1580px] px-3 pt-2 pb-8 sm:px-6 sm:py-7">
        <PageHeader
          pageKey="applications"
          subtitle={`${activeCount} aktiv · ${apps.length} gesamt · ${archiveTotal} Archiv`}
          className="mb-4 sm:mb-5"
          hideTitleOnMobile
          actions={(
            <Link
              to="/applications/new"
              className={appCtaButtonClasses({ size: 'sm', className: 'shadow-md' })}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span className="hidden sm:inline">Neue </span>Bewerbung
            </Link>
          )}
        />

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        )}

        {loading && apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-400">
            <Loader2 className="animate-spin" size={28} />
            <p className="text-sm font-medium">Bewerbungen werden geladen…</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="mx-auto mt-5 max-w-md rounded-2xl border border-white/10 bg-app-muted/80 px-6 py-12 text-center">
            <Briefcase className="mx-auto text-stone-500" size={36} strokeWidth={1.5} />
            <p className="mt-4 text-sm font-semibold text-stone-100">Noch keine Bewerbungen</p>
            <p className="mt-1 text-sm text-stone-400">Lege deine erste Bewerbung an und behalte den Überblick.</p>
            <Link
              to="/applications/new"
              className={appCtaButtonClasses({ size: 'md', className: 'mt-5' })}
            >
              <Plus size={18} />
              Neue Bewerbung
            </Link>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            <ApplicationStatusCards
              apps={apps}
              activeStatus={statusFilter}
              onSelectStatus={setStatusFilter}
            />

            <ApplicationListToolbar
              search={search}
              onSearchChange={setSearch}
              sort={sort}
              onSortChange={setSort}
              filterOpen={filterOpen}
              onFilterOpenChange={setFilterOpen}
            />

            <ApplicationTable
              apps={paginatedPipeline.items}
              rangeStart={paginatedPipeline.rangeStart}
              rangeEnd={paginatedPipeline.rangeEnd}
              total={paginatedPipeline.total}
              page={paginatedPipeline.page}
              pageCount={paginatedPipeline.pageCount}
              onPageChange={setPage}
              onOpenInfo={setInfoApp}
              onStatusChange={moveApplicationToStatus}
              emptyMessage={
                statusFilter
                  ? 'Keine Bewerbungen mit diesem Status.'
                  : 'Keine Bewerbungen gefunden.'
              }
            />

            {archiveTotal > 0 ? (
              <section className="rounded-2xl border border-white/10 bg-app-muted/60 p-4">
                <button
                  type="button"
                  onClick={() => setArchiveOpen(prev => !prev)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-1 py-1 text-left text-stone-100 transition hover:bg-white/5"
                >
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    Archiv — Absagen und erledigt
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs tabular-nums text-stone-200">
                      {archiveTotal}
                    </span>
                  </span>
                  {archiveOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                {archiveOpen ? (
                  <div className="mt-4">
                    <ApplicationTable
                      apps={paginatedArchive.items}
                      rangeStart={paginatedArchive.rangeStart}
                      rangeEnd={paginatedArchive.rangeEnd}
                      total={paginatedArchive.total}
                      page={paginatedArchive.page}
                      pageCount={paginatedArchive.pageCount}
                      onPageChange={setArchivePage}
                      onOpenInfo={setInfoApp}
                      onStatusChange={moveApplicationToStatus}
                      emptyMessage="Keine archivierten Bewerbungen gefunden."
                    />
                  </div>
                ) : null}
              </section>
            ) : null}

            {infoApp ? (
              <ApplicationInfoModal
                app={infoApp}
                cvSummaries={cvSummaries}
                onClose={() => setInfoApp(null)}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
