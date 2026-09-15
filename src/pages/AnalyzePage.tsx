import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import AppCtaButton from '../components/ui/AppCtaButton'
import PageHeader from '../components/layout/PageHeader'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import { useCareerProfile } from '../hooks/useCareerProfile'
import {
  analyzeJob,
  AnalyzeApiError,
  jobDescriptionLengthOk,
  MIN_JD_CHARS,
  MAX_JD_CHARS,
  type AnalyzeReport,
} from '../api/analyzeClient'
import { UsageLimitError } from '../api/agentClient'

const REPORT_KEY = 'privateprep_last_analyze_report'

function readStoredReport(): AnalyzeReport | null {
  try {
    const raw = sessionStorage.getItem(REPORT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AnalyzeReport
  } catch {
    return null
  }
}

function storeReport(report: AnalyzeReport): void {
  try {
    sessionStorage.setItem(REPORT_KEY, JSON.stringify(report))
  } catch { /* ignore quota */ }
}

function scoreLabel(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function cultureLabel(value: string): string {
  switch (value) {
    case 'pass': return 'bestanden'
    case 'caution': return 'Vorsicht'
    case 'fail': return 'nicht bestanden'
    default: return 'nicht bewertet'
  }
}

function SkillPills({ items, empty, tone }: { items: string[]; empty: string; tone: 'ok' | 'gap' | 'muted' }) {
  if (!items.length) {
    return <p className="text-sm text-stone-500">{empty}</p>
  }
  const cls =
    tone === 'ok'
      ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100'
      : tone === 'gap'
        ? 'border-rose-500/30 bg-rose-950/35 text-rose-100'
        : 'border-stone-600/40 bg-white/[0.04] text-stone-200'
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <li key={item} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function ReportView({ report }: { report: AnalyzeReport }) {
  const dims = report.dimensions ?? { cvMatch: 0, roleAlignment: 0, culture: 0, redFlags: 0 }
  const gap = report.skillGap ?? { existing: [], supportedByResume: [], gap: [], extractedJdSkills: [], reasonCode: '' }
  const bullets = report.bullets ?? []
  const warnings = report.warnings ?? []
  const violations = report.factViolations ?? []

  return (
    <div className="mt-8 space-y-6">
      <section className="rounded-2xl border border-amber-500/25 bg-app-surface/90 p-5 shadow-landing">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Gesamt-Match</p>
        <p className="mt-2 font-serif text-5xl font-bold text-stone-50">{scoreLabel(report.globalScore)}</p>
        <p className="mt-1 text-sm text-stone-400">von 5,0</p>
        {report.roleSummary ? (
          <p className="mt-4 text-sm leading-relaxed text-stone-300">{report.roleSummary}</p>
        ) : null}
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['CV-Match', dims.cvMatch],
            ['Rollenpassung', dims.roleAlignment],
            ['Kultur', dims.culture],
            ['Red Flags', dims.redFlags],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-xl bg-black/20 px-3 py-2">
              <dt className="text-[11px] uppercase tracking-wide text-stone-500">{label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-stone-100">{scoreLabel(Number(value))}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-sm text-stone-400">
          Kulturscreening: <span className="font-medium text-stone-200">{cultureLabel(report.cultureScreen)}</span>
        </p>
      </section>

      {warnings.length > 0 && (
        <section className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4 text-sm text-amber-100">
          <p className="mb-2 font-semibold">Hinweise</p>
          <ul className="list-disc space-y-1 pl-5">
            {warnings.map(w => <li key={w}>{w}</li>)}
          </ul>
        </section>
      )}

      {violations.length > 0 && (
        <section className="rounded-2xl border border-rose-500/30 bg-rose-950/25 p-4 text-sm text-rose-100">
          <p className="mb-2 font-semibold">Fact-Gate: Formulierungen gekürzt</p>
          <ul className="space-y-2">
            {violations.map((v, i) => (
              <li key={`${v.violationType}-${i}`}>
                <span className="font-medium">{v.violationType}</span>
                {v.snippet ? <span className="text-rose-200/80"> — {v.snippet}</span> : null}
                {v.reason ? <p className="mt-0.5 text-xs text-rose-200/70">{v.reason}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl border border-stone-600/40 bg-app-surface/90 p-5">
        <h2 className="text-lg font-semibold text-stone-50">Skill-Lücken</h2>
        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Im Lebenslauf</h3>
            <SkillPills items={gap.existing} empty="Keine Treffer" tone="ok" />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Durch CV gestützt</h3>
            <SkillPills items={gap.supportedByResume} empty="Keine Treffer" tone="muted" />
          </div>
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-stone-500">Fehlt</h3>
            <SkillPills items={gap.gap} empty="Keine Lücken erkannt" tone="gap" />
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-600/40 bg-app-surface/90 p-5">
        <h2 className="text-lg font-semibold text-stone-50">Formulierungen</h2>
        {bullets.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Keine Umschreibungen in diesem Bericht.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {bullets.map((b, i) => (
              <li key={i} className="rounded-xl border border-white/8 bg-black/15 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Original</p>
                <p className="mt-1 text-sm text-stone-400">{b.originalBullet}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-400/90">Vorschlag</p>
                <p className="mt-1 text-sm text-stone-100">{b.rewrittenBullet}</p>
                {b.reasoning ? (
                  <p className="mt-2 text-xs leading-relaxed text-stone-500">{b.reasoning}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function AnalyzePage() {
  const { getToken } = useAuth()
  const { profile, loading: profileLoading } = useCareerProfile()
  const [jobText, setJobText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AnalyzeReport | null>(() => readStoredReport())

  useEffect(() => {
    if (report) storeReport(report)
  }, [report])

  const cvReady = (profile?.cvRawText?.trim().length ?? 0) >= 50
  const jdLen = jobText.trim().length
  const jdOk = jobDescriptionLengthOk(jobText)
  const lengthHint = useMemo(() => {
    if (jdLen === 0) return `Mindestens ${MIN_JD_CHARS} Zeichen.`
    if (jdLen < MIN_JD_CHARS) return `Noch ${MIN_JD_CHARS - jdLen} Zeichen.`
    if (jdLen > MAX_JD_CHARS) return `${jdLen - MAX_JD_CHARS} Zeichen über dem Limit.`
    return `${jdLen.toLocaleString('de-DE')} Zeichen`
  }, [jdLen])

  const runAnalyze = async () => {
    setError(null)
    if (!cvReady) {
      setError('Bitte zuerst einen Lebenslauf im Profil hinterlegen.')
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
      const { report: next } = await analyzeJob(jobText.trim(), token)
      setReport(next)
    } catch (e) {
      if (e instanceof UsageLimitError) {
        setError(e.message || 'Tageslimit erreicht. Mit Premium unbegrenzt analysieren.')
      } else if (e instanceof AnalyzeApiError && e.errorCode === 'profile_incomplete') {
        setError('Profil unvollständig. Bitte Lebenslauf und Basisdaten ergänzen.')
      } else {
        setError(e instanceof Error ? e.message : 'Analyse fehlgeschlagen.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <StandardPageContainer className="w-full pb-10 pt-3 sm:py-6">
      <PageHeader pageKey="analyze" className="mb-5" />

      {!profileLoading && !cvReady && (
        <div className="mb-5 flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
          <p>
            Ohne Lebenslauf keine Analyse.{' '}
            <Link to="/career-profile" className="font-semibold underline decoration-amber-400/50 underline-offset-2">
              Profil öffnen
            </Link>
          </p>
        </div>
      )}

      <section className="rounded-2xl border border-stone-600/40 bg-app-surface/90 p-5 shadow-landing">
        <label className="block">
          <span className="text-sm font-medium text-stone-200">Stellenanzeige</span>
          <p className="mt-1 text-xs text-stone-500">
            Text der Anzeige einfügen. Eine URL allein reicht nicht — bitte den Anzeigentext kopieren.
          </p>
          <textarea
            value={jobText}
            onChange={e => setJobText(e.target.value)}
            rows={12}
            placeholder="Stellenanzeige hier einfügen…"
            className="mt-3 w-full rounded-xl border border-app-border bg-black/20 px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-stone-500">{lengthHint}</p>
          <AppCtaButton
            size="lg"
            onClick={() => void runAnalyze()}
            disabled={busy || !jdOk || !cvReady}
            loading={busy}
          >
            {busy ? 'Analysiert…' : 'Analysieren'}
          </AppCtaButton>
        </div>
        {error && (
          <p className="mt-3 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-100" role="alert">
            {error}
          </p>
        )}
      </section>

      {busy && !report && (
        <div className="mt-8 flex items-center justify-center gap-2 text-sm text-stone-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Analyse läuft…
        </div>
      )}

      {report ? <ReportView report={report} /> : null}
    </StandardPageContainer>
  )
}
