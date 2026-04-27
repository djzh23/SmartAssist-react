import { useState } from 'react'
import { FilePlus, Loader2, X } from 'lucide-react'
import type { JobApplicationApi } from '../../../api/client'
import type { CvUserCategoryDto } from '../../../types'
import type { ResumeTemplateDto } from '../../cvTypes'

export interface CreateResumeForCategoryParams {
  categoryId: string
  templateKey: string
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
  onConfirm: (params: CreateResumeForCategoryParams) => Promise<void>
  onClose: () => void
}

export default function CreateResumeInCategoryModal({
  category,
  templates,
  jobApplications,
  onConfirm,
  onClose,
}: Props) {
  const [selectedTemplateKey, setSelectedTemplateKey] = useState(templates[0]?.key ?? '')
  const [selectedAppId, setSelectedAppId] = useState('')
  const [targetCompany, setTargetCompany] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [saveToApplicationList, setSaveToApplicationList] = useState(false)
  const [jobUrl, setJobUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedApp = jobApplications.find(a => a.id === selectedAppId)
  const canSaveToList = !selectedAppId && targetCompany.trim().length > 0 && targetRole.trim().length > 0

  async function handleConfirm() {
    if (!selectedTemplateKey) {
      setError('Bitte eine Vorlage wählen.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const params: CreateResumeForCategoryParams = {
        categoryId: category.id,
        templateKey: selectedTemplateKey,
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
      aria-labelledby="create-resume-cat-title"
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
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-primary-light">
              Neuer Lebenslauf
            </p>
            <h2 id="create-resume-cat-title" className="text-lg font-semibold text-white">
              In Kategorie:{' '}
              <span className="text-primary-light">{category.name}</span>
            </h2>
            <p className="mt-1 text-xs text-stone-500">
              Wähle eine Vorlage und gib optional den Bewerbungskontext an. Der Lebenslauf wird
              direkt dieser Kategorie zugeordnet.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
              {error}
            </div>
          )}

          {/* Template selection */}
          <div className="mb-6">
            <p className="mb-2 text-xs font-semibold text-stone-300">
              Vorlage / Design <span className="text-rose-400" aria-hidden>*</span>
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
                        : 'border-white/10 bg-black/20 text-stone-300 hover:border-white/25 hover:bg-white/[0.04]',
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

          {/* Job application context */}
          <div className="mb-6 space-y-3">
            <p className="text-xs font-semibold text-stone-300">
              Bewerbungskontext{' '}
              <span className="font-normal text-stone-500">(optional)</span>
            </p>

            {jobApplications.length > 0 && (
              <div>
                <label htmlFor="rcm-app" className="mb-1 block text-[11px] text-stone-500">
                  Bestehende Bewerbung verknüpfen
                </label>
                <select
                  id="rcm-app"
                  value={selectedAppId}
                  onChange={e => setSelectedAppId(e.target.value)}
                  className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white focus:border-primary/60 focus:outline-none"
                >
                  <option value="">— Keine Bewerbung verknüpfen —</option>
                  {jobApplications.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.company} — {a.jobTitle}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!selectedAppId && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label htmlFor="rcm-company" className="mb-1 block text-[11px] text-stone-500">
                      Unternehmen
                    </label>
                    <input
                      id="rcm-company"
                      type="text"
                      value={targetCompany}
                      onChange={e => setTargetCompany(e.target.value)}
                      placeholder="z. B. Acme GmbH"
                      className="w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/60 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="rcm-role" className="mb-1 block text-[11px] text-stone-500">
                      Stelle / Rolle
                    </label>
                    <input
                      id="rcm-role"
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
                      {' — '}
                      erstellt einen Eintrag unter „Meine Bewerbungen" und verknüpft diesen CV damit.
                    </span>
                  </label>
                )}

                {saveToApplicationList && (
                  <div>
                    <label htmlFor="rcm-url" className="mb-1 block text-[11px] text-stone-500">
                      Stellen-URL{' '}
                      <span className="text-stone-600">(optional)</span>
                    </label>
                    <input
                      id="rcm-url"
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
          <div className="flex items-center justify-end gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-200"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={busy || !selectedTemplateKey}
              onClick={() => void handleConfirm()}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-primary-hover disabled:opacity-50"
            >
              {busy
                ? <Loader2 size={14} className="animate-spin" aria-hidden />
                : <FilePlus size={14} aria-hidden />}
              Lebenslauf anlegen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
