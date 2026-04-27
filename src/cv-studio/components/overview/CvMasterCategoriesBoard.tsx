import { useState } from 'react'
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
  addCategory: (name: string) => void | Promise<void>
  removeCategory: (id: string) => void | Promise<void>
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}

export default function CvMasterCategoriesBoard({
  resumes,
  categories,
  loaded,
  categoryError,
  getCategoryIdForResume,
  assignResume,
  addCategory,
  removeCategory,
  onDeleteResume,
}: Props) {
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const uncategorized = resumes.filter(r => !getCategoryIdForResume(r.id))

  async function handleCreate() {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await addCategory(newName.trim())
      setNewName('')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Category error */}
      {categoryError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
          {categoryError}
        </div>
      )}

      {/* Create category */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="cv-new-cat" className="mb-1 block text-[11px] font-semibold text-stone-400">
            Neue Kategorie anlegen
          </label>
          <input
            id="cv-new-cat"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
            placeholder="z. B. Frontend, SAP, Logistik …"
            className="w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => void handleCreate()}
          disabled={creating || !newName.trim()}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:bg-primary-hover disabled:opacity-50"
        >
          {creating ? <Loader2 size={15} className="animate-spin" aria-hidden /> : <Plus size={15} aria-hidden />}
          Anlegen
        </button>
      </div>

      {!loaded ? (
        <div className="flex items-center gap-2 py-6 text-sm text-stone-400">
          <Loader2 size={16} className="animate-spin" aria-hidden />
          Kategorien werden geladen…
        </div>
      ) : categories.length === 0 && uncategorized.length === 0 ? (
        <p className="text-sm text-stone-500">
          Noch keine Master-Lebensläufe ohne Bewerbung — oder lege eine Kategorie an.
        </p>
      ) : (
        <div className="space-y-6">
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
                removeCategory={removeCategory}
                onDeleteResume={onDeleteResume}
              />
            )
          })}

          {/* Uncategorized */}
          {uncategorized.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-stone-400">
                  Ohne Kategorie
                </h3>
                <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-stone-500 tabular-nums">
                  {uncategorized.length}
                </span>
              </div>
              <p className="mb-3 text-xs text-stone-500">
                Ordne jedem Lebenslauf eine Kategorie zu — dann findest du beim Bewerben sofort die richtige Vorlage.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {uncategorized.map(r => (
                  <UncategorizedCard
                    key={r.id}
                    resume={r}
                    categories={categories}
                    onAssign={cid => assignResume(r.id, cid)}
                    onDelete={() => onDeleteResume(r)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  resumes,
  allCategories,
  getCategoryIdForResume,
  assignResume,
  removeCategory,
  onDeleteResume,
}: {
  category: CvUserCategoryDto
  resumes: CvStudioResumeSummary[]
  allCategories: CvUserCategoryDto[]
  getCategoryIdForResume: (id: string) => string | null
  assignResume: (resumeId: string, categoryId: string | null) => void | Promise<void>
  removeCategory: (id: string) => void | Promise<void>
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
}) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/[0.03] p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FolderOpen size={15} className="text-primary-light/80" aria-hidden />
          <h3 className="text-sm font-semibold text-white">{category.name}</h3>
          <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-stone-400 tabular-nums">
            {resumes.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => void removeCategory(category.id)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-rose-300/80 transition-colors hover:bg-rose-950/30 hover:text-rose-200"
          title={`Kategorie „${category.name}" löschen`}
        >
          <Trash2 size={12} aria-hidden />
          Löschen
        </button>
      </div>

      {resumes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-xs text-stone-500">
          Noch kein Lebenslauf zugeordnet — per Dropdown unter einer Karte zuweisen.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {resumes.map(r => (
            <div key={r.id} className="flex flex-col gap-1.5">
              <CvResumeCard
                resume={r}
                onDelete={() => onDeleteResume(r)}
                categoryName={null}
              />
              <CategorySelector
                resumeId={r.id}
                categories={allCategories}
                activeCategoryId={getCategoryIdForResume(r.id)}
                onChangeCategory={cid => assignResume(r.id, cid)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UncategorizedCard({
  resume,
  categories,
  onAssign,
  onDelete,
}: {
  resume: CvStudioResumeSummary
  categories: CvUserCategoryDto[]
  onAssign: (categoryId: string | null) => void | Promise<void>
  onDelete: () => void | Promise<void>
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <CvResumeCard resume={resume} onDelete={onDelete} />
      {categories.length > 0 && (
        <CategorySelector
          resumeId={resume.id}
          categories={categories}
          activeCategoryId={null}
          onChangeCategory={onAssign}
        />
      )}
    </div>
  )
}

function CategorySelector({
  resumeId,
  categories,
  activeCategoryId,
  onChangeCategory,
}: {
  resumeId: string
  categories: CvUserCategoryDto[]
  activeCategoryId: string | null
  onChangeCategory: (categoryId: string | null) => void | Promise<void>
}) {
  return (
    <>
      <label className="sr-only" htmlFor={`cat-${resumeId}`}>Kategorie zuweisen</label>
      <select
        id={`cat-${resumeId}`}
        value={activeCategoryId ?? ''}
        onChange={e => void onChangeCategory(e.target.value === '' ? null : e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-[11px] text-stone-300 focus:border-primary/40 focus:outline-none"
      >
        <option value="">— Kategorie wählen —</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </>
  )
}
