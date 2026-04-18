import { useEffect, useMemo, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { PROGRAMMING_LANGUAGES } from '../../types'
import { sanitizeTechnicalContext } from '../../utils/cvTechnicalContext'

export type ContextModalToolType = 'jobanalyzer' | 'interview' | 'interviewprep' | 'programming'

export interface ContextPayload {
  cvText: string
  jobText: string
  jobTitle: string
  companyName: string
  programmingLanguage: string
  programmingLanguageId: string
  generalCoaching?: boolean
  includeProfileCvInSetup?: boolean
  extraSkills: string
  extraProjects: string
  extraExperienceNotes: string
}

type InitialModalData = Partial<ContextPayload> & { profileCvPrefilled?: boolean }

interface Props {
  toolType: ContextModalToolType
  sessionId: string
  initialData?: InitialModalData
  /** Roh-Text aus Karriereprofil — wird nur mit Einverständnis in Setup gemischt, nicht als Textfeld editiert. */
  profileCvFromCareer?: string
  onClose: () => void
  onContextSet: (payload: ContextPayload) => void
}

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || ''
const JOB_TEXT_MAX = 7000
const CV_TEXT_MAX = 4200
const TITLE_MAX = 180
const COMPANY_MAX = 180
const EXTRA_MAX = 2000

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

/** Für POST /api/agent/context: zusammengeführter CV-Block (Profil + optional Legacy + Zusätze). */
function buildMergedCvForServer(args: {
  includeProfileCvInSetup: boolean
  profileCvRaw: string | undefined
  legacyCvText: string
  extraSkills: string
  extraProjects: string
  extraExperienceNotes: string
}): string {
  const parts: string[] = []
  if (args.includeProfileCvInSetup && args.profileCvRaw?.trim()) {
    parts.push(sanitizeTechnicalContext(args.profileCvRaw).trim())
  }
  if (args.legacyCvText.trim()) {
    parts.push(sanitizeTechnicalContext(args.legacyCvText).trim())
  }
  const extraBlock = [
    args.extraSkills.trim()
      && `Zusätzliche Skills (nur dieses Gespräch):\n${args.extraSkills.trim().slice(0, EXTRA_MAX)}`,
    args.extraProjects.trim() && `Projekte:\n${args.extraProjects.trim().slice(0, EXTRA_MAX)}`,
    args.extraExperienceNotes.trim()
      && `Erfahrung (kurz):\n${args.extraExperienceNotes.trim().slice(0, EXTRA_MAX)}`,
  ].filter(Boolean).join('\n\n')
  if (extraBlock)
    parts.push(extraBlock)
  return parts.join('\n\n---\n\n').slice(0, CV_TEXT_MAX)
}

export default function ContextModal({
  toolType,
  sessionId,
  initialData,
  profileCvFromCareer,
  onClose,
  onContextSet,
}: Props) {
  const profileAvailable = Boolean(profileCvFromCareer?.trim())
  const { user } = useUser()
  const { getToken } = useAuth()

  const [jobText, setJobText] = useState(initialData?.jobText ?? '')
  const [jobTitle, setJobTitle] = useState(initialData?.jobTitle ?? '')
  const [companyName, setCompanyName] = useState(initialData?.companyName ?? '')
  const [programmingLanguageId, setProgrammingLanguageId] = useState(initialData?.programmingLanguageId ?? '')
  const [includeProfileCvInSetup, setIncludeProfileCvInSetup] = useState(
    initialData?.includeProfileCvInSetup !== false,
  )
  const [extraSkills, setExtraSkills] = useState(initialData?.extraSkills ?? '')
  const [extraProjects, setExtraProjects] = useState(initialData?.extraProjects ?? '')
  const [extraExperienceNotes, setExtraExperienceNotes] = useState(initialData?.extraExperienceNotes ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const effectiveToolType = useMemo(() => mapToolType(toolType), [toolType])
  const languageOptions = useMemo(
    () => [...PROGRAMMING_LANGUAGES.map(lang => ({ id: lang.id, label: lang.label })), { id: 'other', label: 'Andere' }],
    [],
  )

  const trimmedJobText = trimTo(jobText, JOB_TEXT_MAX)
  const trimmedJobTitle = trimTo(jobTitle, TITLE_MAX)
  const trimmedCompanyName = trimTo(companyName, COMPANY_MAX)
  const trimmedExtraSkills = trimTo(extraSkills, EXTRA_MAX)
  const trimmedExtraProjects = trimTo(extraProjects, EXTRA_MAX)
  const trimmedExtraExp = trimTo(extraExperienceNotes, EXTRA_MAX)

  const jobWasTrimmed = jobText.trim().length > JOB_TEXT_MAX

  useEffect(() => {
    const derivedProgrammingId = initialData?.programmingLanguageId
      || languageOptions.find(option => option.label.toLowerCase() === (initialData?.programmingLanguage ?? '').toLowerCase())?.id
      || ''

    setJobText(initialData?.jobText ?? '')
    setJobTitle(initialData?.jobTitle ?? '')
    setCompanyName(initialData?.companyName ?? '')
    setProgrammingLanguageId(derivedProgrammingId)
    setIncludeProfileCvInSetup(initialData?.includeProfileCvInSetup !== false)
    setExtraSkills(initialData?.extraSkills ?? '')
    setExtraProjects(initialData?.extraProjects ?? '')
    setExtraExperienceNotes(initialData?.extraExperienceNotes ?? '')
    setError(null)
  }, [initialData, languageOptions, sessionId, toolType])

  const persistAndComplete = async (payload: ContextPayload) => {
    setLoading(true)
    setError(null)

    try {
      const token = await getToken()
      const selectedLanguageLabel = languageOptions.find(option => option.id === programmingLanguageId)?.label ?? null

      const mergedCvForServer = buildMergedCvForServer({
        includeProfileCvInSetup: payload.includeProfileCvInSetup !== false,
        profileCvRaw: profileCvFromCareer,
        legacyCvText: payload.cvText,
        extraSkills: payload.extraSkills,
        extraProjects: payload.extraProjects,
        extraExperienceNotes: payload.extraExperienceNotes,
      })

      const response = await fetch(`${API_URL}/api/agent/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          sessionId,
          toolType: effectiveToolType,
          cvText: mergedCvForServer || null,
          jobText: payload.jobText.trim() || null,
          jobTitle: payload.jobTitle.trim() || null,
          companyName: payload.companyName.trim() || null,
          programmingLanguage: selectedLanguageLabel,
          userId: user?.id ?? null,
        }),
      })

      if (!response.ok) {
        throw new Error(await readErrorMessage(response, `Kontext konnte nicht gespeichert werden (${response.status})`))
      }

      onContextSet(payload)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Kontext konnte nicht gespeichert werden')
    } finally {
      setLoading(false)
    }
  }

  const basePayload = (): Omit<ContextPayload, 'generalCoaching'> => {
    const selectedLanguageLabel = languageOptions.find(option => option.id === programmingLanguageId)?.label ?? null
    return {
      cvText: '',
      jobText: trimmedJobText,
      jobTitle: trimmedJobTitle,
      companyName: trimmedCompanyName,
      programmingLanguage: selectedLanguageLabel ?? '',
      programmingLanguageId: programmingLanguageId.trim(),
      includeProfileCvInSetup,
      extraSkills: trimmedExtraSkills,
      extraProjects: trimmedExtraProjects,
      extraExperienceNotes: trimmedExtraExp,
    }
  }

  const submitContext = async () => {
    await persistAndComplete({
      ...basePayload(),
    })
  }

  const submitInterviewGeneralCoaching = async () => {
    await persistAndComplete({
      ...basePayload(),
      jobText: '',
      jobTitle: '',
      companyName: '',
      generalCoaching: true,
    })
  }

  const submitJobGeneralCoaching = async () => {
    await persistAndComplete({
      ...basePayload(),
      jobText: '',
      jobTitle: '',
      companyName: '',
      generalCoaching: true,
    })
  }

  if (effectiveToolType === 'interviewprep') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box max-h-[90vh] overflow-y-auto">
          <div className="modal-header">
            <span>Interview-Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <h3>Stelle & Kontext</h3>
            <p className="modal-subtitle">
              Stelleninfos unten; Lebenslauf kommt aus dem Karriereprofil (optional abschaltbar). Ergänze nur hier Skills,
              Projekte oder kurze Erfahrung — speziell für dieses Gespräch.
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
              placeholder="Vollständige Ausschreibung oder Link-Kontext…"
              className="modal-textarea"
              rows={5}
            />

            {jobWasTrimmed && (
              <p className="modal-hint text-amber-700">
                Hinweis: Der Stellenkontext wird auf {JOB_TEXT_MAX} Zeichen gekürzt.
              </p>
            )}

            {profileAvailable && (
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-slate-300"
                  checked={includeProfileCvInSetup}
                  onChange={event => setIncludeProfileCvInSetup(event.target.checked)}
                />
                <span>
                  Lebenslauf-Inhalt aus dem <strong>Karriereprofil</strong> in dieses Gespräch einbeziehen (empfohlen).
                  Wenn aus: nutzt der Chat nur die Schalter unter dem Chat + die Zusatzfelder hier.
                </span>
              </label>
            )}

            {!profileAvailable && (
              <p className="modal-hint text-slate-600">
                Kein Lebenslauf im Karriereprofil — ergänze Zusatzinfos unten oder im Profil.
              </p>
            )}

            <label className="mt-3">Zusätzliche Skills (nur dieses Gespräch)</label>
            <textarea
              value={extraSkills}
              onChange={event => setExtraSkills(event.target.value)}
              placeholder="z. B. Azure, Kubernetes, oder eine Zeile pro Skill"
              className="modal-textarea"
              rows={3}
            />

            <label>Relevante Projekte (kurz)</label>
            <textarea
              value={extraProjects}
              onChange={event => setExtraProjects(event.target.value)}
              placeholder="Projektname, Rolle, Ergebnis …"
              className="modal-textarea"
              rows={3}
            />

            <label>Erfahrung / Stationen (optional)</label>
            <textarea
              value={extraExperienceNotes}
              onChange={event => setExtraExperienceNotes(event.target.value)}
              placeholder="Was für diese Stelle zählen soll, auch wenn es nicht im Profil steht."
              className="modal-textarea"
              rows={2}
            />

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions flex-wrap gap-2">
              <button onClick={onClose} className="btn-ghost">
                Später
              </button>
              <button
                type="button"
                onClick={() => void submitInterviewGeneralCoaching()}
                className="btn-ghost"
                disabled={loading}
              >
                Allgemeines Coaching
              </button>
              <button
                onClick={() => void submitContext()}
                className="btn-primary"
                disabled={!trimmedJobTitle || loading}
              >
                {loading ? 'Wird vorbereitet…' : 'Mit Stelle starten'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (effectiveToolType === 'jobanalyzer') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box max-h-[90vh] overflow-y-auto">
          <div className="modal-header">
            <span>Job Analyzer</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <h3>Stellenanzeige</h3>
            <p className="modal-subtitle">
              Füge die Anzeige ein. Passung nutzt dein Karriereprofil (optional abschaltbar) plus die Zusatzfelder — kein
              separates CV-Kopieren nötig.
            </p>

            <label>Stellenanzeige oder URL</label>
            <textarea
              value={jobText}
              onChange={event => setJobText(event.target.value)}
              placeholder="Vollständige Stellenausschreibung oder Link-Kontext…"
              className="modal-textarea"
              rows={8}
            />

            {profileAvailable && (
              <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-slate-300"
                  checked={includeProfileCvInSetup}
                  onChange={event => setIncludeProfileCvInSetup(event.target.checked)}
                />
                <span>
                  Lebenslauf aus <strong>Karriereprofil</strong> für die Passungsanalyse nutzen. Aus = nur Stelle +
                  Zusatzinfos (z. B. wenn du die Analyse ohne Profil-CV testen willst).
                </span>
              </label>
            )}

            <label className="mt-3">Zusätzliche Skills (nur diese Analyse)</label>
            <textarea
              value={extraSkills}
              onChange={event => setExtraSkills(event.target.value)}
              placeholder="Skills, die für diese Stelle zählen sollen …"
              className="modal-textarea"
              rows={3}
            />

            <label>Projekte / Referenzen (kurz)</label>
            <textarea
              value={extraProjects}
              onChange={event => setExtraProjects(event.target.value)}
              className="modal-textarea"
              rows={2}
            />

            <label>Erfahrung (optional, nur hier)</label>
            <textarea
              value={extraExperienceNotes}
              onChange={event => setExtraExperienceNotes(event.target.value)}
              className="modal-textarea"
              rows={2}
            />

            {(jobWasTrimmed) && (
              <p className="modal-hint text-amber-700">
                Hinweis: Sehr lange Eingaben werden automatisch gekürzt.
              </p>
            )}

            {error && <p className="modal-error">{error}</p>}

            <div className="modal-actions flex-wrap gap-2">
              <button onClick={onClose} className="btn-ghost">
                Überspringen
              </button>
              <button
                type="button"
                onClick={() => void submitJobGeneralCoaching()}
                className="btn-ghost"
                disabled={loading}
              >
                Allgemeines Coaching
              </button>
              <button
                onClick={() => void submitContext()}
                disabled={!trimmedJobText || loading}
                className="btn-primary"
              >
                {loading ? 'Analyse läuft…' : 'Analyse starten'}
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
                onClick={() => void persistAndComplete({
                  cvText: '',
                  jobText: '',
                  jobTitle: '',
                  companyName: '',
                  programmingLanguage: languageOptions.find(option => option.id === programmingLanguageId)?.label ?? '',
                  programmingLanguageId: programmingLanguageId.trim(),
                  includeProfileCvInSetup: true,
                  extraSkills: '',
                  extraProjects: '',
                  extraExperienceNotes: '',
                })}
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
