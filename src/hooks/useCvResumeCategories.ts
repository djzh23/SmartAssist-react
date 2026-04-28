import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import {
  assignCvStudioCategory,
  createCvStudioCategory,
  deleteCvStudioCategory,
  getCvStudioCategories,
  renameCvStudioCategory,
  reorderCvStudioCategories,
} from '../api/client'
import type { CvUserCategoryDto } from '../types'

interface CategoryStore {
  categories: CvUserCategoryDto[]
  /** resumeId → categoryId */
  assignments: Record<string, string>
}

/**
 * CV-Kategorien — serverseitig gespeichert (api/cv-studio/categories).
 * Optimistische lokale Updates; Fehler werden in `categoryError` gemeldet.
 */
export function useCvResumeCategories(resumeIds: string[] | null) {
  const { getToken } = useAuth()
  const [store, setStore] = useState<CategoryStore>({ categories: [], assignments: {} })
  const [loaded, setLoaded] = useState(false)
  const [categoryError, setCategoryError] = useState<string | null>(null)

  // ── Fetch from server ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    void (async () => {
      const token = await getToken()
      if (!token || cancelled) return
      try {
        const data = await getCvStudioCategories(token)
        if (!cancelled) {
          setStore({ categories: data.categories, assignments: data.assignments })
          setLoaded(true)
        }
      } catch {
        if (!cancelled) setCategoryError('Kategorien konnten nicht geladen werden.')
      }
    })()
    return () => { cancelled = true }
  }, [getToken])

  // ── Prune stale assignments when resume list changes ───────────────────────
  useEffect(() => {
    if (!resumeIds) return
    const validSet = new Set(resumeIds)
    setStore(prev => {
      const pruned: Record<string, string> = {}
      for (const [rid, cid] of Object.entries(prev.assignments)) {
        if (validSet.has(rid)) pruned[rid] = cid
      }
      if (Object.keys(pruned).length === Object.keys(prev.assignments).length) return prev
      return { ...prev, assignments: pruned }
    })
  }, [resumeIds])

  // ── Mutations ──────────────────────────────────────────────────────────────

  const addCategory = useCallback(async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const token = await getToken()
    if (!token) return
    // Optimistic
    const tempId = `temp-${Date.now()}`
    const tempCat: CvUserCategoryDto = { id: tempId, name: trimmed, sortOrder: 999 }
    setStore(prev => ({ ...prev, categories: [...prev.categories, tempCat] }))
    try {
      const created = await createCvStudioCategory(token, trimmed)
      setStore(prev => ({
        ...prev,
        categories: prev.categories.map(c => c.id === tempId ? created : c),
      }))
    } catch {
      setStore(prev => ({ ...prev, categories: prev.categories.filter(c => c.id !== tempId) }))
      setCategoryError('Kategorie konnte nicht angelegt werden.')
    }
  }, [getToken])

  const removeCategory = useCallback(async (id: string) => {
    const token = await getToken()
    if (!token) return
    // Optimistic
    setStore(prev => ({
      categories: prev.categories.filter(c => c.id !== id),
      assignments: Object.fromEntries(
        Object.entries(prev.assignments).filter(([, cid]) => cid !== id),
      ),
    }))
    try {
      await deleteCvStudioCategory(token, id)
    } catch {
      setCategoryError('Kategorie konnte nicht gelöscht werden.')
      // Reload to restore consistent state
      const data = await getCvStudioCategories(token).catch(() => null)
      if (data) setStore({ categories: data.categories, assignments: data.assignments })
    }
  }, [getToken])

  const assignResume = useCallback(async (resumeId: string, categoryId: string | null) => {
    const token = await getToken()
    if (!token) return
    // Optimistic
    setStore(prev => {
      const next = { ...prev.assignments }
      if (categoryId == null) delete next[resumeId]
      else next[resumeId] = categoryId
      return { ...prev, assignments: next }
    })
    try {
      await assignCvStudioCategory(token, resumeId, categoryId)
    } catch {
      setCategoryError('Zuordnung konnte nicht gespeichert werden.')
    }
  }, [getToken])

  const renameCategory = useCallback(async (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const token = await getToken()
    if (!token) return
    let oldName: string | undefined
    setStore(s => {
      oldName = s.categories.find(c => c.id === id)?.name
      return { ...s, categories: s.categories.map(c => c.id === id ? { ...c, name: trimmed } : c) }
    })
    try {
      const updated = await renameCvStudioCategory(token, id, trimmed)
      setStore(s => ({ ...s, categories: s.categories.map(c => c.id === id ? { ...c, ...updated } : c) }))
    } catch {
      if (oldName !== undefined)
        setStore(s => ({ ...s, categories: s.categories.map(c => c.id === id ? { ...c, name: oldName! } : c) }))
      setCategoryError('Kategorie konnte nicht umbenannt werden.')
    }
  }, [getToken])

  const reorderCategories = useCallback(async (orderedIds: string[]) => {
    const token = await getToken()
    if (!token) return
    const orders = orderedIds.map((id, i) => ({ id, sortOrder: i }))
    setStore(s => ({
      ...s,
      categories: s.categories.map(c => {
        const idx = orderedIds.indexOf(c.id)
        return idx >= 0 ? { ...c, sortOrder: idx } : c
      }),
    }))
    try {
      await reorderCvStudioCategories(token, orders)
    } catch {
      setCategoryError('Reihenfolge konnte nicht gespeichert werden.')
      const t2 = await getToken()
      if (t2) {
        const data = await getCvStudioCategories(t2).catch(() => null)
        if (data) setStore({ categories: data.categories, assignments: data.assignments })
      }
    }
  }, [getToken])

  const getCategoryIdForResume = useCallback(
    (resumeId: string) => store.assignments[resumeId] ?? null,
    [store.assignments],
  )

  const sortedCategories = useMemo(
    () => [...store.categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [store.categories],
  )

  return {
    categories: sortedCategories,
    loaded,
    categoryError,
    clearCategoryError: () => setCategoryError(null),
    assignResume,
    addCategory,
    removeCategory,
    renameCategory,
    reorderCategories,
    getCategoryIdForResume,
  }
}
