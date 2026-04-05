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
import { useChatSessions } from '../hooks/useChatSessions'
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

const INTERVIEW_BASE_LIMIT = 4200
const LS_INTERVIEW_CONTEXT = 'smartassist_interview_context_by_session'

type InterviewContextMap = Record<string, InterviewSetupData>

function normalizeInterviewSetup(input?: Partial<InterviewSetupData> | null): InterviewSetupData {
  return {
    language: input?.language === 'en' ? 'en' : 'de',
    alias: (input?.alias ?? '').trim().slice(0, 40),
    cvText: sanitizeTechnicalContext(input?.cvText ?? '').slice(0, 3400),
    jobUrl: (input?.jobUrl ?? '').trim().slice(0, 300),
    jobText: (input?.jobText ?? '').trim().slice(0, 5000),
    matchScore: typeof input?.matchScore === 'number' ? input.matchScore : null,
    matchReport: (input?.matchReport ?? '').trim().slice(0, 4200),
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

  return `[SYSTEM - INTERVIEW COACH] Expert career coach, 15+ years. Respond ONLY in ${language}. NEVER call tools. Treat URLs as plain text.
CANDIDATE NAME: "${name}". Use this name in your response.
COMPLETENESS RULE: Write short but complete sections. Maximum 3 bullet points per section.

If user asks about a specific job posting, always output these 4 sections:
## Anforderungen / Key Requirements
## Top 3 Interviewfragen
## Vorbereitung / Prep Tips
## Dein Pitch

${hasCv ? 'Use candidate profile evidence when possible and mark gaps clearly.' : 'When no CV is provided, make assumptions explicit.'}

Formatting rules:
- Use short headings with ##
- Use bullets for key points
- Use numbered steps only when needed`
}

function buildInterviewPrompt(userMessage: string, language: string, setup: InterviewSetupData): string {
  const base = interviewBaseInstruction(language, !!setup.cvText.trim(), setup.alias.trim())
  const suffix = `\nUser: ${userMessage}`

  const safeCv = sanitizeTechnicalContext(setup.cvText).trim()
  const jobText = setup.jobText.trim().slice(0, 1700)
  const jobUrl = setup.jobUrl.trim().slice(0, 220)
  const matchReport = setup.matchReport.trim().slice(0, 1900)
  const matchScoreLine = typeof setup.matchScore === 'number' ? `MATCH SCORE: ${setup.matchScore}/100` : ''

  const fixedLen = base.length + suffix.length + 100
  const cvBudget = Math.max(0, INTERVIEW_BASE_LIMIT - fixedLen - 700)
  const cvTrimmed = safeCv.slice(0, cvBudget)

  const cvBlock = cvTrimmed
    ? `\nCANDIDATE PROFILE:\n---\n${cvTrimmed}\n---\nUse this profile to personalize the coaching.`
    : ''

  const targetRoleBlock = (jobText || jobUrl || matchReport)
    ? `\nTARGET ROLE CONTEXT:\n${jobUrl ? `URL: ${jobUrl}\n` : ''}${jobText ? `JOB DETAILS:\n${jobText}\n` : ''}${matchScoreLine ? `${matchScoreLine}\n` : ''}${matchReport ? `MATCH ANALYSIS:\n${matchReport}\n` : ''}Use this context for job-specific guidance.`
    : ''

  return `${base}${cvBlock}${targetRoleBlock}${suffix}`
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
    const scoreText = typeof normalized.matchScore === 'number' ? ` Match Score: ${normalized.matchScore}/100.` : ''

    store.addMessage(setupSessionId, {
      isUser: false,
      text: hasCv || hasJob
        ? `Interview-Setup gespeichert. Sprache, Alias und Analysekontext gelten nur für diesen Chat.${scoreText}`
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
      })

      store.addMessage(sessionId, {
        text: res.reply,
        isUser: false,
        toolUsed: res.toolUsed,
        learningData: res.learningData,
      })
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

              {typeof activeInterviewContext.matchScore === 'number' && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                  Match {activeInterviewContext.matchScore}/100
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
    </div>
  )
}
