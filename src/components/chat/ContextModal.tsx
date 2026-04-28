import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { ChevronLeft, ChevronRight, FileText, Link2 } from 'lucide-react'
import { fetchJobPreview, UsageLimitError } from '../../api/client'
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
  /** Roh-Text aus Karriereprofil - wird nur mit Einverständnis in Setup gemischt, nicht als Textfeld editiert. */
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

const WIZARD_LABELS = ['Stelle', 'Nur für diesen Chat', 'Überprüfen'] as const

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

function WizardStepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <ol className="mb-4 flex list-none gap-1.5 text-[11px] font-semibold sm:gap-2 sm:text-xs" role="list">
      {WIZARD_LABELS.map((label, i) => {
        const n = (i + 1) as 1 | 2 | 3
        const active = step === n
        const done = step > n
        return (
          <li
            key={label}
            className={[
              'flex min-h-[2.75rem] flex-1 items-center gap-1.5 rounded-lg border px-1.5 py-1.5 sm:px-2',
              active ? 'border-primary bg-primary-light text-primary' : '',
              !active && done ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : '',
              !active && !done ? 'border-slate-100 bg-slate-50 text-slate-500' : '',
            ].filter(Boolean).join(' ')}
          >
            <span
              className={[
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px]',
                active ? 'bg-white font-bold text-primary' : '',
                !active && done ? 'bg-white font-bold text-emerald-700' : '',
                !active && !done ? 'bg-slate-200 font-bold text-slate-600' : '',
              ].filter(Boolean).join(' ')}
            >
              {n}
            </span>
            <span className="leading-snug">{label}</span>
          </li>
        )
      })}
    </ol>
  )
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

  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1)
  const [jobInputMode, setJobInputMode] = useState<'url' | 'paste'>('paste')
  const [jobUrlDraft, setJobUrlDraft] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [previewMeta, setPreviewMeta] = useState<{
    jobTitle: string
    companyName: string
    location: string
  } | null>(null)

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

  const applyPreviewToState = useCallback((res: {
    jobTitle: string | null
    companyName: string | null
    location: string | null
    rawJobText: string | null
  }) => {
    if (res.rawJobText)
      setJobText(trimTo(res.rawJobText, JOB_TEXT_MAX))
    setPreviewMeta({
      jobTitle: res.jobTitle ?? '',
      companyName: res.companyName ?? '',
      location: res.location ?? '',
    })
    setJobTitle(prev => (prev.trim() ? prev : (res.jobTitle ?? prev)))
    setCompanyName(prev => (prev.trim() ? prev : (res.companyName ?? prev)))
  }, [])

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
    setWizardStep(1)
    setJobInputMode('paste')
    setJobUrlDraft('')
    setPreviewError(null)
    setPreviewLoading(false)
    setPreviewMeta(null)
  }, [initialData, languageOptions, sessionId, toolType])

  const loadJobPreview = async () => {
    const url = jobUrlDraft.trim()
    if (!url) {
      setPreviewError('Bitte eine http(s)-URL einfügen oder zum Tab „Text einfügen“ wechseln.')
      return
    }
    setPreviewLoading(true)
    setPreviewError(null)
    try {
      const token = await getToken()
      if (!token) {
        setPreviewError('Anmeldung erforderlich.')
        return
      }
      const res = await fetchJobPreview(token, url)
      if (!res.success) {
        setPreviewError(
          res.error
            ?? 'URL konnte nicht geladen werden - bitte wechsle zu „Text einfügen“ oder kopiere die komplette Anzeige.',
        )
        return
      }
      applyPreviewToState(res)
    } catch (e) {
      if (e instanceof UsageLimitError)
        setPreviewError(e.reason)
      else
        setPreviewError(e instanceof Error ? e.message : 'Stellen-Vorschau fehlgeschlagen.')
    } finally {
      setPreviewLoading(false)
    }
  }

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

  const canAdvanceStep1Interview = Boolean(trimmedJobTitle && trimmedJobText)
  const canAdvanceStep1Analyzer = Boolean(trimmedJobText)
  const canAdvanceStep2 = true

  const step2ExtrasBlock = (
    <>
      {profileAvailable && (
        <label className="mt-1 flex cursor-pointer items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="mt-1 rounded border-slate-300"
            checked={includeProfileCvInSetup}
            onChange={event => setIncludeProfileCvInSetup(event.target.checked)}
          />
          <span>
            Lebenslauf-Inhalt aus dem <strong>Karriereprofil</strong> einbeziehen (empfohlen). Ausgeschaltet nutzt der Chat
            nur die Schalter unter dem Chat plus die Zusatzfelder hier - <strong>session-lokal</strong> für diesen Chat.
          </span>
        </label>
      )}

      {!profileAvailable && (
        <p className="modal-hint text-slate-600">
          Kein Lebenslauf im Karriereprofil - ergänze Zusatzinfos hier oder im Profil.
        </p>
      )}

      <label className="mt-2">{effectiveToolType === 'interviewprep' ? 'Zusätzliche Skills (nur dieses Gespräch)' : 'Zusätzliche Skills (nur diese Analyse)'}</label>
      <textarea
        value={extraSkills}
        onChange={event => setExtraSkills(event.target.value)}
        placeholder={effectiveToolType === 'interviewprep'
          ? 'z. B. Azure, Kubernetes, oder eine Zeile pro Skill'
          : 'Skills, die für diese Stelle zählen sollen …'}
        className="modal-textarea"
        rows={3}
      />

      <label>{effectiveToolType === 'interviewprep' ? 'Relevante Projekte (kurz)' : 'Projekte / Referenzen (kurz)'}</label>
      <textarea
        value={extraProjects}
        onChange={event => setExtraProjects(event.target.value)}
        placeholder={effectiveToolType === 'interviewprep' ? 'Projektname, Rolle, Ergebnis …' : 'Projekte …'}
        className="modal-textarea"
        rows={effectiveToolType === 'interviewprep' ? 3 : 2}
      />

      <label>{effectiveToolType === 'interviewprep' ? 'Erfahrung / Stationen (optional)' : 'Erfahrung (optional, nur hier)'}</label>
      <textarea
        value={extraExperienceNotes}
        onChange={event => setExtraExperienceNotes(event.target.value)}
        placeholder={
          effectiveToolType === 'interviewprep'
            ? 'Was für diese Stelle zählen soll, auch wenn es nicht im Profil steht.'
            : 'Kurz zusätzliche Erfahrung für diese Auswertung …'
        }
        className="modal-textarea"
        rows={2}
      />
    </>
  )

  const step3ReviewBlock = (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-800">
      <p className="mb-2 font-semibold text-slate-900">Kurzüberblick</p>
      <ul className="list-inside list-disc space-y-1 text-slate-700">
        {effectiveToolType === 'interviewprep' && (
          <li>
            Stelle:
            {' '}
            <span className="font-medium">{trimmedJobTitle || '-'}</span>
            {trimmedCompanyName ? ` - ${trimmedCompanyName}` : ''}
          </li>
        )}
        {effectiveToolType === 'jobanalyzer' && (trimmedJobTitle || trimmedCompanyName) && (
          <li>
            Titel / Firma (optional):
            {' '}
            <span className="font-medium">{[trimmedJobTitle, trimmedCompanyName].filter(Boolean).join(' - ') || '-'}</span>
          </li>
        )}
        <li>
          Stellenkontext:
          {' '}
          {trimmedJobText ? `${trimmedJobText.slice(0, 160)}${trimmedJobText.length > 160 ? '…' : ''}` : '-'}
        </li>
        <li>{includeProfileCvInSetup && profileAvailable ? 'Karriereprofil-CV: ein' : 'Karriereprofil-CV: aus oder nicht verfügbar'}</li>
        {(trimmedExtraSkills || trimmedExtraProjects || trimmedExtraExp) && (
          <li>Zusatzinfos für diesen Chat sind befüllt.</li>
        )}
      </ul>
    </div>
  )

  /** Schritt 1: Modi Link vs Text, Preview, Titel-Felder. */
  const step1JobBlock = (variant: 'interview' | 'analyzer') => (
    <>
      {variant === 'interview' && (
        <>
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
        </>
      )}

      <p className="modal-subtitle mt-1">
        <strong>Link zur Stelle</strong>
        {' - lädt die Seite und füllt die Vorschau. Oder '
        }
        <strong>Stellen-Text einfügen</strong>
        {' ohne Netzaufruf.'}
      </p>

      <div
        className="mb-3 flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-semibold sm:text-sm"
        role="tablist"
        aria-label="Eingabe-Modus"
      >
        <button
          type="button"
          role="tab"
          aria-selected={jobInputMode === 'url'}
          className={[
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition-colors',
            jobInputMode === 'url' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          ].join(' ')}
          onClick={() => {
            setJobInputMode('url')
            setPreviewError(null)
          }}
        >
          <Link2 size={16} aria-hidden />
          Link
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={jobInputMode === 'paste'}
          className={[
            'inline-flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 transition-colors',
            jobInputMode === 'paste' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800',
          ].join(' ')}
          onClick={() => {
            setJobInputMode('paste')
            setPreviewError(null)
          }}
        >
          <FileText size={16} aria-hidden />
          Text einfügen
        </button>
      </div>

      {jobInputMode === 'url' && (
        <>
          <label>URL der Stellenanzeige</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={jobUrlDraft}
              onChange={e => setJobUrlDraft(e.target.value)}
              placeholder="https://…"
              className="modal-input flex-1"
              type="url"
              inputMode="url"
            />
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              onClick={() => void loadJobPreview()}
              disabled={previewLoading}
            >
              {previewLoading ? 'Lade…' : 'Stelle laden'}
            </button>
          </div>
          <p className="modal-hint text-slate-600">
            Bei Bot-Schutz oder Fehlern: Tab „Text einfügen“ und die komplette Anzeige kopieren.
          </p>
        </>
      )}

      {jobInputMode === 'paste' && (
        <>
          <label>{variant === 'interview' ? 'Stellenbeschreibung (Rohtext)' : 'Stellenanzeige (Rohtext)'}</label>
          <textarea
            value={jobText}
            onChange={event => {
              setJobText(event.target.value)
              setPreviewError(null)
            }}
            placeholder="Vollständige Ausschreibung einfügen…"
            className="modal-textarea"
            rows={variant === 'interview' ? 5 : 8}
          />
        </>
      )}

      {previewError && (
        <p className="modal-error" role="alert">
          {previewError}
        </p>
      )}

      {(previewMeta && jobInputMode === 'url') && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
          <p className="font-semibold text-emerald-900">Vorschau</p>
          <p>
            <span className="font-medium">{previewMeta.jobTitle || '-'}</span>
            {(previewMeta.companyName || previewMeta.location) && (
              <span className="text-emerald-800">
                {' '}
                - {previewMeta.companyName || ''}{previewMeta.location ? ` (${previewMeta.location})` : ''}
              </span>
            )}
          </p>
          {trimmedJobText && (
            <details className="mt-2 text-emerald-900">
              <summary className="cursor-pointer text-xs font-medium text-emerald-800">Volltext anzeigen</summary>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                {trimmedJobText}
              </p>
            </details>
          )}
        </div>
      )}

      {variant === 'analyzer' && (
        <>
          <label className="mt-2">Stellentitel (optional)</label>
          <input
            value={jobTitle}
            onChange={event => setJobTitle(event.target.value)}
            placeholder="aus der Vorschau übernommen oder anpassen"
            className="modal-input"
          />

          <label>Unternehmen (optional)</label>
          <input
            value={companyName}
            onChange={event => setCompanyName(event.target.value)}
            placeholder="aus der Vorschau übernommen oder anpassen"
            className="modal-input"
          />
        </>
      )}

      {jobWasTrimmed && (
        <p className="modal-hint text-amber-700">
          Hinweis: Der Stellenkontext wird auf
          {' '}
          {JOB_TEXT_MAX}
          {' '}
          Zeichen gekürzt.
        </p>
      )}
    </>
  )

  const stepNavRow = (opts: { step1Ok: boolean }) => (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
      <button
        type="button"
        className="btn-ghost inline-flex items-center gap-1"
        disabled={wizardStep === 1}
        onClick={() => setWizardStep(s => (s > 1 ? (s - 1) as 1 | 2 | 3 : s))}
      >
        <ChevronLeft size={16} aria-hidden />
        Zurück
      </button>
      {wizardStep < 3 && (
        <button
          type="button"
          className="btn-primary inline-flex items-center gap-1"
          disabled={(wizardStep === 1 && !opts.step1Ok) || (wizardStep === 2 && !canAdvanceStep2)}
          onClick={() => {
            if (wizardStep === 1 && !opts.step1Ok) return
            setWizardStep(s => (s < 3 ? (s + 1) as 1 | 2 | 3 : s))
          }}
        >
          Weiter
          <ChevronRight size={16} aria-hidden />
        </button>
      )}
    </div>
  )

  if (effectiveToolType === 'interviewprep') {
    return (
      <div className="modal-backdrop">
        <div className="modal-box max-h-[90vh] overflow-y-auto">
          <div className="modal-header">
            <span>Interview-Setup</span>
            <button onClick={onClose} className="modal-close">×</button>
          </div>

          <div className="modal-body">
            <WizardStepper step={wizardStep} />
            <h3>{WIZARD_LABELS[wizardStep - 1]}</h3>
            {wizardStep === 1 && (
              <p className="modal-subtitle">
                Stelleninfos; Lebenslauf kommt aus dem Karriereprofil (Schritt 2). Zusatzfelder sind nur für dieses Gespräch.
              </p>
            )}
            {wizardStep === 2 && (
              <p className="modal-subtitle">Skills, Projekte und kurze Erfahrung - nur für diesen Chat, nicht global.</p>
            )}
            {wizardStep === 3 && (
              <p className="modal-subtitle">Prüfe die Angaben, dann starten oder allgemeines Coaching wählen.</p>
            )}

            {wizardStep === 1 && step1JobBlock('interview')}
            {wizardStep === 2 && step2ExtrasBlock}
            {wizardStep === 3 && step3ReviewBlock}

            {error && <p className="modal-error">{error}</p>}

            {wizardStep < 3 && stepNavRow({ step1Ok: canAdvanceStep1Interview })}

            <div className="modal-actions mt-2 flex-wrap gap-2">
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
                disabled={
                  loading || !trimmedJobTitle || wizardStep !== 3
                }
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
            <WizardStepper step={wizardStep} />
            <h3>{WIZARD_LABELS[wizardStep - 1]}</h3>
            {wizardStep === 1 && (
              <p className="modal-subtitle">
                Link laden oder Text einfügen. Passung nutzt dein Karriereprofil im nächsten Schritt plus Zusatzfelder.
              </p>
            )}
            {wizardStep === 2 && (
              <p className="modal-subtitle">Zusatzinfos nur für diese Analyse - session-lokal.</p>
            )}
            {wizardStep === 3 && <p className="modal-subtitle">Kurz prüfen, dann starten oder allgemeines Coaching.</p>}

            {wizardStep === 1 && step1JobBlock('analyzer')}
            {wizardStep === 2 && step2ExtrasBlock}
            {wizardStep === 3 && step3ReviewBlock}

            {error && <p className="modal-error">{error}</p>}

            {wizardStep < 3 && stepNavRow({ step1Ok: canAdvanceStep1Analyzer })}

            <div className="modal-actions mt-2 flex-wrap gap-2">
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
                disabled={!trimmedJobText || loading || wizardStep !== 3}
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
