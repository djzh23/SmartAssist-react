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
    case 'jobanalyzer':
      return 'Job Analyzer ist bereit.\nFüge einen Stellentext oder Link ein, dann bekommst du eine konkrete Auswertung für deinen Lebenslauf.'
    case 'language':
      return 'Sprachlernen ist aktiv.\nSchreibe in deiner Sprache, ich antworte mit Übersetzung und Lernhilfe.'
    case 'programming':
      return 'Programmierung und DSA sind aktiv.\nWähle links die Sprache und stelle dann deine Frage zu Algorithmen, Datenstrukturen oder Code.'
    case 'interview':
      return 'Interview Coach ist aktiv.\nKlicke auf "Neuer Chat", öffne das Setup und hinterlege Sprache, Alias, Lebenslauf und Stellenziel für diesen Chat.'
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
  addMessage: (sessionId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
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

  const addMessage = useCallback((sessionId: string, msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const full: ChatMessage = { ...msg, id: uid(), timestamp: new Date().toISOString() }

    setSessions(prev => {
      const session = prev[sessionId]
      if (!session) return prev
      return {
        ...prev,
        [sessionId]: {
          ...session,
          messages: [...session.messages, full],
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
    activeMessages,
    visibleSessions,
  }
}
