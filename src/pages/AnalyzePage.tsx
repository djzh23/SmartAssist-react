import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { AlertTriangle, Inbox as InboxIcon } from 'lucide-react'
import AppCtaButton from '../components/ui/AppCtaButton'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import AnalyzeHeader from '../components/analyze/AnalyzeHeader'
import AnalyzeReportView from '../components/analyze/AnalyzeReportView'
import AnalyzeLoadingState from '../components/analyze/AnalyzeLoadingState'
import { formatRelativeCreated, plainGerman } from '../components/analyze/analyzeFormat'
import { useCareerProfile } from '../hooks/useCareerProfile'
import {
  analyzeJob,
  AnalyzeApiError,
  jobDescriptionLengthOk,
  MAX_JD_CHARS,
  MIN_JD_CHARS,
  type AnalyzeReport,
} from '../api/analyzeClient'
import { UsageLimitError } from '../api/agentClient'
import { fetchInboxJob } from '../api/inboxClient'
import { isCachedCvReady, readCachedCv } from '../utils/cvSessionCache'
import { LAST_ANALYZE_REPORT_PREFIX } from '../utils/clearCvDerivedState'

const REPORT_KEY_PREFIX = LAST_ANALYZE_REPORT_PREFIX

interface StoredReport {
  report: AnalyzeReport
  storedAt: string
}

/** Scoped by Clerk user id so switching accounts on the same device never shows someone else's report. */
function readStoredReport(userId: string): StoredReport | null {
  try {
    const raw = sessionStorage.getItem(REPORT_KEY_PREFIX + userId)
    if (!raw) return null
    return JSON.parse(raw) as StoredReport
  } catch {
    return null
  }
}

function storeReport(userId: string, report: AnalyzeReport): void {
  try {
    const entry: StoredReport = { report, storedAt: new Date().toISOString() }
    sessionStorage.setItem(REPORT_KEY_PREFIX + userId, JSON.stringify(entry))
  } catch { /* ignore quota */ }
}

export default function AnalyzePage() {
  const { getToken, userId, isLoaded: authLoaded } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const inboxId = searchParams.get('inbox')
  const { profile, loading: profileLoading } = useCareerProfile()
  const [jobText, setJobText] = useState('')
  const [activeJob, setActiveJob] = useState<{ id: string; title: string; company: string } | null>(null)
  const [loadedInboxId, setLoadedInboxId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AnalyzeReport | null>(null)
  const [reportStoredAt, setReportStoredAt] = useState<string | null>(null)
  const [reportIsFromPreviousSession, setReportIsFromPreviousSession] = useState(false)
  const [composing, setComposing] = useState(false)

  useEffect(() => {
    if (!authLoaded || !userId) return
    const stored = readStoredReport(userId)
    if (stored) {
      setReport(stored.report)
      setReportStoredAt(stored.storedAt)
      setReportIsFromPreviousSession(true)
      setComposing(false)
    }
  }, [authLoaded, userId])

  const cachedCv = userId ? readCachedCv(userId) : null
  const cvReady = isCachedCvReady(cachedCv, profile?.cvContentHash)
  const cvNeedsReupload = Boolean(profile?.cvContentHash?.trim()) && !cvReady
  const jdLen = jobText.trim().length
  const jdOk = jobDescriptionLengthOk(jobText)
  const lengthHint = useMemo(() => {
    if (jdLen === 0) return `Mindestens ${MIN_JD_CHARS} Zeichen.`
    if (jdLen < MIN_JD_CHARS) return `Noch ${MIN_JD_CHARS - jdLen} Zeichen.`
    if (jdLen > MAX_JD_CHARS) return `${jdLen - MAX_JD_CHARS} Zeichen über dem Limit.`
    return `${jdLen.toLocaleString('de-DE')} Zeichen`
  }, [jdLen])

  const showReport = Boolean(report) && !busy && !composing
  const showForm = !busy && (!report || composing)

  const runAnalyze = async (text: string, source?: { id: string; title: string; company: string }) => {
    setError(null)
    if (!cvReady) {
      setError(cvNeedsReupload
        ? 'Der Lebenslauf fehlt auf diesem Geraet. Einmal unter Profil hochladen, dann gilt er fuer alle Tabs.'
        : 'Bitte zuerst einen Lebenslauf im Profil hinterlegen.')
      return
    }
    if (!jobDescriptionLengthOk(text)) {
      setError(`Stellenanzeige muss zwischen ${MIN_JD_CHARS} und ${MAX_JD_CHARS} Zeichen lang sein.`)
      return
    }
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte erneut anmelden.')
      if (!cachedCv) throw new Error('Bitte zuerst einen Lebenslauf im Profil hinterlegen.')
      const { report: next } = await analyzeJob(text.trim(), token, { text: cachedCv.text, hash: cachedCv.hash }, source?.id)

      if (source) {
        // Came from the inbox: the report is now persisted server side under that job, so land on
        // its permanent page instead of showing it inline here. Ad-hoc analyses (no source) keep
        // the existing inline flow below - option A from the brief, saving the report inline stays
        // out of scope for this session.
        navigate(`/inbox/${source.id}/report`)
        return
      }

      setReport(next)
      setActiveJob(null)
      setReportIsFromPreviousSession(false)
      setReportStoredAt(null)
      setComposing(false)
      if (userId) storeReport(userId, next)
    } catch (e) {
      if (e instanceof UsageLimitError) {
        setError(e.message || 'Tageslimit erreicht. Mit Premium unbegrenzt analysieren.')
      } else if (e instanceof AnalyzeApiError && (e.errorCode === 'profile_incomplete' || e.errorCode === 'cv_missing' || e.errorCode === 'cv_not_uploaded')) {
        setError('Profil unvollständig. Bitte Lebenslauf unter Profil hochladen.')
      } else if (e instanceof AnalyzeApiError && (e.errorCode === 'cv_stale' || e.errorCode === 'cv_hash_mismatch')) {
        setError('Der Lebenslauf auf diesem Geraet stimmt nicht mehr mit dem Profil. Bitte unter Profil ersetzen oder ergaenzen.')
      } else if (e instanceof AnalyzeApiError && e.errorCode === 'jd_too_short') {
        setError('Die Stellenanzeige ist zu kurz. Bitte den vollständigen Text der Anzeige einfügen.')
      } else {
        setError(e instanceof Error ? plainGerman(e.message) : 'Analyse fehlgeschlagen.')
      }
    } finally {
      setBusy(false)
    }
  }

  const openInboxJob = async (id: string) => {
    setError(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte erneut anmelden.')
      const job = await fetchInboxJob(id, token)
      setJobText(job.rawText)
      setActiveJob({ id: job.id, title: job.title, company: job.company })
      setComposing(true)
      setSearchParams({}, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? plainGerman(e.message) : 'Stelle konnte nicht geladen werden.')
    }
  }

  useEffect(() => {
    if (!authLoaded || !inboxId || inboxId === loadedInboxId) return
    setLoadedInboxId(inboxId)
    void openInboxJob(inboxId)
    // openInboxJob is recreated each render; the query param is the trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, inboxId, loadedInboxId])

  const startNewAnalysis = () => {
    setComposing(true)
    setActiveJob(null)
    setError(null)
  }

  // No overflow on this flex child: it would shrink to the height of <main> and scroll on its own,
  // which shows up as a second scrollbar and a "framed" report.
  return (
    <StandardPageContainer className="w-full max-w-[1120px] pb-10 pt-4 sm:py-8">
      {showForm ? (
        <div className="mx-auto w-full max-w-[820px]">
          <AnalyzeHeader
            title="Stellenanzeige prüfen"
            subtitle="Füge eine Stellenanzeige ein, um deine Passung zu prüfen."
          />
        </div>
      ) : null}

      {!profileLoading && !cvReady && showForm && (
        <div className="mx-auto mb-5 flex w-full max-w-[820px] items-start gap-2 rounded-2xl border border-[rgba(217,119,87,0.28)] bg-[rgba(217,119,87,0.08)] px-4 py-3 text-sm text-[#f0ebe0]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#d97757]" aria-hidden />
          <p>
            {cvNeedsReupload
              ? 'Der Lebenslauf fehlt auf diesem Geraet. Einmal unter Profil hochladen, dann gilt er fuer alle Tabs.'
              : 'Ohne Lebenslauf keine Analyse.'}{' '}
            <Link to="/career-profile" className="font-semibold text-[#e89372] underline decoration-[#d97757]/50 underline-offset-2">
              Profil öffnen
            </Link>
          </p>
        </div>
      )}

      {showForm ? (
        <section className="mx-auto w-full max-w-[820px] rounded-[20px] border border-[#3a332d] bg-[#232019] p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-medium text-[#f5f1eb]">
              {activeJob ? activeJob.title : 'Stellenanzeige'}
            </span>
            <p className="mt-1 text-xs text-[#a89e91]">
              {activeJob ? (
                <>
                  {activeJob.company}. Text aus deiner Inbox übernommen. Erst wenn du Analysieren drückst, startet die Prüfung.{' '}
                  <Link to={`/inbox/${activeJob.id}`} className="font-medium text-[#d97757] hover:text-[#e89372]">
                    Zur Detailansicht
                  </Link>
                </>
              ) : (
                'Text der Anzeige einfügen, egal ob Pflege, Vertrieb, Büro, Handwerk oder IT. Eine URL allein reicht nicht. Bitte den Anzeigentext kopieren.'
              )}
            </p>
            <textarea
              value={jobText}
              onChange={e => setJobText(e.target.value)}
              rows={12}
              placeholder="Stellenanzeige hier einfügen. Den vollständigen Text kopieren, nicht nur den Titel."
              className="mt-3 w-full rounded-xl border border-[#3a332d] bg-[#1a1613] px-3 py-2.5 text-sm text-[#f0ebe0] placeholder-[#8a7f70] focus:border-[#d97757] focus:outline-none focus:ring-1 focus:ring-[#d97757]/30"
            />
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#a89e91]">{lengthHint}</p>
            <AppCtaButton
              size="lg"
              className="w-full sm:w-auto"
              onClick={() => void runAnalyze(jobText, activeJob ?? undefined)}
              disabled={busy || !jdOk || !cvReady}
              loading={busy}
            >
              Analysieren
            </AppCtaButton>
          </div>
          {error && (
            <p className="mt-3 rounded-lg border border-[rgba(217,119,87,0.28)] bg-[rgba(217,119,87,0.08)] px-3 py-2 text-sm text-[#f0ebe0]" role="alert">
              {error}
            </p>
          )}
          {composing && report ? (
            <button
              type="button"
              onClick={() => setComposing(false)}
              className="mt-3 text-xs font-medium text-[#a89e91] underline decoration-[#3a332d] underline-offset-2 hover:text-[#f0ebe0]"
            >
              Letztes Ergebnis anzeigen
            </button>
          ) : null}
        </section>
      ) : null}

      {showForm ? (
        <section className="mx-auto mt-4 w-full max-w-[820px] rounded-2xl border border-[#3a332d] bg-[#232019]/60 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(217,119,87,0.14)] text-[#d97757]">
              <InboxIcon size={18} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#f5f1eb]">Tipp</p>
              <p className="mt-1 text-sm leading-relaxed text-[#a89e91]">
                Du kannst auch die Browser-Erweiterung nutzen, um Jobs automatisch von LinkedIn und anderen
                Portalen in deine Inbox zu sammeln.
              </p>
              <Link
                to="/inbox"
                className="mt-2 inline-block text-sm font-medium text-[#d97757] hover:text-[#e89372]"
              >
                Zur Inbox
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {busy ? (
        <div className="mx-auto mt-4 w-full max-w-[820px]">
          <AnalyzeLoadingState />
        </div>
      ) : null}

      {showReport && report ? (
        <AnalyzeReportView
          report={report}
          createdLabel={formatRelativeCreated(reportIsFromPreviousSession ? reportStoredAt : new Date().toISOString())}
          onNewAnalysis={startNewAnalysis}
          sourceLabel={activeJob ? `${activeJob.title} · ${activeJob.company}` : undefined}
        />
      ) : null}
    </StandardPageContainer>
  )
}
