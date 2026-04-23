import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Briefcase,
  Code2,
  Download,
  FileText,
  GraduationCap,
  GripVertical,
  Headphones,
  Heart,
  Languages,
  Loader2,
  PanelLeftClose,
  PanelRightOpen,
  Pencil,
  Plus,
  Save,
  SlidersHorizontal,
  Trash2,
  User,
  Wrench,
} from 'lucide-react'
import { downloadCvStudioDocx, downloadCvStudioPdf } from '../api/client'
import { LivePreview } from './components/LivePreview'
import { useCvStudioResumeEditor } from './hooks/useCvStudioResumeEditor'
import { downloadBlob, notify } from './lib/cvStudio'
import { CV_MAIN_SECTION_LABELS, normalizeContentSectionOrder, type CvMainSectionKey } from './lib/cvStudioSectionOrder'
import { formatVariantenName, versionBadgeClass } from './lib/formatting'
import type { LanguageItemData, PdfDesign, ResumeVersionDto, SkillGroupData, WorkItemData } from './cvTypes'

const field =
  'mt-1 block w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const lab = 'block text-xs font-medium text-stone-400'

function splitLines(input: string | undefined): string[] {
  return (input ?? '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)
}

function splitComma(input: string | undefined): string[] {
  return (input ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
}

/** Tailwind `xl` breakpoint — sync with tailwind.config for preview column width. */
function useMediaMinWidth(px: number): boolean {
  const [matches, setMatches] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${px}px)`)
    const fn = () => setMatches(mq.matches)
    fn()
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [px])
  return matches
}

type TabId = 'profil' | 'beruf' | 'ausbildung' | 'kenntnisse' | 'hobby' | 'sprachen' | 'darstellung'

function templateIconComponent(key: string) {
  if (key === 'software-developer' || key === 'softwareentwickler') return Code2
  if (key === 'it-support') return Headphones
  if (key === 'service-general' || key === 'service-gastro-zustellung') return Briefcase
  return FileText
}

export default function CvStudioEditorPage() {
  const { resumeId } = useParams()
  const [searchParams] = useSearchParams()
  const versionId = searchParams.get('versionId')
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const vm = useCvStudioResumeEditor(getToken)
  const {
    templates,
    resume,
    versions,
    selectedTemplateKey,
    setSelectedTemplateKey,
    pdfDesign,
    setPdfDesign,
    busy,
    error,
    variantNameDraft,
    setVariantNameDraft,
    aktivKontextText,
    autoSaveText,
    loadTemplates,
    createArbeitsversion,
    openResume,
    updateResume,
    flushAutoSave,
    saveVariant,
    loadVariantIntoEditor,
    resetAll,
  } = vm

  const [activeTab, setActiveTab] = useState<TabId>('profil')
  const [showSaveDropdown, setShowSaveDropdown] = useState(false)
  const [pdfExportName, setPdfExportName] = useState('')
  const [previewWidthPx, setPreviewWidthPx] = useState(380)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const previewLayoutXl = useMediaMinWidth(1280)

  useEffect(() => {
    if (!resume?.title) return
    const stem = resume.title.replace(/\.pdf$/i, '').trim()
    setPdfExportName(stem || `Lebenslauf-${resume.id.slice(0, 8)}`)
  }, [resume?.id, resume?.title])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadTemplates()
      if (cancelled || !resumeId) return
      await openResume(resumeId)
      if (cancelled) return
      if (versionId)
        await loadVariantIntoEditor(versionId)
    })()
    return () => {
      cancelled = true
    }
  }, [resumeId, versionId, loadTemplates, openResume, loadVariantIntoEditor])

  const tabClass = (t: TabId) =>
    [
      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
      activeTab === t ? 'bg-primary/20 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200',
    ].join(' ')

  const exportPdf = async (vId?: string | null) => {
    if (!resume) return
    await flushAutoSave()
    try {
      const token = await getToken()
      if (!token) {
        notify('Bitte anmelden.')
        return
      }
      const stem = pdfExportName.trim()
      const { blob } = await downloadCvStudioPdf(token, resume.id, {
        versionId: vId ?? undefined,
        design: pdfDesign,
        fileName: stem || null,
      })
      const downloadName = stem
        ? (stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`)
        : (vId ? `variante-${vId}.pdf` : `arbeitsversion-${resume.id}.pdf`)
      downloadBlob(downloadName, blob)
    }
    catch (e) {
      notify(e instanceof Error ? e.message : 'PDF-Export fehlgeschlagen.')
    }
  }

  const onPreviewResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = previewWidthPx
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      // Vorschau rechts: nach links ziehen verbreitert die Vorschau.
      setPreviewWidthPx(Math.min(560, Math.max(280, startW - dx)))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const exportDocx = async (vId?: string | null) => {
    if (!resume) return
    await flushAutoSave()
    try {
      const token = await getToken()
      if (!token) {
        notify('Bitte anmelden.')
        return
      }
      const blob = await downloadCvStudioDocx(token, resume.id, vId ?? undefined)
      const name = vId ? `variante-${vId}.docx` : `arbeitsversion-${resume.id}.docx`
      downloadBlob(name, blob)
    }
    catch (e) {
      notify(e instanceof Error ? e.message : 'DOCX-Export fehlgeschlagen.')
    }
  }

  const varianteSpeichern = async () => {
    const variante = await saveVariant()
    if (variante)
      notify(`Gespeicherte Variante: ${formatVariantenName(variante)}`)
  }

  if (!resumeId) {
    return <p className="text-sm text-stone-500">Keine Arbeitsversion gewählt.</p>
  }

  if (!resume) {
    return (
      <div className="flex items-center gap-2 py-12 text-stone-400">
        <Loader2 className="animate-spin" size={20} aria-hidden />
        <span>Lebenslauf wird geladen…</span>
      </div>
    )
  }

  const d = resume.resumeData
  const st = d.sectionTitles ?? {}

  return (
    <div className="pb-12">
      <header className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{resume.title}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-500">
            <span className="inline-flex items-center gap-1">
              <Pencil size={12} aria-hidden />
              {aktivKontextText}
            </span>
            <span className="text-stone-600">·</span>
            <span>{autoSaveText}</span>
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-stone-600">ID: {resume.id}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void createArbeitsversion().then(id => id && navigate(`/cv-studio/edit/${id}`))}
            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50 sm:text-sm"
          >
            <Plus className="inline" size={14} aria-hidden />
            {' '}
            Neue Arbeitsversion
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => navigate(`/cv-studio`)}
            className="rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5 sm:text-sm"
          >
            Übersicht
          </button>
        </div>
      </header>

      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-400">Vorlage für neue Version</h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {templates.map(vorlage => {
            const Icon = templateIconComponent(vorlage.key)
            const active = selectedTemplateKey === vorlage.key
            return (
              <button
                key={vorlage.key}
                type="button"
                disabled={busy}
                onClick={() => setSelectedTemplateKey(vorlage.key)}
                className={[
                  'flex flex-col items-start gap-1 rounded-lg border p-3 text-left text-xs transition-colors',
                  active ? 'border-primary bg-primary/10 text-white' : 'border-white/10 bg-black/20 text-stone-300 hover:border-white/20',
                ].join(' ')}
              >
                <Icon size={18} className="text-primary-light" aria-hidden />
                <span className="font-semibold">{vorlage.displayName}</span>
                <span className="text-stone-500">{vorlage.description}</span>
              </button>
            )
          })}
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void createArbeitsversion().then(id => id && navigate(`/cv-studio/edit/${id}`))}
          className="mt-3 rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5"
        >
          Mit gewählter Vorlage neue Arbeitsversion
        </button>
      </section>

      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-white/10 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
        <strong>Bearbeitung:</strong>
        {' '}
        {aktivKontextText}
      </div>

      {previewCollapsed ? (
        <div className="mb-2 hidden justify-end lg:flex">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-xs text-primary-light hover:bg-white/5"
            onClick={() => setPreviewCollapsed(false)}
          >
            <PanelRightOpen size={14} aria-hidden />
            Vorschau einblenden
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-6 xl:flex-row xl:items-stretch">
        <section className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20">
          <div className="flex flex-col gap-3 border-b border-white/10 p-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select
                className={`${field} w-auto min-w-[200px]`}
                value={pdfDesign}
                onChange={e => setPdfDesign(e.target.value as PdfDesign)}
              >
                <option value="A">Design A — Klassisch (ATS)</option>
                <option value="B">Design B — Modern</option>
                <option value="C">Design C — Professional</option>
              </select>
              <label className={`${lab} min-w-[140px] max-w-[220px] flex-1`}>
                PDF-Dateiname
                <input
                  className={field}
                  maxLength={180}
                  value={pdfExportName}
                  onChange={e => setPdfExportName(e.target.value)}
                  placeholder="z. B. Bewerbung Muster GmbH"
                  title="Wird in der PDF-Export-Liste und beim Download verwendet"
                />
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() => void exportPdf(null)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                <Download size={14} aria-hidden />
                PDF
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void exportDocx(null)}
                className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-2 text-xs text-stone-200 hover:bg-white/5 disabled:opacity-50"
              >
                <Download size={14} aria-hidden />
                DOCX
              </button>
            </div>
            <div className="relative">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowSaveDropdown(s => !s)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50"
              >
                <Save size={14} aria-hidden />
                Variante speichern
              </button>
              {showSaveDropdown ? (
                <div className="absolute right-0 z-20 mt-1 w-64 rounded-lg border border-white/15 bg-[#1a1512] p-3 shadow-xl">
                  <p className="mb-2 text-xs font-semibold text-white">Variante</p>
                  <input
                    className={field}
                    placeholder="z. B. SAP Bewerbung"
                    value={variantNameDraft}
                    onChange={e => setVariantNameDraft(e.target.value)}
                  />
                  <div className="mt-2 flex flex-col gap-1">
                    <button
                      type="button"
                      className="rounded border border-white/10 py-1.5 text-xs text-stone-200 hover:bg-white/5"
                      onClick={() => {
                        void varianteSpeichern()
                        setShowSaveDropdown(false)
                      }}
                    >
                      Nur speichern
                    </button>
                    <button
                      type="button"
                      className="rounded bg-primary py-1.5 text-xs text-white"
                      onClick={async () => {
                        const v = await saveVariant()
                        setShowSaveDropdown(false)
                        if (v && resume) {
                          const token = await getToken()
                          if (token) {
                            try {
                              const stem = pdfExportName.trim()
                              const { blob } = await downloadCvStudioPdf(token, resume.id, {
                                versionId: v.id,
                                design: pdfDesign,
                                fileName: stem || null,
                              })
                              const downloadName = stem
                                ? (stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`)
                                : `variante-${v.id}.pdf`
                              downloadBlob(downloadName, blob)
                            }
                            catch (e) {
                              notify(e instanceof Error ? e.message : 'PDF fehlgeschlagen')
                            }
                          }
                        }
                      }}
                    >
                      Speichern + PDF
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-1 border-b border-white/10 p-2">
            <button type="button" className={tabClass('darstellung')} onClick={() => setActiveTab('darstellung')}>
              <SlidersHorizontal size={14} aria-hidden />
              Darstellung
            </button>
            <button type="button" className={tabClass('profil')} onClick={() => setActiveTab('profil')}>
              <User size={14} aria-hidden />
              Profil
            </button>
            <button type="button" className={tabClass('ausbildung')} onClick={() => setActiveTab('ausbildung')}>
              <GraduationCap size={14} aria-hidden />
              Ausbildung
            </button>
            <button type="button" className={tabClass('kenntnisse')} onClick={() => setActiveTab('kenntnisse')}>
              <Wrench size={14} aria-hidden />
              Kenntnisse
            </button>
            <button type="button" className={tabClass('sprachen')} onClick={() => setActiveTab('sprachen')}>
              <Languages size={14} aria-hidden />
              Sprachen
            </button>
            <button type="button" className={tabClass('beruf')} onClick={() => setActiveTab('beruf')}>
              <Briefcase size={14} aria-hidden />
              Berufe
            </button>
            <button type="button" className={tabClass('hobby')} onClick={() => setActiveTab('hobby')}>
              <Heart size={14} aria-hidden />
              Hobbys
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-4 text-sm">
            {activeTab === 'profil' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white">Profil</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={lab}>
                    Titel
                    <input className={field} value={resume.title} onChange={e => updateResume(r => void (r.title = e.target.value))} />
                  </label>
                  <label className={lab}>
                    Vorname
                    <input className={field} value={d.profile.firstName} onChange={e => updateResume(r => void (r.resumeData.profile.firstName = e.target.value))} />
                  </label>
                  <label className={lab}>
                    Nachname
                    <input className={field} value={d.profile.lastName} onChange={e => updateResume(r => void (r.resumeData.profile.lastName = e.target.value))} />
                  </label>
                  <label className={lab}>
                    Headline
                    <input className={field} value={d.profile.headline} onChange={e => updateResume(r => void (r.resumeData.profile.headline = e.target.value))} />
                  </label>
                  <label className={lab}>
                    E-Mail
                    <input className={field} value={d.profile.email} onChange={e => updateResume(r => void (r.resumeData.profile.email = e.target.value))} />
                  </label>
                  <label className={lab}>
                    Telefon
                    <input className={field} value={d.profile.phone} onChange={e => updateResume(r => void (r.resumeData.profile.phone = e.target.value))} />
                  </label>
                  <label className={`${lab} sm:col-span-2`}>
                    Ort
                    <input className={field} value={d.profile.location} onChange={e => updateResume(r => void (r.resumeData.profile.location = e.target.value))} />
                  </label>
                  <label className={`${lab} sm:col-span-2`}>
                    Profilbild URL
                    <input className={field} value={d.profile.profileImageUrl} onChange={e => updateResume(r => void (r.resumeData.profile.profileImageUrl = e.target.value))} />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className={lab}>
                    LinkedIn
                    <input className={field} value={d.profile.linkedInUrl ?? ''} onChange={e => updateResume(r => void (r.resumeData.profile.linkedInUrl = e.target.value))} />
                  </label>
                  <label className={lab}>
                    GitHub
                    <input className={field} value={d.profile.gitHubUrl ?? ''} onChange={e => updateResume(r => void (r.resumeData.profile.gitHubUrl = e.target.value))} />
                  </label>
                  <label className={`${lab} sm:col-span-2`}>
                    Portfolio
                    <input className={field} value={d.profile.portfolioUrl ?? ''} onChange={e => updateResume(r => void (r.resumeData.profile.portfolioUrl = e.target.value))} />
                  </label>
                  <label className={`${lab} sm:col-span-2`}>
                    Arbeitsgenehmigung
                    <input className={field} value={d.profile.workPermit ?? ''} onChange={e => updateResume(r => void (r.resumeData.profile.workPermit = e.target.value))} />
                  </label>
                </div>
                <label className={lab}>
                  Qualifikationsprofil
                  <textarea className={field} rows={6} value={d.profile.summary} onChange={e => updateResume(r => void (r.resumeData.profile.summary = e.target.value))} />
                </label>
              </div>
            ) : null}

            {activeTab === 'beruf' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white">Berufserfahrung</h2>
                {d.workItems.map((item, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={lab}>
                        Unternehmen
                        <input className={field} value={item.company} onChange={e => updateResume(r => void (r.resumeData.workItems[index].company = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Rolle
                        <input className={field} value={item.role} onChange={e => updateResume(r => void (r.resumeData.workItems[index].role = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Start
                        <input className={field} value={item.startDate} onChange={e => updateResume(r => void (r.resumeData.workItems[index].startDate = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Ende
                        <input className={field} value={item.endDate} onChange={e => updateResume(r => void (r.resumeData.workItems[index].endDate = e.target.value))} />
                      </label>
                    </div>
                    <label className={`${lab} mt-2`}>
                      Kurzbeschreibung
                      <textarea className={field} rows={3} value={item.description} onChange={e => updateResume(r => void (r.resumeData.workItems[index].description = e.target.value))} />
                    </label>
                    <label className={`${lab} mt-2`}>
                      Stichpunkte (eine Zeile = ein Punkt)
                      <textarea className={field} rows={4} value={item.bullets.join('\n')} onChange={e => updateResume(r => void (r.resumeData.workItems[index].bullets = splitLines(e.target.value)))} />
                    </label>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-rose-300 hover:text-rose-200"
                      onClick={() => updateResume(r => void r.resumeData.workItems.splice(index, 1))}
                    >
                      <Trash2 size={14} aria-hidden />
                      Entfernen
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5"
                  onClick={() =>
                    updateResume((r) => {
                      r.resumeData.workItems.push({
                        company: '',
                        role: '',
                        startDate: '',
                        endDate: '',
                        description: '',
                        bullets: [],
                      } satisfies WorkItemData)
                    })}
                >
                  <Plus className="inline" size={14} aria-hidden />
                  {' '}
                  Eintrag hinzufügen
                </button>
              </div>
            ) : null}

            {activeTab === 'ausbildung' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white">Ausbildung</h2>
                {d.educationItems.map((item, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={lab}>
                        Schule
                        <input className={field} value={item.school} onChange={e => updateResume(r => void (r.resumeData.educationItems[index].school = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Abschluss
                        <input className={field} value={item.degree} onChange={e => updateResume(r => void (r.resumeData.educationItems[index].degree = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Start
                        <input className={field} value={item.startDate} onChange={e => updateResume(r => void (r.resumeData.educationItems[index].startDate = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Ende
                        <input className={field} value={item.endDate} onChange={e => updateResume(r => void (r.resumeData.educationItems[index].endDate = e.target.value))} />
                      </label>
                    </div>
                    <label className={`${lab} mt-2`}>
                      Beschreibung (Schwerpunkte, Thesis, Module …)
                      <textarea
                        className={field}
                        rows={3}
                        value={item.description ?? ''}
                        onChange={e => updateResume(r => void (r.resumeData.educationItems[index].description = e.target.value))}
                      />
                    </label>
                    <button
                      type="button"
                      className="mt-2 inline-flex items-center gap-1 text-xs text-rose-300"
                      onClick={() => updateResume(r => void r.resumeData.educationItems.splice(index, 1))}
                    >
                      <Trash2 size={14} aria-hidden />
                      Entfernen
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5"
                  onClick={() =>
                    updateResume((r) => {
                      r.resumeData.educationItems.push({ school: '', degree: '', startDate: '', endDate: '', description: '' })
                    })}
                >
                  <Plus className="inline" size={14} aria-hidden />
                  {' '}
                  Eintrag hinzufügen
                </button>
              </div>
            ) : null}

            {activeTab === 'kenntnisse' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white">Kenntnisse</h2>
                {d.skills.map((group, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <label className={lab}>
                      Kategorie
                      <input className={field} value={group.categoryName} onChange={e => updateResume(r => void (r.resumeData.skills[index].categoryName = e.target.value))} />
                    </label>
                    <label className={`${lab} mt-2`}>
                      Einträge (kommagetrennt)
                      <input className={field} value={group.items.join(', ')} onChange={e => updateResume(r => void (r.resumeData.skills[index].items = splitComma(e.target.value)))} />
                    </label>
                    <button type="button" className="mt-2 text-xs text-rose-300" onClick={() => updateResume(r => void r.resumeData.skills.splice(index, 1))}>
                      Entfernen
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5"
                  onClick={() =>
                    updateResume((r) => {
                      r.resumeData.skills.push({ categoryName: '', items: [] } satisfies SkillGroupData)
                    })}
                >
                  Kategorie hinzufügen
                </button>
              </div>
            ) : null}

            {activeTab === 'hobby' ? (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-white">Hobbys</h2>
                <label className={lab}>
                  Eine Zeile = ein Hobby
                  <textarea className={field} rows={8} value={d.hobbies.join('\n')} onChange={e => updateResume(r => void (r.resumeData.hobbies = splitLines(e.target.value)))} />
                </label>
              </div>
            ) : null}

            {activeTab === 'sprachen' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white">Sprachen</h2>
                <p className="text-xs text-stone-500">
                  Überschrift für PDF/Vorschau unter „Darstellung“ → „Sprachen“. Wenn die Liste leer ist, werden weiterhin Einträge aus einer Sprach-Kategorie unter Kenntnissen verwendet.
                </p>
                {d.languageItems.length === 0 ? (
                  <p className="text-xs text-stone-500">Noch keine Einträge — „Sprache hinzufügen“ oder Kenntnisse nutzen.</p>
                ) : null}
                {d.languageItems.map((li, index) => (
                  <div key={li.rowKey ?? `lang-${index}`} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={lab}>
                        Sprache
                        <input
                          className={field}
                          value={li.label}
                          onChange={e => updateResume(r => void (r.resumeData.languageItems[index].label = e.target.value))}
                        />
                      </label>
                      <label className={lab}>
                        Niveau (optional)
                        <input
                          className={field}
                          value={li.level ?? ''}
                          onChange={e => updateResume(r => void (r.resumeData.languageItems[index].level = e.target.value))}
                        />
                      </label>
                    </div>
                    <button
                      type="button"
                      className="mt-2 text-xs text-rose-300 hover:text-rose-200"
                      onClick={() => updateResume(r => void r.resumeData.languageItems.splice(index, 1))}
                    >
                      Entfernen
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5"
                  onClick={() =>
                    updateResume((r) => {
                      r.resumeData.languageItems.push({
                        label: '',
                        level: '',
                        rowKey: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `lang-${Date.now()}`,
                      } satisfies LanguageItemData)
                    })}
                >
                  Sprache hinzufügen
                </button>
              </div>
            ) : null}

            {activeTab === 'darstellung' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-white">CV-Sektionstitel</h2>
                  <p className="text-xs text-stone-500">
                    Optional: Überschriften für PDF und Vorschau. Leer = Standard. „Sprachen“ und „Interessen“ sind getrennte Sektionen (keine kombinierte Überschrift mehr).
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ['qualificationsProfile', 'Qualifikationsprofil'],
                        ['workExperience', 'Berufserfahrung'],
                        ['education', 'Ausbildung'],
                        ['skills', 'Kenntnisse'],
                        ['projects', 'Projekte'],
                        ['languages', 'Sprachen'],
                        ['interests', 'Interessen'],
                      ] as const
                    ).map(([key, ph]) => (
                      <label key={key} className={lab}>
                        {ph}
                        <input
                          className={field}
                          maxLength={120}
                          value={(st as Record<string, string | null | undefined>)[key] ?? ''}
                          onChange={(e) => {
                            updateResume((r) => {
                              if (!r.resumeData.sectionTitles) r.resumeData.sectionTitles = {}
                              ;(r.resumeData.sectionTitles as Record<string, string>)[key] = e.target.value
                            })
                          }}
                          placeholder={ph}
                        />
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-6">
                  <h2 className="text-sm font-semibold text-white">Reihenfolge der Hauptabschnitte</h2>
                  <p className="text-xs text-stone-500">
                    Ziehe eine Zeile an eine andere Position (Drag-and-Drop). Die Reihenfolge gilt für PDF- und DOCX-Export (Hauptspalte). „Sprachen“ und „Interessen“ sind getrennte Blöcke.
                  </p>
                  <ul className="space-y-2">
                    {normalizeContentSectionOrder(d.contentSectionOrder).map((key) => {
                      const label = CV_MAIN_SECTION_LABELS[key]
                      return (
                        <li
                          key={key}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-cv-section', key)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={(e) => {
                            e.preventDefault()
                            e.dataTransfer.dropEffect = 'move'
                          }}
                          onDrop={(e) => {
                            e.preventDefault()
                            const fromKey = e.dataTransfer.getData('application/x-cv-section') as CvMainSectionKey
                            if (!fromKey || fromKey === key) return
                            updateResume((r) => {
                              const o = [...normalizeContentSectionOrder(r.resumeData.contentSectionOrder)]
                              const fromIdx = o.indexOf(fromKey)
                              const toIdx = o.indexOf(key)
                              if (fromIdx < 0 || toIdx < 0) return
                              const [moved] = o.splice(fromIdx, 1)
                              o.splice(toIdx, 0, moved)
                              r.resumeData.contentSectionOrder = o
                            })
                          }}
                          className="flex cursor-grab items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 active:cursor-grabbing"
                        >
                          <GripVertical size={18} className="flex-shrink-0 text-stone-500" aria-hidden />
                          <span className="text-sm text-stone-200">{label}</span>
                          <span className="ml-auto font-mono text-[10px] text-stone-600">{key}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {!previewCollapsed ? (
          <>
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Breite der Live-Vorschau anpassen"
              className="hidden w-1 shrink-0 cursor-col-resize self-stretch rounded-full bg-white/15 hover:bg-primary/35 xl:block"
              onMouseDown={onPreviewResizeMouseDown}
            />
            <aside
              className="min-w-0 w-full shrink-0"
              style={
                previewLayoutXl
                  ? { flex: `0 0 ${previewWidthPx}px`, width: previewWidthPx, minWidth: 280, maxWidth: 560 }
                  : undefined
              }
            >
              <div className="mx-auto w-full max-w-full">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-400">Live-Vorschau</h2>
                  <button
                    type="button"
                    className="hidden rounded p-1 text-stone-400 hover:bg-white/10 hover:text-white xl:block"
                    title="Vorschau ausblenden"
                    onClick={() => setPreviewCollapsed(true)}
                  >
                    <PanelLeftClose size={18} aria-hidden />
                  </button>
                </div>
                <div className="max-h-[80vh] overflow-y-auto pr-1">
                  <LivePreview resume={resume} pdfDesign={pdfDesign} />
                </div>
              </div>
            </aside>
          </>
        ) : null}
      </div>

      <section className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <h2 className="mb-2 text-sm font-semibold text-white">Gespeicherte Varianten</h2>
        {versions.length === 0 ? (
          <p className="text-xs text-stone-500">Noch keine Variante.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {versions.map((variante: ResumeVersionDto) => (
              <li key={variante.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <span className={`mr-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-bold ${versionBadgeClass(variante.versionNumber)}`}>
                    v
                    {variante.versionNumber}
                  </span>
                  <strong className="text-sm text-white">{formatVariantenName(variante)}</strong>
                  <p className="text-xs text-stone-500">{new Date(variante.createdAtUtc).toLocaleString('de-DE')}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded border border-white/15 px-2 py-1 text-xs text-stone-200 hover:bg-white/5"
                    onClick={() => void loadVariantIntoEditor(variante.id)}
                  >
                    Als Arbeitsversion laden
                  </button>
                  <button type="button" className="rounded bg-primary/90 px-2 py-1 text-xs text-white" onClick={() => void exportPdf(variante.id)}>
                    PDF
                  </button>
                  <button type="button" className="rounded border border-white/20 px-2 py-1 text-xs text-stone-200" onClick={() => void exportDocx(variante.id)}>
                    DOCX
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-8 flex flex-wrap gap-2 border-t border-white/10 pt-4">
        <button
          type="button"
          className="text-xs text-rose-300 hover:text-rose-200"
          onClick={() => {
            if (!window.confirm('Alle Arbeitsversionen und Varianten löschen?')) return
            void resetAll().then(() => navigate('/cv-studio'))
          }}
        >
          Alles zurücksetzen (Fresh Start)
        </button>
      </div>
    </div>
  )
}
