import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import type { ToolType } from '../types'
import { PROGRAMMING_LANGUAGES } from '../types'
import { UsageLimitError, askAgentStream } from '../api/client'
import ChatInput from '../components/chat/ChatInput'
import ChatSidebar from '../components/chat/ChatSidebar'
import ContextModal, { type ContextModalToolType, type ContextPayload } from '../components/chat/ContextModal'
import MessageList from '../components/chat/MessageList'
import UsageLimitModal from '../components/ui/UsageLimitModal'
import { useChatSessions } from '../hooks/useChatSessions'
import { useUserPlan, dispatchServerUsage } from '../hooks/useUserPlan'
import { sanitizeTechnicalContext } from '../utils/cvTechnicalContext'

const LANG_NAMES: Record<string, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ar: 'Arabic',
  pt: 'Portuguese',
}

const INTERVIEW_PROMPT_LIMIT = 3900
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

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const rawToolParam = (searchParams.get('tool') ?? 'general').toLowerCase()
  const toolParam = normalizeToolParam(rawToolParam)
  const modalToolType = modalToolTypeFromParam(rawToolParam, toolParam)

  const store = useChatSessions()
  const [isLoading, setIsLoading] = useState(false)
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

  const { isAtLimit, incrementUsage, isSignedIn, email, getToken } = useUserPlan()

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
        ? { type: 'success', text: 'Upgrade successful. Your plan has been updated.' }
        : { type: 'info', text: 'Checkout was cancelled.' },
    )

    const timer = window.setTimeout(() => setCheckoutBanner(null), 7000)
    return () => window.clearTimeout(timer)
  }, [searchParams])

  const isLanguage = store.currentToolType === 'language'
  const isProgramming = store.currentToolType === 'programming'
  const isInterview = store.currentToolType === 'interview'

  const llMode = isLanguage
  const nativeName = LANG_NAMES[nativeLang] ?? nativeLang
  const targetName = LANG_NAMES[targetLang] ?? targetLang
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
      void handleSend(`Please analyze this job posting:\n\n${normalized.jobText}`)
      return
    }

    if (activeContextTool === 'interview') {
      const intro = normalized.jobTitle
        ? `I am preparing for an interview for: ${normalized.jobTitle}${normalized.companyName ? ` at ${normalized.companyName}` : ''}. Please start the interview preparation.`
        : 'Please start an interview preparation session and ask me targeted questions.'
      void handleSend(intro)
      return
    }

    if (activeContextTool === 'programming' && normalized.programmingLanguage) {
      if (normalized.programmingLanguageId) {
        setProgLang(normalized.programmingLanguageId)
      }
      void handleSend(`I am working with ${normalized.programmingLanguage}. I am ready to get help with my code.`)
      return
    }

    if (activeContextTool === 'programming' && normalized.programmingLanguageId) {
      const mapped = PROGRAMMING_LANGUAGES.find(lang => lang.id === normalized.programmingLanguageId)?.label ?? normalized.programmingLanguageId
      setProgLang(normalized.programmingLanguageId)
      void handleSend(`I am working with ${mapped}. I am ready to get help with my code.`)
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

  const handleSend = async (text: string) => {
    if (isAtLimit) {
      setShowLimitModal(true)
      return
    }

    const sessionId = store.activeSessionId ?? store.newSession(store.currentToolType)

    store.addMessage(sessionId, { text, isUser: true })
    setIsLoading(true)
    setError(null)

    const interviewSetup = toInterviewContext(activeContext)
    const interviewLangCode = interviewSetup.language === 'en' ? 'en' : 'de'
    const interviewLangName = interviewLangCode === 'de' ? 'German' : 'English'

    const apiMessage = isInterview
      ? buildInterviewPrompt(text, interviewLangName, interviewSetup)
      : text

    const streamingMsgId = crypto.randomUUID()
    store.addMessage(sessionId, { id: streamingMsgId, text: '', isUser: false })

    try {
      const token = await getToken()
      let accumulated = ''

      const { toolUsed, serverUsageToday } = await askAgentStream(
        {
          message: apiMessage,
          sessionId,
          languageLearningMode: llMode,
          targetLanguage: llMode ? targetName : undefined,
          nativeLanguage: llMode ? nativeName : undefined,
          targetLanguageCode: llMode ? targetLang : undefined,
          nativeLanguageCode: llMode ? nativeLang : undefined,
          level: llMode ? 'A1' : undefined,
          learningGoal: llMode ? 'speaking basics, verbs, sentence structure' : undefined,
          programmingMode: isProgramming ? true : undefined,
          programmingLanguage: isProgramming ? progMeta?.label : undefined,
          interviewMode: isInterview ? true : undefined,
          interviewLanguage: isInterview ? (interviewLangCode === 'de' ? 'German' : 'English') : undefined,
        },
        token,
        (chunk) => {
          accumulated += chunk
          store.updateMessageText(sessionId, streamingMsgId, accumulated)
        },
      )

      store.finalizeMessage(sessionId, streamingMsgId, { toolUsed: toolUsed || undefined })

      if (typeof serverUsageToday === 'number') {
        dispatchServerUsage(serverUsageToday)
      } else {
        incrementUsage()
      }
    } catch (sendError) {
      store.deleteMessage(sessionId, streamingMsgId)
      if (sendError instanceof UsageLimitError) {
        setShowLimitModal(true)
      } else {
        setError(sendError instanceof Error ? sendError.message : 'Etwas ist schiefgelaufen.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const programmingContextLabel = activeContext?.programmingLanguage
    || (activeContext?.programmingLanguageId
      ? PROGRAMMING_LANGUAGES.find(lang => lang.id === activeContext.programmingLanguageId)?.label ?? activeContext.programmingLanguageId
      : '')

  const contextInfo = {
    jobanalyzer: activeContext?.toolType === 'jobanalyzer' && activeContext.hasJob
      ? `JOB: ${activeContext.jobTitle || 'Job context active'}${activeContext.companyName ? ` at ${activeContext.companyName}` : ''}`
      : null,
    interview: activeContext?.toolType === 'interview' && activeContext.hasJob
      ? `INTERVIEW: ${activeContext.jobTitle || 'Target role'}${activeContext.companyName ? ` at ${activeContext.companyName}` : ''}`
      : null,
    programming: activeContext?.toolType === 'programming' && programmingContextLabel
      ? `CODE: ${programmingContextLabel}`
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
              Edit ??
            </button>
          </div>
        )}

        {isLanguage && (
          <div className="flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
                Lernen: {targetName}
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
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
                Interview Coach
              </span>

              {activeContext?.hasCv && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  CV context active
                </span>
              )}

              <button
                onClick={() => setShowContextModal(true)}
                className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Setup öffnen
              </button>
            </div>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-4">
              <MessageList
                messages={store.activeMessages}
                isLoading={isLoading}
                toolType={store.currentToolType}
                targetLang={targetName}
                nativeLang={nativeName}
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
          isLoading={isLoading}
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

