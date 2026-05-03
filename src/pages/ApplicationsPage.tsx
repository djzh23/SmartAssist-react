import { useCallback, useEffect, useMemo, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { Briefcase, Loader2, Plus } from 'lucide-react'
import {
  type ApplicationStatusApi,
  type JobApplicationApi,
  fetchJobApplications,
  listCvStudioResumes,
  updateJobApplicationStatus,
} from '../api/client'
import ApplicationInfoModal from '../components/applications/ApplicationInfoModal'
import type { CvStudioResumeSummary } from '../types'
import PageHeader from '../components/layout/PageHeader'
import { appCtaButtonClasses } from '../components/ui/AppCtaButton'
import ArchiveSection from '../components/applications/ArchiveSection'
import PipelineBoard from '../components/applications/PipelineBoard'
import { ARCHIVE_STATUSES, PIPELINE_STATUSES, TERMINAL_STATUSES } from '../components/applications/pipelineConfig'

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
  const [draggingAppId, setDraggingAppId] = useState<string | null>(null)
  const [dropStatus, setDropStatus] = useState<ApplicationStatusApi | null>(null)
  const [archiveOpen, setArchiveOpen] = useState(false)

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

  const grouped = useMemo(() => {
    const m = new Map<ApplicationStatusApi, JobApplicationApi[]>()
    for (const s of [...PIPELINE_STATUSES, ...TERMINAL_STATUSES])
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
    () => ARCHIVE_STATUSES.reduce((n, s) => n + (grouped.get(s)?.length ?? 0), 0),
    [grouped],
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

  function handleDragStart(e: DragEvent<HTMLDivElement>, appId: string) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/application-id', appId)
    setDraggingAppId(appId)
  }

  function handleDragEnd() {
    setDraggingAppId(null)
    setDropStatus(null)
  }

  function handleColumnDragOver(e: DragEvent<HTMLElement>, status: ApplicationStatusApi) {
    if (!draggingAppId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropStatus(status)
  }

  function handleColumnDrop(e: DragEvent<HTMLElement>, status: ApplicationStatusApi) {
    e.preventDefault()
    const appId = e.dataTransfer.getData('text/application-id')
    if (appId) {
      void moveApplicationToStatus(appId, status)
    }
    setDropStatus(null)
    setDraggingAppId(null)
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden bg-transparent">
      <div className="mx-auto w-full max-w-[1580px] px-4 pt-3 pb-6 sm:px-6 sm:py-7">
        <PageHeader
          pageKey="applications"
          subtitle={`${activeCount} aktiv · ${apps.length} gesamt · ${archiveTotal} Archiv`}
          className="mb-4"
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
        ) : (
          <>
            <section aria-label="Bewerbungspipeline" className="mb-4">
              <PipelineBoard
                statuses={PIPELINE_STATUSES}
                grouped={grouped}
                draggingAppId={draggingAppId}
                dropStatus={dropStatus}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleColumnDragOver}
                onDrop={handleColumnDrop}
                onDragLeave={status => { if (dropStatus === status) setDropStatus(null) }}
                onOpenInfo={setInfoApp}
              />
            </section>

            <ArchiveSection
              open={archiveOpen}
              count={archiveTotal}
              statuses={ARCHIVE_STATUSES}
              grouped={grouped}
              draggingAppId={draggingAppId}
              dropStatus={dropStatus}
              onToggle={() => setArchiveOpen(prev => !prev)}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDragOver={handleColumnDragOver}
              onDrop={handleColumnDrop}
              onDragLeave={status => { if (dropStatus === status) setDropStatus(null) }}
              onOpenInfo={setInfoApp}
            />

            {infoApp ? (
              <ApplicationInfoModal
                app={infoApp}
                cvSummaries={cvSummaries}
                onClose={() => setInfoApp(null)}
              />
            ) : null}

            {apps.length === 0 && !loading && (
              <div className="mx-auto mt-5 max-w-md rounded-2xl border border-white/10 bg-[#120e0b]/80 px-6 py-12 text-center">
                <Briefcase className="mx-auto text-stone-500" size={36} strokeWidth={1.5} />
                <p className="mt-4 text-sm font-semibold text-stone-100">Noch keine Bewerbungen</p>
                <Link
                  to="/applications/new"
                  className={appCtaButtonClasses({ size: 'md', className: 'mt-5' })}
                >
                  <Plus size={18} />
                  Neue Bewerbung
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
