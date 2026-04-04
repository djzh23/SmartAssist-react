import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { ToolType } from '../types'
import { useChatSessions } from '../hooks/useChatSessions'
import { askAgent } from '../api/client'
import ChatSidebar from '../components/chat/ChatSidebar'
import MessageList from '../components/chat/MessageList'
import ChatInput from '../components/chat/ChatInput'
import { AlertCircle, X } from 'lucide-react'

const LANG_NAMES: Record<string, string> = {
  de: 'German', en: 'English', es: 'Spanish',
  fr: 'French',  it: 'Italian', ar: 'Arabic', pt: 'Portuguese',
}

export default function ChatPage() {
  const [searchParams] = useSearchParams()
  const toolParam = (searchParams.get('tool') ?? 'general') as ToolType

  const store = useChatSessions()
  const [isLoading,    setIsLoading]    = useState(false)
  const [error,        setError]        = useState<string | null>(null)
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [nativeLang,   setNativeLang]   = useState('de')
  const [targetLang,   setTargetLang]   = useState('es')

  // Sync tool context when URL changes
  useEffect(() => {
    store.switchToTool(toolParam)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolParam])

  const isLanguage  = store.currentToolType === 'language'
  const llMode      = isLanguage // always on in language chat
  const nativeName  = LANG_NAMES[nativeLang]  ?? nativeLang
  const targetName  = LANG_NAMES[targetLang]  ?? targetLang

  const handleSend = async (text: string) => {
    if (!store.activeSessionId) {
      store.newSession(store.currentToolType)
    }

    const sessionId = store.activeSessionId!
    store.addMessage(sessionId, { text, isUser: true })
    setIsLoading(true)
    setError(null)

    try {
      const res = await askAgent({
        message:             text,
        sessionId,
        languageLearningMode: llMode,
        targetLanguage:       llMode ? targetName  : undefined,
        nativeLanguage:       llMode ? nativeName  : undefined,
        targetLanguageCode:   llMode ? targetLang  : undefined,
        nativeLanguageCode:   llMode ? nativeLang  : undefined,
        level:                llMode ? 'A1'         : undefined,
        learningGoal:         llMode ? 'speaking basics, verbs, sentence structure' : undefined,
      })

      store.addMessage(sessionId, {
        text:         res.reply,
        isUser:       false,
        toolUsed:     res.toolUsed,
        learningData: res.learningData,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = () => {
    if (window.confirm('Delete all conversations?')) store.clearHistory()
  }

  return (
    <div className="flex h-full overflow-hidden relative">
      {/* Session sidebar */}
      <ChatSidebar
        sessions={store.visibleSessions}
        activeSessionId={store.activeSessionId}
        currentToolType={store.currentToolType}
        isOpen={sidebarOpen}
        onOpen={() => setSidebarOpen(true)}
        onClose={() => setSidebarOpen(false)}
        onSelect={id => { store.setActiveSession(id) }}
        onNew={() => store.newSession()}
        onDelete={id => store.deleteSession(id)}
        onClear={handleClear}
        showLLPanel={isLanguage}
        languageLearningMode={llMode}
        onToggleLL={() => {/* locked in language mode */}}
        nativeLangCode={nativeLang}
        targetLangCode={targetLang}
        onNativeLangChange={setNativeLang}
        onTargetLangChange={setTargetLang}
      />

      {/* Main chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Language mode badge */}
        {isLanguage && (
          <div className="flex-shrink-0 px-4 pt-3 pb-0">
            <div className="max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-medium rounded-full px-3 py-1">
                🌍 Learning: {targetName}
              </span>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-4">
              <MessageList
                messages={store.activeMessages}
                isLoading={isLoading}
                targetLang={targetName}
                nativeLang={nativeName}
                targetLangCode={targetLang}
              />
            </div>
          </div>
        </div>

        {/* Error banner */}
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

        {/* Input */}
        <ChatInput
          toolType={store.currentToolType}
          isLoading={isLoading}
          onSend={handleSend}
        />
      </div>
    </div>
  )
}
