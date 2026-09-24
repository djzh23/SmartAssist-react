import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { AlertTriangle, ArrowLeft, Check, ExternalLink, X } from 'lucide-react'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import AppCtaButton from '../components/ui/AppCtaButton'
import {
  deleteInboxJob,
  fetchInboxJob,
  inboxSourceLabel,
  updateInboxJob,
  InboxJobStatus,
  type InboxJob,
} from '../api/inboxClient'
import { analyzeJob } from '../api/analyzeClient'
import { deleteReport, getReport } from '../api/reportsClient'
import { invalidateInboxCount } from '../hooks/useInboxNewCount'
import { readCachedCv } from '../utils/cvSessionCache'
import { sha256Hex } from '../utils/textHash'

const TITLE_MAX = 500
const COMPANY_MAX = 300

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

function DeleteConfirmDialog({ onCancel, onConfirm, busy }: { onCancel: () => void; onConfirm: () => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-inbox-job-title">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Abbrechen" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl border border-white/10 bg-[#1a140f] p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="delete-inbox-job-title" className="text-base font-semibold text-stone-100">
            Job wirklich loeschen?
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-stone-400 hover:bg-white/5 hover:text-stone-100" aria-label="Abbrechen">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-stone-400">
          Diese Aktion kann nicht rueckgaengig gemacht werden.
        </p>
        <div className="flex gap-2">
          <AppCtaButton variant="secondary" onClick={onCancel} className="flex-1" disabled={busy}>
            Abbrechen
          </AppCtaButton>
          <AppCtaButton variant="danger" onClick={onConfirm} className="flex-1" loading={busy}>
            Job loeschen
          </AppCtaButton>
        </div>
      </div>
    </div>
  )
}

function DeleteAnalysisConfirmDialog({ onCancel, onConfirm, busy }: { onCancel: () => void; onConfirm: () => void; busy: boolean }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="delete-analysis-title">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Abbrechen" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl border border-white/10 bg-[#1a140f] p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="delete-analysis-title" className="text-base font-semibold text-stone-100">
            Analyse loeschen?
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-stone-400 hover:bg-white/5 hover:text-stone-100" aria-label="Abbrechen">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-stone-400">
          Der Job bleibt in der Inbox und kann neu analysiert werden.
        </p>
        <div className="flex gap-2">
          <AppCtaButton variant="secondary" onClick={onCancel} className="flex-1" disabled={busy}>
            Abbrechen
          </AppCtaButton>
          <AppCtaButton variant="danger" onClick={onConfirm} className="flex-1" loading={busy}>
            Analyse loeschen
          </AppCtaButton>
        </div>
      </div>
    </div>
  )
}

function ReanalyzeConfirmDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="reanalyze-title">
      <button type="button" className="absolute inset-0 bg-black/55" aria-label="Abbrechen" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-sm rounded-t-2xl border border-white/10 bg-[#1a140f] p-5 shadow-2xl sm:rounded-2xl">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id="reanalyze-title" className="text-base font-semibold text-stone-100">
            Analyse aktualisieren?
          </h2>
          <button type="button" onClick={onCancel} className="rounded-lg p-1 text-stone-400 hover:bg-white/5 hover:text-stone-100" aria-label="Abbrechen">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-stone-400">
          Die alte Analyse wird ersetzt. Das verbraucht eine deiner taeglichen Analysen. Fortfahren?
        </p>
        <div className="flex gap-2">
          <AppCtaButton variant="secondary" onClick={onCancel} className="flex-1">
            Abbrechen
          </AppCtaButton>
          <AppCtaButton variant="primary" onClick={onConfirm} className="flex-1">
            Fortfahren
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
  | { kind: 'ready'; job: InboxJob }

export default function InboxJobPage() {
  const { id } = useParams<{ id: string }>()
  const { getToken, userId } = useAuth()
  const navigate = useNavigate()

  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [title, setTitle] = useState('')
  const [company, setCompany] = useState('')
  const [rawText, setRawText] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedJustNow, setSavedJustNow] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [confirmingReanalyze, setConfirmingReanalyze] = useState(false)
  const [reanalyzing, setReanalyzing] = useState(false)
  const [reanalyzeError, setReanalyzeError] = useState<string | null>(null)
  const [confirmingDeleteAnalysis, setConfirmingDeleteAnalysis] = useState(false)
  const [deletingAnalysis, setDeletingAnalysis] = useState(false)
  const [deleteAnalysisError, setDeleteAnalysisError] = useState<string | null>(null)
  // null while the hash comparison against the stored report is still running (or hasn't started
  // yet for a job that isn't analyzed). true/false once it resolves. See the effect below.
  const [hashesUnchanged, setHashesUnchanged] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    if (!id) return
    setState({ kind: 'loading' })
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      const job = await fetchInboxJob(id, token)
      setState({ kind: 'ready', job })
      setTitle(job.title)
      setCompany(job.company)
      setRawText(job.rawText)
      setSavedJustNow(false)
    } catch (e) {
      if (e instanceof Error && /404|nicht gefunden/i.test(e.message)) {
        setState({ kind: 'not-found' })
      } else {
        setState({ kind: 'error' })
      }
    }
  }, [id, getToken])

  useEffect(() => {
    void load()
  }, [load])

  // Real hash comparison (Prompt B Session 2) replaces the earlier session-local dirty/saved
  // heuristic: the backend now stores the exact CV/JD hashes it analyzed, so we can directly check
  // whether either one still matches instead of guessing from in-session edit history.
  useEffect(() => {
    if (state.kind !== 'ready') return
    const currentJob = state.job

    if (currentJob.status !== InboxJobStatus.Analyzed || !currentJob.analysisReportId) {
      setHashesUnchanged(null)
      return
    }

    let cancelled = false
    setHashesUnchanged(null)

    const check = async () => {
      try {
        const token = await getToken()
        if (!token) {
          if (!cancelled) setHashesUnchanged(false)
          return
        }
        // job.analysisReportId is trusted here (Analyzed status implies it is set); if the report
        // itself is gone (e.g. deleted through a different tab), fall back to "changed" so the
        // button never stays stuck disabled on a report that no longer exists.
        const report = await getReport(currentJob.analysisReportId!, token)
        const currentJdHash = await sha256Hex(currentJob.rawText.trim())
        if (currentJdHash !== report.jdHash) {
          if (!cancelled) setHashesUnchanged(false)
          return
        }

        // CV hash: compare against the CV this origin has in localStorage (shared across tabs).
        // If nothing is cached here, we cannot prove the CV is unchanged.
        const cachedCv = readCachedCv(userId)
        if (!cachedCv) {
          if (!cancelled) setHashesUnchanged(false)
          return
        }
        if (!cancelled) setHashesUnchanged(cachedCv.hash === report.cvHash)
      } catch {
        // Report fetch failed (network, 404 if deleted concurrently, ...): do not block a
        // legitimate reanalysis on our own inability to check.
        if (!cancelled) setHashesUnchanged(false)
      }
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [state, getToken, userId])

  if (state.kind === 'loading') {
    return (
      <StandardPageContainer className="w-full max-w-[760px] pt-3 pb-6 sm:py-6">
        <div className="animate-pulse rounded-2xl border border-[#3a332d] bg-[#232019] p-5">
          <div className="h-5 w-1/3 rounded bg-white/10" />
          <div className="mt-4 h-10 w-full rounded bg-white/[0.06]" />
          <div className="mt-3 h-10 w-full rounded bg-white/[0.06]" />
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
          <p className="text-sm text-[#f0ebe0]">Dieser Job existiert nicht mehr.</p>
          <Link to="/inbox" className="text-sm font-medium text-[#d97757] hover:text-[#e89372]">
            Zurueck zur Inbox
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

  const { job } = state
  const dirty = title.trim() !== job.title || company.trim() !== job.company || rawText !== job.rawText
  const titleValid = title.trim().length > 0 && title.length <= TITLE_MAX
  const companyValid = company.trim().length > 0 && company.length <= COMPANY_MAX
  const isAnalyzed = job.status === InboxJobStatus.Analyzed
  // Editing right now always counts as "changed" without waiting for the hash check (it would
  // compare the last-saved text anyway, not what's currently in the textarea). Otherwise, defer to
  // the real CV/JD hash comparison from the effect above.
  const checkingReanalyze = !dirty && isAnalyzed && hashesUnchanged === null
  const canReanalyze = dirty || hashesUnchanged === false

  const handleSave = async () => {
    if (!dirty || !titleValid || !companyValid) return
    setSaving(true)
    setSaveError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      const updated = await updateInboxJob(job.id, { title: title.trim(), company: company.trim(), rawText }, token)
      setState({ kind: 'ready', job: updated })
      setTitle(updated.title)
      setCompany(updated.company)
      setRawText(updated.rawText)
      setSavedJustNow(true)
      window.setTimeout(() => setSavedJustNow(false), 3000)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      await deleteInboxJob(job.id, token)
      invalidateInboxCount()
      navigate('/inbox', { replace: true })
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : 'Loeschen fehlgeschlagen.')
      setDeleting(false)
      setConfirmingDelete(false)
    }
  }

  // First-time analysis still goes through the Analyze page's own form (Option B from Paket 3):
  // the user reviews/edits the text there before submitting. AnalyzePage then auto-navigates to
  // this job's report page once the analysis succeeds (Prompt B Session 2, Phase 5).
  const handleAnalyze = () => {
    navigate(`/analyze?inbox=${encodeURIComponent(job.id)}`)
  }

  const handleReanalyze = () => {
    if (!canReanalyze) return
    setConfirmingReanalyze(true)
  }

  // Reanalysis, unlike the first-time flow above, calls analyze directly from here instead of
  // bouncing through the Analyze page - the text is already known and confirmed, there is nothing
  // left for the user to review before submitting.
  const handleConfirmReanalyze = async () => {
    setConfirmingReanalyze(false)
    setReanalyzeError(null)
    setReanalyzing(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      const cachedCv = readCachedCv(userId)
      if (!cachedCv) {
        throw new Error('Der Lebenslauf fehlt auf diesem Geraet. Einmal unter Profil hochladen, dann gilt er fuer alle Tabs.')
      }
      await analyzeJob(job.rawText.trim(), token, { text: cachedCv.text, hash: cachedCv.hash }, job.id)
      navigate(`/inbox/${job.id}/report`)
    } catch (e) {
      setReanalyzeError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.')
      setReanalyzing(false)
    }
  }

  // Separate from handleDelete: this removes only the analysis, not the job. The backend resets
  // the job's Status/AnalyzedAt/AnalysisReportId as part of the delete, so a reload picks that up.
  const handleDeleteAnalysis = async () => {
    if (!job.analysisReportId) return
    setDeletingAnalysis(true)
    setDeleteAnalysisError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet.')
      await deleteReport(job.analysisReportId, token)
      invalidateInboxCount()
      setConfirmingDeleteAnalysis(false)
      await load()
    } catch (e) {
      setDeleteAnalysisError(e instanceof Error ? e.message : 'Loeschen fehlgeschlagen.')
    } finally {
      setDeletingAnalysis(false)
    }
  }

  return (
    <StandardPageContainer className="w-full max-w-[760px] pt-3 pb-6 sm:py-6">
      <Link
        to="/inbox"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#a89e91] hover:text-[#f5f1eb]"
      >
        <ArrowLeft size={16} aria-hidden />
        Zurueck zur Inbox
      </Link>

      <div className="rounded-2xl border border-[#3a332d] bg-[#232019] p-5 sm:p-6">
        <h1 className="mb-4 text-lg font-semibold text-[#f5f1eb]">Job-Details</h1>

        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="text-sm font-medium text-[#f5f1eb]">Titel</span>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              className="mt-1.5 w-full rounded-lg border border-[#3a332d] bg-[#1a1613] px-3 py-2.5 text-sm text-[#f5f1eb] focus:border-[#d97757] focus:outline-none focus:ring-1 focus:ring-[#d97757]/40"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-[#f5f1eb]">Firma</span>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              maxLength={COMPANY_MAX}
              className="mt-1.5 w-full rounded-lg border border-[#3a332d] bg-[#1a1613] px-3 py-2.5 text-sm text-[#f5f1eb] focus:border-[#d97757] focus:outline-none focus:ring-1 focus:ring-[#d97757]/40"
            />
          </label>

          <div className="grid gap-3 text-sm sm:grid-cols-2">
            {job.location ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-[#8a7f70]">Standort</p>
                <p className="mt-0.5 text-[#c9c0b3]">{job.location}</p>
              </div>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8a7f70]">Quelle</p>
              <p className="mt-0.5 text-[#c9c0b3]">
                {inboxSourceLabel(job.sourceKind)}
                {job.sourceUrl ? (
                  <a
                    href={job.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-1.5 inline-flex items-center gap-1 text-[#d97757] hover:text-[#e89372]"
                  >
                    Original oeffnen
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ) : null}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#8a7f70]">Gespeichert</p>
              <p className="mt-0.5 text-[#c9c0b3]">{formatRelativeTime(job.extractedAt)}</p>
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-[#f5f1eb]">Beschreibung</span>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              className="mt-1.5 min-h-[300px] w-full rounded-lg border border-[#3a332d] bg-[#1a1613] px-3 py-2.5 text-sm leading-relaxed text-[#f5f1eb] focus:border-[#d97757] focus:outline-none focus:ring-1 focus:ring-[#d97757]/40"
            />
          </label>

          {saveError ? <p className="text-sm text-rose-400">{saveError}</p> : null}
          {savedJustNow ? <p className="text-sm text-[#8fae8c]">Aenderungen gespeichert.</p> : null}

          <div className="flex flex-wrap gap-2">
            <AppCtaButton
              variant="secondary"
              onClick={() => void handleSave()}
              disabled={!dirty || !titleValid || !companyValid || saving}
              loading={saving}
            >
              Aenderungen speichern
            </AppCtaButton>
          </div>
        </div>

        <div className="my-5 h-px bg-[#3a332d]" />

        {!isAnalyzed ? (
          <AppCtaButton size="lg" className="w-full" onClick={handleAnalyze}>
            Diese Stelle analysieren
          </AppCtaButton>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <p className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8fae8c]">
              <Check size={16} strokeWidth={2.5} aria-hidden />
              Diese Stelle wurde bereits analysiert
            </p>
            <AppCtaButton size="lg" className="w-full" onClick={() => navigate(`/inbox/${job.id}/report`)}>
              Analyse-Ergebnis oeffnen
            </AppCtaButton>
            <AppCtaButton
              size="sm"
              variant="secondary"
              onClick={handleReanalyze}
              disabled={!canReanalyze || checkingReanalyze || reanalyzing}
              loading={checkingReanalyze || reanalyzing}
              title={
                reanalyzing
                  ? 'Analyse laeuft...'
                  : checkingReanalyze
                    ? 'Pruefe, ob sich Text oder Lebenslauf seit der letzten Analyse geaendert haben...'
                    : canReanalyze
                      ? 'Text oder Lebenslauf wurden geaendert. Neue Analyse mit dem aktuellen Stand starten.'
                      : 'Text und Lebenslauf sind unveraendert seit der letzten Analyse. Keine neue Analyse noetig.'
              }
            >
              {reanalyzing ? 'Analyse laeuft...' : checkingReanalyze ? 'Pruefe...' : 'Analyse aktualisieren'}
            </AppCtaButton>
            {reanalyzeError ? <p className="text-sm text-rose-400">{reanalyzeError}</p> : null}
          </div>
        )}

        <div className="my-5 h-px bg-[#3a332d]" />

        <div className="flex flex-col items-center gap-2">
          <p className="text-xs uppercase tracking-wide text-[#8a7f70]">Weitere Aktionen</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {isAnalyzed ? (
              <AppCtaButton
                variant="secondary"
                size="sm"
                onClick={() => setConfirmingDeleteAnalysis(true)}
                disabled={deletingAnalysis}
              >
                Analyse loeschen
              </AppCtaButton>
            ) : null}
            <AppCtaButton
              variant="danger"
              size="sm"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving || deleting}
            >
              Job loeschen
            </AppCtaButton>
          </div>
          {deleteAnalysisError ? <p className="text-sm text-rose-400">{deleteAnalysisError}</p> : null}
          {deleteError ? <p className="text-sm text-rose-400">{deleteError}</p> : null}
        </div>
      </div>

      {confirmingDeleteAnalysis ? (
        <DeleteAnalysisConfirmDialog
          busy={deletingAnalysis}
          onCancel={() => setConfirmingDeleteAnalysis(false)}
          onConfirm={() => void handleDeleteAnalysis()}
        />
      ) : null}

      {confirmingReanalyze ? (
        <ReanalyzeConfirmDialog
          onCancel={() => setConfirmingReanalyze(false)}
          onConfirm={() => void handleConfirmReanalyze()}
        />
      ) : null}

      {confirmingDelete ? (
        <DeleteConfirmDialog
          busy={deleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </StandardPageContainer>
  )
}
