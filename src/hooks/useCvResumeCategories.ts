import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CvStudioResumeSummary } from '../types'
import {
  loadCvCategoryStore,
  makeCategoryId,
  pruneResumeAssignments,
  saveCvCategoryStore,
  type CvCategoryStore,
} from '../cv-studio/lib/cvStudioCategoryStorage'

/**
 * Lokale CV-Kategorien (Master-Typen) — Zuordnung pro Lebenslauf-ID.
 * Nur in diesem Browser, bis das Backend ein Kategorie-Feld liefert.
 */
export function useCvResumeCategories(resumes: CvStudioResumeSummary[] | null) {
  const [store, setStore] = useState<CvCategoryStore>(() => loadCvCategoryStore())

  const validIds = useMemo(() => new Set((resumes ?? []).map(r => r.id)), [resumes])

  useEffect(() => {
    if (!resumes) return
    setStore(s => {
      const pruned = pruneResumeAssignments(s, validIds)
      if (pruned.resumeToCategory === s.resumeToCategory) return s
      saveCvCategoryStore(pruned)
      return pruned
    })
  }, [resumes, validIds])

  const commit = useCallback(
    (updater: (prev: CvCategoryStore) => CvCategoryStore) => {
      setStore(prev => {
        const next = pruneResumeAssignments(updater(prev), validIds)
        saveCvCategoryStore(next)
        return next
      })
    },
    [validIds],
  )

  const addCategory = useCallback(
    (name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      commit(prev => ({
        ...prev,
        categories: [
          ...prev.categories,
          {
            id: makeCategoryId(),
            name: trimmed.slice(0, 80),
            sortOrder: prev.categories.length,
          },
        ],
      }))
    },
    [commit],
  )

  const renameCategory = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim()
      if (!trimmed) return
      commit(prev => ({
        ...prev,
        categories: prev.categories.map(c =>
          c.id === id ? { ...c, name: trimmed.slice(0, 80) } : c,
        ),
      }))
    },
    [commit],
  )

  const removeCategory = useCallback(
    (id: string) => {
      commit(prev => {
        const resumeToCategory = { ...prev.resumeToCategory }
        for (const [rid, cid] of Object.entries(resumeToCategory)) {
          if (cid === id) delete resumeToCategory[rid]
        }
        return {
          categories: prev.categories.filter(c => c.id !== id),
          resumeToCategory,
        }
      })
    },
    [commit],
  )

  const assignResume = useCallback(
    (resumeId: string, categoryId: string | null) => {
      commit(prev => {
        const resumeToCategory = { ...prev.resumeToCategory }
        if (categoryId == null) delete resumeToCategory[resumeId]
        else resumeToCategory[resumeId] = categoryId
        return { ...prev, resumeToCategory }
      })
    },
    [commit],
  )

  const getCategoryIdForResume = useCallback(
    (resumeId: string) => store.resumeToCategory[resumeId] ?? null,
    [store.resumeToCategory],
  )

  const sortedCategories = useMemo(
    () => [...store.categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
    [store.categories],
  )

  return {
    categories: sortedCategories,
    assignResume,
    addCategory,
    renameCategory,
    removeCategory,
    getCategoryIdForResume,
  }
}
