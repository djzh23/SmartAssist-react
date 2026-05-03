import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import {
  Briefcase,
  CheckCircle2,
  FileText,
  Link2,
  Loader2,
  Upload,
  X,
} from 'lucide-react'
import { INTERVIEW_LANGS } from '../../types'
import { askAgent } from '../../api/client'
import { buildTechnicalCvContext, sanitizeTechnicalContext } from '../../utils/cvTechnicalContext'
import { extractTextFromPdf } from '../../utils/pdfParser'

export interface InterviewSetupData {
  language: string
  alias: string
  cvText: string
  jobUrl: string
  jobText: string
}

interface Props {
  isOpen: boolean
  sessionId: string | null
  initialData: InterviewSetupData
  onClose: () => void
  onSave: (data: InterviewSetupData) => void
}

function compactLines(text: string, maxLines: number, maxChars: number): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map(line => line.replace(/^[-*•\s]+/, '').trim())
    .filter(Boolean)

  const out: string[] = []
  let length = 0

  for (const line of lines) {
    if (out.length >= maxLines || length >= maxChars) break
    const room = maxChars - length
    const normalized = line.length > room ? `${line.slice(0, Math.max(0, room - 1)).trim()}…` : line
    if (!normalized) break
    out.push(normalized)
    length += normalized.length + 1
  }

  return out.join('\n')
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

  const [cvAnalysis, setCvAnalysis] = useState(initialData.cvText)
  const [resolvedJobText, setResolvedJobText] = useState('')
  const [analysisReady, setAnalysisReady] = useState(false)

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
    setResolvedJobText('')
    setAnalysisReady(false)

    setManualCvInput('')
    setUploadedCvRawText(null)
    setUploadedCvFileName(null)

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
        message: [
          'Extrahiere aus diesem Job-Link nur die expliziten Anforderungen und Aufgaben.',
          'Format: kurze Bullet-Points ohne Einleitung, maximal 12 Zeilen.',
          'Fokus: Muss-Kriterien, Aufgaben, Tools, Soft Skills.',
          `URL: ${url}`,
        ].join('\n'),
      })

      const text = res.reply?.trim() ?? ''

      const isRefusal =
        text.length < 80 ||
        /\b(cannot|can't|unable|kein zugriff|kann nicht|nicht zugreifen|leider|sorry|no access|not able)\b/i.test(text)

      if (isRefusal) throw new Error('URL_UNRESOLVABLE')

      return compactLines(text, 12, 1400)
    } finally {
      setIsResolvingJob(false)
    }
  }

  const handleAnalyze = async () => {
    setError(null)
    setAnalysisReady(false)

    const cvSource = uploadedCvRawText?.trim() || manualCvInput.trim() || cvAnalysis.trim()
    if (!cvSource) {
      setError('Bitte lade zuerst deinen Lebenslauf hoch oder füge ihn manuell ein.')
      return
    }

    const normalizedJobUrl = jobUrl.trim()
    let effectiveJobText = compactLines(jobText.trim(), 14, 1700)

    if (!effectiveJobText && normalizedJobUrl) {
      try {
        effectiveJobText = await resolveJobTextFromUrl(normalizedJobUrl)
        setResolvedJobText(effectiveJobText)
      } catch {
        setError('Der Job-Link konnte nicht ausgewertet werden. Bitte kopiere den Text der Stellenanzeige direkt in das Feld darunter.')
        return
      }
    }

    if (!effectiveJobText && !normalizedJobUrl) {
      setError('Bitte füge entweder einen Job-Link oder den Text der Stellenanzeige ein.')
      return
    }

    setIsAnalyzing(true)
    try {
      const structuredCv = /^SKILLS:/im.test(cvSource)
        ? sanitizeTechnicalContext(cvSource).slice(0, 1800)
        : buildTechnicalCvContext(cvSource).slice(0, 1800)

      setCvAnalysis(structuredCv)
      setAnalysisReady(true)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = () => {
    const effectiveJobText = compactLines(jobText.trim() || resolvedJobText.trim(), 14, 1700)

    onSave({
      language,
      alias: alias.trim().slice(0, 40),
      cvText: cvAnalysis.trim().slice(0, 2200),
      jobUrl: jobUrl.trim(),
      jobText: effectiveJobText,
    })
  }

  const isBusy = isParsingPdf || isResolvingJob || isAnalyzing

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interview Setup</h2>
            <p className="text-xs text-slate-500">Sprache, Alias, Lebenslauf und Stelle für diesen Chat.</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 overflow-y-auto px-5 py-4">
          {/* Language + Alias */}
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

          {/* CV */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-1.5 text-slate-700">
              <FileText size={14} className="text-sky-500" />
              <p className="text-xs font-medium">Lebenslauf-Quelle</p>
              {uploadedCvFileName && (
                <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-700">
                  {uploadedCvFileName}
                </span>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={handleUploadPdf} />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isBusy}
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

          {/* Job */}
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

          {/* Analyse trigger */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-2">
            <p className="text-[11px] leading-relaxed text-sky-700">
              Lebenslauf wird lokal aufbereitet. Bei Job-Links wird nur der Stellenkontext geladen.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isBusy}
              className="whitespace-nowrap rounded-lg bg-sky-600 px-3 py-2 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 size={12} className="animate-spin" />
                  {isResolvingJob ? 'Stelle laden…' : 'Aufbereiten…'}
                </span>
              ) : 'Kontext aufbereiten'}
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}

          {analysisReady && (
            <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                Kontext aufbereitet - bereit zum Speichern
              </div>

              {/* CV preview */}
              {cvAnalysis && (
                <div className="rounded-lg border border-emerald-200 bg-white p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
                    Lebenslauf-Kontext (aufbereitet)
                  </p>
                  <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                    {cvAnalysis.slice(0, 600)}{cvAnalysis.length > 600 ? '…' : ''}
                  </pre>
                </div>
              )}

              {/* Job preview */}
              {(resolvedJobText || jobText.trim()) && (
                <div className="rounded-lg border border-amber-200 bg-white p-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-600">
                    Stellenkontext {resolvedJobText ? '(via Link geladen)' : ''}
                  </p>
                  <pre className="max-h-32 overflow-y-auto whitespace-pre-wrap text-[11px] leading-relaxed text-slate-700">
                    {(resolvedJobText || jobText).slice(0, 400)}{(resolvedJobText || jobText).length > 400 ? '…' : ''}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 border-t border-slate-200 px-5 py-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm text-slate-600 hover:border-slate-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isBusy}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Für diesen Chat speichern
          </button>
        </div>
      </div>
    </div>
  )
}

