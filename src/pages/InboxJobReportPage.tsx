import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { AlertTriangle, ArrowLeft, X } from 'lucide-react'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import AppCtaButton from '../components/ui/AppCtaButton'
import AnalyzeReportView from '../components/analyze/AnalyzeReportView'
import type { AnalyzeReport } from '../api/analyzeClient'
import { deleteReport, getReportByInboxJob, type AnalysisReport } from '../api/reportsClient'
import { fetchInboxJob, type InboxJob } from '../api/inboxClient'
import { invalidateInboxCount } from '../hooks/useInboxNewCount'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (!Number.isFinite(d.getTime())) return ''
  const datePart = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' })
  const timePart = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return `${datePart} um ${timePart}`
}

function DeleteReportConfirmDialog({ onCancel, onConfirm, busy }: { onCancel: () => void; onConfirm: () => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-report-title">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Abbrechen" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl border border-white/10 bg-[#1a140f] p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="delete-report-title" className="text-base font-semibold text-stone-100">
            Analyse wirklich loeschen?
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-stone-400 hover:bg-white/5 hover:text-stone-100" aria-label="Abbrechen">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-stone-400">
          Der Job wandert zurueck zu "Neu" und kann wieder analysiert werden.
        </p>
        <div className="flex gap-2">
          <AppCtaButton variant="secondary" onClick={onCancel} className="flex-1" disabled={busy}>
            Abbrechen
          </AppCtaButton>
          <AppCtaButton variant="danger" onClick={onConfirm} className="flex-1" loading={busy}>
            Loeschen
          </AppCtaButton>
        </div>
      </div>
    </div>
  )
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error' }
  | { kind: 'ready'; report: AnalysisReport; job: InboxJob | null }

export default function InboxJobReportPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const { getToken } = useAuth()
  const navigate = useNavigate()

  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!jobId) return
    setState({ kind: 'loading' })
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      // Job info (title/company) is a nice-to-have for the header, not load-bearing: a report
      // outlives its job (the FK is ON DELETE SET NULL), so a missing job must not hide the report.
      const [report, job] = await Promise.all([
        getReportByInboxJob(jobId, token),
        fetchInboxJob(jobId, token).catch(() => null),
      ])
      if (!report) {
        setState({ kind: 'not-found' })
        return
      }
      setState({ kind: 'ready', report, job })
    } catch {
      setState({ kind: 'error' })
    }
  }, [jobId, getToken])

  useEffect(() => {
    void load()
  }, [load])

  const parsedReport = useMemo<AnalyzeReport | null>(() => {
    if (state.kind !== 'ready') return null
    try {
      return JSON.parse(state.report.reportJson) as AnalyzeReport
    } catch (e) {
      console.error('Failed to parse report JSON:', e)
      return null
    }
  }, [state])

  const handleDelete = async () => {
    if (state.kind !== 'ready' || !jobId) return
    setDeleting(true)
    setDeleteError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      await deleteReport(state.report.id, token)
      // The job goes back to Status "New", which changes the inbox "New" count - same reasoning
      // as InboxJobPage's handleDelete.
      invalidateInboxCount()
      navigate(`/inbox/${jobId}`, { replace: true })
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Loeschen fehlgeschlagen.')
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  if (state.kind === 'loading') {
    return (
      <StandardPageContainer className="w-full max-w-[1120px] pt-3 pb-6 sm:py-6">
        <div className="mx-auto w-full max-w-[820px] animate-pulse rounded-2xl border border-[#3a332d] bg-[#232019] p-8">
          <div className="h-5 w-1/3 rounded bg-white/10" />
          <div className="mt-4 h-40 w-full rounded bg-white/[0.06]" />
          <div className="mt-3 h-40 w-full rounded bg-white/[0.05]" />
        </div>
      </StandardPageContainer>
    )
  }

  if (state.kind === 'not-found') {
    return (
      <StandardPageContainer className="w-full max-w-[760px] pt-3 pb-6 sm:py-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#3a332d] bg-[#232019] px-6 py-14 text-center">
          <AlertTriangle size={24} className="text-[#d97757]" aria-hidden />
          <p className="text-sm text-[#f0ebe0]">Diese Analyse existiert nicht mehr. Vielleicht wurde sie geloescht.</p>
          <Link to="/inbox" className="text-sm font-medium text-[#d97757] hover:text-[#e89372]">
            Zur Inbox
          </Link>
        </div>
      </StandardPageContainer>
    )
  }

  if (state.kind === 'error') {
    return (
      <StandardPageContainer className="w-full max-w-[760px] pt-3 pb-6 sm:py-6">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-900/40 bg-rose-950/20 px-6 py-12 text-center">
          <AlertTriangle size={24} className="text-rose-400" aria-hidden />
          <p className="text-sm text-rose-200">Fehler beim Laden. Bitte erneut versuchen.</p>
          <AppCtaButton size="sm" variant="secondary" onClick={() => void load()}>
            Erneut versuchen
          </AppCtaButton>
        </div>
      </StandardPageContainer>
    )
  }

  const { report, job } = state

  return (
    <StandardPageContainer className="w-full max-w-[1120px] pb-10 pt-4 sm:py-8">
      <div className="mx-auto w-full max-w-[820px]">
        <Link
          to={job ? `/inbox/${jobId}` : '/inbox'}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#a89e91] hover:text-[#f5f1eb]"
        >
          <ArrowLeft size={16} aria-hidden />
          {job ? 'Zurueck zum Job' : 'Zurueck zur Inbox'}
        </Link>
      </div>

      {parsedReport ? (
        <AnalyzeReportView
          report={parsedReport}
          createdLabel={`Analysiert am ${formatDateTime(report.createdAt)}`}
          onNewAnalysis={() => navigate(job ? `/inbox/${jobId}` : '/inbox')}
          sourceLabel={job ? `${job.title} · ${job.company}` : undefined}
        />
      ) : (
        <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-rose-900/40 bg-rose-950/20 px-6 py-12 text-center">
          <p className="text-sm text-rose-200">Bericht konnte nicht gelesen werden.</p>
        </div>
      )}

      <div className="mx-auto mt-6 w-full max-w-[820px]">
        <div className="mb-4 h-px bg-[#3a332d]" />
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
          {job ? (
            <AppCtaButton variant="secondary" className="w-full sm:w-auto" onClick={() => navigate(`/inbox/${jobId}`)}>
              Zum Job
            </AppCtaButton>
          ) : null}
          <AppCtaButton variant="secondary" className="w-full sm:w-auto" onClick={() => navigate('/inbox')}>
            Inbox
          </AppCtaButton>
          <AppCtaButton variant="danger" className="w-full sm:w-auto" onClick={() => setConfirmingDelete(true)} disabled={deleting}>
            Bericht löschen
          </AppCtaButton>
        </div>
        {deleteError ? <p className="mt-2 text-center text-sm text-rose-400">{deleteError}</p> : null}
      </div>

      {confirmingDelete ? (
        <DeleteReportConfirmDialog
          busy={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </StandardPageContainer>
  )
}
