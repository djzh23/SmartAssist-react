import { useState } from 'react'
import { Briefcase, ChevronRight, FileText, Loader2, X } from 'lucide-react'
import type { JobApplicationApi } from '../../../api/client'
import type { ResumeTemplateDto } from '../../cvTypes'
import type { CvResumeGroup } from '../../lib/cvStudioGroups'

type Purpose = 'application' | 'general' | 'clone'

interface CvCreateDialogProps {
  templates: ResumeTemplateDto[]
  jobApplications: JobApplicationApi[]
  /** When coming from a group's "+ Weiteren CV" button, pre-fills context. */
  prefillGroup?: CvResumeGroup | null
  onConfirm: (params: CreateParams) => Promise<void>
  onClose: () => void
}

export interface CreateParams {
  templateKey: string
  linkedJobApplicationId?: string
  targetCompany?: string
  targetRole?: string
  cloneFromId?: string
  /** Legt eine neue Zeile unter „Bewerbungen“ an und verknüpft den CV. */
  createJobApplicationEntry?: boolean
  jobUrl?: string
}

interface CloneSource {
  id: string
  title: string
}

interface CvCreateDialogInternalProps extends CvCreateDialogProps {
  existingResumes: CloneSource[]
}

export default function CvCreateDialog({
  templates,
  jobApplications,
  prefillGroup,
  existingResumes,
  onConfirm,
  onClose,
}: CvCreateDialogInternalProps) {
  // ── Step state ────────────────────────────────────────────────────────────
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [purpose, setPurpose] = useState<Purpose | null>(null)
  const [selectedAppId, setSelectedAppId] = useState<string>(
    prefillGroup?.applicationId ?? '',
  )
  const [manualCompany, setManualCompany] = useState(prefillGroup?.company ?? '')
  const [manualRole, setManualRole] = useState(prefillGroup?.role ?? '')
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0]?.key ?? '')
  const [cloneFromId, setCloneFromId] = useState('')
  const [saveNewToApplicationList, setSaveNewToApplicationList] = useState(true)
  const [newAppJobUrl, setNewAppJobUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Helpers ───────────────────────────────────────────────────────────────
  const selectedApp = jobApplications.find(a => a.id === selectedAppId)

  function handlePurpose(p: Purpose) {
    setPurpose(p)
    // If prefill already gives us a group context skip to template step
    if (p === 'general') {
      setStep(3)
    } else if (p === 'application' && prefillGroup?.applicationId) {
      setSelectedAppId(prefillGroup.applicationId)
      setStep(3)
    } else if (p === 'clone' && existingResumes.length === 0) {
      setError('Keine bestehenden Lebensläufe zum Ableiten vorhanden.')
    } else {
      setStep(2)
    }
  }

  async function handleConfirm() {
    if (!selectedTemplateKey) {
      setError('Bitte eine Vorlage wählen.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      if (
        purpose === 'application' &&
        saveNewToApplicationList &&
        !selectedAppId &&
        (!manualCompany.trim() || !manualRole.trim())
      ) {
        setError('Für „In Bewerbungsliste speichern“ bitte Unternehmen und Stelle ausfüllen - oder das Häkchen entfernen.')
        setBusy(false)
        return
      }
      const params: CreateParams = { templateKey: selectedTemplateKey }
      if (purpose === 'application') {
        if (selectedAppId) {
          params.linkedJobApplicationId = selectedAppId
          params.targetCompany = selectedApp?.company
          params.targetRole = selectedApp?.jobTitle
        } else {
          if (manualCompany) params.targetCompany = manualCompany
          if (manualRole) params.targetRole = manualRole
          if (saveNewToApplicationList && manualCompany.trim() && manualRole.trim()) {
            params.createJobApplicationEntry = true
            if (newAppJobUrl.trim()) params.jobUrl = newAppJobUrl.trim()
          }
        }
      } else if (purpose === 'clone' && cloneFromId) {
        params.cloneFromId = cloneFromId
      }
      await onConfirm(params)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen.')
      setBusy(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Neuen Lebenslauf anlegen"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#1a1510] shadow-2xl">
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-500 hover:bg-white/10 hover:text-stone-300"
          aria-label="Schließen"
        >
          <X size={18} aria-hidden />
        </button>

        <div className="px-6 pb-6 pt-5">
          {/* Title + breadcrumb */}
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary-light">
            Neuer Lebenslauf
          </p>
          <h2 className="mb-4 text-lg font-semibold text-white">
            {step === 1 && 'Wofür soll der CV sein?'}
            {step === 2 && purpose === 'application' && 'Bewerbungskontext'}
            {step === 2 && purpose === 'clone' && 'Vorlage auswählen'}
            {step === 3 && 'Vorlage / Design'}
          </h2>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* ── Step 1: Purpose ─────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-2">
              <p className="mb-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-relaxed text-stone-400">
                <span className="font-semibold text-stone-300">Kurzentscheidung: </span>
                Nutze „Für eine Bewerbung“, wenn du eine konkrete Stelle in der Pipeline führst. „Allgemein“ nur für
                Master-CV oder Übung - sonst entstehen leicht lose Duplikate. „Ableiten“ kopiert einen vorhandenen Stand
                sinnvoll für eine Variante.
              </p>
              <PurposeButton
                icon={<Briefcase size={18} />}
                label="Für eine Bewerbung"
                description="Mit bestehender oder neuer Bewerbung verknüpfen - optional gleich in der Bewerbungsliste anlegen"
                onClick={() => handlePurpose('application')}
              />
              <PurposeButton
                icon={<FileText size={18} />}
                label="Allgemeiner Lebenslauf"
                description="Kein Stellenbezug - universell einsetzbar"
                onClick={() => handlePurpose('general')}
              />
              {existingResumes.length > 0 && (
                <PurposeButton
                  icon={<FileText size={18} />}
                  label="Aus bestehendem CV ableiten"
                  description="Kopiere einen vorhandenen Lebenslauf als Ausgangspunkt"
                  onClick={() => handlePurpose('clone')}
                />
              )}
            </div>
          )}

          {/* ── Step 2a: Application context ────────────────────────────── */}
          {step === 2 && purpose === 'application' && (
            <div className="space-y-4">
              {jobApplications.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-stone-400">
                    Verknüpfte Bewerbung (optional)
                  </label>
                  <select
                    value={selectedAppId}
                    onChange={e => setSelectedAppId(e.target.value)}
                    className="w-full rounded-lg border border-stone-600/60 bg-stone-700 px-3 py-2 text-sm text-stone-100 focus:border-violet-500/60 focus:outline-none"
                  >
                    <option value="">- Keine Bewerbung verknüpfen -</option>
                    {jobApplications.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.company} - {a.jobTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedAppId && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-400">
                      Unternehmen
                    </label>
                    <input
                      type="text"
                      value={manualCompany}
                      onChange={e => setManualCompany(e.target.value)}
                      placeholder="z. B. Acme GmbH"
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-stone-400">
                      Stelle / Rolle
                    </label>
                    <input
                      type="text"
                      value={manualRole}
                      onChange={e => setManualRole(e.target.value)}
                      placeholder="z. B. Software Engineer"
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                  <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5">
                    <input
                      type="checkbox"
                      className="mt-0.5 rounded border-white/30 bg-black/40 text-primary focus:ring-primary"
                      checked={saveNewToApplicationList}
                      onChange={e => setSaveNewToApplicationList(e.target.checked)}
                    />
                    <span className="text-xs text-stone-300">
                      <span className="font-medium text-stone-200">In Bewerbungsliste speichern</span>
                      {' - '}
                      legt unter „Bewerbungen“ einen neuen Eintrag an und verknüpft diesen CV. Zum Bearbeiten nur
                      Kontext: Häkchen entfernen.
                    </span>
                  </label>
                  {saveNewToApplicationList ? (
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-stone-400">
                        Stellen-URL (optional)
                      </label>
                      <input
                        type="url"
                        value={newAppJobUrl}
                        onChange={e => setNewAppJobUrl(e.target.value)}
                        placeholder="https://…"
                        className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                      />
                    </div>
                  ) : null}
                </>
              )}

              <div className="flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-stone-500 hover:text-stone-300"
                >
                  ← Zurück
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {/* ── Step 2b: Clone source ────────────────────────────────────── */}
          {step === 2 && purpose === 'clone' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-stone-400">
                  Basis-Lebenslauf
                </label>
                <select
                  value={cloneFromId}
                  onChange={e => setCloneFromId(e.target.value)}
                  className="w-full rounded-lg border border-stone-600/60 bg-stone-700 px-3 py-2 text-sm text-stone-100 focus:border-violet-500/60 focus:outline-none"
                >
                  <option value="">- Bitte wählen -</option>
                  {existingResumes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-stone-500 hover:text-stone-300"
                >
                  ← Zurück
                </button>
                <button
                  type="button"
                  disabled={!cloneFromId}
                  onClick={() => setStep(3)}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}

          {/* ── Step 3: Template ─────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                {templates.map(tpl => {
                  const active = selectedTemplateKey === tpl.key
                  return (
                    <button
                      key={tpl.key}
                      type="button"
                      onClick={() => setSelectedTemplateKey(tpl.key)}
                      className={[
                        'flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors',
                        active
                          ? 'border-primary bg-primary/15 text-white'
                          : 'border-white/10 bg-black/20 text-stone-300 hover:border-white/20',
                      ].join(' ')}
                    >
                      <span className="text-sm font-semibold">{tpl.displayName}</span>
                      <span className="text-xs text-stone-500">{tpl.description}</span>
                    </button>
                  )
                })}
              </div>

              <div className="flex justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setStep(purpose === 'general' ? 1 : 2)}
                  className="text-xs text-stone-500 hover:text-stone-300"
                >
                  ← Zurück
                </button>
                <button
                  type="button"
                  disabled={busy || !selectedTemplateKey}
                  onClick={() => void handleConfirm()}
                  className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
                >
                  {busy && <Loader2 size={15} className="animate-spin" aria-hidden />}
                  Lebenslauf anlegen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PurposeButton({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-xl border border-white/10 bg-black/20 px-4 py-3.5 text-left transition-colors hover:border-primary/40 hover:bg-primary/10"
    >
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary-light">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-xs text-stone-500">{description}</p>
      </div>
      <ChevronRight size={16} className="flex-shrink-0 text-stone-600" aria-hidden />
    </button>
  )
}
