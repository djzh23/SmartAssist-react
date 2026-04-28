import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Briefcase, ChevronDown, CheckCircle2, Code2, Globe2, MessageCircle, Plus, RefreshCw, Target, X, type LucideIcon } from 'lucide-react'
import type { CareerToolSetup, ToolType } from '../types'
import { PROGRAMMING_LANGUAGES } from '../types'
import { UsageLimitError, askAgentStream, linkJobApplicationSession } from '../api/client'
import { syncPlanFromStripe } from '../services/StripeService'
import ChatInput from '../components/chat/ChatInput'
import ChatContextBar from '../components/chat/ChatContextBar'
import ChatSidebar from '../components/chat/ChatSidebar'
import ContextModal, { type ContextModalToolType, type ContextPayload } from '../components/chat/ContextModal'
import MessageList from '../components/chat/MessageList'
import { ThinkingIndicator, shouldSkipThinkingUi, STREAM_CHARS_PER_SECOND } from '../components/chat/ThinkingIndicator'
import ChatAnswerReadyBanner from '../components/chat/ChatAnswerReadyBanner'
import OnboardingPromptModal, { ONBOARDING_CHAT_PROMPT_DISMISS_KEY } from '../components/chat/OnboardingPromptModal'
import UsageLimitModal from '../components/ui/UsageLimitModal'
import { useAppUi } from '../context/AppUiContext'
import { useDeliberateStream } from '../hooks/useDeliberateStream'
import { useChatSessions } from '../hooks/useChatSessions'
import { useCareerProfile } from '../hooks/useCareerProfile'
import { useUserPlan, dispatchServerUsage } from '../hooks/useUserPlan'
import { sanitizeTechnicalContext } from '../utils/cvTechnicalContext'
import { applyStreamText } from '../chat/streamTextBridge'
import { buildProfileStatsLine, getProfileCompleteness, getProfileCompletenessGapHint } from '../utils/profileCompleteness'
import { sessionListLabel } from '../utils/sessionTitle'

/** German UI labels shown in sidebar / header chips */
const LANG_DISPLAY: Record<string, string> = {
  de: 'Deutsch',
  en: 'Englisch',
  es: 'Spanisch',
  fr: 'Französisch',
  it: 'Italienisch',
  ar: 'Arabisch',
  pt: 'Portugiesisch',
}

/** English names sent to the backend - Claude responds more reliably to English language names */
const LANG_API: Record<string, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ar: 'Arabic',
  pt: 'Portuguese',
}

function apiToolTypeForChat(tool: ToolType): string | undefined {
  if (tool === 'general') return undefined
  if (tool === 'interview') return 'interviewprep'
  return tool
}

const INTERVIEW_PROMPT_LIMIT = 3900
const JOB_ANALYZER_PROMPT_LIMIT = 3900
const LS_CONTEXT = 'smartassist_context_by_tool_and_session'
const LS_CONTEXT_DISMISSED = 'smartassist_context_modal_dismissed'
const LS_KONTEXT_HINT_DISMISSED = 'privateprep_kontext_hint_dismissed'

type ContextToolType = 'jobanalyzer' | 'interview' | 'programming'

type SessionContextMap = Record<string, SessionContextData>

type DismissedContextMap = Record<string, true>

interface SessionContextData {
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

interface InterviewPromptContext {
  language: 'de' | 'en'
  alias: string
  cvText: string
  jobUrl: string
  jobText: string
}

interface JobAnalyzerPromptContext {
  jobTitle: string
  companyName: string
  jobText: string
  cvText: string
}

interface HandleSendOptions {
  displayText?: string
  apiMessageOverride?: string
  skipUserBubble?: boolean
  contextOverride?: SessionContextData | null
}

function isToolType(value: string): value is ToolType {
  return value === 'general' || value === 'jobanalyzer' || value === 'language' || value === 'programming' || value === 'interview'
}

function normalizeToolParam(value: string): ToolType {
  if (value === 'interviewprep') return 'interview'
  if (isToolType(value)) return value
  return 'general'
}

function modalToolTypeFromParam(rawToolParam: string, normalized: ToolType): ContextModalToolType | null {
  if (rawToolParam === 'interviewprep') return 'interviewprep'
  if (normalized === 'interview' || normalized === 'jobanalyzer' || normalized === 'programming') return normalized
  return null
}

function asContextTool(tool: ToolType): ContextToolType | null {
  if (tool === 'jobanalyzer' || tool === 'interview' || tool === 'programming') return tool
  return null
}

function contextKey(tool: ContextToolType, sessionId: string): string {
  return `${tool}:${sessionId}`
}

const EXTRA_FIELD_MAX = 2000

function mergeSessionCvForApi(ctx: SessionContextData, profileCvRaw: string | null): string {
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
  if (extraBlock)
    parts.push(extraBlock)
  return parts.join('\n\n---\n\n').slice(0, 4200)
}

function normalizeContext(input: Partial<SessionContextData> & { sessionId: string; toolType: ContextToolType }): SessionContextData {
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
    || (includeProfileCvInSetup),
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

function loadContextMap(): SessionContextMap {
  try {
    const raw = localStorage.getItem(LS_CONTEXT)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<string, Partial<SessionContextData>>
    if (!parsed || typeof parsed !== 'object') return {}

    const next: SessionContextMap = {}
    for (const [key, value] of Object.entries(parsed)) {
      if (!value?.sessionId || !value?.toolType) continue
      if (value.toolType !== 'jobanalyzer' && value.toolType !== 'interview' && value.toolType !== 'programming') continue
      next[key] = normalizeContext({
        ...value,
        sessionId: value.sessionId,
        toolType: value.toolType,
      })
    }

    return next
  } catch (error) {
    console.warn('[ChatPage] Failed to load context map', error)
    return {}
  }
}

function saveContextMap(value: SessionContextMap): void {
  try {
    localStorage.setItem(LS_CONTEXT, JSON.stringify(value))
  } catch (error) {
    console.warn('[ChatPage] Failed to save context map', error)
  }
}

function loadDismissedContextMap(): DismissedContextMap {
  try {
    const raw = localStorage.getItem(LS_CONTEXT_DISMISSED)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as DismissedContextMap
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch (error) {
    console.warn('[ChatPage] Failed to load dismissed context map', error)
    return {}
  }
}

function saveDismissedContextMap(value: DismissedContextMap): void {
  try {
    localStorage.setItem(LS_CONTEXT_DISMISSED, JSON.stringify(value))
  } catch (error) {
    console.warn('[ChatPage] Failed to save dismissed context map', error)
  }
}

function compactLines(text: string, maxLines: number, maxChars: number): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map(line => line.replace(/^[-*•\s]+/, '').trim())
    .filter(Boolean)

  const out: string[] = []
  let length = 0

  for (const line of lines) {
    if (out.length >= maxLines || length >= maxChars) break
    const remaining = maxChars - length
    const next = line.length > remaining ? `${line.slice(0, Math.max(0, remaining - 1)).trim()}…` : line
    if (!next) break
    out.push(next)
    length += next.length + 1
  }

  return out.join('\n')
}

function defaultInterviewContext(): InterviewPromptContext {
  return {
    language: 'de',
    alias: '',
    cvText: '',
    jobUrl: '',
    jobText: '',
  }
}

function toInterviewContext(context: SessionContextData | null, profileCvRaw: string | null): InterviewPromptContext {
  if (!context || context.toolType !== 'interview') {
    return defaultInterviewContext()
  }

  const titleLine = context.jobTitle
    ? `ROLE: ${context.jobTitle}${context.companyName ? ` at ${context.companyName}` : ''}`
    : (context.companyName ? `COMPANY: ${context.companyName}` : '')

  const mergedJobText = [titleLine, context.jobText]
    .filter(Boolean)
    .join('\n')
    .slice(0, 3000)

  return {
    language: 'de',
    alias: '',
    cvText: mergeSessionCvForApi(context, profileCvRaw),
    jobUrl: '',
    jobText: mergedJobText,
  }
}

function defaultJobAnalyzerContext(): JobAnalyzerPromptContext {
  return {
    jobTitle: '',
    companyName: '',
    jobText: '',
    cvText: '',
  }
}

function toJobAnalyzerContext(context: SessionContextData | null, profileCvRaw: string | null): JobAnalyzerPromptContext {
  if (!context || context.toolType !== 'jobanalyzer') {
    return defaultJobAnalyzerContext()
  }

  return {
    jobTitle: context.jobTitle.trim().slice(0, 180),
    companyName: context.companyName.trim().slice(0, 180),
    jobText: context.jobText.trim(),
    cvText: mergeSessionCvForApi(context, profileCvRaw),
  }
}

function sessionHasCareerSetupForStructuredApi(
  tool: ToolType,
  ctx: SessionContextData | null,
  profileCvRaw: string | null,
): ctx is SessionContextData {
  if (!ctx) return false
  if (ctx.generalCoaching) return true
  const mergedCv = mergeSessionCvForApi(ctx, profileCvRaw).trim()
  const job = ctx.jobText?.trim() ?? ''
  if (tool === 'jobanalyzer') {
    return Boolean(mergedCv.length > 0 || job.length > 0 || ctx.jobTitle.trim() || ctx.companyName.trim())
  }
  if (tool === 'interview') {
    return Boolean(mergedCv.length > 0 || job.length > 0 || ctx.jobTitle.trim() || ctx.companyName.trim())
  }
  return false
}

function buildCareerToolSetupForApi(
  tool: ToolType,
  priorUserMessageCount: number,
  jobCtx: JobAnalyzerPromptContext,
  invCtx: InterviewPromptContext,
  ctx: SessionContextData,
): CareerToolSetup | undefined {
  if (tool === 'jobanalyzer' && ctx.generalCoaching) {
    const cv = compactLines(sanitizeTechnicalContext(jobCtx.cvText), 22, 2600).trim()
    return {
      cvText: cv || undefined,
      generalCoaching: true,
      jobAnalyzerFollowUp: priorUserMessageCount > 0,
    }
  }
  if (tool === 'interview' && ctx.generalCoaching) {
    const cv = compactLines(sanitizeTechnicalContext(invCtx.cvText), 22, 2600).trim()
    return {
      cvText: cv || undefined,
      generalCoaching: true,
      interviewLanguageCode: invCtx.language,
      interviewAlias: invCtx.alias.trim().slice(0, 80) || undefined,
    }
  }
  if (tool === 'jobanalyzer') {
    const cv = compactLines(sanitizeTechnicalContext(jobCtx.cvText), 22, 2600).trim()
    const job = compactLines(jobCtx.jobText, 40, 3600).trim()
    const title = jobCtx.jobTitle.trim().slice(0, 200)
    const company = jobCtx.companyName.trim().slice(0, 200)
    if (!cv && !job && !title && !company)
      return undefined
    return {
      cvText: cv || undefined,
      jobText: job || undefined,
      jobTitle: title || undefined,
      companyName: company || undefined,
      jobAnalyzerFollowUp: priorUserMessageCount > 0,
    }
  }
  if (tool === 'interview') {
    const cv = compactLines(sanitizeTechnicalContext(invCtx.cvText), 22, 2600).trim()
    const job = compactLines(invCtx.jobText, 14, 3600).trim()
    const url = invCtx.jobUrl.trim().slice(0, 400)
    const title = ctx.jobTitle.trim().slice(0, 200)
    const company = ctx.companyName.trim().slice(0, 200)
    if (!cv && !job && !url && !title && !company)
      return undefined
    return {
      cvText: cv || undefined,
      jobText: job || undefined,
      jobUrl: url || undefined,
      jobTitle: title || undefined,
      companyName: company || undefined,
      interviewLanguageCode: invCtx.language,
      interviewAlias: invCtx.alias.trim().slice(0, 80) || undefined,
    }
  }
  return undefined
}

function interviewBaseInstruction(language: string, hasCv: boolean, alias: string): string {
  const name = alias || 'the candidate'

  return [
    `[SYSTEM - INTERVIEW COACH] Respond ONLY in ${language}. Never call tools.`,
    `Candidate name: "${name}".`,
    hasCv
      ? 'Use candidate profile evidence and be explicit about gaps.'
      : 'If profile data is missing, make assumptions explicit.',
    'If a target role exists, use exactly these sections:',
    '## Anforderungen / Key Requirements',
    '## Top 3 Interviewfragen',
    '## Vorbereitung / Prep Tips',
    '## Dein Pitch',
    'Keep answers concise, practical, and job-specific.',
  ].join('\n')
}

function buildInterviewPrompt(
  userMessage: string,
  language: string,
  setup: InterviewPromptContext,
): string {
  const jobUrl = setup.jobUrl.trim().slice(0, 220)
  let safeUser = userMessage.trim().slice(0, 1400)

  const fixedReserve = 850
  let remaining = INTERVIEW_PROMPT_LIMIT - safeUser.length - jobUrl.length - fixedReserve
  if (remaining < 900) {
    safeUser = safeUser.slice(0, Math.max(280, safeUser.length - (900 - remaining)))
    remaining = INTERVIEW_PROMPT_LIMIT - safeUser.length - jobUrl.length - fixedReserve
  }

  const cvMax = Math.max(280, Math.floor(remaining * 0.52))
  const jobMax = Math.max(220, remaining - cvMax)

  // Gespeichertes Karriereprofil: nur im API-System-Prompt (ProfileToggles), nicht hier doppeln.
  const modalCv = compactLines(sanitizeTechnicalContext(setup.cvText), 20, cvMax)
  const cvMerged = modalCv ? `From setup modal:\n${modalCv}` : ''

  const base = interviewBaseInstruction(language, Boolean(cvMerged.trim()), setup.alias.trim())
  const jobText = compactLines(setup.jobText, 12, jobMax)

  const cvBlock = cvMerged ? `\nCANDIDATE PROFILE:\n${cvMerged}` : ''
  const roleBlock = (jobText || jobUrl)
    ? `\nTARGET ROLE CONTEXT:\n${jobUrl ? `URL: ${jobUrl}\n` : ''}${jobText ? `JOB DETAILS:\n${jobText}\n` : ''}`
    : ''

  let prompt = `${base}${cvBlock}${roleBlock}\nUser: ${safeUser}`
  if (prompt.length > INTERVIEW_PROMPT_LIMIT) {
    const over = prompt.length - INTERVIEW_PROMPT_LIMIT + 1
    safeUser = safeUser.slice(0, Math.max(80, safeUser.length - over))
    prompt = `${base}${cvBlock}${roleBlock}\nUser: ${safeUser}`
  }
  return prompt.length <= INTERVIEW_PROMPT_LIMIT
    ? prompt
    : prompt.slice(0, INTERVIEW_PROMPT_LIMIT - 1)
}

function buildJobAnalyzerPrompt(
  userMessage: string,
  setup: JobAnalyzerPromptContext,
  /** User messages already in this session before the current send (0 = erste Nachricht). */
  priorUserMessageCount: number,
): string {
  const title = setup.jobTitle
    ? `${setup.jobTitle}${setup.companyName ? ` bei ${setup.companyName}` : ''}`
    : (setup.companyName ? `Rolle bei ${setup.companyName}` : '')

  const isFollowUp = priorUserMessageCount > 0

  const toneAndGrounding = [
    'Ton: menschlich, sachlich, moderat - weder Marketing-Sprech noch übertriebene Begeisterung.',
    'Nur Aussagen, die sich aus STELLENKONTEXT und BEWERBERPROFIL begründen lassen; fehlende Infos ehrlich als Lücke benennen - nichts erfinden oder raten.',
  ].join('\n')

  const baseInstructionInitial = [
    '[SYSTEM - JOB ANALYZER] Antworte nur auf Deutsch.',
    toneAndGrounding,
    'Erste Analyse in dieser Unterhaltung - nutze eine klare Struktur mit genau diesen Sektionen:',
    '## Match Score',
    '## Stärken des Profils',
    '## Lücken / Risiken',
    '## Wichtigste Keywords',
    '## Konkrete nächste Schritte',
    'Regeln:',
    '- Maximal 5 Stichpunkte pro Sektion.',
    '- Keine Wiederholung des gesamten Stellentexts.',
    '- Kurz und präzise; vermeide generische Floskeln, die bei jeder Analyse gleich klingen.',
    '- Begründe den Match Score mit 2 bis 4 klaren Gründen.',
  ].join('\n')

  const baseInstructionFollowUp = [
    '[SYSTEM - JOB ANALYZER] Antworte nur auf Deutsch.',
    toneAndGrounding,
    `Kontext: Die aktuelle Eingabe ist User-Nachricht #${priorUserMessageCount + 1} in dieser Session (Folgefrage).`,
    'Du führst ein **laufendes** Gespräch zur Stellenanalyse; es gibt bereits frühere Nachrichten in dieser Session.',
    'Priorität: Beantworte **zuerst** die konkrete Frage oder den Wunsch in der letzten User-Nachricht - nicht mit einer Standard-Gesamt-Analyse „von vorn“, es sei denn, der User verlangt ausdrücklich eine komplette Neu-Analyse.',
    'Struktur: 2–5 kurze Abschnitte mit ##-Überschriften, **passend zur Frage**. Du musst **nicht** erneut alle fünf Standard-Sektionen (Match Score, Stärken, Lücken, Keywords, Schritte) füllen.',
    'Anti-Wiederholung: Nutze den bisherigen Chat. Wiederhole **keine** Sätze oder Stichpunkte wörtlich aus deiner letzten Antwort; formuliere neu, vertiefe oder fokussiere schmaler - je nachdem, was der User will.',
    'Wenn der User nur einen Aspekt will (z. B. Erfahrung, eine Sektion kürzer, Risiken vertiefen), liefere genau das.',
  ].join('\n')

  const baseInstruction = isFollowUp ? baseInstructionFollowUp : baseInstructionInitial

  let safeUser = userMessage.trim().slice(0, 700)
  if (!safeUser) safeUser = 'Bitte starte jetzt die Erstanalyse.'

  const titleLine = title ? `\nZielrolle: ${title}` : ''
  let remaining =
    JOB_ANALYZER_PROMPT_LIMIT - (baseInstruction.length + safeUser.length + titleLine.length + 120)

  if (remaining < 1100) {
    safeUser = safeUser.slice(0, Math.max(220, safeUser.length - (1100 - remaining)))
    remaining =
      JOB_ANALYZER_PROMPT_LIMIT - (baseInstruction.length + safeUser.length + titleLine.length + 120)
  }

  const jobMax = Math.max(700, Math.floor(remaining * 0.62))
  const cvMax = Math.max(360, remaining - jobMax)

  const compactJob = compactLines(setup.jobText, 36, jobMax)
  // Gespeichertes Karriereprofil: nur im API-System-Prompt (ProfileToggles / Backend), nicht hier doppeln.
  const modalCv = compactLines(setup.cvText, 20, cvMax)
  const cvMerged = modalCv ? `Aus Stellenanalyse-Setup:\n${modalCv}` : ''

  const jobBlock = compactJob ? `\nSTELLENKONTEXT:\n${compactJob}` : ''
  const cvBlock = cvMerged ? `\nBEWERBERPROFIL:\n${cvMerged}` : ''

  let prompt = `${baseInstruction}${titleLine}${jobBlock}${cvBlock}\nUser: ${safeUser}`
  if (prompt.length > JOB_ANALYZER_PROMPT_LIMIT) {
    const over = prompt.length - JOB_ANALYZER_PROMPT_LIMIT + 1
    safeUser = safeUser.slice(0, Math.max(80, safeUser.length - over))
    prompt = `${baseInstruction}${titleLine}${jobBlock}${cvBlock}\nUser: ${safeUser}`
  }
  return prompt.length <= JOB_ANALYZER_PROMPT_LIMIT
    ? prompt
    : prompt.slice(0, JOB_ANALYZER_PROMPT_LIMIT - 1)
}

export default function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawToolParam = (searchParams.get('tool') ?? 'general').toLowerCase()
  const toolParam = normalizeToolParam(rawToolParam)
  const modalToolType = modalToolTypeFromParam(rawToolParam, toolParam)

  const store = useChatSessions()
  const { requestConfirm } = useAppUi()
  const applicationSeedKey = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showContextModal, setShowContextModal] = useState(false)
  const [dismissedContextKeys, setDismissedContextKeys] = useState<DismissedContextMap>(() => loadDismissedContextMap())
  const [contextBySessionKey, setContextBySessionKey] = useState<SessionContextMap>(() => loadContextMap())
  const [linkedJobApplicationBySession, setLinkedJobApplicationBySession] = useState<
    Record<string, { id: string; label: string }>
  >({})
  const [skipContextModalForSessions, setSkipContextModalForSessions] = useState<Record<string, boolean>>({})

  const chatScrollRef = useRef<HTMLDivElement>(null)
  const [scrollToBottomSeq, setScrollToBottomSeq] = useState(0)

  const [nativeLang, setNativeLang] = useState('de')
  const [targetLang, setTargetLang] = useState('es')
  const [progLang, setProgLang] = useState('csharp')

  const [showLimitModal, setShowLimitModal] = useState(false)
  const [checkoutBanner, setCheckoutBanner] = useState<{ type: 'success' | 'info'; text: string } | null>(null)
  const [showOnboardingModal, setShowOnboardingModal] = useState(false)
  const [kontextHintOpen, setKontextHintOpen] = useState(() => {
    try {
      return localStorage.getItem(LS_KONTEXT_HINT_DISMISSED) !== '1'
    } catch {
      return true
    }
  })

  const { isAtLimit, incrementUsage, isSignedIn, email, getToken, refreshUsage } = useUserPlan()
  const {
    toggles: profileToggles,
    updateToggles,
    profile: careerProfile,
    loading: careerProfileLoading,
    error: careerProfileError,
    needsOnboarding,
    skipOnboarding,
  } = useCareerProfile()

  const careerProfileRef = useRef(careerProfile)
  careerProfileRef.current = careerProfile

  const streamCtxRef = useRef<{
    sessionId: string
    msgId: string
    sessionToolType: ToolType
  } | null>(null)
  const streamResultRef = useRef<{ toolUsed: string; serverUsageToday?: number } | null>(null)
  const incrementUsageRef = useRef(incrementUsage)
  incrementUsageRef.current = incrementUsage

  const onDisplayUpdateStable = useCallback((text: string) => {
    const c = streamCtxRef.current
    if (c) applyStreamText(c.sessionId, c.msgId, text)
  }, [])

  const onRevealCompleteStable = useCallback((finalText: string) => {
    const c = streamCtxRef.current
    const r = streamResultRef.current
    if (!c) return
    flushSync(() => {
      store.finalizeMessage(c.sessionId, c.msgId, { toolUsed: r?.toolUsed || undefined })
    })
    const preview = finalText.trim().split('\n')[0] ?? 'Neue Antwort'
    store.notifyAnswerReady(c.sessionId, c.sessionToolType, preview)
    if (typeof r?.serverUsageToday === 'number') {
      dispatchServerUsage(r.serverUsageToday)
    } else {
      incrementUsageRef.current()
    }
    store.setSessionStreaming(c.sessionId, false)
    streamCtxRef.current = null
    streamResultRef.current = null
  }, [store])

  const deliberate = useDeliberateStream({
    charsPerSecond: 80,
    initialDelayMs: 200,
    onDisplayUpdate: onDisplayUpdateStable,
    onRevealComplete: onRevealCompleteStable,
  })

  const [thinkingSession, setThinkingSession] = useState<{
    sessionId: string
    messageId: string
    toolType: ToolType
  } | null>(null)

  const handleThinkingComplete = useCallback(() => {
    setThinkingSession(null)
    const c = streamCtxRef.current
    const cps = c ? STREAM_CHARS_PER_SECOND[c.sessionToolType] ?? 80 : 80
    deliberate.startReveal(cps)
  }, [deliberate])

  useEffect(() => {
    if (!isSignedIn || careerProfileLoading || careerProfileError || !needsOnboarding) {
      setShowOnboardingModal(false)
      return
    }
    try {
      if (sessionStorage.getItem(ONBOARDING_CHAT_PROMPT_DISMISS_KEY) === '1') {
        setShowOnboardingModal(false)
        return
      }
    } catch {
      /* sessionStorage unavailable */
    }
    setShowOnboardingModal(true)
  }, [isSignedIn, careerProfileLoading, careerProfileError, needsOnboarding])

  useEffect(() => {
    saveContextMap(contextBySessionKey)
  }, [contextBySessionKey])

  useEffect(() => {
    saveDismissedContextMap(dismissedContextKeys)
  }, [dismissedContextKeys])

  useEffect(() => {
    const seed = (location.state as {
      seedFromApplication?: {
        applicationId: string
        mode: 'jobanalyzer' | 'interview'
        jobTitle: string
        company: string
        jobDescription: string
      }
    } | null)?.seedFromApplication

    if (seed) {
      const key = `${seed.applicationId}:${seed.mode}`
      if (applicationSeedKey.current === key) return
      applicationSeedKey.current = key

      void (async () => {
        try {
          const tool: ToolType = seed.mode === 'interview' ? 'interview' : 'jobanalyzer'
          await store.switchToTool(tool)
          const sid = await store.newSession(tool)
          const ctxTool = seed.mode === 'interview' ? 'interview' : 'jobanalyzer'
          setContextBySessionKey(prev => ({
            ...prev,
            [contextKey(ctxTool, sid)]: normalizeContext({
              sessionId: sid,
              toolType: ctxTool,
              jobTitle: seed.jobTitle,
              companyName: seed.company,
              jobText: seed.jobDescription.slice(0, JOB_ANALYZER_PROMPT_LIMIT),
              cvText: '',
              programmingLanguage: '',
              programmingLanguageId: '',
              extraSkills: '',
              extraProjects: '',
              extraExperienceNotes: '',
              updatedAt: new Date().toISOString(),
            }),
          }))
          setLinkedJobApplicationBySession(prev => ({
            ...prev,
            [sid]: {
              id: seed.applicationId,
              label: [seed.jobTitle, seed.company].filter(Boolean).join(' · '),
            },
          }))
          setSkipContextModalForSessions(prev => ({ ...prev, [sid]: true }))
          const profileSnapshot = careerProfileRef.current
          if (profileSnapshot?.targetJobs?.length) {
            const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ')
            const jt = norm(seed.jobTitle)
            const jc = norm(seed.company)
            const hit =
              profileSnapshot.targetJobs.find(
                j => norm(j.title ?? '') === jt && norm(j.company ?? '') === jc,
              )
              ?? profileSnapshot.targetJobs.find(
                j =>
                  (jt && norm(j.title ?? '').includes(jt))
                  || (norm(j.title ?? '').length > 2 && jt.includes(norm(j.title ?? ''))),
              )
            if (hit)
              updateToggles({ activeTargetJobId: hit.id })
          }
          store.setActiveSession(sid)
          navigate('.', { replace: true, state: {} })
          const token = await getToken()
          if (token) {
            await linkJobApplicationSession(token, seed.applicationId, {
              sessionType: seed.mode === 'interview' ? 'interview' : 'analysis',
              sessionId: sid,
            })
          }
        } catch (e) {
          console.warn('[ChatPage] Application seed failed', e)
          setError('Kontext aus Bewerbung konnte nicht übernommen werden.')
        }
      })()
      return
    }

    void store.switchToTool(toolParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolParam, location.state])

  /** Deep-link from app sidebar “Letzte Gespräche” (switchToTool alone picks first tab per tool). */
  useEffect(() => {
    const st = location.state as { activateSessionId?: string } | null
    const sessionId = st?.activateSessionId
    if (!sessionId) return
    const session = store.sessions[sessionId]
    if (!session) return
    if (session.toolType !== toolParam) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
      return
    }
    store.setActiveSession(sessionId)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.state, location.pathname, location.search, toolParam, navigate, store.sessions, store.setActiveSession])

  useEffect(() => {
    const upgraded = (searchParams.get('upgraded') ?? '').toLowerCase() === 'true'
    const cancelled = (searchParams.get('cancelled') ?? '').toLowerCase() === 'true'

    if (!upgraded && !cancelled) {
      setCheckoutBanner(null)
      return
    }

    setCheckoutBanner(
      upgraded
        ? { type: 'success', text: 'Upgrade erfolgreich. Dein Plan wurde aktualisiert.' }
        : { type: 'info', text: 'Checkout wurde abgebrochen.' },
    )

    if (upgraded) {
      // Re-fetch plan from server so isAtLimit updates immediately.
      // Retries handle Stripe webhook lag (plan may not be in Redis yet).
      void refreshUsage({ retries: 4, retryDelayMs: 1500 }).catch(() => {
        console.warn('[ChatPage] Plan refresh after upgrade failed - will retry on next send')
      })
    }

    const timer = window.setTimeout(() => setCheckoutBanner(null), 7000)
    return () => window.clearTimeout(timer)
  }, [searchParams, refreshUsage])

  const isLanguage = store.currentToolType === 'language'
  const isProgramming = store.currentToolType === 'programming'
  const isInterview = store.currentToolType === 'interview'

  const profileCompletenessPct = careerProfile ? getProfileCompleteness(careerProfile) : 0
  const profileGapHint = careerProfile ? getProfileCompletenessGapHint(careerProfile) : null

  const kontextPillLabels = useMemo(() => {
    const p = careerProfile
    if (!p) {
      return {
        basic: 'Profil',
        skills: 'Skills',
        exp: 'Erfahrung',
        cv: 'Lebenslauf',
      }
    }
    const basicBits = [p.fieldLabel, p.levelLabel, p.currentRole].filter(Boolean) as string[]
    const basic =
      basicBits.length > 0 ? `Profil: ${basicBits.join(', ')}` : 'Profil (Basis)'
    const sk = p.skills
    const skills =
      sk.length > 0
        ? `Skills: ${sk.slice(0, 2).join(', ')}${sk.length > 2 ? ` +${sk.length - 2} weitere` : ''}`
        : 'Skills'
    const cvLen = p.cvRawText?.trim().length ?? 0
    const cv = cvLen > 0 ? `Lebenslauf: ${cvLen} Zeichen` : 'Lebenslauf'
    const exp =
      p.experience.length > 0
        ? `Erfahrung: ${p.experience.length} ${p.experience.length === 1 ? 'Eintrag' : 'Einträge'}`
        : 'Erfahrung'
    return { basic, skills, exp, cv }
  }, [careerProfile])

  const llMode = isLanguage
  /** For display in UI (German labels) */
  const nativeDisplay = LANG_DISPLAY[nativeLang] ?? nativeLang
  const targetDisplay = LANG_DISPLAY[targetLang] ?? targetLang
  /** For the backend API (English names, more reliable with Claude) */
  const nativeApiName = LANG_API[nativeLang] ?? nativeLang
  const targetApiName = LANG_API[targetLang] ?? targetLang
  const progMeta = PROGRAMMING_LANGUAGES.find(lang => lang.id === progLang)

  // Mobile compact header helpers
  const mobileActiveSession = store.visibleSessions.find(s => s.id === store.activeSessionId) ?? null
  const mobileSessionLabel = mobileActiveSession
    ? sessionListLabel(mobileActiveSession, 28)
    : 'Gespräch wählen'
  const MOBILE_TOOL_ICON: Record<string, LucideIcon> = {
    general: MessageCircle,
    jobanalyzer: Briefcase,
    language: Globe2,
    programming: Code2,
    interview: Target,
  }
  const MobileToolIcon: LucideIcon = MOBILE_TOOL_ICON[store.currentToolType] ?? MessageCircle

  const activeContextTool = asContextTool(store.currentToolType)
  const activeContextKey = activeContextTool && store.activeSessionId
    ? contextKey(activeContextTool, store.activeSessionId)
    : null

  const activeContext = activeContextKey ? contextBySessionKey[activeContextKey] ?? null : null
  const hasUserMessages = useMemo(
    () => store.activeMessages.some(message => message.isUser),
    [store.activeMessages],
  )

  useEffect(() => {
    if (!activeContextTool || !store.activeSessionId || !activeContextKey) {
      setShowContextModal(false)
      return
    }

    if (activeContext || hasUserMessages || dismissedContextKeys[activeContextKey]) {
      return
    }

    if (store.activeSessionId && skipContextModalForSessions[store.activeSessionId]) {
      return
    }

    const timer = window.setTimeout(() => setShowContextModal(true), 500)
    return () => window.clearTimeout(timer)
  }, [
    activeContext,
    activeContextKey,
    activeContextTool,
    dismissedContextKeys,
    hasUserMessages,
    skipContextModalForSessions,
    store.activeSessionId,
  ])

  const handleCloseContextModal = () => {
    setShowContextModal(false)

    if (!activeContextKey) return
    setDismissedContextKeys(prev => ({
      ...prev,
      [activeContextKey]: true,
    }))
  }

  const handleContextSet = (contextData: ContextPayload) => {
    if (!activeContextTool || !store.activeSessionId) {
      setError('Cannot set context without an active session.')
      setShowContextModal(false)
      return
    }

    const key = contextKey(activeContextTool, store.activeSessionId)
    const normalized = normalizeContext({
      sessionId: store.activeSessionId,
      toolType: activeContextTool,
      cvText: contextData.cvText,
      jobText: contextData.jobText,
      jobTitle: contextData.jobTitle,
      companyName: contextData.companyName,
      programmingLanguage: contextData.programmingLanguage,
      programmingLanguageId: contextData.programmingLanguageId,
      generalCoaching: contextData.generalCoaching,
      includeProfileCvInSetup: contextData.includeProfileCvInSetup,
      extraSkills: contextData.extraSkills,
      extraProjects: contextData.extraProjects,
      extraExperienceNotes: contextData.extraExperienceNotes,
    })

    setContextBySessionKey(prev => ({
      ...prev,
      [key]: normalized,
    }))

    setDismissedContextKeys(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })

    setShowContextModal(false)

    const userAlreadyStarted = store.activeMessages.some(message => message.isUser)
    if (userAlreadyStarted) return

    if (activeContextTool === 'jobanalyzer' && normalized.generalCoaching) {
      void handleSend(
        'Bitte gib eine allgemeine Karriere- und Profil-Einschätzung ohne konkrete Stellenanzeige (Skills, nächste Schritte, Marktrealismus).',
        { displayText: 'Allgemeines Coaching starten', contextOverride: normalized },
      )
      return
    }

    if (activeContextTool === 'jobanalyzer' && normalized.jobText) {
      const roleHint = normalized.jobTitle
        ? `${normalized.jobTitle}${normalized.companyName ? ` bei ${normalized.companyName}` : ''}`
        : 'Stellenkontext'

      void handleSend(
        'Bitte starte die Analyse mit den gespeicherten Setup-Daten.',
        {
          displayText: `Analyse starten: ${roleHint}`,
          contextOverride: normalized,
        },
      )
      return
    }

    if (activeContextTool === 'interview' && normalized.generalCoaching) {
      void handleSend(
        'Please start general interview coaching without a specific job posting - use my CV/profile; ask targeted questions if needed.',
        { contextOverride: normalized },
      )
      return
    }

    if (activeContextTool === 'interview') {
      const intro = normalized.jobTitle
        ? `I am preparing for an interview for: ${normalized.jobTitle}${normalized.companyName ? ` at ${normalized.companyName}` : ''}. Please start the interview preparation.`
        : 'Please start an interview preparation session and ask me targeted questions.'
      void handleSend(intro, { contextOverride: normalized })
      return
    }

    if (activeContextTool === 'programming' && normalized.programmingLanguage) {
      if (normalized.programmingLanguageId) {
        setProgLang(normalized.programmingLanguageId)
      }
      void handleSend(
        `I am working with ${normalized.programmingLanguage}. I am ready to get help with my code.`,
        { contextOverride: normalized },
      )
      return
    }

    if (activeContextTool === 'programming' && normalized.programmingLanguageId) {
      const mapped = PROGRAMMING_LANGUAGES.find(lang => lang.id === normalized.programmingLanguageId)?.label ?? normalized.programmingLanguageId
      setProgLang(normalized.programmingLanguageId)
      void handleSend(
        `I am working with ${mapped}. I am ready to get help with my code.`,
        { contextOverride: normalized },
      )
    }
  }

  const handleNewSession = () => {
    void store.newSession(store.currentToolType)
  }

  const handleDeleteSession = (id: string) => {
    void store.deleteSession(id)

    setContextBySessionKey(prev => {
      const next: SessionContextMap = {}
      for (const [key, value] of Object.entries(prev)) {
        if (value.sessionId === id) continue
        next[key] = value
      }
      return next
    })

    setDismissedContextKeys(prev => {
      const next: DismissedContextMap = {}
      for (const [key, value] of Object.entries(prev)) {
        if (key.endsWith(`:${id}`)) continue
        next[key] = value
      }
      return next
    })
  }

  const dismissKontextHint = () => {
    try {
      localStorage.setItem(LS_KONTEXT_HINT_DISMISSED, '1')
    } catch {
      /* ignore */
    }
    setKontextHintOpen(false)
  }

  const handleClear = () => {
    void (async () => {
      const ok = await requestConfirm({
        title: 'Konversationen löschen?',
        message: 'Alle gespeicherten Chats werden von diesem Gerät entfernt. Das kann nicht rückgängig gemacht werden.',
        confirmLabel: 'Alle löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
      })
      if (!ok) return
      void store.clearHistory()
      setContextBySessionKey({})
      setDismissedContextKeys({})
      localStorage.removeItem(LS_CONTEXT)
      localStorage.removeItem(LS_CONTEXT_DISMISSED)
    })()
  }

  const handleSend = async (text: string, options?: HandleSendOptions) => {
    if (isAtLimit) {
      setShowLimitModal(true)
      return
    }
    if (store.sessionsRemoteLoading) {
      setError('Chats werden noch geladen - bitte kurz warten.')
      return
    }
    if (!store.activeSessionId) {
      setError('Bitte zuerst „Neues Gespräch“ in der Seitenleiste starten, dann hier schreiben.')
      return
    }

    const sessionId = store.activeSessionId
    const linkedAppForSend = linkedJobApplicationBySession[sessionId]
    const sessionToolType = store.sessions[sessionId]?.toolType ?? store.currentToolType
    const displayText = options?.displayText ?? text
    const outgoingText = options?.apiMessageOverride ?? text
    const priorUserMessageCount = (store.sessions[sessionId]?.messages ?? []).filter(m => m.isUser).length

    setError(null)

    const effectiveContext = options?.contextOverride ?? activeContext
    const profileCvForMerge = careerProfile?.cvRawText ?? null
    const interviewSetup = toInterviewContext(effectiveContext, profileCvForMerge)
    const jobAnalyzerSetup = toJobAnalyzerContext(effectiveContext, profileCvForMerge)
    const interviewLangCode = interviewSetup.language === 'en' ? 'en' : 'de'
    const interviewLangName = interviewLangCode === 'de' ? 'German' : 'English'

    const hasApiMsgOverride = Boolean(options?.apiMessageOverride)
    const useStructuredCareer = !hasApiMsgOverride
      && (store.currentToolType === 'jobanalyzer' || isInterview)
      && sessionHasCareerSetupForStructuredApi(store.currentToolType, effectiveContext, profileCvForMerge)

    const careerToolSetup = useStructuredCareer && effectiveContext
      ? buildCareerToolSetupForApi(
          store.currentToolType,
          priorUserMessageCount,
          jobAnalyzerSetup,
          interviewSetup,
          effectiveContext,
        )
      : undefined

    const apiMessage = useStructuredCareer
      ? (outgoingText.trim()
        || (store.currentToolType === 'jobanalyzer' && priorUserMessageCount === 0
          ? 'Bitte starte jetzt die Erstanalyse.'
          : 'Bitte fahre mit der Vorbereitung fort.'))
      : (isInterview
        ? buildInterviewPrompt(outgoingText, interviewLangName, interviewSetup)
        : (store.currentToolType === 'jobanalyzer'
          ? buildJobAnalyzerPrompt(outgoingText, jobAnalyzerSetup, priorUserMessageCount)
          : outgoingText))

    const streamingMsgId = crypto.randomUUID()
    flushSync(() => {
      if (!options?.skipUserBubble) {
        store.addMessage(sessionId, { text: displayText, isUser: true })
      }
      store.addMessage(sessionId, { id: streamingMsgId, text: '', isUser: false })
      store.setSessionStreaming(sessionId, true, streamingMsgId)
    })
    setScrollToBottomSeq(s => s + 1)

    const skipThinkingUi = shouldSkipThinkingUi(outgoingText, sessionToolType)
    let usedDeliberatePath = false

    try {
      const token = await getToken()

      if (skipThinkingUi) {
        let accumulated = ''

        const { toolUsed, serverUsageToday } = await askAgentStream(
          {
            message: apiMessage,
            sessionId,
            toolType: apiToolTypeForChat(store.currentToolType),
            languageLearningMode: llMode,
            targetLanguage: llMode ? targetApiName : undefined,
            nativeLanguage: llMode ? nativeApiName : undefined,
            targetLanguageCode: llMode ? targetLang : undefined,
            nativeLanguageCode: llMode ? nativeLang : undefined,
            level: llMode ? 'adaptive' : undefined,
            learningGoal: llMode ? 'Kurze Sätze, Zielsprache und Übersetzung' : undefined,
            programmingMode: isProgramming ? true : undefined,
            programmingLanguage: isProgramming ? progMeta?.label : undefined,
            interviewMode: isInterview ? true : undefined,
            interviewLanguage: isInterview ? (interviewLangCode === 'de' ? 'German' : 'English') : undefined,
            profileToggles: isSignedIn ? profileToggles : undefined,
            jobApplicationId: isSignedIn && linkedAppForSend ? linkedAppForSend.id : undefined,
            careerToolSetup,
          },
          token,
          (chunk) => {
            accumulated += chunk
            applyStreamText(sessionId, streamingMsgId, accumulated)
          },
        )

        flushSync(() => {
          store.finalizeMessage(sessionId, streamingMsgId, { toolUsed: toolUsed || undefined })
        })

        const preview = accumulated.trim().split('\n')[0] ?? 'Neue Antwort'
        store.notifyAnswerReady(sessionId, sessionToolType, preview)

        if (typeof serverUsageToday === 'number') {
          dispatchServerUsage(serverUsageToday)
        } else {
          incrementUsage()
        }
      } else {
        usedDeliberatePath = true
        deliberate.reset()
        streamCtxRef.current = {
          sessionId,
          msgId: streamingMsgId,
          sessionToolType,
        }
        streamResultRef.current = null
        setThinkingSession({
          sessionId,
          messageId: streamingMsgId,
          toolType: sessionToolType,
        })

        const { toolUsed, serverUsageToday } = await askAgentStream(
          {
            message: apiMessage,
            sessionId,
            toolType: apiToolTypeForChat(store.currentToolType),
            languageLearningMode: llMode,
            targetLanguage: llMode ? targetApiName : undefined,
            nativeLanguage: llMode ? nativeApiName : undefined,
            targetLanguageCode: llMode ? targetLang : undefined,
            nativeLanguageCode: llMode ? nativeLang : undefined,
            level: llMode ? 'adaptive' : undefined,
            learningGoal: llMode ? 'Kurze Sätze, Zielsprache und Übersetzung' : undefined,
            programmingMode: isProgramming ? true : undefined,
            programmingLanguage: isProgramming ? progMeta?.label : undefined,
            interviewMode: isInterview ? true : undefined,
            interviewLanguage: isInterview ? (interviewLangCode === 'de' ? 'German' : 'English') : undefined,
            profileToggles: isSignedIn ? profileToggles : undefined,
            jobApplicationId: isSignedIn && linkedAppForSend ? linkedAppForSend.id : undefined,
            careerToolSetup,
          },
          token,
          (chunk) => {
            deliberate.appendFromNetwork(chunk)
          },
        )

        streamResultRef.current = {
          toolUsed: toolUsed || '',
          serverUsageToday,
        }
        deliberate.markNetworkComplete()
      }
    } catch (sendError) {
      store.deleteMessage(sessionId, streamingMsgId)
      if (usedDeliberatePath) {
        deliberate.reset()
        setThinkingSession(null)
        streamCtxRef.current = null
        streamResultRef.current = null
        store.setSessionStreaming(sessionId, false)
      }
      if (sendError instanceof UsageLimitError) {
        // Before showing the modal, re-check the plan from the server.
        // If the backend returned 429 due to a stale "free" plan right after a Stripe
        // upgrade, the refresh (or Stripe sync) will unlock the correct plan so the user
        // can simply click Send again without seeing the modal.
        try {
          const latestPlan = await refreshUsage({ retries: 1, retryDelayMs: 1000 })
          if (latestPlan === 'premium' || latestPlan === 'pro') {
            return // timing artifact - plan now confirmed, don't block
          }
          // Usage endpoint still returns free - query Stripe directly to repair Redis
          const token = await getToken()
          if (token) {
            const syncResult = await syncPlanFromStripe(token, email)
            if (syncResult.plan === 'premium' || syncResult.plan === 'pro') {
              await refreshUsage({ retries: 1, retryDelayMs: 500 })
              return // Redis repaired - let user retry
            }
          }
        } catch { /* ignore - fall through to show modal */ }
        setShowLimitModal(true)
      } else {
        setError(sendError instanceof Error ? sendError.message : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.')
      }
    } finally {
      if (!usedDeliberatePath) {
        store.setSessionStreaming(sessionId, false)
      }
    }
  }

  const activeId = store.activeSessionId
  /** Streaming is tracked in ChatSessionsProvider so it survives switching chats / routes. */
  const inputBlocked = store.isSessionStreaming(activeId)

  const thinkingSlot =
    thinkingSession
    && activeId === thinkingSession.sessionId
    && store.streamingPlaceholder?.messageId === thinkingSession.messageId
      ? (
          <ThinkingIndicator
            key={`${thinkingSession.sessionId}-${thinkingSession.messageId}`}
            toolType={thinkingSession.toolType}
            includeProfileStep={
              isSignedIn
              && (profileToggles.includeBasicProfile
                || profileToggles.includeSkills
                || profileToggles.includeExperience
                || profileToggles.includeCv)
            }
            hasTargetJob={Boolean(profileToggles.activeTargetJobId)}
            profileStatsLine={buildProfileStatsLine(careerProfile ?? null)}
            onComplete={handleThinkingComplete}
          />
        )
      : undefined

  const programmingContextLabel = activeContext?.programmingLanguage
    || (activeContext?.programmingLanguageId
      ? PROGRAMMING_LANGUAGES.find(lang => lang.id === activeContext.programmingLanguageId)?.label ?? activeContext.programmingLanguageId
      : '')

  const contextInfo = {
    jobanalyzer: activeContext?.toolType === 'jobanalyzer' && activeContext.hasJob
      ? `Stelle: ${activeContext.jobTitle || 'Kontext aktiv'}${activeContext.companyName ? ` bei ${activeContext.companyName}` : ''}`
      : null,
    interview: activeContext?.toolType === 'interview' && activeContext.hasJob
      ? `Interview: ${activeContext.jobTitle || 'Zielrolle'}${activeContext.companyName ? ` bei ${activeContext.companyName}` : ''}`
      : null,
    programming: activeContext?.toolType === 'programming' && programmingContextLabel
      ? `Code: ${programmingContextLabel}`
      : null,
  } as const

  const activeContextInfo = activeContextTool ? contextInfo[activeContextTool] : null
  const activeModalInitialData = useMemo(() => {
    const profileCvRaw = careerProfile?.cvRawText?.trim()
    const profileCv = profileCvRaw
      ? sanitizeTechnicalContext(careerProfile?.cvRawText ?? '').slice(0, 4200)
      : ''
    if (!activeContext && !profileCv) return undefined
    return {
      cvText: activeContext?.cvText?.trim() ?? '',
      jobText: activeContext?.jobText ?? '',
      jobTitle: activeContext?.jobTitle ?? '',
      companyName: activeContext?.companyName ?? '',
      programmingLanguage: activeContext?.programmingLanguage ?? '',
      programmingLanguageId: activeContext?.programmingLanguageId ?? '',
      includeProfileCvInSetup: activeContext?.includeProfileCvInSetup !== false,
      extraSkills: activeContext?.extraSkills ?? '',
      extraProjects: activeContext?.extraProjects ?? '',
      extraExperienceNotes: activeContext?.extraExperienceNotes ?? '',
      profileCvPrefilled: Boolean(profileCv),
    }
  }, [activeContext, careerProfile])

  return (
    <div className="relative flex min-h-0 flex-1 overflow-hidden">
      <ChatSidebar
        sessions={store.visibleSessions}
        activeSessionId={store.activeSessionId}
        currentToolType={store.currentToolType}
        sessionIsStreaming={id => store.isSessionStreaming(id)}
        isOpen={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        onSelect={id => { store.setActiveSession(id) }}
        onNew={handleNewSession}
        onDelete={handleDeleteSession}
        onClear={handleClear}
        onReorderSessions={(from, to) => {
          void store.reorderSessionsForTool(store.currentToolType, from, to)
        }}
        onRenameSession={(id, title) => {
          void store.renameSession(id, title)
        }}
        onSyncFromServer={isSignedIn ? () => void store.syncSessionsRemote() : undefined}
        sessionsRemoteSyncing={store.sessionsRemoteSyncing}
        sessionsLastSyncedAt={store.sessionsLastSyncedAt}
        showLLPanel={isLanguage}
        languageLearningMode={llMode}
        nativeLangCode={nativeLang}
        targetLangCode={targetLang}
        onNativeLangChange={setNativeLang}
        onTargetLangChange={setTargetLang}
        showProgPanel={isProgramming}
        progLang={progLang}
        onProgLangChange={setProgLang}
        showInterviewPanel={isInterview}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {store.sessionsLoadError && (
          <div className="flex-shrink-0 border-b border-red-500/35 bg-red-950/40 px-3 py-2.5 text-sm text-red-100 sm:px-4" role="alert">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
              <span className="flex min-w-0 items-start gap-2">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-400" aria-hidden />
                <span className="min-w-0 leading-snug">{store.sessionsLoadError}</span>
              </span>
              <button
                type="button"
                onClick={() => store.retrySessionsRemoteLoad()}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/50 px-3 py-1.5 text-xs font-semibold text-red-200 shadow-sm transition hover:bg-red-950/70"
              >
                <RefreshCw size={14} aria-hidden />
                Erneut laden
              </button>
            </div>
          </div>
        )}

        {store.sessionsStaleHint && (
          <div className="flex-shrink-0 border-b border-amber-500/35 bg-amber-950/35 px-3 py-2.5 text-sm text-amber-50 sm:px-4" role="status">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 leading-snug">{store.sessionsStaleHint}</span>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void store.syncSessionsRemote()}
                  disabled={store.sessionsRemoteSyncing}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-950/45 px-3 py-1.5 text-xs font-semibold text-amber-100 shadow-sm transition hover:bg-amber-950/65 disabled:opacity-50"
                >
                  <RefreshCw size={14} className={store.sessionsRemoteSyncing ? 'animate-spin' : ''} aria-hidden />
                  Synchronisieren
                </button>
                <button
                  type="button"
                  onClick={() => store.dismissSessionsStaleHint()}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-amber-200/90 hover:bg-amber-500/15"
                >
                  Ausblenden
                </button>
              </div>
            </div>
          </div>
        )}

        {store.remoteSyncNotice && (
          <div className="pointer-events-none flex flex-shrink-0 justify-center px-3 pt-2 sm:px-4" role="status" aria-live="polite">
            <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-full border border-emerald-200 bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg">
              <CheckCircle2 size={16} className="shrink-0 opacity-95" aria-hidden />
              <span className="min-w-0 flex-1 leading-snug">{store.remoteSyncNotice}</span>
              <button
                type="button"
                onClick={() => store.dismissRemoteSyncNotice()}
                className="rounded-full p-0.5 text-white/90 transition hover:bg-white/15 hover:text-white"
                aria-label="Hinweis schließen"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Mobile (≤768px): compact unified session + status bar */}
        <div className="flex min-[769px]:hidden flex-shrink-0 items-center gap-1 border-b border-stone-600/35 bg-app-muted/90 px-1.5 py-0.5 backdrop-blur-sm">
          {/* Session toggle - tap to open sessions panel */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
            aria-label="Gespräche öffnen"
          >
            <MobileToolIcon size={13} className="shrink-0 text-stone-500" />
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-stone-300">
              {mobileSessionLabel}
            </span>
            {isInterview && (
              <span className="shrink-0 rounded bg-sky-900/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-300">Intv</span>
            )}
            {isProgramming && (
              <span className="shrink-0 rounded bg-emerald-900/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-300">
                {(progMeta?.label ?? progLang).slice(0, 4)}
              </span>
            )}
            {isLanguage && (
              <span className="shrink-0 rounded bg-amber-900/70 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                {targetDisplay.slice(0, 3)}
              </span>
            )}
            <ChevronDown size={11} className="shrink-0 text-stone-500" />
          </button>
          {/* Interview: quick setup access */}
          {isInterview && (
            <button
              type="button"
              onClick={() => setShowContextModal(true)}
              className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[10px] font-medium text-sky-400 transition-colors hover:bg-sky-900/30 active:bg-sky-900/50"
            >
              Setup
            </button>
          )}
          {/* New chat */}
          <button
            onClick={handleNewSession}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/8 active:bg-white/15"
            aria-label="Neues Gespräch starten"
          >
            <Plus size={16} />
          </button>
        </div>

        {checkoutBanner && (
          <div className="flex-shrink-0 px-4 pb-0 pt-3">
            <div
              className={`mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-sm ${
                checkoutBanner.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                {checkoutBanner.text}
              </div>
              <button
                onClick={() => setCheckoutBanner(null)}
                className={checkoutBanner.type === 'success' ? 'text-emerald-600 hover:text-emerald-800' : 'text-amber-600 hover:text-amber-800'}
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {isSignedIn && store.activeSessionId && linkedJobApplicationBySession[store.activeSessionId] && (
          <div className="hidden min-[769px]:block flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-800">
                Bewerbung:
                {' '}
                {linkedJobApplicationBySession[store.activeSessionId].label}
              </span>
            </div>
          </div>
        )}

        {activeContextInfo && (
          <div className="context-indicator">
            <span>{activeContextInfo}</span>
            <button onClick={() => setShowContextModal(true)} className="context-edit-btn">
              Bearbeiten
            </button>
          </div>
        )}

        {isLanguage && (
          <div className="hidden min-[769px]:block flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
                Lernen: {targetDisplay}
              </span>
            </div>
          </div>
        )}

        {isProgramming && (
          <div className="hidden min-[769px]:block flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Programmierung: {progMeta?.label ?? progLang}
              </span>
            </div>
          </div>
        )}

        {isInterview && (
          <div className="hidden min-[769px]:flex flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                Vorstellungsgespräch
              </span>

              {activeContext?.hasCv && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Lebenslauf Kontext aktiv
                </span>
              )}

              <button
                onClick={() => setShowContextModal(true)}
                className="text-xs text-sky-600 hover:text-sky-800 hover:underline"
              >
                Setup öffnen
              </button>
            </div>
          </div>
        )}

        <ChatAnswerReadyBanner />

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-3 py-4 desktop:px-4">
              <MessageList
                messages={store.activeMessages}
                viewSessionId={activeId}
                streamingPlaceholder={store.streamingPlaceholder}
                toolType={store.currentToolType}
                targetLang={targetDisplay}
                nativeLang={nativeDisplay}
                targetLangCode={targetLang}
                progLang={progLang}
                thinkingSlot={thinkingSlot}
                streamCursorActive={deliberate.isRevealing}
                streamCursorMessageId={store.streamingPlaceholder?.messageId ?? null}
                scrollContainerRef={chatScrollRef}
                scrollToBottomSeq={scrollToBottomSeq}
                activeSessionId={activeId}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="flex-shrink-0 px-4 pb-1">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={15} className="flex-shrink-0" />
                {error}
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <X size={15} />
              </button>
            </div>
          </div>
        )}

        {isSignedIn
          && !careerProfileLoading
          && store.currentToolType !== 'language'
          && store.currentToolType !== 'general' && (
          <div className="flex-shrink-0 border-b border-stone-600/35 bg-app-muted/85 px-4 py-2 backdrop-blur-sm">
            <ChatContextBar
              careerProfile={careerProfile}
              profileCompletenessPct={profileCompletenessPct}
              profileGapHint={profileGapHint}
              profileToggles={profileToggles}
              updateToggles={updateToggles}
              kontextPillLabels={kontextPillLabels}
              kontextHintOpen={kontextHintOpen}
              dismissKontextHint={dismissKontextHint}
            />
          </div>
        )}

        <ChatInput
          toolType={store.currentToolType}
          isLoading={inputBlocked}
          noActiveSession={!activeId}
          onSend={handleSend}
        />
      </div>

      {showContextModal && store.activeSessionId && modalToolType && (
        <ContextModal
          toolType={modalToolType}
          sessionId={store.activeSessionId}
          initialData={activeModalInitialData}
          profileCvFromCareer={careerProfile?.cvRawText ?? undefined}
          onClose={handleCloseContextModal}
          onContextSet={handleContextSet}
        />
      )}

      <UsageLimitModal
        isOpen={showLimitModal}
        isLoggedIn={isSignedIn}
        userEmail={email}
        onClose={() => setShowLimitModal(false)}
      />

      <OnboardingPromptModal
        isOpen={showOnboardingModal}
        onDismissSession={() => {
          try {
            sessionStorage.setItem(ONBOARDING_CHAT_PROMPT_DISMISS_KEY, '1')
          } catch {
            /* ignore */
          }
          setShowOnboardingModal(false)
        }}
        onSkipApi={skipOnboarding}
        onAfterSkip={() => setShowOnboardingModal(false)}
      />
    </div>
  )
}


