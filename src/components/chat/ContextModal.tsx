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
    () => [...PROGRAMMING_LANGUAGES.map(lang => ({ id: lang.id, label: lang.label })), { id: 'other', label: 'Other' }],
    [],
  )

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
          cvText: cvText || null,
          jobText: jobText || null,
          jobTitle: jobTitle || null,
          companyName: companyName || null,
          programmingLanguage: selectedLanguageLabel,
          userId: user?.id ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Failed to save context (${response.status})`))
      }

      onContextSet({
        cvText: cvText.trim(),
        jobText: jobText.trim(),
        jobTitle: jobTitle.trim(),
        companyName: companyName.trim(),
        programmingLanguage: selectedLanguageLabel ?? '',
        programmingLanguageId: programmingLanguageId.trim(),
      })
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save context')
    } finally {
      setLoading(false)
    }
  }

  if (effectiveToolType === 'interviewprep') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box">
          <div className="modal-header">
            <span>🎯 Interview Preparation Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          {step === 1 && (
            <div className="modal-body">
              <h3>Step 1 of 2: Job Details</h3>
              <p className="modal-subtitle">
                Tell us what role you are preparing for.
              </p>
              <label>Job Title *</label>
              <input
                value={jobTitle}
                onChange={event => setJobTitle(event.target.value)}
                placeholder="e.g. Senior .NET Developer"
                className="modal-input"
              />
              <label>Company Name</label>
              <input
                value={companyName}
                onChange={event => setCompanyName(event.target.value)}
                placeholder="e.g. Siemens AG"
                className="modal-input"
              />
              <label>Job Description (paste here)</label>
              <textarea
                value={jobText}
                onChange={event => setJobText(event.target.value)}
                placeholder="Paste the full job description for personalized questions..."
                className="modal-textarea"
                rows={5}
              />
              <div className="modal-actions">
                <button onClick={onClose} className="btn-ghost">
                  Skip for now
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="btn-primary"
                  disabled={!jobTitle.trim()}
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="modal-body">
              <h3>Step 2 of 2: Your CV</h3>
              <p className="modal-subtitle">
                Paste your CV for personalized interview questions based on your actual experience.
              </p>
              <label>Your CV / Resume (paste text)</label>
              <textarea
                value={cvText}
                onChange={event => setCvText(event.target.value)}
                placeholder="Paste your CV text here..."
                className="modal-textarea"
                rows={8}
              />
              <p className="modal-hint">
                🔒 Your CV stays in your browser session and local device context.
              </p>

              {error && <p className="modal-error">{error}</p>}

              <div className="modal-actions">
                <button onClick={() => setStep(1)} className="btn-ghost">
                  ← Back
                </button>
                <button onClick={() => void submitContext()} className="btn-primary" disabled={loading}>
                  {loading ? 'Setting up...' : 'Start Interview Prep 🎯'}
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
            <span>💼 Job Analyzer Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>
          <div className="modal-body">
            <h3>Paste the job posting</h3>
            <p className="modal-subtitle">
              Add the job description to get personalized CV tips, keywords, and application advice.
            </p>
            <label>Job Description or URL</label>
            <textarea
              value={jobText}
              onChange={event => setJobText(event.target.value)}
              placeholder="Paste the complete job posting here, or enter the job URL..."
              className="modal-textarea"
              rows={8}
            />
            <label>Your CV (optional for tailored advice)</label>
            <textarea
              value={cvText}
              onChange={event => setCvText(event.target.value)}
              placeholder="Paste your CV for specific optimization tips..."
              className="modal-textarea"
              rows={4}
            />

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions">
              <button onClick={onClose} className="btn-ghost">
                Skip — I will paste in chat
              </button>
              <button
                onClick={() => void submitContext()}
                disabled={!jobText.trim() || loading}
                className="btn-primary"
              >
                {loading ? 'Analyzing...' : 'Analyze Job 💼'}
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
            <span>💻 Programming Assistant Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>
          <div className="modal-body">
            <h3>What language are you working in?</h3>
            <p className="modal-subtitle">
              The AI will focus on patterns and best practices for your language.
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
                Skip
              </button>
              <button
                onClick={() => void submitContext()}
                disabled={!programmingLanguageId.trim() || loading}
                className="btn-primary"
              >
                {loading ? 'Setting up...' : 'Start Coding 💻'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
