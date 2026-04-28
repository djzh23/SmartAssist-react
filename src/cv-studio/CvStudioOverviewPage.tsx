import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { FolderPlus, Loader2, Plus, Sparkles } from 'lucide-react'
import {
  assignCvStudioCategory,
  createCvStudioResume,
  createCvStudioResumeFromTemplate,
  createJobApplication,
  deleteCvStudioPdfExport,
  deleteCvStudioResume,
  fetchJobApplications,
  getCvStudioResume,
  getCvStudioResumeTemplates,
  linkCvStudioJobApplication,
  listCvStudioPdfExports,
  listCvStudioResumes,
  type JobApplicationApi,
} from '../api/client'
import { useAppUi } from '../context/AppUiContext'
import type { CvStudioPdfExportRow, CvStudioResumeSummary, CvUserCategoryDto } from '../types'
import type { ResumeTemplateDto } from './cvTypes'
import { useCvResumeCategories } from '../hooks/useCvResumeCategories'
import CvCreateDialog, { type CreateParams } from './components/overview/CvCreateDialog'
import CvExportHistory from './components/overview/CvExportHistory'
import CvMasterCategoriesBoard from './components/overview/CvMasterCategoriesBoard'
import CvQuotaBadge from './components/overview/CvQuotaBadge'
import CreateCategoryModal from './components/overview/CreateCategoryModal'
import CreateResumeInCategoryModal, {
  type CreateResumeForCategoryParams,
} from './components/overview/CreateResumeInCategoryModal'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'

export default function CvStudioOverviewPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const forApplication = searchParams.get('forApplication')
  const { getToken } = useAuth()
  const { requestConfirm } = useAppUi()

  // ── Data state ────────────────────────────────────────────────────────────
  const [resumes, setResumes] = useState<CvStudioResumeSummary[] | null>(null)
  const [templates, setTemplates] = useState<ResumeTemplateDto[]>([])
  const [jobApplications, setJobApplications] = useState<JobApplicationApi[]>([])
  const [pdfRows, setPdfRows] = useState<CvStudioPdfExportRow[]>([])
  const [pdfLimit, setPdfLimit] = useState(0)
  const [pdfUsed, setPdfUsed] = useState(0)

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // General "Neuer Lebenslauf" dialog (no category context)
  const [showDialog, setShowDialog] = useState(false)

  // Modal: create category
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)

  // Modal: create resume inside a specific category
  const [showCreateResumeModal, setShowCreateResumeModal] = useState(false)
  const [selectedCategoryForResume, setSelectedCategoryForResume] = useState<CvUserCategoryDto | null>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const token = await getToken()
      if (!token) {
        setError('Kein Sitzungs-Token. Bitte neu anmelden.')
        return
      }
      const [rows, tpl, pdf, apps] = await Promise.all([
        listCvStudioResumes(token),
        getCvStudioResumeTemplates(token),
        listCvStudioPdfExports(token).catch(() => ({
          rows: [] as CvStudioPdfExportRow[],
          limit: 0,
          used: 0,
        })),
        fetchJobApplications(token).catch(() => [] as JobApplicationApi[]),
      ])
      setResumes(rows)
      setTemplates(tpl)
      setPdfRows(pdf.rows)
      setPdfLimit(pdf.limit)
      setPdfUsed(pdf.used)
      setJobApplications(apps)
    } catch (e) {
      setResumes(null)
      setError(e instanceof Error ? e.message : 'CV.Studio konnte nicht geladen werden.')
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    void load()
  }, [load])

  /** Redirect when opened via „CV anzeigen" in Bewerbungen. */
  useEffect(() => {
    if (!forApplication || loading || resumes === null) return
    const linked = resumes.find(r => r.linkedJobApplicationId === forApplication)
    if (linked) {
      navigate(`/cv-studio/edit/${linked.id}`, { replace: true })
      return
    }
    navigate(`/cv-studio/basis/${encodeURIComponent(forApplication)}`, { replace: true })
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      p.delete('forApplication')
      return p
    }, { replace: true })
  }, [forApplication, loading, resumes, navigate, setSearchParams])

  // ── Categories ────────────────────────────────────────────────────────────
  const resumeIds = useMemo(() => (resumes ?? []).map(r => r.id), [resumes])
  const {
    categories,
    loaded: categoriesLoaded,
    categoryError,
    assignResume,
    addCategory,
    removeCategory,
    renameCategory,
    reorderCategories,
    getCategoryIdForResume,
  } = useCvResumeCategories(resumeIds)

  // ── Handlers: categories ──────────────────────────────────────────────────
  async function handleCreateCategory(name: string) {
    await addCategory(name)
  }

  async function handleDeleteCategory(cat: CvUserCategoryDto) {
    const inCat = (resumes ?? []).filter(r => getCategoryIdForResume(r.id) === cat.id)
    const hint =
      inCat.length > 0
        ? `\n\n${inCat.length} Lebenslauf${inCat.length === 1 ? '' : 'läufe'} ${inCat.length === 1 ? 'wird' : 'werden'} danach unter „Ohne Kategorie" angezeigt.`
        : ''
    const ok = await requestConfirm({
      title: 'Kategorie löschen?',
      message: `Kategorie „${cat.name}" wirklich löschen?${hint}`,
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!ok) return
    await removeCategory(cat.id)
  }

  // ── Handlers: resumes ─────────────────────────────────────────────────────

  /** General create (no category pre-selection). */
  async function handleCreate(params: CreateParams) {
    const token = await getToken()
    if (!token) throw new Error('Kein Sitzungs-Token. Bitte neu anmelden.')

    let linkedJobApplicationId = params.linkedJobApplicationId
    if (
      params.createJobApplicationEntry &&
      params.targetCompany?.trim() &&
      params.targetRole?.trim()
    ) {
      const app = await createJobApplication(token, {
        company: params.targetCompany.trim(),
        jobTitle: params.targetRole.trim(),
        jobUrl: params.jobUrl?.trim() || undefined,
      })
      linkedJobApplicationId = app.id
    }

    const linkPayload =
      linkedJobApplicationId || params.targetCompany?.trim() || params.targetRole?.trim()
        ? {
            jobApplicationId: linkedJobApplicationId ?? null,
            targetCompany: params.targetCompany?.trim() || null,
            targetRole: params.targetRole?.trim() || null,
          }
        : null

    let created
    if (params.cloneFromId) {
      const source = await getCvStudioResume(token, params.cloneFromId)
      created = await createCvStudioResume(token, {
        title: `Kopie von ${source.title}`,
        templateKey: source.templateKey ?? params.templateKey,
        resumeData: source.resumeData,
      })
      if (linkPayload) await linkCvStudioJobApplication(token, created.id, linkPayload)
    } else {
      created = await createCvStudioResumeFromTemplate(token, params.templateKey, linkPayload)
    }

    navigate(`/cv-studio/edit/${created.id}`)
  }

  /** Create inside a category: create resume → assign → navigate to editor. */
  async function handleCreateResumeInCategory(params: CreateResumeForCategoryParams) {
    const token = await getToken()
    if (!token) throw new Error('Kein Sitzungs-Token. Bitte neu anmelden.')

    let linkedJobApplicationId = params.linkedJobApplicationId
    if (
      params.createJobApplicationEntry &&
      params.targetCompany?.trim() &&
      params.targetRole?.trim()
    ) {
      const app = await createJobApplication(token, {
        company: params.targetCompany.trim(),
        jobTitle: params.targetRole.trim(),
        jobUrl: params.jobUrl?.trim() || undefined,
      })
      linkedJobApplicationId = app.id
    }

    const linkPayload =
      linkedJobApplicationId || params.targetCompany?.trim() || params.targetRole?.trim()
        ? {
            jobApplicationId: linkedJobApplicationId ?? null,
            targetCompany: params.targetCompany?.trim() || null,
            targetRole: params.targetRole?.trim() || null,
          }
        : null

    let created
    if (params.cloneFromId) {
      // Clone: copy resumeData from the source, then apply any link context
      const source = await getCvStudioResume(token, params.cloneFromId)
      created = await createCvStudioResume(token, {
        title: `Kopie von ${source.title}`,
        templateKey: source.templateKey ?? params.templateKey,
        resumeData: source.resumeData,
      })
      if (linkPayload) await linkCvStudioJobApplication(token, created.id, linkPayload)
    } else {
      created = await createCvStudioResumeFromTemplate(token, params.templateKey, linkPayload)
    }

    // Assign to the category
    await assignCvStudioCategory(token, created.id, params.categoryId)

    navigate(`/cv-studio/edit/${created.id}`)
  }

  async function handleDeleteResume(resume: CvStudioResumeSummary) {
    const ok = await requestConfirm({
      title: 'Lebenslauf löschen?',
      message: `„${resume.title}" wirklich löschen?\n\nAlle gespeicherten Snapshots (Versionen) dieses Lebenslaufs werden mit entfernt. Zugehörige PDF-Export-Einträge in der Liste werden ebenfalls gelöscht.`,
      confirmLabel: 'Endgültig löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!ok) return
    const token = await getToken()
    if (!token) { setError('Bitte anmelden.'); return }
    try {
      await deleteCvStudioResume(token, resume.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.')
    }
  }

  async function handleDeletePdf(id: string) {
    const token = await getToken()
    if (!token) return
    await deleteCvStudioPdfExport(token, id)
    await load()
  }

  // ── Derived: filtered resumes for search ──────────────────────────────────
  const filteredResumes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q || !resumes) return resumes ?? []
    const matchingCategoryIds = new Set(
      categories
        .filter(cat => cat.name.toLowerCase().includes(q))
        .map(cat => cat.id),
    )
    return resumes.filter(r =>
      r.title.toLowerCase().includes(q) ||
      (r.targetCompany ?? '').toLowerCase().includes(q) ||
      (r.targetRole ?? '').toLowerCase().includes(q) ||
      (() => {
        const catId = getCategoryIdForResume(r.id)
        return catId != null && matchingCategoryIds.has(catId)
      })(),
    )
  }, [categories, getCategoryIdForResume, resumes, searchQuery])

  const filteredCategoryIds = useMemo(() => {
    return new Set(
      filteredResumes
        .map(r => getCategoryIdForResume(r.id))
        .filter((id): id is string => Boolean(id)),
    )
  }, [filteredResumes, getCategoryIdForResume])

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return categories
    return categories.filter(cat =>
      cat.name.toLowerCase().includes(q) || filteredCategoryIds.has(cat.id),
    )
  }, [categories, filteredCategoryIds, searchQuery])

  const existingResumes = (resumes ?? []).map(r => ({ id: r.id, title: r.title }))
  const hasResumes = (resumes?.length ?? 0) > 0

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-10">
      {/* Page header */}
      <div className="mb-8 flex flex-col gap-2 border-b border-white/10 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-light">
          CV.Studio
        </p>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 max-w-2xl">
            <div className="flex flex-wrap items-start gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Bewerbungen & Lebensläufe
              </h1>
              <InfoExplainerButton
                variant="onDark"
                trigger="hint"
                modalTitle="So funktioniert CV.Studio"
                ariaLabel="Hinweis: Ablauf CV.Studio"
                className="border-white/20 text-stone-200 hover:bg-white/12"
              >
                <p>
                  Organisiere deine Lebensläufe in <strong>Kategorien</strong> — z. B. „Frontend", „SAP" oder nach
                  Zielunternehmen. Innerhalb jeder Kategorie legst du einen oder mehrere Lebensläufe für konkrete
                  Bewerbungen an.
                </p>
                <p className="mt-3">
                  Klicke auf <strong>„+ Lebenslauf"</strong> in einer Kategorie, um einen neuen CV direkt dort
                  anzulegen. Du kannst optional eine Bewerbung aus „Meine Bewerbungen" verknüpfen oder eine neue
                  anlegen.
                </p>
                <p className="mt-3">
                  <strong>Vorlagen</strong> starten mit anonymen Beispieldaten. Mehr dazu im{' '}
                  <Link to="/guides/cv-studio-vorlagen-dummy" className="font-semibold text-primary hover:underline">
                    Ratgeber
                  </Link>
                  .
                </p>
              </InfoExplainerButton>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-stone-400">
              Erstelle Kategorien für deine Bewerbungsfelder und lege darin passende Lebensläufe an —
              alles übersichtlich an einem Ort.
            </p>
          </div>

          {/* Header actions */}
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCreateCategoryModal(true)}
                className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-light transition-colors hover:bg-primary/20"
              >
                <FolderPlus size={16} aria-hidden />
                Neue Kategorie
              </button>
              <button
                type="button"
                onClick={() => setShowDialog(true)}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
              >
                <Plus size={16} aria-hidden />
                Neuer Lebenslauf
              </button>
            </div>
            <CvQuotaBadge used={pdfUsed} limit={pdfLimit} />
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
        >
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 py-8 text-sm text-stone-400">
          <Loader2 className="animate-spin" size={18} aria-hidden />
          Daten werden geladen…
        </div>
      )}

      {/* Main content */}
      {!loading && resumes !== null && (
        <>
          {/* Search bar (only when there are resumes) */}
          {hasResumes && (
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Kategorien oder Lebensläufe durchsuchen…"
                className="w-full max-w-md rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-500 shadow-sm focus:border-primary/60 focus:outline-none"
              />
              {searchQuery && (
                <span className="text-xs text-stone-500">
                  {filteredResumes.length} Ergebnis{filteredResumes.length !== 1 ? 'se' : ''}
                </span>
              )}
            </div>
          )}

          {/* No resumes at all */}
          {!hasResumes && (
            <div className="mb-8 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-14 text-center">
              <Sparkles className="mx-auto mb-3 text-primary-light/80" size={28} aria-hidden />
              <p className="text-sm font-medium text-stone-200">Noch kein Lebenslauf</p>
              <p className="mt-1 text-xs text-stone-500">
                Lege zuerst eine Kategorie an und erstelle darin deinen ersten Lebenslauf.
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-light hover:bg-primary/20"
                >
                  <FolderPlus size={15} aria-hidden />
                  Kategorie anlegen
                </button>
                <button
                  type="button"
                  onClick={() => setShowDialog(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  <Plus size={15} aria-hidden />
                  Direkt Lebenslauf anlegen
                </button>
              </div>
            </div>
          )}

          {/* No search results */}
          {hasResumes && searchQuery && filteredResumes.length === 0 && filteredCategories.length === 0 && (
            <p className="mb-8 text-sm text-stone-500">
              Keine Treffer für „{searchQuery}".
            </p>
          )}

          {/* Category board */}
          {(!searchQuery || filteredResumes.length > 0) && (
            <div className="mb-8">
              <CvMasterCategoriesBoard
                resumes={filteredResumes}
                categories={filteredCategories}
                loaded={categoriesLoaded}
                categoryError={categoryError}
                getCategoryIdForResume={getCategoryIdForResume}
                assignResume={assignResume}
                renameCategory={renameCategory}
                reorderCategories={reorderCategories}
                onDeleteCategory={handleDeleteCategory}
                onDeleteResume={handleDeleteResume}
                onCreateCategory={() => setShowCreateCategoryModal(true)}
                onCreateResumeInCategory={cat => {
                  setSelectedCategoryForResume(cat)
                  setShowCreateResumeModal(true)
                }}
              />
            </div>
          )}

          {/* PDF export history */}
          <CvExportHistory
            rows={pdfRows}
            used={pdfUsed}
            limit={pdfLimit}
            onDelete={handleDeletePdf}
            requestConfirm={requestConfirm}
          />
        </>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* General CV create dialog */}
      {showDialog && (
        <CvCreateDialog
          templates={templates}
          jobApplications={jobApplications}
          prefillGroup={null}
          existingResumes={existingResumes}
          onConfirm={async params => { await handleCreate(params) }}
          onClose={() => setShowDialog(false)}
        />
      )}

      {/* Create category modal */}
      {showCreateCategoryModal && (
        <CreateCategoryModal
          onConfirm={handleCreateCategory}
          onClose={() => setShowCreateCategoryModal(false)}
        />
      )}

      {/* Create resume in category modal */}
      {showCreateResumeModal && selectedCategoryForResume && (
        <CreateResumeInCategoryModal
          category={selectedCategoryForResume}
          templates={templates}
          jobApplications={jobApplications}
          allResumes={resumes ?? []}
          getCategoryName={id => {
            const catId = getCategoryIdForResume(id)
            return catId ? (categories.find(c => c.id === catId)?.name ?? null) : null
          }}
          onConfirm={handleCreateResumeInCategory}
          onClose={() => {
            setShowCreateResumeModal(false)
            setSelectedCategoryForResume(null)
          }}
        />
      )}
    </div>
  )
}
