import { useEffect, useMemo, useState } from 'react'
import { flushSync } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, PanelLeft, Plus, X } from 'lucide-react'
import type { ToolType } from '../types'
import { PROGRAMMING_LANGUAGES } from '../types'
import { UsageLimitError, askAgentStream } from '../api/client'
import { syncPlanFromStripe } from '../services/StripeService'
import ChatInput from '../components/chat/ChatInput'
import ChatSidebar from '../components/chat/ChatSidebar'
import ContextModal, { type ContextModalToolType, type ContextPayload } from '../components/chat/ContextModal'
import MessageList from '../components/chat/MessageList'
import ChatAnswerReadyBanner from '../components/chat/ChatAnswerReadyBanner'
import UsageLimitModal from '../components/ui/UsageLimitModal'
import { useChatSessions } from '../hooks/useChatSessions'
import { useUserPlan, dispatchServerUsage } from '../hooks/useUserPlan'
import { sanitizeTechnicalContext } from '../utils/cvTechnicalContext'
import { applyStreamText } from '../chat/streamTextBridge'

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

/** English names sent to the backend — Claude responds more reliably to English language names */
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

type ContextToolType = 'jobanalyzer' | 'interview' | 'programming'

type SessionContextMap = Record<string, SessionContextData>

type DismissedContextMap = Record<string, true>

interface SessionContextData {
  sessionId: string
  toolType: ContextToolType
  cvText: string
  jobText: string
  jobTitle: string
  companyName: string
  programmingLanguage: string
  programmingLanguageId: string
  hasJob: boolean
  hasCv: boolean
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

function normalizeContext(input: Partial<SessionContextData> & { sessionId: string; toolType: ContextToolType }): SessionContextData {
  const cvText = sanitizeTechnicalContext(input.cvText ?? '').slice(0, 4200)
  const jobText = (input.jobText ?? '').trim().slice(0, 7000)
  const jobTitle = (input.jobTitle ?? '').trim().slice(0, 180)
  const companyName = (input.companyName ?? '').trim().slice(0, 180)
  const programmingLanguage = (input.programmingLanguage ?? '').trim().slice(0, 80)
  const programmingLanguageId = (input.programmingLanguageId ?? '').trim().slice(0, 40)

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
    hasCv: Boolean(cvText),
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

function toInterviewContext(context: SessionContextData | null): InterviewPromptContext {
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
    cvText: context.cvText,
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

function toJobAnalyzerContext(context: SessionContextData | null): JobAnalyzerPromptContext {
  if (!context || context.toolType !== 'jobanalyzer') {
    return defaultJobAnalyzerContext()
  }

  return {
    jobTitle: context.jobTitle.trim().slice(0, 180),
    companyName: context.companyName.trim().slice(0, 180),
    jobText: context.jobText.trim(),
    cvText: sanitizeTechnicalContext(context.cvText).trim(),
  }
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

function buildInterviewPrompt(userMessage: string, language: string, setup: InterviewPromptContext): string {
  const base = interviewBaseInstruction(language, !!setup.cvText.trim(), setup.alias.trim())
  const jobUrl = setup.jobUrl.trim().slice(0, 220)

  let safeUser = userMessage.trim().slice(0, 1400)
  let remaining = INTERVIEW_PROMPT_LIMIT - (base.length + safeUser.length + 120)

  if (remaining < 900) {
    safeUser = safeUser.slice(0, Math.max(280, safeUser.length - (900 - remaining)))
    remaining = INTERVIEW_PROMPT_LIMIT - (base.length + safeUser.length + 120)
  }

  const cvMax = Math.max(280, Math.floor(remaining * 0.52))
  const jobMax = Math.max(220, remaining - cvMax)

  const cvText = compactLines(sanitizeTechnicalContext(setup.cvText), 20, cvMax)
  const jobText = compactLines(setup.jobText, 12, jobMax)

  const cvBlock = cvText ? `\nCANDIDATE PROFILE:\n${cvText}` : ''
  const roleBlock = (jobText || jobUrl)
    ? `\nTARGET ROLE CONTEXT:\n${jobUrl ? `URL: ${jobUrl}\n` : ''}${jobText ? `JOB DETAILS:\n${jobText}\n` : ''}`
    : ''

  const prompt = `${base}${cvBlock}${roleBlock}\nUser: ${safeUser}`
  return prompt.length <= INTERVIEW_PROMPT_LIMIT
    ? prompt
    : prompt.slice(0, INTERVIEW_PROMPT_LIMIT - 1)
}

function buildJobAnalyzerPrompt(userMessage: string, setup: JobAnalyzerPromptContext): string {
  const title = setup.jobTitle
    ? `${setup.jobTitle}${setup.companyName ? ` bei ${setup.companyName}` : ''}`
    : (setup.companyName ? `Rolle bei ${setup.companyName}` : '')

  const baseInstruction = [
    '[SYSTEM - JOB ANALYZER] Antworte nur auf Deutsch.',
    'Nutze eine klare, kurze und professionelle Struktur mit genau diesen Sektionen:',
    '## 🎯 Match Score',
    '## ✅ Stärken des Profils',
    '## ⚠️ Lücken / Risiken',
    '## 🔑 Wichtigste Keywords',
    '## 🚀 Konkrete nächste Schritte',
    'Regeln:',
    '- Maximal 5 Stichpunkte pro Sektion.',
    '- Keine Wiederholung des gesamten Originaltexts.',
    '- Keine langen Absätze, nur präzise Aussagen.',
    '- Begründe den Match Score mit 2 bis 4 klaren Gründen.',
  ].join('\n')

  let safeUser = userMessage.trim().slice(0, 700)
  if (!safeUser) safeUser = 'Bitte starte jetzt die Erstanalyse.'

  const titleLine = title ? `\nZielrolle: ${title}` : ''
  let remaining = JOB_ANALYZER_PROMPT_LIMIT - (baseInstruction.length + safeUser.length + titleLine.length + 120)

  if (remaining < 1100) {
    safeUser = safeUser.slice(0, Math.max(220, safeUser.length - (1100 - remaining)))
    remaining = JOB_ANALYZER_PROMPT_LIMIT - (baseInstruction.length + safeUser.length + titleLine.length + 120)
  }

  const jobMax = Math.max(700, Math.floor(remaining * 0.62))
  const cvMax = Math.max(360, remaining - jobMax)

  const compactJob = compactLines(setup.jobText, 36, jobMax)
  const compactCv = compactLines(setup.cvText, 20, cvMax)

  const jobBlock = compactJob ? `\nSTELLENKONTEXT:\n${compactJob}` : ''
  const cvBlock = compactCv ? `\nBEWERBERPROFIL (technischer Auszug):\n${compactCv}` : ''

  const prompt = `${baseInstruction}${titleLine}${jobBlock}${cvBlock}\nUser: ${safeUser}`
  return prompt.length <= JOB_ANALYZER_PROMPT_LIMIT
    ? prompt
    : prompt.slice(0, JOB_ANALYZER_PROMPT_LIMIT - 1)
}

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const rawToolParam = (searchParams.get('tool') ?? 'general').toLowerCase()
  const toolParam = normalizeToolParam(rawToolParam)
  const modalToolType = modalToolTypeFromParam(rawToolParam, toolParam)

  const store = useChatSessions()
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showContextModal, setShowContextModal] = useState(false)
  const [dismissedContextKeys, setDismissedContextKeys] = useState<DismissedContextMap>(() => loadDismissedContextMap())
  const [contextBySessionKey, setContextBySessionKey] = useState<SessionContextMap>(() => loadContextMap())

  const [nativeLang, setNativeLang] = useState('de')
  const [targetLang, setTargetLang] = useState('es')
  const [progLang, setProgLang] = useState('csharp')

  const [showLimitModal, setShowLimitModal] = useState(false)
  const [checkoutBanner, setCheckoutBanner] = useState<{ type: 'success' | 'info'; text: string } | null>(null)

  const { isAtLimit, incrementUsage, isSignedIn, email, getToken, refreshUsage } = useUserPlan()

  useEffect(() => {
    saveContextMap(contextBySessionKey)
  }, [contextBySessionKey])

  useEffect(() => {
    saveDismissedContextMap(dismissedContextKeys)
  }, [dismissedContextKeys])

  useEffect(() => {
    store.switchToTool(toolParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolParam])

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
        console.warn('[ChatPage] Plan refresh after upgrade failed — will retry on next send')
      })
    }

    const timer = window.setTimeout(() => setCheckoutBanner(null), 7000)
    return () => window.clearTimeout(timer)
  }, [searchParams, refreshUsage])

  const isLanguage = store.currentToolType === 'language'
  const isProgramming = store.currentToolType === 'programming'
  const isInterview = store.currentToolType === 'interview'

  const llMode = isLanguage
  /** For display in UI (German labels) */
  const nativeDisplay = LANG_DISPLAY[nativeLang] ?? nativeLang
  const targetDisplay = LANG_DISPLAY[targetLang] ?? targetLang
  /** For the backend API (English names, more reliable with Claude) */
  const nativeApiName = LANG_API[nativeLang] ?? nativeLang
  const targetApiName = LANG_API[targetLang] ?? targetLang
  const progMeta = PROGRAMMING_LANGUAGES.find(lang => lang.id === progLang)

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

    const timer = window.setTimeout(() => setShowContextModal(true), 500)
    return () => window.clearTimeout(timer)
  }, [
    activeContext,
    activeContextKey,
    activeContextTool,
    dismissedContextKeys,
    hasUserMessages,
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
    store.newSession(store.currentToolType)
  }

  const handleDeleteSession = (id: string) => {
    store.deleteSession(id)

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

  const handleClear = () => {
    if (!window.confirm('Alle Konversationen löschen?')) return
    store.clearHistory()
    setContextBySessionKey({})
    setDismissedContextKeys({})
    localStorage.removeItem(LS_CONTEXT)
    localStorage.removeItem(LS_CONTEXT_DISMISSED)
  }

  const handleSend = async (text: string, options?: HandleSendOptions) => {
    if (isAtLimit) {
      setShowLimitModal(true)
      return
    }

    const sessionId = store.activeSessionId ?? store.newSession(store.currentToolType)
    const sessionToolType = store.sessions[sessionId]?.toolType ?? store.currentToolType
    const displayText = options?.displayText ?? text
    const outgoingText = options?.apiMessageOverride ?? text

    setError(null)

    const effectiveContext = options?.contextOverride ?? activeContext
    const interviewSetup = toInterviewContext(effectiveContext)
    const jobAnalyzerSetup = toJobAnalyzerContext(effectiveContext)
    const interviewLangCode = interviewSetup.language === 'en' ? 'en' : 'de'
    const interviewLangName = interviewLangCode === 'de' ? 'German' : 'English'

    const apiMessage = isInterview
      ? buildInterviewPrompt(outgoingText, interviewLangName, interviewSetup)
      : (store.currentToolType === 'jobanalyzer'
        ? buildJobAnalyzerPrompt(outgoingText, jobAnalyzerSetup)
        : outgoingText)

    const streamingMsgId = crypto.randomUUID()
    flushSync(() => {
      if (!options?.skipUserBubble) {
        store.addMessage(sessionId, { text: displayText, isUser: true })
      }
      store.addMessage(sessionId, { id: streamingMsgId, text: '', isUser: false })
      store.setSessionStreaming(sessionId, true, streamingMsgId)
    })

    try {
      const token = await getToken()
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
    } catch (sendError) {
      store.deleteMessage(sessionId, streamingMsgId)
      if (sendError instanceof UsageLimitError) {
        // Before showing the modal, re-check the plan from the server.
        // If the backend returned 429 due to a stale "free" plan right after a Stripe
        // upgrade, the refresh (or Stripe sync) will unlock the correct plan so the user
        // can simply click Send again without seeing the modal.
        try {
          const latestPlan = await refreshUsage({ retries: 1, retryDelayMs: 1000 })
          if (latestPlan === 'premium' || latestPlan === 'pro') {
            return // timing artifact — plan now confirmed, don't block
          }
          // Usage endpoint still returns free — query Stripe directly to repair Redis
          const token = await getToken()
          if (token) {
            const syncResult = await syncPlanFromStripe(token, email)
            if (syncResult.plan === 'premium' || syncResult.plan === 'pro') {
              await refreshUsage({ retries: 1, retryDelayMs: 500 })
              return // Redis repaired — let user retry
            }
          }
        } catch { /* ignore — fall through to show modal */ }
        setShowLimitModal(true)
      } else {
        setError(sendError instanceof Error ? sendError.message : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.')
      }
    } finally {
      store.setSessionStreaming(sessionId, false)
    }
  }

  const activeId = store.activeSessionId
  /** Streaming is tracked in ChatSessionsProvider so it survives switching chats / routes. */
  const inputBlocked = store.isSessionStreaming(activeId)

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
  const activeModalInitialData = activeContext
    ? {
      cvText: activeContext.cvText,
      jobText: activeContext.jobText,
      jobTitle: activeContext.jobTitle,
      companyName: activeContext.companyName,
      programmingLanguage: activeContext.programmingLanguage,
      programmingLanguageId: activeContext.programmingLanguageId,
    }
    : undefined

  return (
    <div className="relative flex h-full overflow-hidden">
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
        {/* ── Mobile chat session bar (replaces floating chevron) ─── */}
        <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-100 bg-white px-3 py-2 md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors active:bg-slate-100"
            aria-label="Gespräche öffnen"
          >
            <PanelLeft size={17} />
          </button>
          <p className="min-w-0 flex-1 truncate text-sm text-slate-400">
            {(() => {
              const preview = store.activeMessages.find(m => m.isUser)?.text
              if (!preview) return 'Neues Gespräch'
              return preview.length > 38 ? `${preview.slice(0, 38)}…` : preview
            })()}
          </p>
          <button
            onClick={handleNewSession}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-colors active:bg-slate-100"
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

        {activeContextInfo && (
          <div className="context-indicator">
            <span>{activeContextInfo}</span>
            <button onClick={() => setShowContextModal(true)} className="context-edit-btn">
              Bearbeiten
            </button>
          </div>
        )}

        {isLanguage && (
          <div className="flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
                Lernen: {targetDisplay}
              </span>
            </div>
          </div>
        )}

        {isProgramming && (
          <div className="flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                Programmierung: {progMeta?.label ?? progLang}
              </span>
            </div>
          </div>
        )}

        {isInterview && (
          <div className="flex-shrink-0 px-4 pb-0 pt-3">
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
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-4">
              <MessageList
                messages={store.activeMessages}
                viewSessionId={activeId}
                streamingPlaceholder={store.streamingPlaceholder}
                toolType={store.currentToolType}
                targetLang={targetDisplay}
                nativeLang={nativeDisplay}
                targetLangCode={targetLang}
                progLang={progLang}
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

        <ChatInput
          toolType={store.currentToolType}
          isLoading={inputBlocked}
          onSend={handleSend}
        />
      </div>

      {showContextModal && store.activeSessionId && modalToolType && (
        <ContextModal
          toolType={modalToolType}
          sessionId={store.activeSessionId}
          initialData={activeModalInitialData}
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
    </div>
  )
}


