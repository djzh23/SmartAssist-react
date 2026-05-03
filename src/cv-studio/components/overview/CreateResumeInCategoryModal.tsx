import { useState } from 'react'
import { ChevronRight, Copy, FilePlus, FileText, Loader2, X } from 'lucide-react'
import AppCtaButton from '../../../components/ui/AppCtaButton'
import type { JobApplicationApi } from '../../../api/client'
import type { CvStudioResumeSummary, CvUserCategoryDto } from '../../../types'
import type { ResumeTemplateDto } from '../../cvTypes'
import CvMiniDocPreview from './CvMiniDocPreview'

export interface CreateResumeForCategoryParams {
  categoryId: string
  templateKey: string
  cloneFromId?: string
  targetCompany?: string
  targetRole?: string
  linkedJobApplicationId?: string
  createJobApplicationEntry?: boolean
  jobUrl?: string
}

interface Props {
  category: CvUserCategoryDto
  templates: ResumeTemplateDto[]
  jobApplications: JobApplicationApi[]
  /** All existing resumes - for the clone picker. */
  allResumes: CvStudioResumeSummary[]
  getCategoryName: (resumeId: string) => string | null
  onConfirm: (params: CreateResumeForCategoryParams) => Promise<void>
  onClose: () => void
}

type StartChoice = 'new' | 'clone'

export default function CreateResumeInCategoryModal({
  category,
  templates,
  jobApplications,
  allResumes,
  getCategoryName,
  onConfirm,
  onClose,
}: Props) {
  const [step, setStep] = useState<'choice' | 'configure'>('choice')
  const [startChoice, setStartChoice] = useState<StartChoice | null>(null)

  // "Neue Vorlage" state
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0]?.key ?? '')
  // "Kopieren" state
  const [cloneFromId, setCloneFromId] = useState<string | null>(null)

  // Shared job context
  const [selectedAppId, setSelectedAppId] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [saveToApplicationList, setSaveToApplicationList] = useState(false)
  const [jobUrl, setJobUrl] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedApp = jobApplications.find(a => a.id === selectedAppId)
  const canSaveToList = !selectedAppId && targetCompany.trim().length > 0 && targetRole.trim().length > 0

  function handleChoose(choice: StartChoice) {
    setStartChoice(choice)
    setStep('configure')
    setError(null)
  }

  async function handleConfirm() {
    if (startChoice === 'new' && !selectedTemplateKey) {
      setError('Bitte eine Vorlage wählen.')
      return
    }
    if (startChoice === 'clone' && !cloneFromId) {
      setError('Bitte einen Lebenslauf zum Kopieren wählen.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const params: CreateResumeForCategoryParams = {
        categoryId: category.id,
        templateKey: selectedTemplateKey,
      }
      if (startChoice === 'clone' && cloneFromId) {
        params.cloneFromId = cloneFromId
      }
      if (selectedAppId) {
        params.linkedJobApplicationId = selectedAppId
        params.targetCompany = selectedApp?.company
        params.targetRole = selectedApp?.jobTitle
      } else {
        if (targetCompany.trim()) params.targetCompany = targetCompany.trim()
        if (targetRole.trim()) params.targetRole = targetRole.trim()
        if (saveToApplicationList && canSaveToList) {
          params.createJobApplicationEntry = true
          if (jobUrl.trim()) params.jobUrl = jobUrl.trim()
        }
      }
      await onConfirm(params)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Anlegen.')
      setBusy(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crim-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-[#1a1510] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-stone-500 hover:bg-white/10 hover:text-stone-300"
          aria-label="Schließen"
        >
          <X size={18} aria-hidden />
        </button>

        <div className="max-h-[90vh] overflow-y-auto px-6 pb-6 pt-5">
          {/* Header */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-light">
            Neuer Lebenslauf
          </p>
          <h2 id="crim-title" className="mb-0.5 text-lg font-semibold text-white">
            In Kategorie:{' '}
            <span className="text-primary-light">{category.name}</span>
          </h2>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* ── Step: choice ─────────────────────────────────────────────── */}
          {step === 'choice' && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-stone-400">
                Womit möchtest du starten?
              </p>

              <ChoiceCard
                icon={<FileText size={20} />}
                title="Neue Vorlage"
                description="Starte mit einer leeren Vorlage - Daten werden direkt im Editor eingetragen."
                onClick={() => handleChoose('new')}
              />

              <ChoiceCard
                icon={<Copy size={20} />}
                title="Aus bestehendem Lebenslauf kopieren"
                description={
                  allResumes.length === 0
                    ? 'Noch keine Lebensläufe vorhanden.'
                    : 'Nimm einen vorhandenen Lebenslauf als Ausgangspunkt und passe ihn an.'
                }
                disabled={allResumes.length === 0}
                onClick={() => handleChoose('clone')}
              />
            </div>
          )}

          {/* ── Step: configure ───────────────────────────────────────────── */}
          {step === 'configure' && (
            <div className="mt-5 space-y-5">

              {/* Sub-section: template OR clone picker */}
              {startChoice === 'new' && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-stone-300">
                    Vorlage wählen <span className="text-rose-400" aria-hidden>*</span>
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {templates.map(tpl => {
                      const active = selectedTemplateKey === tpl.key
                      return (
                        <button
                          key={tpl.key}
                          type="button"
                          onClick={() => setSelectedTemplateKey(tpl.key)}
                          className={[
                            'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors',
                            active
                              ? 'border-primary bg-primary/15 text-white'
                              : 'border-white/10 bg-black/20 text-stone-300 hover:border-white/25',
                          ].join(' ')}
                        >
                          <span className="text-sm font-semibold">{tpl.displayName}</span>
                          {tpl.description && (
                            <span className="text-[11px] text-stone-500">{tpl.description}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {startChoice === 'clone' && (
                <div>
                  <p className="mb-2 text-xs font-semibold text-stone-300">
                    Lebenslauf zum Kopieren wählen <span className="text-rose-400" aria-hidden>*</span>
                  </p>
                  <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
                    {allResumes.map(r => {
                      const catName = getCategoryName(r.id)
                      const selected = cloneFromId === r.id
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setCloneFromId(r.id)}
                          className={[
                            'flex flex-col overflow-hidden rounded-xl border text-left transition-colors',
                            selected
                              ? 'border-primary bg-primary/15'
                              : 'border-white/10 bg-black/20 hover:border-white/25',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-center bg-black/20 px-3 pt-3 pb-1">
                            <div className="w-full max-w-[6rem]">
                              <CvMiniDocPreview resume={r} />
                            </div>
                          </div>
                          <div className="px-2 pb-2 pt-1">
                            <p className="truncate text-[11px] font-semibold text-stone-100 leading-tight">
                              {r.title}
                            </p>
                            {(r.targetCompany || r.targetRole) && (
                              <p className="truncate text-[10px] text-stone-500">
                                {[r.targetCompany, r.targetRole].filter(Boolean).join(' · ')}
                              </p>
                            )}
                            {catName && (
                              <span className="mt-0.5 inline-block rounded bg-primary/15 px-1 py-0.5 text-[9px] font-medium text-primary-light">
                                {catName}
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Job context - always shown */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-stone-300">
                  Bewerbungskontext{' '}
                  <span className="font-normal text-stone-500">(optional)</span>
                </p>

                {jobApplications.length > 0 && (
                  <div>
                    <label htmlFor="crim-app" className="mb-1 block text-[11px] text-stone-500">
                      Bestehende Bewerbung verknüpfen
                    </label>
                    <select
                      id="crim-app"
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
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor="crim-company" className="mb-1 block text-[11px] text-stone-500">
                          Unternehmen
                        </label>
                        <input
                          id="crim-company"
                          type="text"
                          value={targetCompany}
                          onChange={e => setTargetCompany(e.target.value)}
                          placeholder="z. B. Acme GmbH"
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="crim-role" className="mb-1 block text-[11px] text-stone-500">
                          Stelle / Rolle
                        </label>
                        <input
                          id="crim-role"
                          type="text"
                          value={targetRole}
                          onChange={e => setTargetRole(e.target.value)}
                          placeholder="z. B. Software Engineer"
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                        />
                      </div>
                    </div>

                    {canSaveToList && (
                      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                        <input
                          type="checkbox"
                          className="mt-0.5 shrink-0 accent-violet-500"
                          checked={saveToApplicationList}
                          onChange={e => setSaveToApplicationList(e.target.checked)}
                        />
                        <span className="text-xs leading-relaxed text-stone-300">
                          <span className="font-medium text-stone-200">In Bewerbungsliste anlegen</span>
                          {' - '}
                          erstellt einen Eintrag unter „Meine Bewerbungen" und verknüpft diesen CV.
                        </span>
                      </label>
                    )}

                    {saveToApplicationList && (
                      <div>
                        <label htmlFor="crim-url" className="mb-1 block text-[11px] text-stone-500">
                          Stellen-URL{' '}
                          <span className="text-stone-600">(optional)</span>
                        </label>
                        <input
                          id="crim-url"
                          type="url"
                          value={jobUrl}
                          onChange={e => setJobUrl(e.target.value)}
                          placeholder="https://…"
                          className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => { setStep('choice'); setError(null) }}
                  className="text-xs text-stone-500 hover:text-stone-300"
                >
                  ← Zurück
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-lg px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-200"
                  >
                    Abbrechen
                  </button>
                  <AppCtaButton
                    type="button"
                    disabled={busy || (startChoice === 'new' && !selectedTemplateKey) || (startChoice === 'clone' && !cloneFromId)}
                    onClick={() => void handleConfirm()}
                    className="flex items-center gap-2 disabled:opacity-50"
                  >
                    {busy
                      ? <Loader2 size={14} className="animate-spin" aria-hidden />
                      : startChoice === 'clone'
                        ? <Copy size={14} aria-hidden />
                        : <FilePlus size={14} aria-hidden />}
                    {startChoice === 'clone' ? 'Kopie anlegen' : 'Lebenslauf anlegen'}
                  </AppCtaButton>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChoiceCard({
  icon,
  title,
  description,
  disabled,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  description: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        'flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-colors',
        disabled
          ? 'cursor-not-allowed border-white/8 bg-black/10 opacity-40'
          : 'border-white/10 bg-black/20 hover:border-primary/40 hover:bg-primary/[0.07]',
      ].join(' ')}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary-light">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-stone-500">{description}</p>
      </div>
      {!disabled && <ChevronRight size={16} className="shrink-0 text-stone-600" aria-hidden />}
    </button>
  )
}
