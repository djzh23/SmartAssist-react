import { useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle2, MessageCircle, RefreshCw, X } from 'lucide-react'
import type { ToolType } from '../types'
import { PROGRAMMING_LANGUAGES } from '../types'
import { sanitizeTechnicalContext } from '../utils/cvTechnicalContext'
import { UsageLimitError, askAgentStream, linkJobApplicationSession } from '../api/client'
import { syncPlanFromStripe } from '../services/StripeService'
import ChatInput from '../components/chat/ChatInput'
import ChatContextBar from '../components/chat/ChatContextBar'
import ChatSidebar from '../components/chat/ChatSidebar'
import ContextModal, { type ContextModalToolType, type ContextPayload } from '../components/chat/ContextModal'
import MessageList from '../components/chat/MessageList'
import { ThinkingIndicator, shouldSkipThinkingUi } from '../components/chat/ThinkingIndicator'
import ChatAnswerReadyBanner from '../components/chat/ChatAnswerReadyBanner'
import ChatSwitcherStrip from '../components/chat/ChatSwitcherStrip'
import OnboardingPromptModal, { ONBOARDING_CHAT_PROMPT_DISMISS_KEY } from '../components/chat/OnboardingPromptModal'
import UsageLimitModal from '../components/ui/UsageLimitModal'
import { useAppUi } from '../context/AppUiContext'
import { useLayoutChrome } from '../context/LayoutChromeContext'
import { useChatSessions } from '../hooks/useChatSessions'
import { useCareerProfile } from '../hooks/useCareerProfile'
import { useBreakpoint } from '../hooks/useBreakpoint'
import { useUserPlan, dispatchServerUsage } from '../hooks/useUserPlan'
import { useChatStreaming } from '../hooks/useChatStreaming'
import { applyStreamText } from '../chat/streamTextBridge'
import { buildProfileStatsLine, getProfileCompleteness, getProfileCompletenessGapHint } from '../utils/profileCompleteness'
import { sessionListLabel } from '../utils/sessionTitle'
import { CHAT_FEATURE_ACTIVE_BG_ALPHA, getChatFeatureColor, hexToRgba } from '../utils/chatFeatureColors'
import {
  LS_CONTEXT,
  LS_CONTEXT_DISMISSED,
  LS_KONTEXT_HINT_DISMISSED,
  type SessionContextData,
  type SessionContextMap,
  type DismissedContextMap,
  asContextTool,
  contextKey,
  normalizeContext,
  loadContextMap,
  saveContextMap,
  loadDismissedContextMap,
  saveDismissedContextMap,
  readActiveContextInfoVisible,
  writeActiveContextInfoVisible,
} from '../utils/chatContextStorage'
import {
  toInterviewContext,
  toJobAnalyzerContext,
  sessionHasCareerSetupForStructuredApi,
  buildCareerToolSetupForApi,
  buildInterviewPrompt,
  buildJobAnalyzerPrompt,
  JOB_ANALYZER_PROMPT_LIMIT,
} from '../utils/chatPromptBuilders'

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

interface HandleSendOptions {
  displayText?: string
  apiMessageOverride?: string
  skipUserBubble?: boolean
  contextOverride?: SessionContextData | null
}

function isAbortError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false
  const name = 'name' in error ? String((error as { name?: unknown }).name ?? '') : ''
  return name === 'AbortError'
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


export default function ChatPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const rawToolParam = (searchParams.get('tool') ?? 'general').toLowerCase()
  const toolParam = normalizeToolParam(rawToolParam)
  const modalToolType = modalToolTypeFromParam(rawToolParam, toolParam)

  const store = useChatSessions()
  const bp = useBreakpoint()
  const isDesktopBp = bp === 'desktop'
  const { desktopChatHistoryOpen, setDesktopChatHistoryOpen } = useLayoutChrome()
  const { requestConfirm } = useAppUi()
  const applicationSeedKey = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const desktopHistoryOpenRef = useRef(desktopChatHistoryOpen)
  desktopHistoryOpenRef.current = desktopChatHistoryOpen
  const [showContextModal, setShowContextModal] = useState(false)
  const [showMobileDetailsModal, setShowMobileDetailsModal] = useState(false)
  const [showActiveContextInfo, setShowActiveContextInfo] = useState(readActiveContextInfoVisible)
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

  const {
    deliberate,
    thinkingSession,
    setThinkingSession,
    stopStreaming,
    handleThinkingComplete,
    streamCtxRef,
    streamAbortRef,
    streamResultRef,
  } = useChatStreaming(store, incrementUsage)

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
  }, [toolParam, location.state, store.switchToTool, store.newSession, store.setActiveSession, navigate, getToken, updateToggles])

  // Narrow to the specific session entry so this effect only re-runs when the
  // target session appears or changes, not on every stream token (finding #28).
  const activateSessionId = (location.state as { activateSessionId?: string } | null)?.activateSessionId
  const activateTargetSession = activateSessionId ? store.sessions[activateSessionId] : undefined

  /** Deep-link from app sidebar “Letzte Gespräche” (switchToTool alone picks first tab per tool). */
  useEffect(() => {
    if (!activateSessionId) return
    if (!activateTargetSession) return
    if (activateTargetSession.toolType !== toolParam) {
      navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
      return
    }
    store.setActiveSession(activateSessionId)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [activateSessionId, activateTargetSession, location.pathname, location.search, toolParam, navigate, store.setActiveSession])

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
  const mobileSessionDisplayLabel =
    mobileSessionLabel.trim().toLowerCase() === 'neues gespräch'
      ? ''
      : mobileSessionLabel
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

  useEffect(() => {
    if (!isDesktopBp)
      setDesktopChatHistoryOpen(false)
  }, [isDesktopBp, setDesktopChatHistoryOpen])

  useEffect(() => {
    if (!isDesktopBp || location.pathname !== '/chat')
      return

    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (el?.closest('input, textarea, select, [contenteditable="true"]'))
        return

      if (e.key === 'Escape') {
        if (desktopHistoryOpenRef.current) {
          e.preventDefault()
          setDesktopChatHistoryOpen(false)
        }
        return
      }

      if (!e.altKey || e.repeat || e.ctrlKey || e.metaKey)
        return

      if (e.code === 'KeyN') {
        e.preventDefault()
        void store.newSession(store.currentToolType)
        return
      }

      const digitMap: Record<string, string> = {
        Digit1: '/chat',
        Digit2: '/chat?tool=jobanalyzer',
        Digit3: '/chat?tool=interviewprep',
        Digit4: '/chat?tool=cover_letter',
        Digit5: '/chat?tool=salary_coach',
      }
      const path = digitMap[e.code]
      if (!path)
        return
      e.preventDefault()
      navigate(path)
      setDesktopChatHistoryOpen(true)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isDesktopBp, location.pathname, navigate, setDesktopChatHistoryOpen, store])

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

    const skipThinkingUi =
      shouldSkipThinkingUi(outgoingText, sessionToolType)
      || (typeof document !== 'undefined' && document.visibilityState === 'hidden')
    let usedDeliberatePath = false

    try {
      const token = await getToken()
      const abortController = new AbortController()
      streamAbortRef.current = abortController

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
          abortController.signal,
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
          abortController.signal,
        )

        streamResultRef.current = {
          toolUsed: toolUsed || '',
          serverUsageToday,
        }
        deliberate.markNetworkComplete()
      }
    } catch (sendError) {
      if (isAbortError(sendError)) {
        if (usedDeliberatePath) {
          deliberate.reset()
          setThinkingSession(null)
          streamCtxRef.current = null
          streamResultRef.current = null
        }
        const currentText = (store.sessions[sessionId]?.messages ?? []).find(m => m.id === streamingMsgId)?.text ?? ''
        if (!currentText.trim()) {
          store.deleteMessage(sessionId, streamingMsgId)
        } else {
          store.finalizeMessage(sessionId, streamingMsgId, {})
        }
        store.setSessionStreaming(sessionId, false)
        return
      }
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
      streamAbortRef.current = null
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
  const featureColor = getChatFeatureColor(store.currentToolType)
  const featureLabel: Record<ToolType, string> = {
    general: 'Karriere-Chat',
    jobanalyzer: 'Stellenanalyse',
    interview: 'Interview Coach',
    programming: 'Code-Assistent',
    language: 'Sprachtraining',
  }
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
        layout={isDesktopBp ? 'desktop-inline' : 'standard'}
        desktopExpanded={isDesktopBp && desktopChatHistoryOpen}
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
              <button
                type="button"
                onClick={() => store.dismissSessionsStaleHint()}
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-amber-200/90 hover:bg-amber-500/15"
              >
                Ausblenden
              </button>
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
          <button
            type="button"
            onClick={() => setShowMobileDetailsModal(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 text-[10px] font-medium text-amber-200 transition hover:bg-amber-500/15"
          >
            Details
          </button>
          {/* Session toggle - tap to open sessions panel */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
            aria-label="Gespräche öffnen"
          >
            {mobileSessionDisplayLabel ? (
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-stone-300">
                {mobileSessionDisplayLabel}
              </span>
            ) : (
              <span className="min-w-0 flex-1" aria-hidden />
            )}
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
          </button>

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-[10px] font-medium text-stone-300 transition-colors hover:bg-white/8 active:bg-white/15"
            aria-label="Chat-Liste öffnen"
          >
            <MessageCircle size={13} className="shrink-0" />
            Chats
          </button>
        </div>

        <ChatSwitcherStrip />

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
          <div className="hidden flex-shrink-0 px-3 pb-0 pt-1.5 min-[769px]:block min-[769px]:px-4 min-[769px]:pt-2">
            <div className="mx-auto max-w-3xl">
              <button
                type="button"
                onClick={() => {
                  setShowActiveContextInfo(prev => {
                    const next = !prev
                    writeActiveContextInfoVisible(next)
                    return next
                  })
                }}
                className="inline-flex items-center gap-1 rounded-full border border-stone-600/45 bg-app-raised/80 px-2.5 py-1 text-[10px] font-medium text-stone-300 transition-colors hover:bg-white/8"
              >
                {showActiveContextInfo ? <ChevronUp size={13} aria-hidden /> : <ChevronDown size={13} aria-hidden />}
                {showActiveContextInfo ? 'Stellendetails ausblenden' : 'Stellendetails anzeigen'}
              </button>
              {showActiveContextInfo && (
                <div className="mt-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-100">
                  {activeContextInfo}
                </div>
              )}
            </div>
          </div>
        )}

        {isLanguage && (
          <div className="hidden min-[769px]:block flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/40 bg-amber-950/35 px-3 py-1 text-xs font-medium text-amber-100/95">
                Lernen: {targetDisplay}
              </span>
            </div>
          </div>
        )}

        {isProgramming && (
          <div className="hidden min-[769px]:block flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto max-w-3xl">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-600/45 bg-stone-900/55 px-3 py-1 text-xs font-medium text-stone-200">
                Programmierung: {progMeta?.label ?? progLang}
              </span>
            </div>
          </div>
        )}

        {isInterview && (
          <div className="hidden min-[769px]:flex flex-shrink-0 px-4 pb-0 pt-3">
            <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-600/45 bg-stone-900/55 px-3 py-1 text-xs font-medium text-stone-200">
                Vorstellungsgespräch
              </span>

              {activeContext?.hasCv && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-800/35 bg-amber-950/35 px-3 py-1 text-xs font-medium text-amber-100/95">
                  Lebenslauf Kontext aktiv
                </span>
              )}

              <button
                onClick={() => setShowContextModal(true)}
                className="text-xs text-amber-400/95 hover:text-amber-300 hover:underline"
              >
                Setup öffnen
              </button>
            </div>
          </div>
        )}

        <ChatAnswerReadyBanner />

        <div className="hidden min-[769px]:block flex-shrink-0 px-4 pb-0 pt-2">
          <div className="mx-auto flex max-w-3xl items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: featureColor }} />
            <span className="font-semibold" style={{ color: hexToRgba(featureColor, 0.95) }}>
              {featureLabel[store.currentToolType]}
            </span>
            {store.activeSessionId && (
              <span
                className="rounded-full border px-2 py-0.5 text-[10px]"
                style={{
                  borderColor: hexToRgba(featureColor, 0.45),
                  backgroundColor: hexToRgba(featureColor, CHAT_FEATURE_ACTIVE_BG_ALPHA),
                  color: featureColor,
                }}
              >
                Aktiv
              </span>
            )}
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl px-2.5 py-2 pb-44 min-[391px]:px-3 min-[391px]:py-2.5 min-[391px]:pb-44 min-[769px]:py-4 min-[769px]:pb-4 desktop:px-4">
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
          <div
            className={[
              'hidden flex-shrink-0 border-b border-stone-700/35 bg-app-muted/80 px-3 py-1.5 backdrop-blur-sm min-[769px]:block min-[769px]:px-4 min-[769px]:py-2',
            ].join(' ')}
          >
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
          onStop={stopStreaming}
        />

        {showMobileDetailsModal && (
          <div className="fixed inset-0 z-[95] flex items-end justify-center min-[769px]:hidden" role="dialog" aria-modal="true" aria-label="Details und Profil-Kontext">
            <button
              type="button"
              className="absolute inset-0 bg-black/55"
              onClick={() => setShowMobileDetailsModal(false)}
              aria-label="Details schließen"
            />
            <div className="relative z-10 flex max-h-[72vh] w-full flex-col overflow-hidden rounded-t-2xl border border-white/10 bg-[#17110c] shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2.5">
                <h3 className="text-sm font-semibold text-stone-100">Details & Profil-Kontext</h3>
                <button
                  type="button"
                  onClick={() => setShowMobileDetailsModal(false)}
                  className="rounded-full px-2 py-1 text-xs font-medium text-stone-300 hover:bg-white/10"
                >
                  Schließen
                </button>
              </div>
              <div className="space-y-2 overflow-y-auto px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
                {activeContextInfo ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowActiveContextInfo(prev => {
                        const next = !prev
                        writeActiveContextInfoVisible(next)
                        return next
                      })
                    }}
                    className="w-full rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-left text-xs font-medium text-amber-100"
                  >
                    {showActiveContextInfo ? activeContextInfo : 'Stellendetails anzeigen'}
                  </button>
                ) : null}

                {store.currentToolType !== 'language' && store.currentToolType !== 'general' && (
                  <div className="px-0.5 py-1">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-stone-400">
                      Profil-Kontext
                    </p>
                    <ChatContextBar
                      compact
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

                <button
                  type="button"
                  onClick={() => {
                    setShowMobileDetailsModal(false)
                    setShowContextModal(true)
                  }}
                  className="w-full rounded-lg border border-amber-500/25 bg-amber-500/12 px-3 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-500/18"
                >
                  Bearbeiten
                </button>
              </div>
            </div>
          </div>
        )}
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


