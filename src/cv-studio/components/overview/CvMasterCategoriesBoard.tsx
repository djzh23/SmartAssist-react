import { useState } from 'react'
import { ChevronDown, ChevronRight, FolderOpen, Loader2, Plus, Trash2 } from 'lucide-react'
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

/** Fixed card dimensions for uniform rows */
const CARD_W = 'w-36'        // 144 px
const CARD_H = 'h-[11.5rem]' // ~184 px

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
    <div className="space-y-3">
      {/* Error banner */}
      {categoryError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
          {categoryError}
        </div>
      )}

      {/* Empty state */}
      {categories.length === 0 && resumes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-600/40 bg-stone-900/40 px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300/70">
            <FolderOpen size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-stone-200">Noch keine Kategorien</p>
          <p className="mt-1 text-xs text-stone-500">
            Lege deine erste Kategorie an — z. B. „Frontend", „SAP" oder „Google".
          </p>
          <button
            type="button"
            onClick={onCreateCategory}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            <Plus size={15} aria-hidden />
            Erste Kategorie anlegen
          </button>
        </div>
      )}

      {/* Category sections */}
      {categories.map((cat, idx) => {
        const inCat = resumes.filter(r => getCategoryIdForResume(r.id) === cat.id)
        return (
          <CategorySection
            key={cat.id}
            index={idx}
            category={cat}
            resumes={inCat}
            allCategories={categories}
            getCategoryIdForResume={getCategoryIdForResume}
            assignResume={assignResume}
            onDelete={() => void onDeleteCategory(cat)}
            onDeleteResume={onDeleteResume}
            onCreateResume={() => onCreateResumeInCategory(cat)}
            cardW={CARD_W}
            cardH={CARD_H}
          />
        )
      })}

      {/* Uncategorized */}
      {uncategorized.length > 0 && (
        <UncategorizedSection
          resumes={uncategorized}
          categories={categories}
          assignResume={assignResume}
          onDeleteResume={onDeleteResume}
          cardW={CARD_W}
          cardH={CARD_H}
        />
      )}
    </div>
  )
}

// ─── Category accent colours (cycles through 4 palettes) ─────────────────────

const ACCENTS = [
  { border: 'border-violet-700/40', header: 'bg-violet-950/50', dot: 'bg-violet-400' },
  { border: 'border-amber-700/40',  header: 'bg-amber-950/50',  dot: 'bg-amber-400'  },
  { border: 'border-sky-700/40',    header: 'bg-sky-950/50',    dot: 'bg-sky-400'    },
  { border: 'border-emerald-700/40',header: 'bg-emerald-950/50',dot: 'bg-emerald-400'},
]

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  index,
  category,
  resumes,
  allCategories,
  getCategoryIdForResume,
  assignResume,
  onDelete,
  onDeleteResume,
  onCreateResume,
  cardW,
  cardH,
}: {
  index: number
  category: CvUserCategoryDto
  resumes: CvStudioResumeSummary[]
  allCategories: CvUserCategoryDto[]
  getCategoryIdForResume: (id: string) => string | null
  assignResume: (resumeId: string, categoryId: string | null) => void | Promise<void>
  onDelete: () => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
  onCreateResume: () => void
  cardW: string
  cardH: string
}) {
  const [open, setOpen] = useState(true)
  const accent = ACCENTS[index % ACCENTS.length]

  return (
    <div className={`overflow-hidden rounded-xl border ${accent.border} bg-stone-900/60`}>
      {/* Header — clickable to collapse */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left ${accent.header} transition-colors hover:brightness-110`}
        aria-expanded={open}
        aria-controls={`cat-body-${category.id}`}
      >
        {/* Accent dot */}
        <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} aria-hidden />

        {/* Category name */}
        <span className="min-w-0 flex-1 text-sm font-bold tracking-wide text-white">
          {category.name}
        </span>

        {/* Count badge */}
        <span className="shrink-0 rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-300">
          {resumes.length}
        </span>

        {/* Collapse chevron */}
        {open
          ? <ChevronDown size={15} className="shrink-0 text-stone-400" aria-hidden />
          : <ChevronRight size={15} className="shrink-0 text-stone-400" aria-hidden />}
      </button>

      {/* Body */}
      {open && (
        <div id={`cat-body-${category.id}`} className="px-4 pb-4 pt-3">
          {resumes.length === 0 ? (
            /* Empty placeholder */
            <button
              type="button"
              onClick={onCreateResume}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-600/50 py-7 text-xs text-stone-500 transition-colors hover:border-stone-500 hover:bg-stone-800/40 hover:text-stone-300"
            >
              <Plus size={14} aria-hidden />
              Ersten Lebenslauf in dieser Kategorie anlegen
            </button>
          ) : (
            /* Horizontal scroll row */
            <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
              {resumes.map(r => (
                <div key={r.id} className={`${cardW} ${cardH} shrink-0 flex flex-col gap-1.5`}>
                  <div className="flex-1">
                    <CvResumeCard resume={r} onDelete={() => void onDeleteResume(r)} />
                  </div>
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
              <div className={`${cardW} ${cardH} shrink-0`}>
                <button
                  type="button"
                  onClick={onCreateResume}
                  className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-stone-600/50 bg-stone-800/20 text-[11px] text-stone-500 transition-colors hover:border-violet-500/40 hover:bg-violet-950/20 hover:text-stone-300"
                  title={`Lebenslauf in „${category.name}" anlegen`}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-stone-600/50 bg-stone-700/40 text-stone-400">
                    <Plus size={16} aria-hidden />
                  </div>
                  <span className="text-center leading-tight">Neuer<br />Lebenslauf</span>
                </button>
              </div>
            </div>
          )}

          {/* Category actions row */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onCreateResume}
              className="flex items-center gap-1.5 rounded-lg bg-violet-600/90 px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-violet-500"
            >
              <Plus size={12} aria-hidden />
              Lebenslauf
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] text-stone-500 transition-colors hover:bg-rose-950/40 hover:text-rose-300"
              title={`Kategorie „${category.name}" löschen`}
            >
              <Trash2 size={12} aria-hidden />
              Kategorie löschen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Uncategorized Section ────────────────────────────────────────────────────

function UncategorizedSection({
  resumes,
  categories,
  assignResume,
  onDeleteResume,
  cardW,
  cardH,
}: {
  resumes: CvStudioResumeSummary[]
  categories: CvUserCategoryDto[]
  assignResume: (resumeId: string, categoryId: string | null) => void | Promise<void>
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
  cardW: string
  cardH: string
}) {
  const [open, setOpen] = useState(true)

  return (
    <div className="overflow-hidden rounded-xl border border-stone-700/40 bg-stone-900/40">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center gap-3 bg-stone-800/50 px-4 py-2.5 text-left transition-colors hover:brightness-110"
        aria-expanded={open}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-stone-500" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-bold tracking-wide text-stone-300">
          Ohne Kategorie
        </span>
        <span className="shrink-0 rounded-md bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-400">
          {resumes.length}
        </span>
        {open
          ? <ChevronDown size={15} className="shrink-0 text-stone-500" aria-hidden />
          : <ChevronRight size={15} className="shrink-0 text-stone-500" aria-hidden />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3">
          {categories.length > 0 && (
            <p className="mb-2 text-[11px] text-stone-500">
              Ordne diesen Lebensläufen über das Dropdown eine Kategorie zu.
            </p>
          )}
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {resumes.map(r => (
              <div key={r.id} className={`${cardW} ${cardH} shrink-0 flex flex-col gap-1.5`}>
                <div className="flex-1">
                  <CvResumeCard resume={r} onDelete={() => void onDeleteResume(r)} />
                </div>
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

// ─── Category Selector (readable dropdown) ────────────────────────────────────

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
      <label className="sr-only" htmlFor={`cat-${resumeId}`}>Kategorie</label>
      <select
        id={`cat-${resumeId}`}
        value={activeCategoryId ?? ''}
        onChange={e => onChangeCategory(e.target.value === '' ? null : e.target.value)}
        className="w-full rounded-lg border border-stone-600/60 bg-stone-700 px-2 py-1 text-[10px] font-medium text-stone-100 focus:border-violet-500/60 focus:outline-none"
      >
        <option value="">— Kategorie —</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </>
  )
}
