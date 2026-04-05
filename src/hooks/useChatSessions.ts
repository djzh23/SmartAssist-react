import { useState, useEffect, useCallback } from 'react'
import type { ChatSession, ChatMessage, ToolType } from '../types'

const LS_SESSIONS = 'smartassist_react_sessions'
const LS_ORDER    = 'smartassist_react_order'
const LS_ACTIVE   = 'smartassist_react_active'

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
    // storage full — ignore
  }
}

// Welcome messages per tool
function welcomeFor(tool: ToolType): string | null {
  switch (tool) {
    case 'jobanalyzer':
      return '💼 Job Analyzer ready!\nPaste a job posting text or share a URL.\nI\'ll analyze the role and give you personalized CV tips.'
    case 'language':
      return '🌍 Language Learning Mode activated!\nWrite something in your native language and I\'ll translate and teach you.'
    case 'programming':
      return '💻 Programming & DSA Mode activated!\nSelect your language in the sidebar, then ask anything about algorithms, data structures, or code.\nTry: "Explain binary search with an example"'
    case 'interview':
      return '🎤 Interview Practice Mode activated!\nChoose German or English, then practice answering interview questions.\nClick the mic button to answer with your voice, or just type.\nTry: "Give me a common behavioral interview question"'
    default:
      return null
  }
}

export interface SessionStore {
  sessions: Record<string, ChatSession>
  sessionOrder: string[]
  activeSessionId: string | null
  currentToolType: ToolType

  // Actions
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
  const [sessions, setSessions]         = useState<Record<string, ChatSession>>(() => load(LS_SESSIONS, {}))
  const [sessionOrder, setSessionOrder] = useState<string[]>(() => load(LS_ORDER, []))
  const [activeId, setActiveId]         = useState<string | null>(() => load(LS_ACTIVE, null))
  const [currentTool, setCurrentTool]   = useState<ToolType>('general')

  // Derive currentTool from active session
  useEffect(() => {
    if (activeId && sessions[activeId]) {
      setCurrentTool(sessions[activeId].toolType)
    }
  }, [activeId, sessions])

  // Persist whenever sessions or order changes
  useEffect(() => { save(LS_SESSIONS, sessions) },     [sessions])
  useEffect(() => { save(LS_ORDER,    sessionOrder) }, [sessionOrder])
  useEffect(() => { save(LS_ACTIVE,   activeId) },     [activeId])

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
    // Find existing session for this tool
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
    setSessionOrder(prev => {
      const next = prev.filter(s => s !== id)
      return next
    })
    setActiveId(prev => {
      if (prev !== id) return prev
      // Switch to next session of same tool
      const next = sessionOrder.find(s => s !== id && sessions[s]?.toolType === currentTool)
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
      return { ...prev, [sessionId]: { ...session, messages: [...session.messages, full] } }
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
