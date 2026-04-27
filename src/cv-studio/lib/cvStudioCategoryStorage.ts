import type { CvStudioResumeSummary } from '../../types'

const STORAGE_KEY = 'cv-studio-user-categories-v1'

export interface CvUserCategory {
  id: string
  name: string
  sortOrder: number
}

export interface CvCategoryStore {
  categories: CvUserCategory[]
  /** resumeId → categoryId */
  resumeToCategory: Record<string, string>
}

function emptyStore(): CvCategoryStore {
  return { categories: [], resumeToCategory: {} }
}

export function loadCvCategoryStore(): CvCategoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') return emptyStore()
    const o = parsed as Record<string, unknown>
    const categories = Array.isArray(o.categories) ? o.categories : []
    const resumeToCategory =
      o.resumeToCategory && typeof o.resumeToCategory === 'object' && !Array.isArray(o.resumeToCategory)
        ? (o.resumeToCategory as Record<string, string>)
        : {}
    const safeCats: CvUserCategory[] = categories
      .map((c: unknown, i: number) => {
        if (!c || typeof c !== 'object') return null
        const r = c as Record<string, unknown>
        const id = typeof r.id === 'string' ? r.id : ''
        const name = typeof r.name === 'string' ? r.name.trim() : ''
        if (!id || !name) return null
        return {
          id,
          name: name.slice(0, 80),
          sortOrder: typeof r.sortOrder === 'number' ? r.sortOrder : i,
        }
      })
      .filter(Boolean) as CvUserCategory[]
    return { categories: safeCats, resumeToCategory }
  } catch {
    return emptyStore()
  }
}

export function saveCvCategoryStore(store: CvCategoryStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    // quota or private mode — fail loud in UI if needed
  }
}

/** Drop assignments that no longer match known resume ids */
export function pruneResumeAssignments(
  store: CvCategoryStore,
  validResumeIds: Set<string>,
): CvCategoryStore {
  const next: Record<string, string> = {}
  for (const [rid, cid] of Object.entries(store.resumeToCategory)) {
    if (validResumeIds.has(rid)) next[rid] = cid
  }
  return { ...store, resumeToCategory: next }
}

export function makeCategoryId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `cat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function resumesFromOtherGroups(
  groups: { resumes: CvStudioResumeSummary[] }[],
): CvStudioResumeSummary[] {
  const seen = new Set<string>()
  const out: CvStudioResumeSummary[] = []
  for (const g of groups) {
    for (const r of g.resumes) {
      if (seen.has(r.id)) continue
      seen.add(r.id)
      out.push(r)
    }
  }
  return out
}
