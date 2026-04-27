import { FolderOpen, Loader2, Plus, Trash2 } from 'lucide-react'
import type { CvStudioResumeSummary, CvUserCategoryDto } from '../../../types'
import CvResumeCard from './CvResumeCard'

interface Props {
  resumes: CvStudioResumeSummary[]
  categories: CvUserCategoryDto[]
  loaded: boolean
  categoryError: string | null
  getCategoryIdForResume: (resumeId: string) => string | null
  assignResume: (resumeId: string, categoryId: string | null) => void | Promise<void>
  onDeleteCategory: (category: CvUserCategoryDto) => void | Promise<void>
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
  onCreateCategory: () => void
  onCreateResumeInCategory: (category: CvUserCategoryDto) => void
}

export default function CvMasterCategoriesBoard({
  resumes,
  categories,
  loaded,
  categoryError,
  getCategoryIdForResume,
  assignResume,
  onDeleteCategory,
  onDeleteResume,
  onCreateCategory,
  onCreateResumeInCategory,
}: Props) {
  const uncategorized = resumes.filter(r => !getCategoryIdForResume(r.id))

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-stone-400">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Kategorien werden geladen…
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Error banner */}
      {categoryError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
          {categoryError}
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 && resumes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary-light">
            <FolderOpen size={24} aria-hidden />
          </div>
          <p className="text-sm font-medium text-stone-200">Noch keine Kategorien</p>
          <p className="mt-1 text-xs text-stone-500">
            Lege deine erste Kategorie an — z. B. „Frontend", „SAP" oder „Google".
          </p>
          <button
            type="button"
            onClick={onCreateCategory}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Plus size={15} aria-hidden />
            Erste Kategorie anlegen
          </button>
        </div>
      )}

      {/* Category sections */}
      {categories.map(cat => {
        const inCat = resumes.filter(r => getCategoryIdForResume(r.id) === cat.id)
        return (
          <CategorySection
            key={cat.id}
            category={cat}
            resumes={inCat}
            allCategories={categories}
            getCategoryIdForResume={getCategoryIdForResume}
            assignResume={assignResume}
            onDelete={() => void onDeleteCategory(cat)}
            onDeleteResume={onDeleteResume}
            onCreateResume={() => onCreateResumeInCategory(cat)}
          />
        )
      })}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/[0.015] p-4">
          <div className="mb-4 flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-stone-400">
              Ohne Kategorie
            </h3>
            <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-stone-500 tabular-nums">
              {uncategorized.length}
            </span>
          </div>
          {categories.length > 0 && (
            <p className="mb-3 text-[11px] text-stone-500">
              Ordne diesen Lebensläufen über das Dropdown eine Kategorie zu.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {uncategorized.map(r => (
              <div key={r.id} className="flex flex-col gap-1.5">
                <CvResumeCard
                  resume={r}
                  onDelete={() => void onDeleteResume(r)}
                />
                {categories.length > 0 && (
                  <CategorySelector
                    resumeId={r.id}
                    categories={categories}
                    activeCategoryId={null}
                    onChangeCategory={cid => void assignResume(r.id, cid)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function CategorySection({
  category,
  resumes,
  allCategories,
  getCategoryIdForResume,
  assignResume,
  onDelete,
  onDeleteResume,
  onCreateResume,
}: {
  category: CvUserCategoryDto
  resumes: CvStudioResumeSummary[]
  allCategories: CvUserCategoryDto[]
  getCategoryIdForResume: (id: string) => string | null
  assignResume: (resumeId: string, categoryId: string | null) => void | Promise<void>
  onDelete: () => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
  onCreateResume: () => void
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.03]">
      {/* Category header */}
      <div className="flex items-center justify-between gap-2 border-b border-primary/15 px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={15} className="shrink-0 text-primary-light/70" aria-hidden />
          <h3 className="text-sm font-semibold text-white">{category.name}</h3>
          <span className="rounded-md bg-primary/20 px-1.5 py-0.5 text-[10px] font-medium text-primary-light tabular-nums">
            {resumes.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCreateResume}
            className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/15 px-3 py-1.5 text-[11px] font-semibold text-primary-light transition-colors hover:bg-primary/25"
            title={`Lebenslauf in „${category.name}" erstellen`}
          >
            <Plus size={13} aria-hidden />
            Lebenslauf
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-rose-300/70 transition-colors hover:bg-rose-950/40 hover:text-rose-200"
            title={`Kategorie „${category.name}" löschen`}
          >
            <Trash2 size={13} aria-hidden />
          </button>
        </div>
      </div>

      {/* CV grid */}
      <div className="p-4">
        {resumes.length === 0 ? (
          <button
            type="button"
            onClick={onCreateResume}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/25 py-8 text-xs text-stone-500 transition-colors hover:border-primary/40 hover:bg-primary/[0.04] hover:text-stone-300"
          >
            <Plus size={15} aria-hidden />
            Ersten Lebenslauf in dieser Kategorie anlegen
          </button>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {resumes.map(r => (
              <div key={r.id} className="flex flex-col gap-1.5">
                <CvResumeCard
                  resume={r}
                  onDelete={() => void onDeleteResume(r)}
                />
                {allCategories.length > 1 && (
                  <CategorySelector
                    resumeId={r.id}
                    categories={allCategories}
                    activeCategoryId={getCategoryIdForResume(r.id)}
                    onChangeCategory={cid => void assignResume(r.id, cid)}
                  />
                )}
              </div>
            ))}

            {/* Add tile */}
            <button
              type="button"
              onClick={onCreateResume}
              className="flex min-h-[10rem] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/20 bg-primary/[0.03] text-xs text-stone-500 transition-colors hover:border-primary/35 hover:bg-primary/[0.06] hover:text-stone-300"
              title={`Lebenslauf in „${category.name}" anlegen`}
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary-light/70">
                <Plus size={18} aria-hidden />
              </div>
              <span>Neuer Lebenslauf</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function CategorySelector({
  resumeId,
  categories,
  activeCategoryId,
  onChangeCategory,
}: {
  resumeId: string
  categories: CvUserCategoryDto[]
  activeCategoryId: string | null
  onChangeCategory: (categoryId: string | null) => void
}) {
  return (
    <>
      <label className="sr-only" htmlFor={`cat-${resumeId}`}>Kategorie zuweisen</label>
      <select
        id={`cat-${resumeId}`}
        value={activeCategoryId ?? ''}
        onChange={e => onChangeCategory(e.target.value === '' ? null : e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-stone-400 focus:border-primary/40 focus:outline-none"
      >
        <option value="">— Kategorie —</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </>
  )
}
