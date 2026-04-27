import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  Briefcase,
  Check,
  ChevronDown,
  Code2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  GraduationCap,
  GripVertical,
  Headphones,
  Heart,
  Languages,
  Loader2,
  Link2,
  MessageSquare,
  PanelLeftClose,
  PanelRightOpen,
  Plus,
  Save,
  SlidersHorizontal,
  Star,
  Trash2,
  User,
  Wrench,
} from 'lucide-react'
import {
  downloadCvStudioDocx,
  downloadCvStudioPdf,
  fetchJobApplications,
  type JobApplicationApi,
} from '../api/client'
import { useAppUi } from '../context/AppUiContext'
import { LivePreview } from './components/LivePreview'
import CvRenameSnapshotModal from './components/editor/CvRenameSnapshotModal'
import CvSaveVersionModal from './components/editor/CvSaveVersionModal'
import CvExportUnsavedModal from './components/editor/CvExportUnsavedModal'
import CvLinkApplicationModal from './components/editor/CvLinkApplicationModal'
import CvVersionsSidebar from './components/editor/CvVersionsSidebar'
import { useCvStudioResumeEditor } from './hooks/useCvStudioResumeEditor'
import { downloadBlob, notify } from './lib/cvStudio'
import { CV_MAIN_SECTION_LABELS, normalizeContentSectionOrder, type CvMainSectionKey } from './lib/cvStudioSectionOrder'
import { buildCvExportStem, formatRelativeTimeDe } from './lib/cvStudioPhase3'
import type { LanguageItemData, PdfDesign, SkillGroupData, WorkItemData } from './cvTypes'

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
  const tabParam = searchParams.get('tab')
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const { requestConfirm } = useAppUi()
  const vm = useCvStudioResumeEditor(getToken, requestConfirm)
  const {
    templates,
    resume,
    versions,
    activeVariant,
    selectedTemplateKey,
    setSelectedTemplateKey,
    pdfDesign,
    setPdfDesign,
    busy,
    error,
    aktivKontextText,
    autoSaveText,
    autoSaving,
    hasUnsavedChanges,
    loadTemplates,
    createArbeitsversion,
    openResume,
    updateResume,
    flushAutoSave,
    saveVariant,
    loadVariantIntoEditor,
    restoreSnapshotToWorkingCopy,
    deleteSnapshotVersion,
    renameSnapshotVersion,
    deleteAllSnapshotVersions,
    linkApplication,
    patchNotes,
    resetAll,
  } = vm

  const [activeTab, setActiveTab] = useState<TabId>('profil')
  const [pdfExportName, setPdfExportName] = useState('')
  const [exportNameTouched, setExportNameTouched] = useState(false)
  const [previewWidthPx, setPreviewWidthPx] = useState(380)
  const [previewCollapsed, setPreviewCollapsed] = useState(false)
  const previewLayoutXl = useMediaMinWidth(1280)

  // Phase 3 UI state
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notesDraft, setNotesDraft] = useState('')
  const [notesSaving, setNotesSaving] = useState(false)
  const [jobApplications, setJobApplications] = useState<JobApplicationApi[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [exportUnsavedModal, setExportUnsavedModal] = useState<
    null | { kind: 'pdf' | 'docx'; vId?: string | null; fileStem?: string | null }
  >(null)
  const [renameSnapshotTarget, setRenameSnapshotTarget] = useState<
    null | { id: string; versionNumber: number; label: string }
  >(null)

  const [versionsSidebarOpen, setVersionsSidebarOpen] = useState(() => {
    try {
      const v = localStorage.getItem('cvStudioVersionsSidebarOpen')
      if (v === '0') return false
      if (v === '1') return true
    } catch {
      /* ignore */
    }
    return true
  })

  useEffect(() => {
    try {
      localStorage.setItem('cvStudioVersionsSidebarOpen', versionsSidebarOpen ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [versionsSidebarOpen])

  useEffect(() => {
    setExportNameTouched(false)
  }, [resume?.id])

  useEffect(() => {
    if (!resume || exportNameTouched) return
    setPdfExportName(buildCvExportStem(resume, versions))
  }, [resume, versions, exportNameTouched])

  useEffect(() => {
    if (tabParam === 'versionen') {
      setVersionsSidebarOpen(true)
      setActiveTab('darstellung')
    }
  }, [tabParam])

  useEffect(() => {
    if (resume?.notes !== undefined) {
      setNotesDraft(resume.notes ?? '')
    }
  }, [resume?.notes])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadTemplates()
      if (cancelled || !resumeId) return
      await openResume(resumeId)
      if (cancelled) return
      if (versionId) await loadVariantIntoEditor(versionId)
    })()
    return () => { cancelled = true }
  }, [resumeId, versionId, loadTemplates, openResume, loadVariantIntoEditor])

  // Lazy-load job applications when link modal opens
  async function openLinkModal() {
    setShowLinkModal(true)
    if (jobApplications.length === 0) {
      setLoadingApps(true)
      try {
        const token = await getToken()
        if (token) setJobApplications(await fetchJobApplications(token).catch(() => []))
      } finally {
        setLoadingApps(false)
      }
    }
  }

  const headerChangeNote = useMemo(() => {
    const fromVariant = activeVariant?.label?.trim()
    if (fromVariant) return fromVariant
    if (!versions.length) return ''
    const top = versions.reduce((a, b) => (a.versionNumber >= b.versionNumber ? a : b))
    return top.label?.trim() ?? ''
  }, [activeVariant?.label, activeVariant?.id, versions])

  const versionStandHint = useMemo(() => {
    if (activeVariant) {
      return `Du siehst den Inhalt von Version ${activeVariant.versionNumber}. Klicke „Inhalt übernehmen” (Stift-Symbol rechts), um diesen Stand in deine Arbeitsversion zu übertragen.`
    }
    if (versions.length === 0) {
      return 'Deine Änderungen werden automatisch gespeichert. Mit „Version speichern” legst du einen manuellen Sicherungspunkt an — z. B. bevor du größere Änderungen vornimmst.'
    }
    return 'Du bearbeitest deine Arbeitsversion — der aktuelle Stand. Rechts siehst du gespeicherte Versionen, die du jederzeit wiederherstellen oder exportieren kannst.'
  }, [activeVariant?.versionNumber, versions.length])

  const tabClass = (t: TabId) =>
    [
      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm',
      activeTab === t ? 'bg-primary/20 text-white' : 'text-stone-400 hover:bg-white/5 hover:text-stone-200',
    ].join(' ')

  const runExportPdf = async (vId?: string | null, fileStem?: string | null) => {
    if (!resume) return
    await flushAutoSave()
    try {
      const token = await getToken()
      if (!token) {
        notify('Bitte anmelden.', 'error')
        return
      }
      const stem =
        (fileStem?.trim() || pdfExportName.trim()) ||
        buildCvExportStem(
          resume,
          versions,
          vId ? { pinnedVersionNumber: versions.find(v => v.id === vId)?.versionNumber } : undefined,
        )
      const { blob } = await downloadCvStudioPdf(token, resume.id, {
        versionId: vId ?? undefined,
        design: pdfDesign,
        fileName: stem || null,
      })
      const downloadName = stem
        ? (stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`)
        : (vId ? `variante-${vId}.pdf` : `arbeitsversion-${resume.id}.pdf`)
      downloadBlob(downloadName, blob)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'PDF-Export fehlgeschlagen.', 'error')
    }
  }

  const exportPdf = async (vId?: string | null, fileStem?: string | null) => {
    if (!resume) return
    if (hasUnsavedChanges && vId == null) {
      setExportUnsavedModal({ kind: 'pdf', vId, fileStem })
      return
    }
    await runExportPdf(vId, fileStem)
  }

  const runExportDocx = async (vId?: string | null, fileStem?: string | null) => {
    if (!resume) return
    await flushAutoSave()
    try {
      const token = await getToken()
      if (!token) {
        notify('Bitte anmelden.', 'error')
        return
      }
      const stem =
        (fileStem?.trim() || pdfExportName.trim()) ||
        buildCvExportStem(
          resume,
          versions,
          vId ? { pinnedVersionNumber: versions.find(v => v.id === vId)?.versionNumber } : undefined,
        )
      const blob = await downloadCvStudioDocx(token, resume.id, vId ?? undefined)
      const base = stem.toLowerCase().endsWith('.docx') ? stem.slice(0, -5) : stem
      const name = base ? `${base}.docx` : (vId ? `variante-${vId}.docx` : `arbeitsversion-${resume.id}.docx`)
      downloadBlob(name, blob)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'DOCX-Export fehlgeschlagen.', 'error')
    }
  }

  const exportDocx = async (vId?: string | null, fileStem?: string | null) => {
    if (!resume) return
    if (hasUnsavedChanges && vId == null) {
      setExportUnsavedModal({ kind: 'docx', vId, fileStem })
      return
    }
    await runExportDocx(vId, fileStem)
  }

  const handleSaveVersion = async (label: string) => {
    const v = await saveVariant(label)
    if (v) {
      notify(
        `Version ${v.versionNumber} gespeichert — Du kannst jederzeit zu früheren Versionen zurückkehren.`,
        'success',
      )
      if (!exportNameTouched && resume) {
        setPdfExportName(buildCvExportStem(resume, versions, { pinnedVersionNumber: v.versionNumber }))
      }
    }
    setShowSaveModal(false)
  }

  const handleSaveAndPdf = async (label: string) => {
    const v = await saveVariant(label)
    setShowSaveModal(false)
    if (!v || !resume) return
    try {
      const token = await getToken()
      if (!token) return
      const stem =
        (pdfExportName.trim()) ||
        buildCvExportStem(resume, versions, { pinnedVersionNumber: v.versionNumber })
      const { blob } = await downloadCvStudioPdf(token, resume.id, {
        versionId: v.id,
        design: pdfDesign,
        fileName: stem || null,
      })
      const downloadName = stem
        ? (stem.toLowerCase().endsWith('.pdf') ? stem : `${stem}.pdf`)
        : `variante-${v.id}.pdf`
      downloadBlob(downloadName, blob)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'PDF fehlgeschlagen', 'error')
    }
  }

  const handleLink = async (
    appId: string | null,
    company: string | null,
    role: string | null,
  ) => {
    await linkApplication({ jobApplicationId: appId, targetCompany: company, targetRole: role })
    setShowLinkModal(false)
  }

  const handleSaveNotes = async () => {
    setNotesSaving(true)
    try {
      await patchNotes(notesDraft.trim() || null)
      setShowNotes(false)
    } finally {
      setNotesSaving(false)
    }
  }

  const onPreviewResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = previewWidthPx
    const onMove = (ev: MouseEvent) => {
      setPreviewWidthPx(Math.min(560, Math.max(280, startW - (ev.clientX - startX))))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
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
  const contextLabel = [resume.targetCompany, resume.targetRole].filter(Boolean).join(' — ')

  return (
    <div className="pb-12">
      {/* ── Editor header ───────────────────────────────────────────────── */}
      <header className="mb-4 border-b border-white/10 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-2">
            <h1 className="text-xl font-semibold leading-snug text-white sm:text-2xl">
              {contextLabel || resume.title}
            </h1>
            <p className="text-xs text-stone-500">
              Interner Dokumentname:{' '}
              <span className="font-medium text-stone-400">{resume.title || '—'}</span>
              <button
                type="button"
                onClick={() => setActiveTab('profil')}
                className="ml-2 text-primary-light underline-offset-2 hover:underline"
              >
                Im Tab „Profil“ bearbeiten
              </button>
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-100">
                {activeVariant ? (
                  <>
                    Version {activeVariant.versionNumber}
                    <Star size={11} className="text-amber-300" fill="currentColor" aria-hidden />
                  </>
                ) : (
                  'Arbeitsversion'
                )}
              </span>
              <span className="text-stone-600" aria-hidden>
                ·
              </span>
              <span>
                Letzte Änderung:{' '}
                {formatRelativeTimeDe(resume.updatedAtUtc) || '—'}
              </span>
              <span className="text-stone-600" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1">
                {autoSaving ? (
                  'Auto-Save …'
                ) : hasUnsavedChanges ? (
                  'Auto-Save ausstehend'
                ) : (
                  <>
                    <Check size={12} className="text-emerald-400" aria-hidden />
                    Auto-Save
                  </>
                )}
              </span>
            </p>
            {headerChangeNote ? (
              <p className="text-xs text-stone-500">
                Notiz:{' '}
                <span className="text-stone-300">&ldquo;{headerChangeNote}&rdquo;</span>
              </p>
            ) : null}
            <div className="flex flex-wrap items-center gap-2">
              {resume.linkedJobApplicationId && (
                <Link
                  to={`/applications/${encodeURIComponent(resume.linkedJobApplicationId)}`}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-light hover:bg-primary/20"
                >
                  <Link2 size={11} aria-hidden />
                  Zur Bewerbung
                  <ExternalLink size={10} aria-hidden />
                </Link>
              )}
              <span className="text-xs text-stone-500">{autoSaveText}</span>
              {hasUnsavedChanges && (
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
                  Ungespeicherte Änderungen
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-600">{aktivKontextText}</p>
            <p className="text-[11px] leading-relaxed text-stone-500">{versionStandHint}</p>
          </div>

          <div className="flex flex-shrink-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              disabled={busy || autoSaving}
              title="Speichert die Arbeitsversion sofort auf dem Server (zusätzlich zum Auto-Save)."
              onClick={() => {
                void (async () => {
                  const outcome = await flushAutoSave()
                  if (outcome === 'saved')
                    notify('Arbeitsversion gespeichert.', 'success')
                  else if (outcome === 'skipped')
                    notify('Keine offenen Änderungen — alles war schon gespeichert.', 'info')
                  else if (outcome === 'no_token')
                    notify('Bitte anmelden.', 'error')
                  else if (outcome === 'failed')
                    notify('Speichern fehlgeschlagen — siehe Fehlermeldung oben.', 'error')
                })()
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/25 disabled:opacity-50 sm:text-sm"
            >
              <FileCheck2 size={14} aria-hidden />
              Jetzt speichern
            </button>
            <button
              type="button"
              disabled={busy}
              title="Speichert den aktuellen Stand als nummerierte Version — ein manueller Sicherungspunkt, jederzeit wiederherstellbar."
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-50 sm:text-sm"
            >
              <Save size={14} aria-hidden />
              Version speichern
            </button>
            <button
              type="button"
              onClick={() => void openLinkModal()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5 sm:text-sm"
            >
              <Link2 size={14} aria-hidden />
              {contextLabel ? 'Kontext ändern' : 'Mit Bewerbung verknüpfen'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNotes(v => !v)
                if (!showNotes) setNotesDraft(resume.notes ?? '')
              }}
              className={[
                'inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs transition-colors sm:text-sm',
                showNotes
                  ? 'border-primary/40 bg-primary/10 text-primary-light'
                  : 'border-white/15 text-stone-200 hover:bg-white/5',
              ].join(' ')}
            >
              <MessageSquare size={14} aria-hidden />
              Notizen
              {resume.notes && !showNotes && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" aria-label="Hat Notizen" />
              )}
            </button>
          </div>
        </div>

        {/* Notes panel */}
        {showNotes && (
          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-4">
            <label className="block text-xs font-medium text-stone-400">
              Notizen zu diesem Lebenslauf
              <textarea
                className={`${field} mt-1.5`}
                rows={4}
                value={notesDraft}
                onChange={e => setNotesDraft(e.target.value)}
                placeholder="z. B. Zielstelle, offene Punkte, Anpassungsideen …"
              />
            </label>
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowNotes(false)}
                className="text-xs text-stone-500 hover:text-stone-300"
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={notesSaving}
                onClick={() => void handleSaveNotes()}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
              >
                {notesSaving && <Loader2 size={13} className="animate-spin" aria-hidden />}
                Speichern
              </button>
            </div>
          </div>
        )}
      </header>

      {error ? (
        <div role="alert" className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

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
        <div className="flex min-w-0 flex-1 flex-col gap-0 xl:flex-row xl:items-stretch">
        {/* ── Editor panel ──────────────────────────────────────────────── */}
        <section className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20">
          {/* Toolbar */}
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
                Dateiname (ohne Endung)
                <input
                  className={field}
                  maxLength={180}
                  value={pdfExportName}
                  onChange={e => {
                    setExportNameTouched(true)
                    setPdfExportName(e.target.value)
                  }}
                  placeholder="z. B. CV_Meier_Firma_Rolle_v2"
                />
              </label>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <span className="sr-only">Herunterladen</span>
              <button
                type="button"
                disabled={busy}
                title="Lebenslauf als PDF speichern"
                onClick={() => void exportPdf(null)}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover disabled:opacity-50 sm:flex-initial sm:min-w-[9.5rem]"
              >
                <Download size={16} aria-hidden />
                PDF herunterladen
              </button>
              <button
                type="button"
                disabled={busy}
                title="Lebenslauf als Word-Datei speichern"
                onClick={() => void exportDocx(null)}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm font-semibold text-stone-100 hover:bg-white/10 disabled:opacity-50 sm:flex-initial sm:min-w-[9.5rem]"
              >
                <FileText size={16} aria-hidden />
                Word (.docx)
              </button>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createArbeitsversion().then(id => id && navigate(`/cv-studio/edit/${id}`))}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-3 py-2 text-xs text-stone-200 hover:bg-white/5"
            >
              <Plus size={13} aria-hidden />
              Neue Arbeitsversion
            </button>
          </div>

          {/* Template selector (for new Arbeitsversion) */}
          {templates.length > 0 && (
            <details className="border-b border-white/10">
              <summary className="flex cursor-pointer items-center justify-between px-4 py-2.5 text-xs text-stone-500 hover:text-stone-300">
                <span>Vorlage für neue Arbeitsversion</span>
                <ChevronDown size={14} aria-hidden className="details-chevron" />
              </summary>
              <div className="px-4 pb-3 pt-1">
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
              </div>
            </details>
          )}

          {/* Tabs */}
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

          {/* Tab content */}
          <div className="max-h-[70vh] overflow-y-auto p-4 text-sm">
            {/* ── Profil ──────────────────────────────────────────────── */}
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

            {/* ── Beruf ───────────────────────────────────────────────── */}
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
                  onClick={() => updateResume(r => { r.resumeData.workItems.push({ company: '', role: '', startDate: '', endDate: '', description: '', bullets: [] } satisfies WorkItemData) })}
                >
                  <Plus className="inline" size={14} aria-hidden />
                  {' '}Eintrag hinzufügen
                </button>
              </div>
            ) : null}

            {/* ── Ausbildung ──────────────────────────────────────────── */}
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
                      <textarea className={field} rows={3} value={item.description ?? ''} onChange={e => updateResume(r => void (r.resumeData.educationItems[index].description = e.target.value))} />
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
                  onClick={() => updateResume(r => { r.resumeData.educationItems.push({ school: '', degree: '', startDate: '', endDate: '', description: '' }) })}
                >
                  <Plus className="inline" size={14} aria-hidden />
                  {' '}Eintrag hinzufügen
                </button>
              </div>
            ) : null}

            {/* ── Kenntnisse ──────────────────────────────────────────── */}
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
                  onClick={() => updateResume(r => { r.resumeData.skills.push({ categoryName: '', items: [] } satisfies SkillGroupData) })}
                >
                  Kategorie hinzufügen
                </button>
              </div>
            ) : null}

            {/* ── Sprachen ────────────────────────────────────────────── */}
            {activeTab === 'sprachen' ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-white">Sprachen</h2>
                <p className="text-xs text-stone-500">
                  Wenn die Liste leer ist, werden Einträge aus einer Sprach-Kategorie unter Kenntnissen verwendet.
                </p>
                {d.languageItems.map((li, index) => (
                  <div key={li.rowKey ?? `lang-${index}`} className="rounded-lg border border-white/10 bg-black/30 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <label className={lab}>
                        Sprache
                        <input className={field} value={li.label} onChange={e => updateResume(r => void (r.resumeData.languageItems[index].label = e.target.value))} />
                      </label>
                      <label className={lab}>
                        Niveau (optional)
                        <input className={field} value={li.level ?? ''} onChange={e => updateResume(r => void (r.resumeData.languageItems[index].level = e.target.value))} />
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
                  onClick={() => updateResume(r => { r.resumeData.languageItems.push({ label: '', level: '', rowKey: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `lang-${Date.now()}` } satisfies LanguageItemData) })}
                >
                  Sprache hinzufügen
                </button>
              </div>
            ) : null}

            {/* ── Hobbys ──────────────────────────────────────────────── */}
            {activeTab === 'hobby' ? (
              <div>
                <h2 className="mb-2 text-sm font-semibold text-white">Hobbys</h2>
                <label className={lab}>
                  Eine Zeile = ein Hobby
                  <textarea className={field} rows={8} value={d.hobbies.join('\n')} onChange={e => updateResume(r => void (r.resumeData.hobbies = splitLines(e.target.value)))} />
                </label>
              </div>
            ) : null}

            {/* ── Darstellung ─────────────────────────────────────────── */}
            {activeTab === 'darstellung' ? (
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-sm font-semibold text-white">CV-Sektionstitel</h2>
                  <p className="text-xs text-stone-500">
                    Optional: Überschriften für PDF und Vorschau. Leer = Standard.
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
                          onChange={e => {
                            updateResume(r => {
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
                    Drag-and-Drop — gilt für PDF- und DOCX-Export.
                  </p>
                  <ul className="space-y-2">
                    {normalizeContentSectionOrder(d.contentSectionOrder).map(key => {
                      const label = CV_MAIN_SECTION_LABELS[key]
                      return (
                        <li
                          key={key}
                          draggable
                          onDragStart={e => {
                            e.dataTransfer.setData('application/x-cv-section', key)
                            e.dataTransfer.effectAllowed = 'move'
                          }}
                          onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' }}
                          onDrop={e => {
                            e.preventDefault()
                            const fromKey = e.dataTransfer.getData('application/x-cv-section') as CvMainSectionKey
                            if (!fromKey || fromKey === key) return
                            updateResume(r => {
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

        <CvVersionsSidebar
          open={versionsSidebarOpen}
          onToggle={() => setVersionsSidebarOpen(o => !o)}
          versions={versions}
          activeVariant={activeVariant}
          busy={busy}
          onRenameLabel={id => {
            const v = versions.find(x => x.id === id)
            if (!v) return
            setRenameSnapshotTarget({
              id: v.id,
              versionNumber: v.versionNumber,
              label: v.label ?? '',
            })
          }}
          onRestore={id =>
            void restoreSnapshotToWorkingCopy(id).then(ok => {
              if (ok) notify('Arbeitsstand wurde wiederhergestellt.', 'success')
            })}
          onLoadForEdit={id => void loadVariantIntoEditor(id)}
          onExportPdf={id =>
            void exportPdf(
              id,
              buildCvExportStem(resume, versions, {
                pinnedVersionNumber: versions.find(v => v.id === id)?.versionNumber,
              }),
            )}
          onExportDocx={id =>
            void exportDocx(
              id,
              buildCvExportStem(resume, versions, {
                pinnedVersionNumber: versions.find(v => v.id === id)?.versionNumber,
              }),
            )}
          onDelete={id =>
            void deleteSnapshotVersion(id).then(ok => {
              if (ok) notify('Snapshot gelöscht.', 'success')
            })}
          onDeleteAllSnapshots={() =>
            void deleteAllSnapshotVersions().then(ok => {
              if (ok) notify('Alle Snapshots wurden gelöscht.', 'success')
            })}
          onFreshStart={() => {
            void (async () => {
              const ok = await requestConfirm({
                title: 'Alles zurücksetzen?',
                message:
                  'Alle Arbeitsversionen und gespeicherten Lebensläufe in CV.Studio werden unwiderruflich gelöscht (Fresh Start).',
                confirmLabel: 'Zurücksetzen',
                cancelLabel: 'Abbrechen',
                danger: true,
              })
              if (!ok) return
              await resetAll()
              navigate('/cv-studio')
            })()
          }}
        />
        </div>

        {/* ── Live preview ──────────────────────────────────────────────── */}
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

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {exportUnsavedModal && (
        <CvExportUnsavedModal
          onSaveFirst={() => {
            setExportUnsavedModal(null)
            setShowSaveModal(true)
          }}
          onExportWithoutSnapshot={() => {
            const p = exportUnsavedModal
            setExportUnsavedModal(null)
            if (p.kind === 'pdf') void runExportPdf(p.vId, p.fileStem)
            else void runExportDocx(p.vId, p.fileStem)
          }}
          onDismiss={() => setExportUnsavedModal(null)}
        />
      )}

      {showSaveModal && (
        <CvSaveVersionModal
          busy={busy}
          onSave={handleSaveVersion}
          onSaveAndPdf={handleSaveAndPdf}
          onClose={() => setShowSaveModal(false)}
        />
      )}

      {renameSnapshotTarget && (
        <CvRenameSnapshotModal
          busy={busy}
          versionNumber={renameSnapshotTarget.versionNumber}
          initialLabel={renameSnapshotTarget.label}
          onClose={() => setRenameSnapshotTarget(null)}
          onSave={async label => {
            const ok = await renameSnapshotVersion(renameSnapshotTarget.id, label)
            if (ok) {
              setRenameSnapshotTarget(null)
              notify('Snapshot-Bezeichnung gespeichert.', 'success')
            }
          }}
        />
      )}

      {showLinkModal && (
        <CvLinkApplicationModal
          currentAppId={resume.linkedJobApplicationId ?? null}
          currentCompany={resume.targetCompany ?? null}
          currentRole={resume.targetRole ?? null}
          jobApplications={jobApplications}
          loadingApps={loadingApps}
          busy={busy}
          onLink={handleLink}
          onClose={() => setShowLinkModal(false)}
        />
      )}
    </div>
  )
}
