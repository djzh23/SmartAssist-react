import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  FileText,
  Gauge,
  Link2,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import { INTERVIEW_LANGS } from '../../types'
import { askAgent } from '../../api/client'
import { buildTechnicalCvContext, sanitizeTechnicalContext } from '../../utils/cvTechnicalContext'
import { analyzeCvJobMatch } from '../../utils/jobMatchAnalyzer'
import { extractTextFromPdf } from '../../utils/pdfParser'

export interface InterviewSetupData {
  language: string
  alias: string
  cvText: string
  jobUrl: string
  jobText: string
  matchScore: number | null
  matchReport: string
}

interface Props {
  isOpen: boolean
  sessionId: string | null
  initialData: InterviewSetupData
  onClose: () => void
  onSave: (data: InterviewSetupData) => void
}

type ScoreBreakdown = {
  essentials: number
  requirements: number
  evidence: number
  keywords: number
}

type RequirementItem = {
  text: string
  essential: boolean
  matched: boolean
  strength: 'none' | 'low' | 'medium' | 'high'
  matchedTerms: string[]
}

function parseBreakdownFromReport(report: string): ScoreBreakdown | null {
  const essentials = report.match(/Muss-Anforderungen:\s*(\d+)\/100/i)
  const requirements = report.match(/Gesamtanforderungen:\s*(\d+)\/100/i)
  const evidence = report.match(/Nachweis im Lebenslauf:\s*(\d+)\/100/i)
  const keywords = report.match(/Schlüsselbegriffe:\s*(\d+)\/100/i)

  if (!essentials || !requirements || !evidence || !keywords) return null

  return {
    essentials: Number(essentials[1]),
    requirements: Number(requirements[1]),
    evidence: Number(evidence[1]),
    keywords: Number(keywords[1]),
  }
}

function getScoreTheme(score: number): { label: string; card: string; border: string; accent: string; bar: string } {
  if (score >= 75) {
    return {
      label: 'Sehr gute Übereinstimmung',
      card: 'bg-emerald-50',
      border: 'border-emerald-200',
      accent: 'text-emerald-700',
      bar: 'bg-emerald-500',
    }
  }

  if (score >= 50) {
    return {
      label: 'Teilweise Übereinstimmung',
      card: 'bg-amber-50',
      border: 'border-amber-200',
      accent: 'text-amber-700',
      bar: 'bg-amber-500',
    }
  }

  return {
    label: 'Niedrige Übereinstimmung',
    card: 'bg-rose-50',
    border: 'border-rose-200',
    accent: 'text-rose-700',
    bar: 'bg-rose-500',
  }
}

function strengthLabel(level: RequirementItem['strength']): string {
  if (level === 'high') return 'stark'
  if (level === 'medium') return 'solide'
  if (level === 'low') return 'schwach'
  return 'kein Treffer'
}

export default function InterviewSetupModal({
  isOpen,
  sessionId,
  initialData,
  onClose,
  onSave,
}: Props) {
  const [language, setLanguage] = useState(initialData.language)
  const [alias, setAlias] = useState(initialData.alias)

  const [manualCvInput, setManualCvInput] = useState('')
  const [uploadedCvRawText, setUploadedCvRawText] = useState<string | null>(null)
  const [uploadedCvFileName, setUploadedCvFileName] = useState<string | null>(null)

  const [jobUrl, setJobUrl] = useState(initialData.jobUrl)
  const [jobText, setJobText] = useState(initialData.jobText)
  const [resolvedJobText, setResolvedJobText] = useState('')

  const [cvAnalysis, setCvAnalysis] = useState(initialData.cvText)
  const [matchScore, setMatchScore] = useState<number | null>(initialData.matchScore)
  const [matchReport, setMatchReport] = useState(initialData.matchReport)
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(() => parseBreakdownFromReport(initialData.matchReport))
  const [requirementMatches, setRequirementMatches] = useState<RequirementItem[]>([])
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([])
  const [missingKeywords, setMissingKeywords] = useState<string[]>([])

  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const [isResolvingJob, setIsResolvingJob] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return

    setLanguage(initialData.language || 'de')
    setAlias(initialData.alias || '')
    setJobUrl(initialData.jobUrl || '')
    setJobText(initialData.jobText || '')
    setCvAnalysis(initialData.cvText || '')
    setMatchScore(initialData.matchScore ?? null)
    setMatchReport(initialData.matchReport || '')
    setBreakdown(parseBreakdownFromReport(initialData.matchReport || ''))
    setRequirementMatches([])
    setMatchedKeywords([])
    setMissingKeywords([])

    setManualCvInput('')
    setUploadedCvRawText(null)
    setUploadedCvFileName(null)
    setResolvedJobText('')

    setError(null)
    setIsParsingPdf(false)
    setIsResolvingJob(false)
    setIsAnalyzing(false)
  }, [isOpen, initialData])

  if (!isOpen || !sessionId) return null

  const handleUploadPdf = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setIsParsingPdf(true)

    try {
      const rawText = await extractTextFromPdf(file)
      if (!rawText.trim()) {
        setUploadedCvRawText(null)
        setUploadedCvFileName(null)
        setError('Im PDF wurde kein lesbarer Text gefunden. Bitte nutze ein textbasiertes PDF.')
        return
      }

      setUploadedCvRawText(rawText)
      setUploadedCvFileName(file.name)
    } catch {
      setUploadedCvRawText(null)
      setUploadedCvFileName(null)
      setError('PDF konnte nicht verarbeitet werden. Bitte prüfe, ob es geschützt oder gescannt ist.')
    } finally {
      setIsParsingPdf(false)
    }
  }

  const resolveJobTextFromUrl = async (url: string): Promise<string> => {
    setIsResolvingJob(true)
    try {
      const res = await askAgent({
        sessionId: `setup-job-${Date.now()}`,
        message: `Extract the job requirements from this URL as bullet points. Focus on must-haves, responsibilities, tools, and soft skills. Max 14 bullets. URL: ${url}`,
      })
      return res.reply?.trim() ?? ''
    } finally {
      setIsResolvingJob(false)
    }
  }

  const handleAnalyze = async () => {
    setError(null)

    const cvSource = uploadedCvRawText?.trim() || manualCvInput.trim() || cvAnalysis.trim()
    if (!cvSource) {
      setError('Bitte lade zuerst deinen Lebenslauf hoch oder füge ihn manuell ein.')
      return
    }

    let effectiveJobText = jobText.trim()
    const normalizedJobUrl = jobUrl.trim()

    if (!effectiveJobText && normalizedJobUrl) {
      try {
        effectiveJobText = await resolveJobTextFromUrl(normalizedJobUrl)
        setResolvedJobText(effectiveJobText)
      } catch {
        setError('Die Stelle konnte über den Link nicht geladen werden. Bitte füge den Stellentext manuell ein.')
        return
      }
    }

    if (!effectiveJobText) {
      setError('Bitte füge entweder einen Job-Link oder den Text der Stellenanzeige ein.')
      return
    }

    setIsAnalyzing(true)
    try {
      const structuredCv = /^SKILLS:/im.test(cvSource)
        ? sanitizeTechnicalContext(cvSource).slice(0, 2500)
        : buildTechnicalCvContext(cvSource).slice(0, 2500)

      const sanitizedRaw = sanitizeTechnicalContext(cvSource).slice(0, 3600)
      const effectiveCvContext = [
        structuredCv,
        '',
        'ADDITIONAL PROFILE CONTEXT:',
        sanitizedRaw,
      ].join('\n')

      const match = analyzeCvJobMatch({
        cvProfile: effectiveCvContext,
        jobText: effectiveJobText,
        jobUrl: normalizedJobUrl || undefined,
      })

      setCvAnalysis(effectiveCvContext)
      setMatchScore(match.score)
      setMatchReport(match.report)
      setBreakdown(match.breakdown)
      setRequirementMatches(match.requirementMatches)
      setMatchedKeywords(match.matchedKeywords.slice(0, 12))
      setMissingKeywords(match.missingKeywords.slice(0, 12))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = () => {
    onSave({
      language,
      alias: alias.trim().slice(0, 40),
      cvText: cvAnalysis.trim(),
      jobUrl: jobUrl.trim(),
      jobText: (jobText.trim() || resolvedJobText.trim()).slice(0, 5000),
      matchScore,
      matchReport: matchReport.trim(),
    })
  }

  const scoreTheme = matchScore !== null ? getScoreTheme(matchScore) : null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interview Setup</h2>
            <p className="text-xs text-slate-500">Konfiguriere Sprache, Alias, Lebenslauf und Stellenziel für diesen Chat.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-medium text-slate-700">Interview-Sprache</p>
              <div className="flex gap-2">
                {INTERVIEW_LANGS.map(option => (
                  <button
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={[
                      'flex-1 rounded-lg border py-2 text-sm transition-colors',
                      language === option.code
                        ? 'border-primary bg-primary text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary',
                    ].join(' ')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Alias für Anonymisierung</label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                maxLength={40}
                placeholder="Zum Beispiel Alex"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-slate-700">
              <FileText size={14} className="text-indigo-500" />
              <p className="text-xs font-medium">Lebenslauf-Quelle</p>
              {uploadedCvFileName && (
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">{uploadedCvFileName}</span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUploadPdf}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsingPdf || isAnalyzing}
              className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60"
            >
              {isParsingPdf ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              PDF hochladen
            </button>

            <textarea
              value={manualCvInput}
              onChange={e => setManualCvInput(e.target.value)}
              rows={5}
              placeholder="Oder Lebenslauf-Text manuell einfügen"
              className="min-h-[110px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-slate-700">
              <Briefcase size={14} className="text-amber-600" />
              <p className="text-xs font-medium">Stellenziel</p>
            </div>

            <label className="mb-1 flex items-center gap-1 text-[11px] text-slate-600">
              <Link2 size={12} /> Job-Link
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={e => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="mb-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-primary"
            />

            <label className="mb-1 block text-[11px] text-slate-600">Oder Text der Stellenanzeige</label>
            <textarea
              value={jobText}
              onChange={e => setJobText(e.target.value)}
              rows={5}
              placeholder="Anforderungen und Aufgaben hier einfügen"
              className="min-h-[110px] w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-[11px] leading-relaxed text-indigo-700">
              Analyse läuft lokal mit anonymisiertem Profil. Bei Job-Links wird nur Stellenkontext geladen.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isParsingPdf || isResolvingJob || isAnalyzing}
              className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {(isAnalyzing || isResolvingJob) ? 'Analysiere...' : 'Analyse starten'}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {matchScore !== null && scoreTheme && (
            <div className={`space-y-3 rounded-xl border p-4 ${scoreTheme.card} ${scoreTheme.border}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className={`flex items-center gap-1.5 text-xs font-semibold ${scoreTheme.accent}`}>
                  <Gauge size={14} /> Match-Analyse
                </div>
                <div className={`rounded-full border bg-white px-2.5 py-1 text-sm font-bold ${scoreTheme.accent} ${scoreTheme.border}`}>
                  {matchScore}/100
                </div>
              </div>

              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/80">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${scoreTheme.bar}`}
                    style={{ width: `${Math.max(4, Math.min(100, matchScore))}%` }}
                  />
                </div>
                <p className={`mt-1 text-[11px] font-medium ${scoreTheme.accent}`}>{scoreTheme.label}</p>
              </div>

              {breakdown && (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {[
                    { label: 'Muss', value: breakdown.essentials, tone: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    { label: 'Gesamt', value: breakdown.requirements, tone: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
                    { label: 'Nachweis', value: breakdown.evidence, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { label: 'Keywords', value: breakdown.keywords, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
                  ].map(item => (
                    <div key={item.label} className={`rounded-lg border p-2 ${item.tone}`}>
                      <p className="text-[10px] font-semibold uppercase tracking-wide">{item.label}</p>
                      <p className="text-base font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                  <p className="mb-2 text-[11px] font-semibold text-emerald-700">Trefferbegriffe</p>
                  <div className="flex flex-wrap gap-1.5">
                    {matchReport && requirementMatches.length === 0 && (
                      <span className="text-[11px] text-slate-500">Nach dem nächsten Analyse-Lauf werden Details angezeigt.</span>
                    )}
                    {matchedKeywords.map(term => (
                      <span key={term} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] text-emerald-700">
                        {term}
                      </span>
                    ))}
                    {matchedKeywords.length === 0 && (
                      <span className="text-[11px] text-slate-500">Noch keine Treffer ermittelt.</span>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border border-rose-200 bg-white p-3">
                  <p className="mb-2 text-[11px] font-semibold text-rose-700">Fehlende Punkte</p>
                  <div className="flex flex-wrap gap-1.5">
                    {missingKeywords.map(term => (
                        <span key={term} className="rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">
                          {term}
                        </span>
                      ))}
                    {missingKeywords.length === 0 && (
                      <span className="text-[11px] text-slate-500">Keine kritischen Lücken erkannt.</span>
                    )}
                  </div>
                </div>
              </div>

              {requirementMatches.length > 0 && (
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles size={13} className="text-indigo-500" />
                    Anforderungen im Detail
                  </div>

                  <div className="max-h-[210px] space-y-2 overflow-y-auto pr-1">
                    {requirementMatches.map(item => (
                      <div
                        key={item.text}
                        className={[
                          'rounded-md border px-2.5 py-2 text-xs',
                          item.matched
                            ? 'border-emerald-200 bg-emerald-50/40'
                            : 'border-rose-200 bg-rose-50/40',
                        ].join(' ')}
                      >
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            {item.matched ? (
                              <CheckCircle2 size={13} className="text-emerald-600" />
                            ) : (
                              <AlertTriangle size={13} className="text-rose-600" />
                            )}
                            <span className="font-medium">{item.text}</span>
                          </div>
                          <span className={[
                            'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            item.essential
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-100 text-slate-600',
                          ].join(' ')}>
                            {item.essential ? 'Muss' : 'Optional'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">Trefferstärke: {strengthLabel(item.strength)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <details className="rounded-lg border border-slate-200 bg-white p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-700">Vollständigen Analysebericht anzeigen</summary>
                <pre className="mt-2 max-h-[220px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
                  {matchReport}
                </pre>
              </details>

              <p className="text-[11px] text-slate-500">
                Hinweis: Beim Speichern wird die Analyse nur diesem aktuellen Chat zugeordnet.
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm text-slate-600 hover:border-slate-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isParsingPdf || isResolvingJob || isAnalyzing}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Für diesen Chat speichern
          </button>
        </div>
      </div>
    </div>
  )
}
