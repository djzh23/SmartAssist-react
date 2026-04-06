import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import type { ToolType } from '../types'
import { PROGRAMMING_LANGUAGES } from '../types'
import { askAgent } from '../api/client'
import ChatInput from '../components/chat/ChatInput'
import ChatSidebar from '../components/chat/ChatSidebar'
import InterviewSetupModal, { type InterviewSetupData } from '../components/chat/InterviewSetupModal'
import MessageList from '../components/chat/MessageList'
import UsageLimitModal from '../components/ui/UsageLimitModal'
import { useChatSessions } from '../hooks/useChatSessions'
import { useUserPlan } from '../hooks/useUserPlan'
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
const LS_INTERVIEW_CONTEXT = 'smartassist_interview_context_by_session'

type InterviewContextMap = Record<string, InterviewSetupData>

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


function normalizeInterviewSetup(input?: Partial<InterviewSetupData> | null): InterviewSetupData {
  return {
    language: input?.language === 'en' ? 'en' : 'de',
    alias: (input?.alias ?? '').trim().slice(0, 40),
    cvText: sanitizeTechnicalContext(input?.cvText ?? '').slice(0, 2200),
    jobUrl: (input?.jobUrl ?? '').trim().slice(0, 300),
    jobText: compactLines((input?.jobText ?? '').trim(), 14, 1700),
  }
}

function loadInterviewContextMap(): InterviewContextMap {
  try {
    const raw = localStorage.getItem(LS_INTERVIEW_CONTEXT)
    if (!raw) return {}

    const parsed = JSON.parse(raw) as Record<string, Partial<InterviewSetupData>>
    if (!parsed || typeof parsed !== 'object') return {}

    const next: InterviewContextMap = {}
    for (const [sessionId, value] of Object.entries(parsed)) {
      next[sessionId] = normalizeInterviewSetup(value)
    }

    return next
  } catch {
    return {}
  }
}

function saveInterviewContextMap(value: InterviewContextMap): void {
  try {
    localStorage.setItem(LS_INTERVIEW_CONTEXT, JSON.stringify(value))
  } catch {
    // ignore storage errors
  }
}

function defaultInterviewSetup(): InterviewSetupData {
  return normalizeInterviewSetup({})
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

function buildInterviewPrompt(userMessage: string, language: string, setup: InterviewSetupData): string {
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
  const toolParam = (searchParams.get('tool') ?? 'general') as ToolType

  const store = useChatSessions()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [nativeLang, setNativeLang] = useState('de')
  const [targetLang, setTargetLang] = useState('es')
  const [progLang, setProgLang] = useState('csharp')

  const [interviewContextBySession, setInterviewContextBySession] = useState<InterviewContextMap>(() => loadInterviewContextMap())
  const [setupOpen, setSetupOpen] = useState(false)
  const [setupSessionId, setSetupSessionId] = useState<string | null>(null)
  const [setupInitialData, setSetupInitialData] = useState<InterviewSetupData>(defaultInterviewSetup())
  const [showLimitModal, setShowLimitModal] = useState(false)

  const { isAtLimit, incrementUsage, isSignedIn, getToken } = useUserPlan()

  useEffect(() => {
    saveInterviewContextMap(interviewContextBySession)
  }, [interviewContextBySession])

  useEffect(() => {
    store.switchToTool(toolParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolParam])

  const isLanguage = store.currentToolType === 'language'
  const isProgramming = store.currentToolType === 'programming'
  const isInterview = store.currentToolType === 'interview'

  const llMode = isLanguage
  const nativeName = LANG_NAMES[nativeLang] ?? nativeLang
  const targetName = LANG_NAMES[targetLang] ?? targetLang
  const progMeta = PROGRAMMING_LANGUAGES.find(lang => lang.id === progLang)

  const activeInterviewContext =
    isInterview && store.activeSessionId
      ? interviewContextBySession[store.activeSessionId] ?? defaultInterviewSetup()
      : defaultInterviewSetup()

  const openInterviewSetup = (sessionId: string) => {
    const setup = interviewContextBySession[sessionId] ?? defaultInterviewSetup()
    setSetupSessionId(sessionId)
    setSetupInitialData(setup)
    setSetupOpen(true)
  }

  const handleSaveInterviewSetup = (data: InterviewSetupData) => {
    if (!setupSessionId) return

    const normalized = normalizeInterviewSetup(data)

    setInterviewContextBySession(prev => ({
      ...prev,
      [setupSessionId]: normalized,
    }))

    const hasCv = normalized.cvText.trim().length > 0
    const hasJob = normalized.jobText.trim().length > 0 || normalized.jobUrl.trim().length > 0

    store.addMessage(setupSessionId, {
      isUser: false,
      text: hasCv || hasJob
        ? `Interview-Setup gespeichert.\nStarte direkt mit: "Was soll ich für mein Profil verbessern?" oder "Gib mir die Top 3 Interviewfragen für diese Stelle."`
        : 'Interview-Setup gespeichert. Sprache und Alias gelten nur für diesen Chat.',
    })

    setSetupOpen(false)
    setSetupSessionId(null)
  }

  const handleNewSession = () => {
    const newId = store.newSession(store.currentToolType)
    if (store.currentToolType === 'interview') {
      openInterviewSetup(newId)
    }
  }

  const handleDeleteSession = (id: string) => {
    store.deleteSession(id)
    setInterviewContextBySession(prev => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const handleClear = () => {
    if (!window.confirm('Alle Konversationen löschen?')) return
    store.clearHistory()
    setInterviewContextBySession({})
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

    const sessionInterviewContext = interviewContextBySession[sessionId] ?? defaultInterviewSetup()
    const interviewLangCode = sessionInterviewContext.language === 'en' ? 'en' : 'de'
    const interviewLangName = interviewLangCode === 'de' ? 'German' : 'English'

    const apiMessage = isInterview
      ? buildInterviewPrompt(text, interviewLangName, sessionInterviewContext)
      : text

    try {
      const token = await getToken()
      const res = await askAgent({
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
      }, token ?? undefined)

      store.addMessage(sessionId, {
        text: res.reply,
        isUser: false,
        toolUsed: res.toolUsed,
        learningData: res.learningData,
      })
      incrementUsage()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Etwas ist schiefgelaufen.')
    } finally {
      setIsLoading(false)
    }
  }

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
                Interview Coach | {activeInterviewContext.language === 'en' ? 'English' : 'Deutsch'}
              </span>

              {activeInterviewContext.cvText.trim() && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  CV aktiv{activeInterviewContext.alias ? ` | ${activeInterviewContext.alias}` : ''}
                </span>
              )}

              {store.activeSessionId && (
                <button
                  onClick={() => openInterviewSetup(store.activeSessionId!)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Setup öffnen
                </button>
              )}
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

      <InterviewSetupModal
        isOpen={setupOpen}
        sessionId={setupSessionId}
        initialData={setupInitialData}
        onClose={() => {
          setSetupOpen(false)
          setSetupSessionId(null)
        }}
        onSave={handleSaveInterviewSetup}
      />

      <UsageLimitModal
        isOpen={showLimitModal}
        isLoggedIn={isSignedIn}
        onClose={() => setShowLimitModal(false)}
      />
    </div>
  )
}
