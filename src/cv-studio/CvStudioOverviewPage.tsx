import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { FolderPlus, Loader2, Plus } from 'lucide-react'
import {
  assignCvStudioCategory,
  createCvStudioResume,
  createCvStudioResumeFromTemplate,
  createJobApplication,
  downloadCvStudioPdf,
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
import { downloadBlob, notify } from './lib/cvStudio'
import { useCvResumeCategories } from '../hooks/useCvResumeCategories'
import CvCreateDialog, { type CreateParams } from './components/overview/CvCreateDialog'
import CvQuotaBadge from './components/overview/CvQuotaBadge'
import CvStudioCategoryCard from './components/overview/CvStudioCategoryCard'
import CvStudioExportList from './components/overview/CvStudioExportList'
import CvStudioResumeCard from './components/overview/CvStudioResumeCard'
import CreateCategoryModal from './components/overview/CreateCategoryModal'
import CreateResumeInCategoryModal, {
  type CreateResumeForCategoryParams,
} from './components/overview/CreateResumeInCategoryModal'
import PageHeader from '../components/layout/PageHeader'

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | 'uncategorized' | null>(null)

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
    addCategory,
    removeCategory,
    renameCategory,
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
    const ok = await requestConfirm({
      title: 'Export entfernen?',
      message: 'Der Eintrag wird gelöscht und das Kontingent freigegeben.',
      confirmLabel: 'Löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!ok) return
    const token = await getToken()
    if (!token) return
    await deleteCvStudioPdfExport(token, id)
    await load()
  }

  async function handleRenameCategory(category: CvUserCategoryDto) {
    const next = window.prompt('Neuer Kategoriename', category.name)?.trim()
    if (!next || next === category.name) return
    await renameCategory(category.id, next)
  }

  async function handleDuplicateResume(resume: CvStudioResumeSummary) {
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return
    }
    setError(null)
    try {
      const source = await getCvStudioResume(token, resume.id)
      const created = await createCvStudioResume(token, {
        title: `Kopie von ${source.title}`,
        templateKey: source.templateKey ?? resume.templateKey,
        resumeData: source.resumeData,
      })
      if (resume.linkedJobApplicationId || resume.targetCompany || resume.targetRole) {
        await linkCvStudioJobApplication(token, created.id, {
          jobApplicationId: resume.linkedJobApplicationId ?? null,
          targetCompany: resume.targetCompany ?? null,
          targetRole: resume.targetRole ?? null,
        })
      }
      const categoryId = getCategoryIdForResume(resume.id)
      if (categoryId) {
        await assignCvStudioCategory(token, created.id, categoryId)
      }
      await load()
      navigate(`/cv-studio/edit/${created.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Duplizieren fehlgeschlagen.')
    }
  }

  async function handleExportResumePdf(resume: CvStudioResumeSummary) {
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return
    }
    setError(null)
    try {
      const fileName = `${resume.title || 'Lebenslauf'}.pdf`
      const { blob, limit, used } = await downloadCvStudioPdf(token, resume.id, { design: 'A', fileName })
      downloadBlob(fileName, blob)
      setPdfLimit(limit)
      setPdfUsed(used)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PDF-Export fehlgeschlagen.')
    }
  }

  async function handleDownloadExportRow(row: CvStudioPdfExportRow) {
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return
    }
    try {
      const safeDesign = row.design === 'B' || row.design === 'C' ? row.design : 'A'
      const fallbackName = row.fileLabel.endsWith('.pdf') ? row.fileLabel : `${row.fileLabel}.pdf`
      const { blob } = await downloadCvStudioPdf(token, row.resumeId, {
        versionId: row.versionId,
        design: safeDesign,
        fileName: fallbackName,
      })
      downloadBlob(fallbackName, blob)
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Download fehlgeschlagen.', 'error')
    }
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

  const sortedCategories = useMemo(
    () => [...filteredCategories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [filteredCategories],
  )
  const uncategorizedResumes = useMemo(
    () => filteredResumes.filter(r => !getCategoryIdForResume(r.id)),
    [filteredResumes, getCategoryIdForResume],
  )
  const hasResumes = filteredResumes.length > 0
  const existingResumes = (resumes ?? []).map(r => ({ id: r.id, title: r.title }))

  useEffect(() => {
    const availableKeys = new Set<string | 'uncategorized'>([
      ...sortedCategories.map(cat => cat.id),
      ...(uncategorizedResumes.length > 0 ? (['uncategorized'] as const) : []),
    ])
    if (availableKeys.size === 0) {
      setSelectedCategoryId(null)
      return
    }
    if (!selectedCategoryId || !availableKeys.has(selectedCategoryId)) {
      const firstCategory = sortedCategories[0]?.id ?? 'uncategorized'
      setSelectedCategoryId(firstCategory)
    }
  }, [selectedCategoryId, sortedCategories, uncategorizedResumes.length])

  const selectedCategoryResumes = useMemo(() => {
    if (!selectedCategoryId) return []
    if (selectedCategoryId === 'uncategorized') return uncategorizedResumes
    return filteredResumes.filter(r => getCategoryIdForResume(r.id) === selectedCategoryId)
  }, [filteredResumes, getCategoryIdForResume, selectedCategoryId, uncategorizedResumes])

  const selectedCategoryName = useMemo(() => {
    if (!selectedCategoryId) return null
    if (selectedCategoryId === 'uncategorized') return 'Ohne Kategorie'
    return sortedCategories.find(cat => cat.id === selectedCategoryId)?.name ?? null
  }, [selectedCategoryId, sortedCategories])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="pb-24 lg:pb-10">
      <PageHeader
        pageKey="cvStudio"
        title="CV.Studio"
        subtitle="Verwalte Kategorien und Lebensläufe an einem Ort."
        className="mb-5"
        actions={(
          <>
            <button
              type="button"
              onClick={() => setShowCreateCategoryModal(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-amber-300/30 bg-transparent px-4 py-2 text-sm font-semibold text-stone-100 transition hover:border-amber-300/60 hover:bg-white/5"
            >
              <FolderPlus size={16} aria-hidden />
              Kategorie erstellen
            </button>
            <button
              type="button"
              onClick={() => setShowDialog(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-hover"
            >
              <Plus size={16} aria-hidden />
              Neuer Lebenslauf
            </button>
          </>
        )}
      />

      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-[#15100c]/75 px-4 py-3">
        <p className="text-sm text-stone-300">Organisiere deine Lebensläufe in Kategorien oder starte direkt neu.</p>
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="hidden rounded-lg bg-amber-500/90 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-400 sm:inline-flex"
        >
          Neuen Lebenslauf erstellen
        </button>
      </div>

      <div className="mb-6 flex justify-end">
        <CvQuotaBadge used={pdfUsed} limit={pdfLimit} />
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
          <div className="mb-5">
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Kategorien oder Lebensläufe durchsuchen…"
              className="w-full max-w-md rounded-xl border border-white/15 bg-[#17120e] px-3 py-2 text-sm text-stone-100 placeholder:text-stone-500 focus:border-amber-400/55 focus:outline-none"
            />
          </div>

          {!categoriesLoaded && (
            <div className="mb-6 flex items-center gap-2 py-6 text-sm text-stone-400">
              <Loader2 className="animate-spin" size={16} />
              Kategorien werden geladen…
            </div>
          )}
          {categoryError && (
            <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-950/40 px-4 py-2 text-xs text-rose-200">
              {categoryError}
            </div>
          )}

          {hasResumes || sortedCategories.length > 0 ? (
            <>
              <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-stone-100">Kategorien</h2>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {sortedCategories.map(cat => {
                    const resumesInCategory = filteredResumes.filter(r => getCategoryIdForResume(r.id) === cat.id)
                    const latestTimestamp = resumesInCategory
                      .slice()
                      .sort((a, b) => new Date(b.updatedAtUtc).getTime() - new Date(a.updatedAtUtc).getTime())[0]
                      ?.updatedAtUtc
                    return (
                      <CvStudioCategoryCard
                        key={cat.id}
                        name={cat.name}
                        count={resumesInCategory.length}
                        updatedLabel={latestTimestamp ? new Date(latestTimestamp).toLocaleDateString('de-DE') : '—'}
                        active={selectedCategoryId === cat.id}
                        onOpen={() => setSelectedCategoryId(cat.id)}
                        onCreateResume={() => {
                          setSelectedCategoryForResume(cat)
                          setShowCreateResumeModal(true)
                        }}
                        onRename={() => void handleRenameCategory(cat)}
                        onDelete={() => void handleDeleteCategory(cat)}
                      />
                    )
                  })}
                  {uncategorizedResumes.length > 0 ? (
                    <CvStudioCategoryCard
                      name="Ohne Kategorie"
                      count={uncategorizedResumes.length}
                      updatedLabel={new Date(uncategorizedResumes[0].updatedAtUtc).toLocaleDateString('de-DE')}
                      active={selectedCategoryId === 'uncategorized'}
                      onOpen={() => setSelectedCategoryId('uncategorized')}
                      onCreateResume={() => setShowDialog(true)}
                      onRename={() => { /* no-op */ }}
                      onDelete={() => { /* no-op */ }}
                      showMenu={false}
                    />
                  ) : null}
                </div>
              </section>

              {selectedCategoryId && selectedCategoryName ? (
                <section className="mb-8 rounded-2xl border border-white/10 bg-[#120e0b]/76 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-stone-100">{selectedCategoryName}</h3>
                      <p className="text-xs text-stone-400">
                        {selectedCategoryResumes.length} Lebenslauf{selectedCategoryResumes.length === 1 ? '' : 'e'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedCategoryId === 'uncategorized') {
                          setShowDialog(true)
                          return
                        }
                        const targetCategory = sortedCategories.find(cat => cat.id === selectedCategoryId)
                        if (!targetCategory) return
                        setSelectedCategoryForResume(targetCategory)
                        setShowCreateResumeModal(true)
                      }}
                      className="rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                    >
                      + Lebenslauf
                    </button>
                  </div>

                  {selectedCategoryResumes.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-white/15 px-3 py-8 text-center text-sm text-stone-500">
                      Keine Lebensläufe in dieser Kategorie.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                      {selectedCategoryResumes.map(resume => (
                        <CvStudioResumeCard
                          key={resume.id}
                          resume={resume}
                          onEdit={() => navigate(`/cv-studio/edit/${resume.id}`)}
                          onDuplicate={() => void handleDuplicateResume(resume)}
                          onExportPdf={() => void handleExportResumePdf(resume)}
                          onDelete={() => void handleDeleteResume(resume)}
                        />
                      ))}
                    </div>
                  )}
                </section>
              ) : null}
            </>
          ) : (
            <div className="mb-8 rounded-2xl border border-dashed border-white/20 bg-white/[0.02] px-6 py-12 text-center">
              <p className="text-sm font-semibold text-stone-100">Starte mit deiner ersten Kategorie.</p>
              <p className="mt-1 text-xs text-stone-500">Danach kannst du pro Kategorie neue Lebensläufe anlegen.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(true)}
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-300/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/20"
                >
                  <FolderPlus size={15} />
                  Kategorie erstellen
                </button>
                <button
                  type="button"
                  onClick={() => setShowDialog(true)}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
                >
                  <Plus size={15} />
                  Neuer Lebenslauf
                </button>
              </div>
            </div>
          )}

          <CvStudioExportList
            rows={pdfRows}
            onDelete={handleDeletePdf}
            onDownload={handleDownloadExportRow}
          />
        </>
      )}

      <div className="fixed inset-x-4 bottom-4 z-20 sm:hidden">
        <button
          type="button"
          onClick={() => setShowDialog(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/30"
        >
          <Plus size={16} />
          Neuer Lebenslauf
        </button>
      </div>

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
