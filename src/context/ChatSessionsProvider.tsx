import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLocation } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { setStreamTextApplier } from '../chat/streamTextBridge'
import { reorderSessionOrderForTool } from '../utils/sessionOrder'
import { suggestSessionTitle } from '../utils/sessionTitle'
import type { ChatSession, ChatMessage, ToolType } from '../types'

function lsKeys(scopeId: string) {
  return {
    sessions: `smartassist_react_sessions_${scopeId}`,
    order: `smartassist_react_order_${scopeId}`,
    active: `smartassist_react_active_${scopeId}`,
  }
}

/** URL query value for each tool (matches ChatPage). */
export const TOOL_TO_QUERY: Record<ToolType, string> = {
  general: 'general',
  jobanalyzer: 'jobanalyzer',
  language: 'language',
  programming: 'programming',
  interview: 'interview',
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function fixMojibake(text: string): string {
  return text
    .replace(/Ã¶/g, 'ö').replace(/Ã¤/g, 'ä').replace(/Ã¼/g, 'ü')
    .replace(/Ã–/g, 'Ö').replace(/Ã„/g, 'Ä').replace(/Ãœ/g, 'Ü')
    .replace(/ÃŸ/g, 'ß').replace(/â€"/g, '—').replace(/â€˜/g, '\u2018')
    .replace(/â€™/g, '\u2019').replace(/â€œ/g, '\u201c').replace(/â€\u009d/g, '\u201d')
    .replace(/Ã©/g, 'é').replace(/Ã /g, 'à').replace(/Ã¨/g, 'è')
    .replace(/Ã®/g, 'î').replace(/Ã´/g, 'ô').replace(/Ã»/g, 'û')
    .replace(/Ã±/g, 'ñ').replace(/Ã¡/g, 'á').replace(/Ã³/g, 'ó')
    .replace(/Ã­/g, 'í').replace(/Ãº/g, 'ú')
}

function sanitizeSessions(raw: Record<string, ChatSession>): Record<string, ChatSession> {
  const out: Record<string, ChatSession> = {}
  for (const [id, session] of Object.entries(raw)) {
    out[id] = {
      ...session,
      messages: session.messages.map(m => ({ ...m, text: fixMojibake(m.text) })),
    }
  }
  return out
}

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // storage full
  }
}

function welcomeFor(tool: ToolType): string | null {
  switch (tool) {
    case 'general':
      return 'Hallo. Ich bin dein persönlicher KI-Assistent.\nFrag mich einfach, ich helfe dir schnell und präzise weiter.'
    case 'jobanalyzer':
      return 'Job-Analyse bereit.\nFüge eine Stellenanzeige oder einen Link ein, ich zeige dir klar, worauf es ankommt.'
    case 'language':
      return 'Sprachcoach aktiv.\nSchreib einfach los, ich übersetze, korrigiere und erkläre auf deinem Niveau.'
    case 'programming':
      return `Programmierung aktiv.
Wähle eine Sprache oder sende direkt deinen Code. Ich unterstütze dich bei:
- Debugging und Fehleranalyse
- Code Reviews und Best Practices
- Algorithmik und Optimierung
- Architektur und Strukturfragen`
    case 'interview':
      return 'Interview-Coach aktiv.\nÖffne das Setup, hinterlege Lebenslauf und Zielstelle, dann bereite ich dich gezielt vor.'
    default:
      return null
  }
}

export interface AnswerReadyToast {
  sessionId: string
  toolType: ToolType
  preview: string
}

/** Which session/message is receiving the stream (typing dots only there). */
export interface StreamingPlaceholder {
  sessionId: string
  messageId: string
}

export interface SessionStore {
  sessions: Record<string, ChatSession>
  sessionOrder: string[]
  activeSessionId: string | null
  currentToolType: ToolType
  setActiveSession: (id: string) => void
  newSession: (tool?: ToolType) => string
  deleteSession: (id: string) => void
  clearHistory: () => void
  switchToTool: (tool: ToolType) => void
  addMessage: (sessionId: string, msg: Partial<ChatMessage> & { text: string; isUser: boolean }) => void
  updateMessageText: (sessionId: string, msgId: string, text: string) => void
  finalizeMessage: (sessionId: string, msgId: string, meta: { toolUsed?: string }) => void
  deleteMessage: (sessionId: string, msgId: string) => void
  activeMessages: ChatMessage[]
  visibleSessions: ChatSession[]
  /** True while the assistant response is streaming for this session (survives route changes). */
  isSessionStreaming: (sessionId: string | null) => boolean
  /** When starting a stream, pass assistantMessageId so typing UI only shows on that bubble. */
  setSessionStreaming: (sessionId: string, streaming: boolean, assistantMessageId?: string) => void
  streamingPlaceholder: StreamingPlaceholder | null
  /** In-chat banner when an answer finishes in another conversation (ChatPage reads this). */
  answerReadyToast: AnswerReadyToast | null
  dismissAnswerToast: () => void
  notifyAnswerReady: (sessionId: string, toolType: ToolType, preview: string) => void
  reorderSessionsForTool: (toolType: ToolType, fromIndex: number, toIndex: number) => void
}

const ChatSessionsContext = createContext<SessionStore | null>(null)

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { user, isLoaded: clerkLoaded } = useUser()
  const scopeId = !clerkLoaded ? '_loading' : (user?.id ?? 'guest')

  const [sessions, setSessions] = useState<Record<string, ChatSession>>({})
  const [sessionOrder, setSessionOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentTool, setCurrentTool] = useState<ToolType>('general')
  const [streamingIds, setStreamingIds] = useState<Record<string, true>>({})
  const [streamingPlaceholder, setStreamingPlaceholder] = useState<StreamingPlaceholder | null>(null)
  const [answerReadyToast, setAnswerReadyToast] = useState<AnswerReadyToast | null>(null)

  const locationRef = useRef(location)
  locationRef.current = location
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions

  useEffect(() => {
    if (scopeId === '_loading') return
    const k = lsKeys(scopeId)
    setSessions(sanitizeSessions(load(k.sessions, {})))
    setSessionOrder(load(k.order, []))
    setActiveId(load(k.active, null))
  }, [scopeId])

  useEffect(() => {
    if (activeId && sessions[activeId]) {
      setCurrentTool(sessions[activeId].toolType)
    }
  }, [activeId, sessions])

  useEffect(() => {
    if (scopeId === '_loading') return
    save(lsKeys(scopeId).sessions, sessions)
  }, [sessions, scopeId])

  useEffect(() => {
    if (scopeId === '_loading') return
    save(lsKeys(scopeId).order, sessionOrder)
  }, [sessionOrder, scopeId])

  useEffect(() => {
    if (scopeId === '_loading') return
    save(lsKeys(scopeId).active, activeId)
  }, [activeId, scopeId])

  const createSession = useCallback((tool: ToolType = 'general'): string => {
    const id = uid()
    const welcome = welcomeFor(tool)
    const messages: ChatMessage[] = welcome
      ? [{ id: uid(), text: welcome, isUser: false, timestamp: new Date().toISOString() }]
      : []
    const session: ChatSession = { id, toolType: tool, messages, createdAt: new Date().toISOString() }

    setSessions(prev => ({ ...prev, [id]: session }))
    setSessionOrder(prev => [id, ...prev])
    return id
  }, [])

  const switchToTool = useCallback((tool: ToolType) => {
    setCurrentTool(tool)
    const existing = sessionOrder.find(id => sessions[id]?.toolType === tool)
    if (existing) {
      setActiveId(existing)
    } else {
      const id = createSession(tool)
      setActiveId(id)
    }
  }, [sessions, sessionOrder, createSession])

  const setActiveSession = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const newSession = useCallback((tool?: ToolType): string => {
    const t = tool ?? currentTool
    const id = createSession(t)
    setActiveId(id)
    return id
  }, [currentTool, createSession])

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })

    setSessionOrder(prev => prev.filter(sessionId => sessionId !== id))

    setStreamingIds(prev => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    })

    setStreamingPlaceholder(prev => (prev?.sessionId === id ? null : prev))

    setActiveId(prev => {
      if (prev !== id) return prev
      const next = sessionOrder.find(sessionId => sessionId !== id && sessions[sessionId]?.toolType === currentTool)
      return next ?? null
    })
  }, [sessions, sessionOrder, currentTool])

  const clearHistory = useCallback(() => {
    if (scopeId === '_loading') return
    const k = lsKeys(scopeId)
    setSessions({})
    setSessionOrder([])
    setActiveId(null)
    setStreamingIds({})
    setStreamingPlaceholder(null)
    localStorage.removeItem(k.sessions)
    localStorage.removeItem(k.order)
    localStorage.removeItem(k.active)
  }, [scopeId])

  const addMessage = useCallback((
    sessionId: string,
    msg: Partial<ChatMessage> & { text: string; isUser: boolean },
  ) => {
    const full: ChatMessage = {
      id: uid(),
      timestamp: new Date().toISOString(),
      ...msg,
    }
    setSessions(prev => {
      const session = prev[sessionId]
      if (!session) return prev
      const shouldSetTitle = full.isUser && !(session.title?.trim())
      const title = shouldSetTitle ? suggestSessionTitle(session.toolType, full.text) : session.title
      return {
        ...prev,
        [sessionId]: {
          ...session,
          messages: [...session.messages, full],
          ...(shouldSetTitle ? { title } : {}),
        },
      }
    })
  }, [])

  const updateMessageText = useCallback((sessionId: string, msgId: string, text: string) => {
    setSessions(prev => {
      const session = prev[sessionId]
      if (!session) return prev
      return {
        ...prev,
        [sessionId]: {
          ...session,
          messages: session.messages.map(m => m.id === msgId ? { ...m, text } : m),
        },
      }
    })
  }, [])

  const updateMessageTextRef = useRef(updateMessageText)
  updateMessageTextRef.current = updateMessageText

  useEffect(() => {
    setStreamTextApplier((sessionId, messageId, text) => {
      updateMessageTextRef.current(sessionId, messageId, text)
    })
    return () => setStreamTextApplier(null)
  }, [])

  const finalizeMessage = useCallback((
    sessionId: string,
    msgId: string,
    meta: { toolUsed?: string },
  ) => {
    setSessions(prev => {
      const session = prev[sessionId]
      if (!session) return prev
      return {
        ...prev,
        [sessionId]: {
          ...session,
          messages: session.messages.map(m =>
            m.id === msgId ? { ...m, toolUsed: meta.toolUsed } : m,
          ),
        },
      }
    })
  }, [])

  const deleteMessage = useCallback((sessionId: string, msgId: string) => {
    setSessions(prev => {
      const session = prev[sessionId]
      if (!session) return prev
      return {
        ...prev,
        [sessionId]: {
          ...session,
          messages: session.messages.filter(m => m.id !== msgId),
        },
      }
    })
  }, [])

  const setSessionStreaming = useCallback((sessionId: string, streaming: boolean, assistantMessageId?: string) => {
    setStreamingIds(prev => {
      if (streaming) return { ...prev, [sessionId]: true }
      if (!prev[sessionId]) return prev
      const next = { ...prev }
      delete next[sessionId]
      return next
    })
    if (streaming && assistantMessageId) {
      setStreamingPlaceholder({ sessionId, messageId: assistantMessageId })
    }
    if (!streaming) {
      setStreamingPlaceholder(prev =>
        prev?.sessionId === sessionId ? null : prev,
      )
    }
  }, [])

  const isSessionStreaming = useCallback((sessionId: string | null) => {
    if (!sessionId) return false
    return Boolean(streamingIds[sessionId])
  }, [streamingIds])

  const dismissAnswerToast = useCallback(() => setAnswerReadyToast(null), [])

  const notifyAnswerReady = useCallback((sessionId: string, toolType: ToolType, preview: string) => {
    // Refs: stream may finish after navigation; stale closure must not hide the toast.
    const onChat = locationRef.current.pathname.startsWith('/chat')
    const tabVisible = typeof document === 'undefined' || document.visibilityState === 'visible'
    if (onChat && activeIdRef.current === sessionId && tabVisible) {
      return
    }
    const short = preview.length > 72 ? `${preview.slice(0, 72)}…` : preview
    setAnswerReadyToast({ sessionId, toolType, preview: short })
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      try {
        if (Notification.permission === 'granted') {
          // eslint-disable-next-line no-new
          new Notification('PrivatePrep', { body: `Antwort bereit: ${short}` })
        }
      } catch {
        // ignore
      }
    }
  }, [])

  const reorderSessionsForTool = useCallback((toolType: ToolType, fromIndex: number, toIndex: number) => {
    setSessionOrder(prev =>
      reorderSessionOrderForTool(prev, toolType, fromIndex, toIndex, sessionsRef.current),
    )
  }, [])

  const activeMessages = activeId ? (sessions[activeId]?.messages ?? []) : []

  const visibleSessions = sessionOrder
    .filter(id => sessions[id]?.toolType === currentTool)
    .map(id => sessions[id])
    .filter(Boolean)

  const value = useMemo<SessionStore>(() => ({
    sessions,
    sessionOrder,
    activeSessionId: activeId,
    currentToolType: currentTool,
    setActiveSession,
    newSession,
    deleteSession,
    clearHistory,
    switchToTool,
    addMessage,
    updateMessageText,
    finalizeMessage,
    deleteMessage,
    activeMessages,
    visibleSessions,
    isSessionStreaming,
    setSessionStreaming,
    streamingPlaceholder,
    answerReadyToast,
    dismissAnswerToast,
    notifyAnswerReady,
    reorderSessionsForTool,
  }), [
    sessions,
    sessionOrder,
    activeId,
    currentTool,
    setActiveSession,
    newSession,
    deleteSession,
    clearHistory,
    switchToTool,
    addMessage,
    updateMessageText,
    finalizeMessage,
    deleteMessage,
    activeMessages,
    visibleSessions,
    isSessionStreaming,
    setSessionStreaming,
    streamingPlaceholder,
    answerReadyToast,
    dismissAnswerToast,
    notifyAnswerReady,
    reorderSessionsForTool,
  ])

  return (
    <ChatSessionsContext.Provider value={value}>
      {children}
    </ChatSessionsContext.Provider>
  )
}

export function useChatSessions(): SessionStore {
  const ctx = useContext(ChatSessionsContext)
  if (!ctx) {
    throw new Error('useChatSessions must be used within ChatSessionsProvider')
  }
  return ctx
}
