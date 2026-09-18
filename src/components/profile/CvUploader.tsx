import { useCallback, useRef, useState } from 'react'
import { FileUp, Loader2, X } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'
import type { Education, ParsedCvData, ProfileLanguage, WorkExperience } from '../../api/profileClient'
import { uploadCvPdfForParsing } from '../../api/profileClient'

interface FieldOpt {
  value: string
  label: string
}

interface Props {
  getToken: () => Promise<string | null>
  fieldOptions: FieldOpt[]
  levelOptions: FieldOpt[]
  cvPasteText: string
  onCvPasteTextChange: (v: string) => void
  /** Nach Bestätigung der Vorschau - Parent führt Onboarding + Profil-Update aus. */
  onApplyParsed: (draft: ParsedCvData) => Promise<void>
  onManualAdjust: (draft: ParsedCvData) => void
}

const inputCls =
  'mt-1 w-full rounded-lg border border-stone-400/40 bg-white px-2 py-1.5 text-sm text-stone-900 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30'
const rowInputCls =
  'rounded-lg border border-stone-400/30 bg-white px-1.5 py-1 text-xs text-stone-900 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30'

function fileToBase64DataPart(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => {
      const s = typeof r.result === 'string' ? r.result : ''
      const i = s.indexOf(',')
      resolve(i >= 0 ? s.slice(i + 1) : s)
    }
    r.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'))
    r.readAsDataURL(file)
  })
}

function normalizeParsed(p: Partial<ParsedCvData> | null | undefined): ParsedCvData {
  return {
    currentRole: p?.currentRole ?? '',
    field: p?.field ?? '',
    level: p?.level ?? '',
    skills: [...(p?.skills ?? [])],
    experience: [...(p?.experience ?? [])],
    education: [...(p?.education ?? [])],
    languages: [...(p?.languages ?? [])],
  }
}

export default function CvUploader({
  getToken,
  fieldOptions,
  levelOptions,
  cvPasteText,
  onCvPasteTextChange,
  onApplyParsed,
  onManualAdjust,
}: Props) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload')
  const [loading, setLoading] = useState(false)
  const [loadStep, setLoadStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<ParsedCvData | null>(null)
  const [skillInput, setSkillInput] = useState('')
  const [applyBusy, setApplyBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const runLoadSteps = useCallback(() => {
    setLoadStep(0)
    const t1 = window.setTimeout(() => setLoadStep(1), 400)
    const t2 = window.setTimeout(() => setLoadStep(2), 900)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [])

  const handleFile = async (file: File | null) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Bitte eine PDF-Datei hochladen.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Die Datei darf maximal 5 MB groß sein.')
      return
    }

    setLoading(true)
    setError(null)
    const clearSteps = runLoadSteps()
    try {
      const token = await getToken()
      if (!token) throw new Error('Nicht angemeldet')
      const b64 = await fileToBase64DataPart(file)
      const { parsed } = await uploadCvPdfForParsing(token, b64)
      setDraft(normalizeParsed(parsed))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload fehlgeschlagen')
    } finally {
      clearSteps()
      setLoading(false)
      setLoadStep(0)
    }
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || !draft) return
    if (draft.skills.includes(s)) return
    if (draft.skills.length >= 15) return
    setDraft({ ...draft, skills: [...draft.skills, s] })
    setSkillInput('')
  }

  const removeSkill = (sk: string) => {
    if (!draft) return
    setDraft({ ...draft, skills: draft.skills.filter(x => x !== sk) })
  }

  const updateExp = (i: number, patch: Partial<WorkExperience>) => {
    if (!draft) return
    const experience = draft.experience.map((e, j) => (j === i ? { ...e, ...patch } : e))
    setDraft({ ...draft, experience })
  }

  const removeExp = (i: number) => {
    if (!draft) return
    setDraft({ ...draft, experience: draft.experience.filter((_, j) => j !== i) })
  }

  const updateEdu = (i: number, patch: Partial<Education>) => {
    if (!draft) return
    const education = draft.education.map((e, j) => (j === i ? { ...e, ...patch } : e))
    setDraft({ ...draft, education })
  }

  const removeEdu = (i: number) => {
    if (!draft) return
    setDraft({ ...draft, education: draft.education.filter((_, j) => j !== i) })
  }

  const updateLang = (i: number, patch: Partial<ProfileLanguage>) => {
    if (!draft) return
    const languages = draft.languages.map((e, j) => (j === i ? { ...e, ...patch } : e))
    setDraft({ ...draft, languages })
  }

  const removeLang = (i: number) => {
    if (!draft) return
    setDraft({ ...draft, languages: draft.languages.filter((_, j) => j !== i) })
  }

  if (draft) {
    const fieldLabel = fieldOptions.find(f => f.value === (draft.field ?? ''))?.label ?? draft.field ?? ''
    const levelLabel = levelOptions.find(l => l.value === (draft.level ?? ''))?.label ?? draft.level ?? ''

    return (
      <div className="rounded-xl border border-emerald-500/30 bg-app-parchment p-4 shadow-landing">
        <p className="mb-3 text-sm font-semibold text-emerald-700">Erkannt aus deinem Lebenslauf</p>

        <div className="mb-3 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-stone-700">
            Berufsfeld
            <select
              value={draft.field ?? ''}
              onChange={e => setDraft({ ...draft, field: e.target.value })}
              className={inputCls}
            >
              <option value="">-</option>
              {fieldOptions.map(f => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            {fieldLabel && (
              <span className="mt-0.5 block text-[10px] text-stone-500">{fieldLabel}</span>
            )}
          </label>
          <label className="block text-xs font-medium text-stone-700">
            Level
            <select
              value={draft.level ?? ''}
              onChange={e => setDraft({ ...draft, level: e.target.value })}
              className={inputCls}
            >
              <option value="">-</option>
              {levelOptions.map(l => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
            {levelLabel && (
              <span className="mt-0.5 block text-[10px] text-stone-500">{levelLabel}</span>
            )}
          </label>
        </div>

        <label className="mb-3 block text-xs font-medium text-stone-700">
          Aktuelle Rolle
          <input
            value={draft.currentRole ?? ''}
            onChange={e => setDraft({ ...draft, currentRole: e.target.value })}
            className={inputCls}
          />
        </label>

        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-stone-700">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {draft.skills.map(sk => (
              <button
                key={sk}
                type="button"
                onClick={() => removeSkill(sk)}
                className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-primary/25"
              >
                {sk}
                <X size={11} />
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Skill hinzufügen"
              className="min-w-0 flex-1 rounded-lg border border-stone-400/30 bg-white px-2 py-1 text-sm text-stone-900 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            />
            <button
              type="button"
              onClick={addSkill}
              className="rounded-lg border border-stone-400/40 px-2 py-1 text-xs font-medium text-stone-700 hover:bg-app-parchmentDeep"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-3 space-y-2">
          <p className="text-xs font-medium text-stone-700">Erfahrung</p>
          {draft.experience.map((ex, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-lg border border-stone-400/25 bg-app-parchmentDeep p-2 text-xs sm:flex-row sm:items-center">
              <input
                value={ex.title ?? ''}
                onChange={e => updateExp(i, { title: e.target.value })}
                placeholder="Titel"
                className={`flex-1 ${rowInputCls}`}
              />
              <input
                value={ex.company ?? ''}
                onChange={e => updateExp(i, { company: e.target.value })}
                placeholder="Firma"
                className={`flex-1 ${rowInputCls}`}
              />
              <input
                value={ex.duration ?? ''}
                onChange={e => updateExp(i, { duration: e.target.value })}
                placeholder="Zeitraum"
                className={`w-full sm:w-28 ${rowInputCls}`}
              />
              <button type="button" onClick={() => removeExp(i)} className="text-rose-600 hover:text-rose-700">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mb-3 space-y-2">
          <p className="text-xs font-medium text-stone-700">Ausbildung</p>
          {draft.education.map((ed, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-lg border border-stone-400/25 bg-app-parchmentDeep p-2 text-xs sm:flex-row sm:items-center">
              <input
                value={ed.degree ?? ''}
                onChange={e => updateEdu(i, { degree: e.target.value })}
                placeholder="Abschluss"
                className={`flex-1 ${rowInputCls}`}
              />
              <input
                value={ed.institution ?? ''}
                onChange={e => updateEdu(i, { institution: e.target.value })}
                placeholder="Institution"
                className={`flex-1 ${rowInputCls}`}
              />
              <input
                value={ed.year ?? ''}
                onChange={e => updateEdu(i, { year: e.target.value })}
                placeholder="Jahr"
                className={`w-full sm:w-20 ${rowInputCls}`}
              />
              <button type="button" onClick={() => removeEdu(i)} className="text-rose-600 hover:text-rose-700">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-stone-700">Sprachen</p>
          {draft.languages.map((lg, i) => (
            <div key={i} className="flex flex-wrap items-center gap-1 text-xs">
              <input
                value={lg.name ?? ''}
                onChange={e => updateLang(i, { name: e.target.value })}
                placeholder="Sprache"
                className={`w-28 ${rowInputCls}`}
              />
              <input
                value={lg.level ?? ''}
                onChange={e => updateLang(i, { level: e.target.value })}
                placeholder="Level"
                className={`w-20 ${rowInputCls}`}
              />
              <button type="button" onClick={() => removeLang(i)} className="text-rose-600 hover:text-rose-700">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <AppCtaButton
            loading={applyBusy}
            onClick={() => {
              void (async () => {
                setApplyBusy(true)
                setError(null)
                try {
                  await onApplyParsed(draft)
                } catch (e) {
                  setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen')
                } finally {
                  setApplyBusy(false)
                }
              })()
            }}
          >
            {applyBusy ? 'Speichern…' : 'Alles übernehmen'}
          </AppCtaButton>
          <AppCtaButton
            variant="ghost"
            className="!text-stone-700 hover:!bg-app-parchmentDeep"
            onClick={() => onManualAdjust(draft)}
          >
            Im Formular bearbeiten (speichert nicht automatisch)
          </AppCtaButton>
          <button
            type="button"
            onClick={() => setDraft(null)}
            className="text-sm text-stone-600 hover:text-stone-800"
          >
            Zurück
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex rounded-lg border border-stone-400/40 bg-app-parchmentDeep p-0.5 text-xs font-medium">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={[
            'flex-1 rounded-md py-2 transition-colors',
            tab === 'upload' ? 'bg-app-parchment text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-800',
          ].join(' ')}
        >
          PDF hochladen
        </button>
        <button
          type="button"
          onClick={() => setTab('paste')}
          className={[
            'flex-1 rounded-md py-2 transition-colors',
            tab === 'paste' ? 'bg-app-parchment text-stone-900 shadow-sm' : 'text-stone-600 hover:text-stone-800',
          ].join(' ')}
        >
          Text einfügen
        </button>
      </div>

      {tab === 'upload' && (
        <>
          <button
            type="button"
            disabled={loading}
            onClick={() => inputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault()
              e.stopPropagation()
            }}
            onDrop={e => {
              e.preventDefault()
              void handleFile(e.dataTransfer.files[0] ?? null)
            }}
            className={[
              'flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-400/50 bg-app-parchment px-4 py-10 transition-colors',
              loading ? 'cursor-wait opacity-70' : 'hover:border-amber-500/50 hover:bg-amber-500/10',
            ].join(' ')}
          >
            {loading ? (
              <>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-stone-800">Lebenslauf wird analysiert…</p>
                <p className="text-xs text-stone-600">
                  {loadStep === 0 && 'Text extrahieren…'}
                  {loadStep === 1 && 'Daten erkennen…'}
                  {loadStep === 2 && 'Felder ausfüllen…'}
                </p>
              </>
            ) : (
              <>
                <FileUp className="h-10 w-10 text-stone-500" />
                <p className="text-center text-sm text-stone-700">
                  PDF-Lebenslauf hierhin ziehen oder klicken zum Auswählen
                </p>
                <p className="text-[11px] text-stone-500">Max. 5 MB</p>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={e => void handleFile(e.target.files?.[0] ?? null)}
          />
        </>
      )}

      {tab === 'paste' && (
        <div>
          <textarea
            value={cvPasteText}
            onChange={e => onCvPasteTextChange(e.target.value)}
            rows={8}
            placeholder="CV-Text hier einfügen…"
            className="w-full rounded-lg border border-stone-400/40 bg-app-parchment px-3 py-2 text-sm text-stone-900 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30"
          />
          <p className="mt-1 text-[11px] text-stone-600">
            Text wird beim Abschluss gespeichert (ohne KI-Analyse). Für automatische Erkennung nutze PDF.
          </p>
        </div>
      )}

      {error && !draft && <p className="text-sm text-rose-600">{error}</p>}
    </div>
  )
}
