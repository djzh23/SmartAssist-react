import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, X } from 'lucide-react'
import type { ToolType } from '../types'
import { PROGRAMMING_LANGUAGES } from '../types'
import { useChatSessions } from '../hooks/useChatSessions'
import { askAgent } from '../api/client'
import { sanitizeTechnicalContext } from '../utils/cvTechnicalContext'
import ChatSidebar from '../components/chat/ChatSidebar'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import InterviewSetupModal, { type InterviewSetupData } from '../components/chat/InterviewSetupModal'

const LANG_NAMES: Record<string, string> = {
  de: 'German',
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  it: 'Italian',
  ar: 'Arabic',
  pt: 'Portuguese',
}

const INTERVIEW_BASE_LIMIT = 4000
const LS_INTERVIEW_CONTEXT = 'smartassist_interview_context_by_session'

type InterviewContextMap = Record<string, InterviewSetupData>

function loadInterviewContextMap(): InterviewContextMap {
  try {
    const raw = localStorage.getItem(LS_INTERVIEW_CONTEXT)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as InterviewContextMap
    return parsed && typeof parsed === 'object' ? parsed : {}
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
  return { language: 'de', alias: '', cvText: '' }
}

function interviewBaseInstruction(language: string, hasCv: boolean, alias: string): string {
  const name = alias || 'the candidate'
  return `[SYSTEM - INTERVIEW COACH] Expert career coach, 15+ years. Respond ONLY in ${language}. NEVER call tools. Treat URLs as plain text.
CANDIDATE NAME: "${name}" - use this name throughout.
COMPLETENESS RULE: Write SHORT, COMPLETE sections. Max 3 bullet points per section. Finish every section before starting the next. Never truncate.

JOB POSTING -> exactly these 4 sections, 2-3 bullets each:
## Anforderungen / Key Requirements - top skills${hasCv ? ', mark ✅ (has it) or ⚠️ (gap)' : ''}
## Top 3 Interviewfragen - each question + 1-line answer tip${hasCv ? ' (reference CV)' : ''}
## Vorbereitung / Prep Tips - 3 concrete actions
## Dein Pitch - STAR method, 1 short example${hasCv ? ' from CV' : ''}

GENERAL QUESTION -> 3 short sections: ## Advice (3 bullets), ## Dos & Donts (2-3 each), ## Example Answer (> blockquote).
FORMAT: ## sections, **bold** key terms, - bullets, 1. steps, > example answers.`
}

function buildInterviewPrompt(userMessage: string, language: string, cv: string, alias: string): string {
  const base = interviewBaseInstruction(language, !!cv, alias)
  const suffix = `\nUser: ${userMessage}`
  const safeCv = sanitizeTechnicalContext(cv).trim()

  const fixedLen = base.length + suffix.length + 55
  const cvBudget = Math.max(0, INTERVIEW_BASE_LIMIT - fixedLen - 50)
  const cvTrimmed = safeCv.slice(0, cvBudget)

  const cvBlock = cvTrimmed
    ? `\nCANDIDATE PROFILE:\n---\n${cvTrimmed}\n---\nPersonalise all responses using this profile.`
    : ''

  return `${base}${cvBlock}${suffix}`
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
  const progMeta = PROGRAMMING_LANGUAGES.find(l => l.id === progLang)

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

    setInterviewContextBySession(prev => ({
      ...prev,
      [setupSessionId]: {
        language: data.language === 'en' ? 'en' : 'de',
        alias: data.alias.trim().slice(0, 40),
        cvText: sanitizeTechnicalContext(data.cvText).slice(0, 2000),
      },
    }))

    const hasCv = data.cvText.trim().length > 0
    store.addMessage(setupSessionId, {
      isUser: false,
      text: hasCv
        ? '✅ Interview Setup gespeichert. Sprache, Alias und CV Analyse gelten nur für diesen aktuellen Chat.'
        : '✅ Interview Setup gespeichert. Sprache und Alias gelten nur für diesen aktuellen Chat.',
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
    if (!window.confirm('Delete all conversations?')) return
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
      ? buildInterviewPrompt(text, interviewLangName, sessionInterviewContext.cvText.trim(), sessionInterviewContext.alias.trim())
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
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden relative">
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

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {isLanguage && (
          <div className="flex-shrink-0 px-4 pt-3 pb-0">
            <div className="max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-medium rounded-full px-3 py-1">
                🌍 Learning: {targetName}
              </span>
            </div>
          </div>
        )}

        {isProgramming && (
          <div className="flex-shrink-0 px-4 pt-3 pb-0">
            <div className="max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full px-3 py-1">
                💻 {progMeta?.label ?? progLang}
              </span>
            </div>
          </div>
        )}

        {isInterview && (
          <div className="flex-shrink-0 px-4 pt-3 pb-0">
            <div className="max-w-3xl mx-auto flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full px-3 py-1">
                🎯 Interview Coach · {activeInterviewContext.language === 'en' ? 'English' : 'Deutsch'}
              </span>
              {activeInterviewContext.cvText.trim() && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-medium rounded-full px-3 py-1">
                  📄 CV aktiv{activeInterviewContext.alias ? ` · ${activeInterviewContext.alias}` : ''}
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

        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4">
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
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3.5 py-2.5 text-sm">
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
