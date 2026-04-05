import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Check, FileText, Loader2, Upload, X, Link2, Briefcase, Gauge } from 'lucide-react'
import { INTERVIEW_LANGS } from '../../types'
import { extractTextFromPdf } from '../../utils/pdfParser'
import { buildTechnicalCvContext } from '../../utils/cvTechnicalContext'
import { analyzeCvJobMatch } from '../../utils/jobMatchAnalyzer'
import { askAgent } from '../../api/client'

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
        message: `Extract key requirements from this job URL in concise bullet points. Focus on qualifications, responsibilities, tools, and soft skills. Return plain bullets only, max 12 bullets. URL: ${url}`,
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
        setError('Die Stelle konnte über den Link nicht ausgelesen werden. Bitte füge die Ausschreibung manuell ein.')
        return
      }
    }

    if (!effectiveJobText) {
      setError('Bitte füge entweder einen Job-Link oder den Text der Stellenanzeige ein.')
      return
    }

    setIsAnalyzing(true)
    try {
      const cvProfile = /^SKILLS:/im.test(cvSource)
        ? cvSource.slice(0, 2400)
        : buildTechnicalCvContext(cvSource).slice(0, 2400)
      const match = analyzeCvJobMatch({
        cvProfile,
        jobText: effectiveJobText,
        jobUrl: normalizedJobUrl || undefined,
      })

      setCvAnalysis(cvProfile)
      setMatchScore(match.score)
      setMatchReport(match.report)
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

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl animate-slide-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interview Setup</h2>
            <p className="text-xs text-slate-500">Sprache, Profil und Stellenziel für den aktuellen Chat konfigurieren.</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center"
            aria-label="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-medium text-slate-700 mb-2">Interview Sprache</p>
              <div className="flex gap-2">
                {INTERVIEW_LANGS.map(option => (
                  <button
                    key={option.code}
                    onClick={() => setLanguage(option.code)}
                    className={[
                      'flex-1 text-sm py-2 rounded-lg border transition-colors',
                      language === option.code
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-primary hover:text-primary',
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
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-primary outline-none"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center gap-1.5 text-slate-700 mb-2">
              <FileText size={14} className="text-indigo-500" />
              <p className="text-xs font-medium">Lebenslauf Quelle</p>
              {uploadedCvFileName && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 ml-auto">{uploadedCvFileName}</span>
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
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60 mb-2"
            >
              {isParsingPdf ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              PDF hochladen
            </button>

            <textarea
              value={manualCvInput}
              onChange={e => setManualCvInput(e.target.value)}
              rows={5}
              placeholder="Oder Lebenslauf Text manuell einfügen"
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 resize-y min-h-[110px] focus:border-primary outline-none"
            />
          </div>

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center gap-1.5 text-slate-700 mb-2">
              <Briefcase size={14} className="text-amber-600" />
              <p className="text-xs font-medium">Stellenziel</p>
            </div>

            <label className="text-[11px] text-slate-600 flex items-center gap-1 mb-1">
              <Link2 size={12} /> Job Link
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={e => setJobUrl(e.target.value)}
              placeholder="https://..."
              className="w-full mb-2 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:border-primary outline-none"
            />

            <label className="text-[11px] text-slate-600 mb-1 block">Oder Stellenanzeige Text</label>
            <textarea
              value={jobText}
              onChange={e => setJobText(e.target.value)}
              rows={5}
              placeholder="Job Anforderungen und Aufgaben hier einfügen"
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 resize-y min-h-[110px] focus:border-primary outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2">
            <p className="text-[11px] text-indigo-700 leading-relaxed">
              Analyse läuft lokal mit anonymisiertem Profil. Für Job-Links wird nur die Stelleninformation geladen.
            </p>
            <button
              onClick={handleAnalyze}
              disabled={isParsingPdf || isResolvingJob || isAnalyzing}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
            >
              {(isAnalyzing || isResolvingJob) ? 'Analysiere...' : 'Analyse starten'}
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {matchScore !== null && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                  <Gauge size={13} /> Match Analyse
                </div>
                <span className="text-sm font-bold text-emerald-700">{matchScore}/100</span>
              </div>

              <pre className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-emerald-100 rounded-lg p-3 max-h-[260px] overflow-y-auto">
                {matchReport}
              </pre>

              <p className="text-[11px] text-slate-500">
                Hinweis: Diese Analyse wird beim Speichern in den aktuellen Chat übernommen.
              </p>
            </div>
          )}

          {cvAnalysis.trim() && !matchReport.trim() && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-1.5 text-slate-700 text-xs font-medium mb-2">
                <Check size={13} /> CV Profil (vorläufig)
              </div>
              <pre className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed bg-slate-50 border border-slate-100 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                {cvAnalysis}
              </pre>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-200 text-slate-600 rounded-lg py-2.5 text-sm hover:border-slate-300"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isParsingPdf || isResolvingJob || isAnalyzing}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Für diesen Chat speichern
          </button>
        </div>
      </div>
    </div>
  )
}
