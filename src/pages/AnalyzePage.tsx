import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { AlertTriangle, Plus } from 'lucide-react'
import AppCtaButton from '../components/ui/AppCtaButton'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import AnalyzeHeader from '../components/analyze/AnalyzeHeader'
import AnalyzeHero from '../components/analyze/AnalyzeHero'
import AnalyzeSubDimensions from '../components/analyze/AnalyzeSubDimensions'
import AnalyzeWarningBanner from '../components/analyze/AnalyzeWarningBanner'
import AnalyzeSkillBuckets from '../components/analyze/AnalyzeSkillBuckets'
import AnalyzeBulletRewrites from '../components/analyze/AnalyzeBulletRewrites'
import AnalyzeLoadingState from '../components/analyze/AnalyzeLoadingState'
import AnalyzeRoleSummary from '../components/analyze/AnalyzeRoleSummary'
import { emptySkillGap, inventedSkillCount, requirementCount, splitRoleSummary, formatRelativeCreated, userFacingWarnings } from '../components/analyze/analyzeFormat'
import { useCareerProfile } from '../hooks/useCareerProfile'
import {
  analyzeJob,
  AnalyzeApiError,
  jobDescriptionLengthOk,
  MIN_JD_CHARS,
  MAX_JD_CHARS,
  type AnalyzeReport,
  type SkillGapReport,
} from '../api/analyzeClient'
import { UsageLimitError } from '../api/agentClient'
import { isCachedCvReady, readCachedCv } from '../utils/cvSessionCache'

const REPORT_KEY_PREFIX = 'privateprep_last_analyze_report_'

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

function normalizeGap(gap?: SkillGapReport): SkillGapReport {
  const base = emptySkillGap()
  if (!gap) return base
  return {
    existing: gap.existing ?? [],
    supportedByResume: gap.supportedByResume ?? [],
    gap: gap.gap ?? [],
    extractedJdSkills: gap.extractedJdSkills ?? [],
    reasonCode: gap.reasonCode ?? '',
  }
}

export default function AnalyzePage() {
  const { getToken, userId, isLoaded: authLoaded } = useAuth()
  const { profile, loading: profileLoading } = useCareerProfile()
  const [jobText, setJobText] = useState('')
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

  const runAnalyze = async () => {
    setError(null)
    if (!cvReady) {
      setError(cvNeedsReupload
        ? 'Der Lebenslauf liegt nicht in diesem Browser. Bitte unter Profil erneut hochladen.'
        : 'Bitte zuerst einen Lebenslauf im Profil hinterlegen.')
      return
    }
    if (!jdOk) {
      setError(`Stellenanzeige muss zwischen ${MIN_JD_CHARS} und ${MAX_JD_CHARS} Zeichen lang sein.`)
      return
    }
    setBusy(true)
    try {
      const token = await getToken()
      if (!token) throw new Error('Bitte erneut anmelden.')
      if (!cachedCv) throw new Error('Bitte zuerst einen Lebenslauf im Profil hinterlegen.')
      const { report: next } = await analyzeJob(jobText.trim(), token, { text: cachedCv.text, hash: cachedCv.hash })
      setReport(next)
      setReportIsFromPreviousSession(false)
      setReportStoredAt(null)
      setComposing(false)
      if (userId) storeReport(userId, next)
    } catch (e) {
      if (e instanceof UsageLimitError) {
        setError(e.message || 'Tageslimit erreicht. Mit Premium unbegrenzt analysieren.')
      } else if (e instanceof AnalyzeApiError && (e.errorCode === 'profile_incomplete' || e.errorCode === 'cv_missing' || e.errorCode === 'cv_not_uploaded')) {
        setError('Profil unvollständig. Bitte Lebenslauf in diesem Browser erneut hochladen.')
      } else if (e instanceof AnalyzeApiError && (e.errorCode === 'cv_stale' || e.errorCode === 'cv_hash_mismatch')) {
        setError('Der Lebenslauf in diesem Browser stimmt nicht mehr. Bitte unter Profil erneut hochladen.')
      } else {
        setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.')
      }
    } finally {
      setBusy(false)
    }
  }

  const startNewAnalysis = () => {
    setComposing(true)
    setError(null)
  }

  const role = splitRoleSummary(report?.roleSummary)
  const dims = report?.dimensions ?? { cvMatch: 0, roleAlignment: 0, culture: 0, redFlags: 0 }
  const gap = normalizeGap(report?.skillGap)
  const factGateCount = inventedSkillCount(report?.factViolations)

  return (
    <StandardPageContainer className="w-full max-w-[820px] overflow-x-hidden pb-10 pt-4 sm:py-10">
      {showForm ? (
        <AnalyzeHeader title="Stellenanzeige prüfen" />
      ) : null}

      {!profileLoading && !cvReady && showForm && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-[rgba(217,119,87,0.28)] bg-[rgba(217,119,87,0.08)] px-4 py-3 text-sm text-[#f0ebe0]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#d97757]" aria-hidden />
          <p>
            {cvNeedsReupload
              ? 'Der Lebenslauf liegt nicht in diesem Browser. Bitte unter Profil erneut hochladen, dann analysieren.'
              : 'Ohne Lebenslauf keine Analyse.'}{' '}
            <Link to="/career-profile" className="font-semibold text-[#e89372] underline decoration-[#d97757]/50 underline-offset-2">
              Profil öffnen
            </Link>
          </p>
        </div>
      )}

      {showForm ? (
        <section className="rounded-[20px] border border-[#3a332d] bg-[#232019] p-5 sm:p-6">
          <label className="block">
            <span className="text-sm font-medium text-[#f5f1eb]">Stellenanzeige</span>
            <p className="mt-1 text-xs text-[#a89e91]">
              Text der Anzeige einfügen, egal ob Pflege, Vertrieb, Büro, Handwerk oder IT. Eine URL allein reicht nicht. Bitte den Anzeigentext kopieren.
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
              onClick={() => void runAnalyze()}
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

      {busy ? (
        <div className="mt-4">
          <AnalyzeLoadingState />
        </div>
      ) : null}

      {showReport && report ? (
        <div className="pp-report-paper px-6 py-9 sm:px-10">
          <AnalyzeHeader
            tone="paper"
            title={role.title}
            subtitle={role.subtitle}
            score={report.globalScore}
            kicker={`Analysebericht · ${formatRelativeCreated(reportIsFromPreviousSession ? reportStoredAt : new Date().toISOString())}`}
          />

          <AnalyzeHero
            score={report.globalScore}
            factGateCount={factGateCount}
            coveredCount={gap.existing.length}
            requirementTotal={requirementCount(gap)}
            missingCount={gap.gap.length}
            roleAlignment={dims.roleAlignment}
            warningCount={userFacingWarnings(report.warnings).length}
          />
          <AnalyzeSubDimensions
            cvMatch={dims.cvMatch}
            roleAlignment={dims.roleAlignment}
            culture={dims.culture}
            redFlags={dims.redFlags}
          />
          <AnalyzeWarningBanner skillGap={gap} warnings={report.warnings} />
          <AnalyzeSkillBuckets skillGap={gap} />
          <AnalyzeBulletRewrites bullets={report.bullets ?? []} />
          <AnalyzeRoleSummary text={report.roleSummary ?? ''} />

          <button
            type="button"
            onClick={startNewAnalysis}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d97757] px-4 py-3.5 text-sm font-semibold text-[#1a1613] transition hover:bg-[#e89372] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Neue Analyse
          </button>
        </div>
      ) : null}
    </StandardPageContainer>
  )
}
