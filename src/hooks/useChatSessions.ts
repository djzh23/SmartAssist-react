import { useState, useEffect, useCallback } from 'react'
import type { ChatSession, ChatMessage, ToolType } from '../types'

const LS_SESSIONS = 'smartassist_react_sessions'
const LS_ORDER = 'smartassist_react_order'
const LS_ACTIVE = 'smartassist_react_active'

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
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
}

export function useChatSessions(): SessionStore {
  const [sessions, setSessions] = useState<Record<string, ChatSession>>(() => load(LS_SESSIONS, {}))
  const [sessionOrder, setSessionOrder] = useState<string[]>(() => load(LS_ORDER, []))
  const [activeId, setActiveId] = useState<string | null>(() => load(LS_ACTIVE, null))
  const [currentTool, setCurrentTool] = useState<ToolType>('general')

  useEffect(() => {
    if (activeId && sessions[activeId]) {
      setCurrentTool(sessions[activeId].toolType)
    }
  }, [activeId, sessions])

  useEffect(() => { save(LS_SESSIONS, sessions) }, [sessions])
  useEffect(() => { save(LS_ORDER, sessionOrder) }, [sessionOrder])
  useEffect(() => { save(LS_ACTIVE, activeId) }, [activeId])

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

    setActiveId(prev => {
      if (prev !== id) return prev
      const next = sessionOrder.find(sessionId => sessionId !== id && sessions[sessionId]?.toolType === currentTool)
      return next ?? null
    })
  }, [sessions, sessionOrder, currentTool])

  const clearHistory = useCallback(() => {
    setSessions({})
    setSessionOrder([])
    setActiveId(null)
    localStorage.removeItem(LS_SESSIONS)
    localStorage.removeItem(LS_ORDER)
    localStorage.removeItem(LS_ACTIVE)
  }, [])

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
      return { ...prev, [sessionId]: { ...session, messages: [...session.messages, full] } }
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

  const activeMessages = activeId ? (sessions[activeId]?.messages ?? []) : []

  const visibleSessions = sessionOrder
    .filter(id => sessions[id]?.toolType === currentTool)
    .map(id => sessions[id])
    .filter(Boolean)

  return {
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
  }
}



