import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Check, FileText, Loader2, Upload, X } from 'lucide-react'
import { INTERVIEW_LANGS } from '../../types'
import { extractTextFromPdf } from '../../utils/pdfParser'
import { buildTechnicalCvContext } from '../../utils/cvTechnicalContext'

export interface InterviewSetupData {
  language: string
  alias: string
  cvText: string
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
  const [manualInput, setManualInput] = useState('')
  const [uploadedRawText, setUploadedRawText] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState(initialData.cvText)
  const [isParsingPdf, setIsParsingPdf] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isOpen) return
    setLanguage(initialData.language || 'de')
    setAlias(initialData.alias || '')
    setAnalysis(initialData.cvText || '')
    setManualInput('')
    setUploadedRawText(null)
    setUploadedFileName(null)
    setError(null)
    setIsParsingPdf(false)
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
        setUploadedRawText(null)
        setUploadedFileName(null)
        setError('Im PDF wurde kein lesbarer Text gefunden. Bitte nutze ein textbasiertes PDF.')
        return
      }

      setUploadedRawText(rawText)
      setUploadedFileName(file.name)
    } catch {
      setUploadedRawText(null)
      setUploadedFileName(null)
      setError('PDF konnte nicht verarbeitet werden. Bitte prüfe, ob es geschützt oder gescannt ist.')
    } finally {
      setIsParsingPdf(false)
    }
  }

  const handleAnalyze = () => {
    setError(null)
    const source = (uploadedRawText?.trim() || manualInput.trim())

    if (!source) {
      setError('Bitte lade zuerst ein PDF hoch oder füge den CV Text manuell ein.')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = buildTechnicalCvContext(source).slice(0, 2000)
      setAnalysis(result)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSave = () => {
    onSave({
      language,
      alias: alias.trim().slice(0, 40),
      cvText: analysis.trim(),
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-up max-h-[88vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Interview Setup</h2>
            <p className="text-xs text-slate-500">Diese Einstellungen gelten nur für den aktuellen Chat.</p>
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

          <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-slate-700">
                <FileText size={14} className="text-indigo-500" />
                <p className="text-xs font-medium">CV Quelle</p>
              </div>
              {uploadedFileName && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5">{uploadedFileName}</span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleUploadPdf}
            />

            <div className="flex flex-wrap gap-2 mb-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isParsingPdf || isAnalyzing}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-primary hover:text-primary disabled:opacity-60"
              >
                {isParsingPdf ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                PDF hochladen
              </button>
            </div>

            <textarea
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              rows={6}
              placeholder="Oder CV Text manuell einfügen"
              className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 placeholder-slate-400 resize-y min-h-[120px] focus:border-primary outline-none"
            />

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-[11px] text-slate-500">Analyse läuft lokal im Browser. Es wird nur beruflich relevanter, anonymisierter Kontext übernommen.</p>
              <button
                onClick={handleAnalyze}
                disabled={isParsingPdf || isAnalyzing}
                className="px-3 py-2 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                {isAnalyzing ? 'Analysiere...' : 'Analysieren'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-xs text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {analysis.trim() && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3">
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium mb-2">
                <Check size={13} /> Analyse Ergebnis
              </div>
              <pre className="text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed bg-white border border-emerald-100 rounded-lg p-3 max-h-[220px] overflow-y-auto">
                {analysis}
              </pre>
              <p className="mt-2 text-[11px] text-slate-500">
                Hinweis: Dieses Ergebnis wird nur für den aktuellen Chat gespeichert.
              </p>
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
            disabled={isParsingPdf || isAnalyzing}
            className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Für diesen Chat speichern
          </button>
        </div>
      </div>
    </div>
  )
}

