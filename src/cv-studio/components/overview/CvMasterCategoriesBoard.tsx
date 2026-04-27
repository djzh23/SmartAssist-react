import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderInput, Plus } from 'lucide-react'
import type { CvStudioResumeSummary } from '../../../types'
import type { CvUserCategory } from '../../lib/cvStudioCategoryStorage'

interface Props {
  resumes: CvStudioResumeSummary[]
  categories: CvUserCategory[]
  getCategoryIdForResume: (resumeId: string) => string | null
  assignResume: (resumeId: string, categoryId: string | null) => void
  addCategory: (name: string) => void
  removeCategory: (id: string) => void
}

export default function CvMasterCategoriesBoard({
  resumes,
  categories,
  getCategoryIdForResume,
  assignResume,
  addCategory,
  removeCategory,
}: Props) {
  const [newName, setNewName] = useState('')

  const uncategorized = resumes.filter(r => !getCategoryIdForResume(r.id))

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-amber-500/20 bg-amber-950/20 px-3 py-2.5 text-xs leading-relaxed text-amber-100/90">
        <strong className="text-amber-50">Lokal auf diesem Gerät:</strong> Kategorien (z. B. Frontend, SAP,
        Logistik) und Zuordnungen werden im Browser gespeichert — nicht im Konto in der Cloud. Sobald das Backend ein
        Kategorie-Feld hat, wandern die Daten dorthin.
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <label htmlFor="cv-new-cat" className="mb-1 block text-[11px] font-semibold text-stone-400">
            Neue Kategorie (Master-Typ)
          </label>
          <input
            id="cv-new-cat"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="z. B. Frontend, SAP, Logistik …"
            className="w-full rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-stone-600 focus:border-primary/50 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            addCategory(newName)
            setNewName('')
          }}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          <Plus size={16} aria-hidden />
          Anlegen
        </button>
      </div>

      {categories.length === 0 && uncategorized.length === 0 ? (
        <p className="text-sm text-stone-500">Noch keine Master-Lebensläufe ohne Bewerbung — oder lege eine Kategorie an.</p>
      ) : null}

      <div className="space-y-5">
        {categories.map(cat => {
          const inCat = resumes.filter(r => getCategoryIdForResume(r.id) === cat.id)
          return (
            <section
              key={cat.id}
              className="rounded-2xl border border-white/[0.08] border-l-[3px] border-l-primary/45 bg-white/[0.02] p-4"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderInput className="h-4 w-4 text-primary-light" aria-hidden />
                  <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                  <span className="rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-stone-400 tabular-nums">
                    {inCat.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeCategory(cat.id)}
                  className="text-xs text-rose-300/90 hover:text-rose-200"
                >
                  Kategorie löschen
                </button>
              </div>
              {inCat.length === 0 ? (
                <p className="text-xs text-stone-500">Noch keine Lebensläufe — per Dropdown einer Karte zuweisen.</p>
              ) : (
                <ul className="grid gap-2 sm:grid-cols-2">
                  {inCat.map(r => (
                    <MasterResumeRow
                      key={r.id}
                      resume={r}
                      categories={categories}
                      activeCategoryId={getCategoryIdForResume(r.id)}
                      onChangeCategory={cid => assignResume(r.id, cid)}
                    />
                  ))}
                </ul>
              )}
            </section>
          )
        })}

        {uncategorized.length > 0 ? (
          <section className="rounded-2xl border border-dashed border-white/15 bg-black/20 p-4">
            <h3 className="mb-2 text-sm font-semibold text-stone-300">Ohne Kategorie</h3>
            <p className="mb-3 text-xs text-stone-500">
              Ordne jedem Master-CV eine Kategorie zu — dann weißt du beim Bewerben sofort, welche Vorlage du kopieren
              und anpassen willst.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {uncategorized.map(r => (
                <MasterResumeRow
                  key={r.id}
                  resume={r}
                  categories={categories}
                  activeCategoryId={null}
                  onChangeCategory={cid => assignResume(r.id, cid)}
                />
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function MasterResumeRow({
  resume,
  categories,
  activeCategoryId,
  onChangeCategory,
}: {
  resume: CvStudioResumeSummary
  categories: CvUserCategory[]
  activeCategoryId: string | null
  onChangeCategory: (categoryId: string | null) => void
}) {
  return (
    <li className="flex flex-col gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <Link to={`/cv-studio/edit/${resume.id}`} className="text-sm font-medium text-white hover:text-primary-light">
          {resume.title}
        </Link>
        <p className="mt-0.5 text-[11px] text-stone-500">
          {[resume.targetCompany, resume.targetRole].filter(Boolean).join(' — ') || 'Kein Firmenbezug'}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <label className="sr-only" htmlFor={`cat-${resume.id}`}>
          Kategorie für {resume.title}
        </label>
        <select
          id={`cat-${resume.id}`}
          value={activeCategoryId ?? ''}
          onChange={e => onChangeCategory(e.target.value === '' ? null : e.target.value)}
          className="max-w-full rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 text-xs text-stone-200 focus:border-primary/50 focus:outline-none"
        >
          <option value="">— Kategorie wählen —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Link
          to={`/cv-studio/edit/${resume.id}`}
          className="rounded-lg border border-white/10 px-2 py-1.5 text-[11px] font-semibold text-primary-light hover:bg-white/5"
        >
          Bearbeiten
        </Link>
      </div>
    </li>
  )
}
