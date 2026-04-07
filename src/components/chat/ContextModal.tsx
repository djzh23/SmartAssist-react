import { useEffect, useMemo, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { PROGRAMMING_LANGUAGES } from '../../types'

export type ContextModalToolType = 'jobanalyzer' | 'interview' | 'interviewprep' | 'programming'

export interface ContextPayload {
  cvText: string
  jobText: string
  jobTitle: string
  companyName: string
  programmingLanguage: string
  programmingLanguageId: string
}

interface Props {
  toolType: ContextModalToolType
  sessionId: string
  initialData?: Partial<ContextPayload>
  onClose: () => void
  onContextSet: (payload: ContextPayload) => void
}

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
const JOB_TEXT_MAX = 7000
const CV_TEXT_MAX = 4200
const TITLE_MAX = 180
const COMPANY_MAX = 180

function trimTo(value: string, max: number): string {
  return value.trim().slice(0, max)
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as { error?: string; message?: string }
    return data.error ?? data.message ?? fallback
  } catch {
    return fallback
  }
}

function mapToolType(toolType: ContextModalToolType): 'jobanalyzer' | 'interviewprep' | 'programming' {
  if (toolType === 'interview') return 'interviewprep'
  return toolType
}

export default function ContextModal({ toolType, sessionId, initialData, onClose, onContextSet }: Props) {
  const { user } = useUser()
  const { getToken } = useAuth()

  const [step, setStep] = useState(1)
  const [cvText, setCvText] = useState(initialData?.cvText ?? '')
  const [jobText, setJobText] = useState(initialData?.jobText ?? '')
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle ?? '')
  const [companyName, setCompanyName] = useState(initialData?.companyName ?? '')
  const [programmingLanguageId, setProgrammingLanguageId] = useState(initialData?.programmingLanguageId ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveToolType = useMemo(() => mapToolType(toolType), [toolType])
  const languageOptions = useMemo(
    () => [...PROGRAMMING_LANGUAGES.map(lang => ({ id: lang.id, label: lang.label })), { id: 'other', label: 'Andere' }],
    [],
  )

  const trimmedJobText = trimTo(jobText, JOB_TEXT_MAX)
  const trimmedCvText = trimTo(cvText, CV_TEXT_MAX)
  const trimmedJobTitle = trimTo(jobTitle, TITLE_MAX)
  const trimmedCompanyName = trimTo(companyName, COMPANY_MAX)

  const jobWasTrimmed = jobText.trim().length > JOB_TEXT_MAX
  const cvWasTrimmed = cvText.trim().length > CV_TEXT_MAX

  useEffect(() => {
    const derivedProgrammingId = initialData?.programmingLanguageId
      || languageOptions.find(option => option.label.toLowerCase() === (initialData?.programmingLanguage ?? '').toLowerCase())?.id
      || ''

    setStep(1)
    setCvText(initialData?.cvText ?? '')
    setJobText(initialData?.jobText ?? '')
    setJobTitle(initialData?.jobTitle ?? '')
    setCompanyName(initialData?.companyName ?? '')
    setProgrammingLanguageId(derivedProgrammingId)
    setError(null)
  }, [initialData, languageOptions, sessionId, toolType])

  const submitContext = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()
      const selectedLanguageLabel = languageOptions.find(option => option.id === programmingLanguageId)?.label ?? null

      const response = await fetch(`${API_URL}/api/agent/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          toolType: effectiveToolType,
          cvText: trimmedCvText || null,
          jobText: trimmedJobText || null,
          jobTitle: trimmedJobTitle || null,
          companyName: trimmedCompanyName || null,
          programmingLanguage: selectedLanguageLabel,
          userId: user?.id ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Kontext konnte nicht gespeichert werden (${response.status})`))
      }

      onContextSet({
        cvText: trimmedCvText,
        jobText: trimmedJobText,
        jobTitle: trimmedJobTitle,
        companyName: trimmedCompanyName,
        programmingLanguage: selectedLanguageLabel ?? '',
        programmingLanguageId: programmingLanguageId.trim(),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Kontext konnte nicht gespeichert werden')
    } finally {
      setLoading(false)
    }
  }

  if (effectiveToolType === 'interviewprep') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <div className="modal-header">
            <span>Interview Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          {step === 1 && (
            <div className="modal-body">
              <h3>Schritt 1 von 2: Zielstelle</h3>
              <p className="modal-subtitle">
                Für welche Rolle möchtest du dich vorbereiten?
              </p>

              <label>Stellenbezeichnung *</label>
              <input
                value={jobTitle}
                onChange={event => setJobTitle(event.target.value)}
                placeholder="z. B. Senior .NET Developer"
                className="modal-input"
              />

              <label>Unternehmen</label>
              <input
                value={companyName}
                onChange={event => setCompanyName(event.target.value)}
                placeholder="z. B. Siemens AG"
                className="modal-input"
              />

              <label>Stellenbeschreibung</label>
              <textarea
                value={jobText}
                onChange={event => setJobText(event.target.value)}
                placeholder="Füge die vollständige Stellenausschreibung hier ein..."
                className="modal-textarea"
                rows={5}
              />

              {jobWasTrimmed && (
                <p className="modal-hint text-amber-700">
                  Hinweis: Der Stellenkontext wird auf {JOB_TEXT_MAX} Zeichen gekürzt.
                </p>
              )}

              <div className="modal-actions">
                <button onClick={onClose} className="btn-ghost">
                  Später
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                  disabled={!trimmedJobTitle}
                >
                  Weiter →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-body">
              <h3>Schritt 2 von 2: Lebenslauf</h3>
              <p className="modal-subtitle">
                Füge deinen Lebenslauf ein, damit die Fragen auf dein Profil abgestimmt werden.
              </p>

              <label>Lebenslauf (Text)</label>
              <textarea
                value={cvText}
                onChange={event => setCvText(event.target.value)}
                placeholder="Füge hier deinen Lebenslauf als Text ein..."
                className="modal-textarea"
                rows={8}
              />

              <p className="modal-hint">
                Daten bleiben lokal im Browser-Kontext. Teile keine sensiblen Inhalte im Chat.
              </p>

              {cvWasTrimmed && (
                <p className="modal-hint text-amber-700">
                  Hinweis: Der Lebenslauf-Kontext wird auf {CV_TEXT_MAX} Zeichen gekürzt.
                </p>
              )}

              {error && <p className="modal-error">{error}</p>}

              <div className="modal-actions">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  ← Zurück
                </button>
                <button onClick={() => void submitContext()} className="btn-primary" disabled={loading}>
                  {loading ? 'Wird vorbereitet...' : 'Interview starten'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (effectiveToolType === 'jobanalyzer') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <div className="modal-header">
            <span>Job Analyzer Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <h3>Stellenanzeige einfügen</h3>
            <p className="modal-subtitle">
              Ergänze Ausschreibung und optional Lebenslauf für eine gezielte Analyse.
            </p>

            <label>Stellenanzeige oder URL</label>
            <textarea
              value={jobText}
              onChange={event => setJobText(event.target.value)}
              placeholder="Füge hier die vollständige Stellenausschreibung oder den Link ein..."
              className="modal-textarea"
              rows={8}
            />

            <label>Lebenslauf (optional)</label>
            <textarea
              value={cvText}
              onChange={event => setCvText(event.target.value)}
              placeholder="Optional: Lebenslauf einfügen für eine präzisere Passungsanalyse..."
              className="modal-textarea"
              rows={4}
            />

            {(jobWasTrimmed || cvWasTrimmed) && (
              <p className="modal-hint text-amber-700">
                Hinweis: Sehr lange Eingaben werden für stabile Analyse automatisch gekürzt.
              </p>
            )}

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button onClick={onClose} className="btn-ghost">
                Überspringen
              </button>
              <button
                onClick={() => void submitContext()}
                disabled={!trimmedJobText || loading}
                className="btn-primary"
              >
                {loading ? 'Analyse läuft...' : 'Analyse starten'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (effectiveToolType === 'programming') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <div className="modal-header">
            <span>Programming Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <h3>In welcher Sprache arbeitest du?</h3>
            <p className="modal-subtitle">
              Antworten werden auf Best Practices und Idiome deiner Sprache ausgerichtet.
            </p>

            <div className="lang-grid">
              {languageOptions.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => setProgrammingLanguageId(lang.id)}
                  className={`lang-btn ${programmingLanguageId === lang.id ? 'selected' : ''}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button onClick={onClose} className="btn-ghost">
                Überspringen
              </button>
              <button
                onClick={() => void submitContext()}
                disabled={!programmingLanguageId.trim() || loading}
                className="btn-primary"
              >
                {loading ? 'Wird vorbereitet...' : 'Coding starten'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
