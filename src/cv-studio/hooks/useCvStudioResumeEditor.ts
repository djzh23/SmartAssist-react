import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createCvStudioResume,
  createCvStudioResumeFromTemplate,
  createCvStudioVersion,
  deleteAllCvStudioResumes,
  deleteCvStudioVersion,
  getCvStudioResume,
  getCvStudioResumeTemplates,
  getCvStudioVersion,
  linkCvStudioJobApplication,
  listCvStudioResumes,
  listCvStudioVersions,
  patchCvStudioNotes,
  restoreCvStudioVersion,
  updateCvStudioResume,
  updateCvStudioVersion,
} from '../../api/client'
import type { LinkJobApplicationRequest } from '../cvTypes'
import { clearLastResumeId, setLastResumeId } from '../lib/cvStudio'
import { formatVariantenName } from '../lib/formatting'
import { coerceResumeData, normalizeResumeDto } from '../lib/resumeData'
import { ensureSectionTitles } from '../lib/sectionTitles'
import type { AppConfirmOptions } from '../../context/appUiBridge'
import type { CvStudioResumeSummary } from '../../types'
import type { PdfDesign, ResumeDto, ResumeTemplateDto, ResumeVersionSummaryDto } from '../cvTypes'

export type CvStudioRequestConfirm = (opts: AppConfirmOptions) => Promise<boolean>

function patchResume(r: ResumeDto): ResumeDto {
  const n = normalizeResumeDto(r)
  ensureSectionTitles(n.resumeData)
  return n
}

export function useCvStudioResumeEditor(
  getToken: () => Promise<string | null>,
  requestConfirm: CvStudioRequestConfirm,
) {
  const [templates, setTemplates] = useState<ResumeTemplateDto[]>([])
  const [summaries, setSummaries] = useState<CvStudioResumeSummary[]>([])
  const [resume, setResumeState] = useState<ResumeDto | null>(null)
  const [versions, setVersions] = useState<ResumeVersionSummaryDto[]>([])
  const [activeVariant, setActiveVariant] = useState<ResumeVersionSummaryDto | null>(null)
  const activeVariantRef = useRef<ResumeVersionSummaryDto | null>(null)
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('')
  const [pdfDesign, setPdfDesign] = useState<PdfDesign>('A')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [variantNameDraft, setVariantNameDraft] = useState('')
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSavedAtUtc, setLastSavedAtUtc] = useState<Date | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  const resumeRef = useRef<ResumeDto | null>(null)
  const hasUnsavedRef = useRef(false)
  const selectedTemplateKeyRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    resumeRef.current = resume
  }, [resume])

  useEffect(() => {
    activeVariantRef.current = activeVariant
  }, [activeVariant])

  useEffect(() => {
    selectedTemplateKeyRef.current = selectedTemplateKey
  }, [selectedTemplateKey])

  const refreshSummaries = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    const list = await listCvStudioResumes(token)
    setSummaries(list)
  }, [getToken])

  const refreshVersions = useCallback(
    async (resumeId: string) => {
      const token = await getToken()
      if (!token) return
      const v = await listCvStudioVersions(token, resumeId)
      setVersions(v)
    },
    [getToken],
  )

  const assignResume = useCallback(
    (
      r: ResumeDto | null,
      opts?: { keepDirty?: boolean; activeVar?: ResumeVersionSummaryDto | null | undefined },
    ) => {
      const patched = r ? patchResume(r) : null
      resumeRef.current = patched
      setResumeState(patched)
      if (opts && 'activeVar' in opts)
        setActiveVariant(opts.activeVar ?? null)
      if (!patched) {
        hasUnsavedRef.current = false
        setHasUnsavedChanges(false)
        return
      }
      if (opts?.keepDirty) {
        hasUnsavedRef.current = true
        setHasUnsavedChanges(true)
      }
      else {
        hasUnsavedRef.current = false
        setHasUnsavedChanges(false)
      }
    },
    [],
  )

  const runBusy = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    }
    catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return undefined
    }
    finally {
      setBusy(false)
    }
  }, [])

  const saveNow = useCallback(async (): Promise<'skipped' | 'saved' | 'failed' | 'no_token'> => {
    const r = resumeRef.current
    if (!r || !hasUnsavedRef.current)
      return 'skipped'
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return 'no_token'
    }
    setAutoSaving(true)
    setError(null)
    try {
      const tk = selectedTemplateKeyRef.current || r.templateKey || null
      const updated = await updateCvStudioResume(token, r.id, {
        title: r.title,
        templateKey: tk,
        resumeData: coerceResumeData(r.resumeData),
      })
      const patched = patchResume(updated)
      hasUnsavedRef.current = false
      setHasUnsavedChanges(false)
      setLastSavedAtUtc(new Date())
      resumeRef.current = patched
      setResumeState(patched)
      await refreshSummaries()
      setLastResumeId(patched.id)
      return 'saved'
    }
    catch (e) {
      setError(e instanceof Error ? e.message : String(e))
      return 'failed'
    }
    finally {
      setAutoSaving(false)
    }
  }, [getToken, refreshSummaries])

  const queueAutoSave = useCallback(() => {
    if (saveTimerRef.current)
      clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveNow()
    }, 1000)
  }, [saveNow])

  const flushAutoSave = useCallback(async (): Promise<'skipped' | 'saved' | 'failed' | 'no_token'> => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    return saveNow()
  }, [saveNow])

  const updateResume = useCallback(
    (recipe: (r: ResumeDto) => void) => {
      setResumeState((prev) => {
        if (!prev)
          return prev
        const next = structuredClone(prev)
        recipe(next)
        ensureSectionTitles(next.resumeData)
        resumeRef.current = next
        hasUnsavedRef.current = true
        setHasUnsavedChanges(true)
        setActiveVariant(null)
        queueAutoSave()
        return next
      })
    },
    [queueAutoSave],
  )

  useEffect(
    () => () => {
      if (saveTimerRef.current)
        clearTimeout(saveTimerRef.current)
    },
    [],
  )

  const loadTemplates = useCallback(async () => {
    await runBusy(async () => {
      const token = await getToken()
      if (!token)
        throw new Error('Bitte anmelden.')
      const t = await getCvStudioResumeTemplates(token)
      setTemplates(t)
      const list = await listCvStudioResumes(token)
      setSummaries(list)
      if (!selectedTemplateKeyRef.current && t.length > 0)
        setSelectedTemplateKey(t[0].key)
    })
  }, [getToken, runBusy])

  const createArbeitsversion = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return null
    }
    const created = await runBusy(async () => {
      if (selectedTemplateKeyRef.current)
        return createCvStudioResumeFromTemplate(token, selectedTemplateKeyRef.current)
      return createCvStudioResume(token, {
        title: 'Neue Arbeitsversion',
        resumeData: coerceResumeData(undefined),
      })
    })
    if (!created)
      return null
    assignResume(created)
    await refreshVersions(created.id)
    await refreshSummaries()
    setLastResumeId(created.id)
    return created.id
  }, [assignResume, getToken, refreshSummaries, refreshVersions, runBusy])

  const openResume = useCallback(
    async (id: string) => {
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      const loaded = await runBusy(async () => getCvStudioResume(token, id))
      if (!loaded)
        return
      assignResume(loaded)
      if (loaded.templateKey)
        setSelectedTemplateKey(loaded.templateKey)
      await refreshVersions(loaded.id)
      await refreshSummaries()
      setLastResumeId(loaded.id)
    },
    [assignResume, getToken, refreshSummaries, refreshVersions, runBusy],
  )

  const saveVariant = useCallback(
    async (name?: string | null) => {
      const r = resumeRef.current
      if (!r)
        return null
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return null
      }
      await flushAutoSave()
      const label = (name ?? variantNameDraft).trim()
      const created = await runBusy(async () =>
        createCvStudioVersion(token, r.id, { label: label || null }),
      )
      if (!created)
        return null
      setVariantNameDraft('')
      assignResume(r, { keepDirty: false, activeVar: created })
      await refreshVersions(r.id)
      await refreshSummaries()
      setLastResumeId(r.id)
      return created
    },
    [assignResume, flushAutoSave, getToken, refreshSummaries, refreshVersions, runBusy, variantNameDraft],
  )

  const loadVariantIntoEditor = useCallback(
    async (versionId: string) => {
      const r = resumeRef.current
      if (!r)
        return
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return
      }
      const variante = await runBusy(async () => getCvStudioVersion(token, r.id, versionId))
      if (!variante)
        return
      const merged: ResumeDto = {
        ...r,
        resumeData: coerceResumeData(variante.resumeData),
        updatedAtUtc: new Date().toISOString(),
      }
      assignResume(merged, { keepDirty: true, activeVar: variante })
      queueAutoSave()
      setLastResumeId(r.id)
    },
    [assignResume, getToken, queueAutoSave, runBusy],
  )

  /** Server: Arbeitsversion = Snapshot-Inhalt; kein ausstehendes Auto-Save. */
  const restoreSnapshotToWorkingCopy = useCallback(
    async (versionId: string): Promise<boolean> => {
      if (hasUnsavedRef.current) {
        const ok = await requestConfirm({
          title: 'Arbeitsversion ersetzen?',
          message:
            'Die Arbeitsversion wird durch diese Snapshot-Version ersetzt. Lokale, noch nicht per Auto-Save übernommene Änderungen gehen verloren.',
          confirmLabel: 'Wiederherstellen',
          cancelLabel: 'Abbrechen',
          danger: true,
        })
        if (!ok) return false
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current)
        saveTimerRef.current = null
      }
      const r = resumeRef.current
      if (!r) return false
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return false
      }
      const updated = await runBusy(async () => restoreCvStudioVersion(token, r.id, versionId))
      if (!updated) return false
      const vlist = await listCvStudioVersions(token, r.id)
      const meta = vlist.find(v => v.id === versionId) ?? null
      hasUnsavedRef.current = false
      setHasUnsavedChanges(false)
      assignResume(patchResume(updated), { activeVar: meta })
      setVersions(vlist)
      await refreshSummaries()
      setLastResumeId(r.id)
      return true
    },
    [assignResume, getToken, refreshSummaries, requestConfirm, runBusy],
  )

  const deleteSnapshotVersion = useCallback(
    async (versionId: string): Promise<boolean> => {
      const r = resumeRef.current
      if (!r) return false
      const meta = versions.find(v => v.id === versionId)
      const name = meta ? formatVariantenName(meta) : 'dieser Snapshot'
      const confirmed = await requestConfirm({
        title: 'Snapshot löschen?',
        message: `Snapshot „${name}“ dauerhaft löschen?\n\nDie Arbeitsversion (aktueller Editor-Inhalt) bleibt erhalten. Exporte, die diesen Snapshot nutzen, sind danach ggf. nicht mehr verfügbar.`,
        confirmLabel: 'Löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
      })
      if (!confirmed) return false
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return false
      }
      const done = await runBusy(async () => {
        await deleteCvStudioVersion(token, r.id, versionId)
        return true
      })
      if (!done) return false
      const vlist = await listCvStudioVersions(token, r.id)
      setVersions(vlist)
      if (activeVariantRef.current?.id === versionId)
        assignResume(r, { activeVar: null })
      await refreshSummaries()
      return true
    },
    [assignResume, getToken, refreshSummaries, requestConfirm, runBusy, versions],
  )

  const renameSnapshotVersion = useCallback(
    async (versionId: string, label: string | null) => {
      const r = resumeRef.current
      if (!r) return false
      const token = await getToken()
      if (!token) {
        setError('Bitte anmelden.')
        return false
      }
      const dto = await runBusy(async () =>
        updateCvStudioVersion(token, r.id, versionId, { label: label?.trim() ? label.trim() : null }),
      )
      if (!dto) return false
      setVersions(prev => prev.map(v => (v.id === versionId ? dto : v)))
      setActiveVariant(cur => (cur?.id === versionId ? dto : cur))
      return true
    },
    [getToken, runBusy],
  )

  const deleteAllSnapshotVersions = useCallback(async (): Promise<boolean> => {
    const r = resumeRef.current
    if (!r || versions.length === 0) return false
    const confirmed = await requestConfirm({
      title: 'Alle Snapshots löschen?',
      message: `Alle ${versions.length} gespeicherten Snapshots dauerhaft löschen?\n\nDie Arbeitsversion (dein aktueller Lebenslauf im Editor) bleibt erhalten.`,
      confirmLabel: 'Alle löschen',
      cancelLabel: 'Abbrechen',
      danger: true,
    })
    if (!confirmed) return false
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return false
    }
    const toDelete = [...versions]
    const done = await runBusy(async () => {
      for (const v of toDelete)
        await deleteCvStudioVersion(token, r.id, v.id)
      return true
    })
    if (!done) return false
    const vlist = await listCvStudioVersions(token, r.id)
    setVersions(vlist)
    assignResume(r, { activeVar: null })
    await refreshSummaries()
    return true
  }, [assignResume, getToken, refreshSummaries, requestConfirm, runBusy, versions])

  const linkApplication = useCallback(
    async (body: LinkJobApplicationRequest) => {
      const r = resumeRef.current
      if (!r) return
      const token = await getToken()
      if (!token) { setError('Bitte anmelden.'); return }
      const updated = await runBusy(async () => linkCvStudioJobApplication(token, r.id, body))
      if (!updated) return
      assignResume(updated, { keepDirty: false })
      await refreshSummaries()
    },
    [assignResume, getToken, refreshSummaries, runBusy],
  )

  const patchNotes = useCallback(
    async (notes: string | null) => {
      const r = resumeRef.current
      if (!r) return
      const token = await getToken()
      if (!token) { setError('Bitte anmelden.'); return }
      const updated = await runBusy(async () => patchCvStudioNotes(token, r.id, notes))
      if (!updated) return
      assignResume(updated, { keepDirty: false })
    },
    [assignResume, getToken, runBusy],
  )

  const resetAll = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      setError('Bitte anmelden.')
      return
    }
    await runBusy(async () => {
      await deleteAllCvStudioResumes(token)
      assignResume(null)
      setVersions([])
      clearLastResumeId()
      await refreshSummaries()
    })
  }, [assignResume, getToken, refreshSummaries, runBusy])

  const aktivKontextText =
    activeVariant === null ? 'Arbeitsversion' : `Gespeicherte Variante ${formatVariantenName(activeVariant)}`

  const autoSaveText = autoSaving
    ? 'Auto-Save: speichert…'
    : hasUnsavedChanges
      ? 'Auto-Save: wartend'
      : lastSavedAtUtc
        ? `Auto-Save: gespeichert (${lastSavedAtUtc.toLocaleTimeString('de-DE')})`
        : 'Auto-Save: bereit'

  return {
    templates,
    summaries,
    resume,
    versions,
    activeVariant,
    selectedTemplateKey,
    setSelectedTemplateKey,
    pdfDesign,
    setPdfDesign,
    busy,
    error,
    setError,
    variantNameDraft,
    setVariantNameDraft,
    autoSaving,
    lastSavedAtUtc,
    hasUnsavedChanges,
    aktivKontextText,
    autoSaveText,
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
    refreshSummaries,
    refreshVersions,
    assignResume,
  }
}
