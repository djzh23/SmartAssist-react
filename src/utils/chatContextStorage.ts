import type { ToolType } from '../types'
import { sanitizeTechnicalContext } from './cvTechnicalContext'

export const LS_CONTEXT = 'smartassist_context_by_tool_and_session'
export const LS_CONTEXT_DISMISSED = 'smartassist_context_modal_dismissed'
export const LS_KONTEXT_HINT_DISMISSED = 'privateprep_kontext_hint_dismissed'
export const LS_ACTIVE_CONTEXT_INFO_VISIBLE = 'privateprep_active_context_info_visible'

export const EXTRA_FIELD_MAX = 2000

export type ContextToolType = 'jobanalyzer' | 'interview' | 'programming'

export interface SessionContextData {
  sessionId: string
  toolType: ContextToolType
  /** Legacy; Profil-Text kommt primär aus Karriereprofil + Zusatzfeldern. */
  cvText: string
  jobText: string
  jobTitle: string
  companyName: string
  programmingLanguage: string
  programmingLanguageId: string
  hasJob: boolean
  hasCv: boolean
  /** Ohne konkrete Stellenanzeige, minimales Setup für strukturierte API-Payloads. */
  generalCoaching?: boolean
  /** false = kein Lebenslauf aus Karriereprofil in dieses Setup. */
  includeProfileCvInSetup?: boolean
  extraSkills: string
  extraProjects: string
  extraExperienceNotes: string
  updatedAt: string
}

export type SessionContextMap = Record<string, SessionContextData>
export type DismissedContextMap = Record<string, true>

export function asContextTool(tool: ToolType): ContextToolType | null {
  if (tool === 'jobanalyzer' || tool === 'interview' || tool === 'programming') return tool
  return null
}

export function contextKey(tool: ContextToolType, sessionId: string): string {
  return `${tool}:${sessionId}`
}

export function mergeSessionCvForApi(ctx: SessionContextData, profileCvRaw: string | null): string {
  const parts: string[] = []
  if (ctx.includeProfileCvInSetup !== false && profileCvRaw?.trim()) {
    parts.push(sanitizeTechnicalContext(profileCvRaw).trim())
  }
  if (ctx.cvText?.trim()) {
    parts.push(sanitizeTechnicalContext(ctx.cvText).trim())
  }
  const extraBlock = [
    ctx.extraSkills?.trim()
      && `Zusätzliche Skills (nur dieses Gespräch):\n${ctx.extraSkills.trim().slice(0, EXTRA_FIELD_MAX)}`,
    ctx.extraProjects?.trim() && `Projekte:\n${ctx.extraProjects.trim().slice(0, EXTRA_FIELD_MAX)}`,
    ctx.extraExperienceNotes?.trim()
      && `Erfahrung (kurz):\n${ctx.extraExperienceNotes.trim().slice(0, EXTRA_FIELD_MAX)}`,
  ].filter(Boolean).join('\n\n')
  if (extraBlock) parts.push(extraBlock)
  return parts.join('\n\n---\n\n').slice(0, 4200)
}

export function normalizeContext(
  input: Partial<SessionContextData> & { sessionId: string; toolType: ContextToolType },
): SessionContextData {
  const cvText = sanitizeTechnicalContext(input.cvText ?? '').slice(0, 4200)
  const jobText = (input.jobText ?? '').trim().slice(0, 7000)
  const jobTitle = (input.jobTitle ?? '').trim().slice(0, 180)
  const companyName = (input.companyName ?? '').trim().slice(0, 180)
  const programmingLanguage = (input.programmingLanguage ?? '').trim().slice(0, 80)
  const programmingLanguageId = (input.programmingLanguageId ?? '').trim().slice(0, 40)
  const extraSkills = (input.extraSkills ?? '').trim().slice(0, EXTRA_FIELD_MAX)
  const extraProjects = (input.extraProjects ?? '').trim().slice(0, EXTRA_FIELD_MAX)
  const extraExperienceNotes = (input.extraExperienceNotes ?? '').trim().slice(0, EXTRA_FIELD_MAX)
  const includeProfileCvInSetup = input.includeProfileCvInSetup !== false

  const hasCv = Boolean(
    cvText
    || extraSkills
    || extraProjects
    || extraExperienceNotes
    || includeProfileCvInSetup,
  )

  return {
    sessionId: input.sessionId,
    toolType: input.toolType,
    cvText,
    jobText,
    jobTitle,
    companyName,
    programmingLanguage,
    programmingLanguageId,
    hasJob: Boolean(jobText || jobTitle || companyName),
    hasCv,
    generalCoaching: Boolean(input.generalCoaching),
    includeProfileCvInSetup,
    extraSkills,
    extraProjects,
    extraExperienceNotes,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  }
}

export function loadContextMap(): SessionContextMap {
  try {
    const raw = localStorage.getItem(LS_CONTEXT)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, Partial<SessionContextData>>
    if (!parsed || typeof parsed !== 'object') return {}

    const next: SessionContextMap = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!value?.sessionId || !value?.toolType) continue
      if (value.toolType !== 'jobanalyzer' && value.toolType !== 'interview' && value.toolType !== 'programming') continue
      next[key] = normalizeContext({ ...value, sessionId: value.sessionId, toolType: value.toolType })
    }
    return next
  } catch (error) {
    console.warn('[chatContextStorage] Failed to load context map', error)
    return {}
  }
}

export function saveContextMap(value: SessionContextMap): void {
  try {
    localStorage.setItem(LS_CONTEXT, JSON.stringify(value))
  } catch (error) {
    console.warn('[chatContextStorage] Failed to save context map', error)
  }
}

export function loadDismissedContextMap(): DismissedContextMap {
  try {
    const raw = localStorage.getItem(LS_CONTEXT_DISMISSED)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DismissedContextMap
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch (error) {
    console.warn('[chatContextStorage] Failed to load dismissed context map', error)
    return {}
  }
}

export function saveDismissedContextMap(value: DismissedContextMap): void {
  try {
    localStorage.setItem(LS_CONTEXT_DISMISSED, JSON.stringify(value))
  } catch (error) {
    console.warn('[chatContextStorage] Failed to save dismissed context map', error)
  }
}

export function readActiveContextInfoVisible(): boolean {
  try {
    return localStorage.getItem(LS_ACTIVE_CONTEXT_INFO_VISIBLE) !== '0'
  } catch {
    return true
  }
}

export function writeActiveContextInfoVisible(visible: boolean): void {
  try {
    localStorage.setItem(LS_ACTIVE_CONTEXT_INFO_VISIBLE, visible ? '1' : '0')
  } catch {
    /* ignore */
  }
}
