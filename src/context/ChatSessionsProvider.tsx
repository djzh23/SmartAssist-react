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
import { useAuth, useUser } from '@clerk/clerk-react'
import { setStreamTextApplier } from '../chat/streamTextBridge'
import {
  createChatSessionRemote,
  deleteChatSessionRemote,
  fetchChatSessions,
  fetchSessionTranscript,
  patchChatSessionTitle,
  putChatSessionOrder,
  putSessionTranscript,
} from '../api/client'
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

/** Per-browser last open chat for this Clerk user — avoids jumping to server-first tab after refresh. */
function lastActiveChatStorageKey(scopeId: string): string {
  return `smartassist_last_active_chat_${scopeId}`
}

function readStoredLastActiveChatId(scopeId: string): string | null {
  try {
    const v = localStorage.getItem(lastActiveChatStorageKey(scopeId))
    return v && v.trim() ? v.trim() : null
  }
  catch {
    return null
  }
}

function buildRemoteSyncFingerprint(order: string[], next: Record<string, ChatSession>): string {
  const orderPart = order.join(',')
  const counts = order.map(id => `${id}:${next[id]?.messages?.length ?? 0}`).join('|')
  return `${orderPart}::${counts}`
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

function normalizeToolFromApi(t: string | undefined | null): ToolType {
  const x = (t ?? 'general').toLowerCase()
  if (x === 'interviewprep') return 'interview'
  if (x === 'general' || x === 'jobanalyzer' || x === 'language' || x === 'programming' || x === 'interview')
    return x
  return 'general'
}

function parseTranscriptMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  const out: ChatMessage[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : uid()
    const text = typeof o.text === 'string' ? fixMojibake(o.text) : ''
    const isUser = Boolean(o.isUser)
    const timestamp = typeof o.timestamp === 'string' ? o.timestamp : new Date().toISOString()
    const toolUsed = typeof o.toolUsed === 'string' ? o.toolUsed : undefined
    const learningData = o.learningData && typeof o.learningData === 'object'
      ? (o.learningData as ChatMessage['learningData'])
      : undefined
    out.push({ id, text, isUser, timestamp, toolUsed, learningData })
  }
  return out
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

function welcomeMessages(tool: ToolType): ChatMessage[] {
  const w = welcomeFor(tool)
  return w
    ? [{ id: uid(), text: w, isUser: false, timestamp: new Date().toISOString() }]
    : []
}

export interface AnswerReadyToast {
  sessionId: string
  toolType: ToolType
  preview: string
}

export interface StreamingPlaceholder {
  sessionId: string
  messageId: string
}

export interface SessionStore {
  sessions: Record<string, ChatSession>
  sessionOrder: string[]
  activeSessionId: string | null
  currentToolType: ToolType
  /** True while loading sessions/transcripts from the API after sign-in or account switch. */
  sessionsRemoteLoading: boolean
  /** Set when remote session list/transcript load fails (empty state + visible banner). */
  sessionsLoadError: string | null
  retrySessionsRemoteLoad: () => void
  setActiveSession: (id: string) => void
  renameSession: (sessionId: string, title: string) => Promise<void>
  newSession: (tool?: ToolType) => Promise<string>
  deleteSession: (id: string) => Promise<void>
  clearHistory: () => Promise<void>
  switchToTool: (tool: ToolType) => Promise<void>
  addMessage: (sessionId: string, msg: Partial<ChatMessage> & { text: string; isUser: boolean }) => void
  updateMessageText: (sessionId: string, msgId: string, text: string) => void
  finalizeMessage: (sessionId: string, msgId: string, meta: { toolUsed?: string }) => void
  deleteMessage: (sessionId: string, msgId: string) => void
  activeMessages: ChatMessage[]
  visibleSessions: ChatSession[]
  isSessionStreaming: (sessionId: string | null) => boolean
  setSessionStreaming: (sessionId: string, streaming: boolean, assistantMessageId?: string) => void
  streamingPlaceholder: StreamingPlaceholder | null
  answerReadyToast: AnswerReadyToast | null
  dismissAnswerToast: () => void
  notifyAnswerReady: (sessionId: string, toolType: ToolType, preview: string) => void
  reorderSessionsForTool: (toolType: ToolType, fromIndex: number, toIndex: number) => Promise<void>
  /** Short notice after manual sync detected remote changes (auto-dismiss). */
  remoteSyncNotice: string | null
  dismissRemoteSyncNotice: () => void
  /** User-triggered full session list + transcript sync (no automatic polling). */
  syncSessionsRemote: () => Promise<void>
  sessionsRemoteSyncing: boolean
  /** ISO time of last successful server load (initial or manual sync). */
  sessionsLastSyncedAt: string | null
  /** Hint that another tab or visibility suggests pulling from server; cleared on Sync or dismiss. */
  sessionsStaleHint: string | null
  dismissSessionsStaleHint: () => void
}

const ChatSessionsContext = createContext<SessionStore | null>(null)

async function migrateLocalSessionsOnce(scopeId: string, token: string): Promise<void> {
  const flag = `sessions_migrated_${scopeId}`
  if (localStorage.getItem(flag)) return

  const k = lsKeys(scopeId)
  const legacyChatSessions = localStorage.getItem('chat_sessions')
  if (legacyChatSessions) {
    try {
      const parsed = JSON.parse(legacyChatSessions) as unknown
      const rows: Array<{ toolType?: string; title?: string }> = Array.isArray(parsed) ? parsed : []
      for (const row of rows) {
        const toolType = normalizeToolFromApi(row.toolType)
        const rec = await createChatSessionRemote(token, {
          toolType,
          title: typeof row.title === 'string' ? row.title : undefined,
        })
        await putSessionTranscript(token, rec.id, { toolType, messages: welcomeMessages(toolType) })
      }
    } catch (e) {
      console.warn('[sessions] Legacy chat_sessions migration failed', e)
    }
    localStorage.removeItem('chat_sessions')
  }

  const rawSessions = localStorage.getItem(k.sessions)
  if (rawSessions) {
    try {
      const parsed = sanitizeSessions(JSON.parse(rawSessions) as Record<string, ChatSession>)
      const orderRaw = localStorage.getItem(k.order)
      const order = (orderRaw ? JSON.parse(orderRaw) as string[] : Object.keys(parsed)).filter(
        id => Boolean(parsed[id]),
      )
      for (const id of order) {
        const s = parsed[id]
        if (!s) continue
        const rec = await createChatSessionRemote(token, {
          toolType: s.toolType,
          title: s.title,
        })
        await putSessionTranscript(token, rec.id, { toolType: s.toolType, messages: s.messages })
      }
    } catch (e) {
      console.warn('[sessions] LocalStorage migration failed', e)
    }
    localStorage.removeItem(k.sessions)
    localStorage.removeItem(k.order)
    localStorage.removeItem(k.active)
  }

  localStorage.setItem(flag, 'true')
}

export function ChatSessionsProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { getToken } = useAuth()
  const { user, isLoaded: clerkLoaded } = useUser()
  const scopeId = !clerkLoaded ? '_loading' : (user?.id ?? 'guest')

  const [sessions, setSessions] = useState<Record<string, ChatSession>>({})
  const [sessionOrder, setSessionOrder] = useState<string[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [currentTool, setCurrentTool] = useState<ToolType>('general')
  const [streamingIds, setStreamingIds] = useState<Record<string, true>>({})
  const [streamingPlaceholder, setStreamingPlaceholder] = useState<StreamingPlaceholder | null>(null)
  const [answerReadyToast, setAnswerReadyToast] = useState<AnswerReadyToast | null>(null)
  const [sessionsRemoteLoading, setSessionsRemoteLoading] = useState(true)
  const [sessionsLoadError, setSessionsLoadError] = useState<string | null>(null)
  const [remoteSyncNotice, setRemoteSyncNotice] = useState<string | null>(null)
  const [sessionsRemoteSyncing, setSessionsRemoteSyncing] = useState(false)
  const [sessionsLastSyncedAt, setSessionsLastSyncedAt] = useState<string | null>(null)
  const [sessionsStaleHint, setSessionsStaleHint] = useState<string | null>(null)

  const locationRef = useRef(location)
  locationRef.current = location
  const activeIdRef = useRef(activeId)
  activeIdRef.current = activeId
  const sessionsRef = useRef(sessions)
  sessionsRef.current = sessions
  const sessionOrderRef = useRef(sessionOrder)
  sessionOrderRef.current = sessionOrder
  const currentToolRef = useRef(currentTool)
  currentToolRef.current = currentTool

  /** Bumps on unmount / scope change so in-flight loads do not apply stale results. */
  const loadSeqRef = useRef(0)
  const broadcastRef = useRef<BroadcastChannel | null>(null)
  const remoteSyncFingerprintRef = useRef('')
  const remoteSyncToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    remoteSyncFingerprintRef.current = ''
  }, [scopeId])

  const persistIdsRef = useRef(new Set<string>())
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flushPersist = useCallback(async () => {
    const token = await getToken()
    if (!token) return
    const ids = [...persistIdsRef.current]
    persistIdsRef.current.clear()
    for (const sessionId of ids) {
      const s = sessionsRef.current[sessionId]
      if (!s) continue
      try {
        await putSessionTranscript(token, sessionId, { toolType: s.toolType, messages: s.messages })
      } catch (e) {
        console.warn('[sessions] Transcript sync failed', sessionId, e)
      }
    }
  }, [getToken])

  const schedulePersist = useCallback(
    (sessionId: string) => {
      persistIdsRef.current.add(sessionId)
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current)
      persistTimerRef.current = setTimeout(() => {
        persistTimerRef.current = null
        void flushPersist()
      }, 550)
    },
    [flushPersist],
  )

  const loadSessionsFromApi = useCallback(
    async (mode: 'initial' | 'refresh') => {
      const seq = ++loadSeqRef.current
      if (scopeId === '_loading')
        return
      if (scopeId === 'guest') {
        if (seq !== loadSeqRef.current)
          return
        setSessions({})
        setSessionOrder([])
        setActiveId(null)
        setSessionsLoadError(null)
        if (mode === 'initial')
          setSessionsRemoteLoading(false)
        return
      }
      if (mode === 'initial')
        setSessionsRemoteLoading(true)
      try {
        const token = await getToken()
        if (seq !== loadSeqRef.current)
          return
        if (!token) {
          setSessions({})
          setSessionOrder([])
          setActiveId(null)
          setSessionsLoadError('Chats konnten nicht geladen werden: Kein gültiges Anmeldetoken. Bitte neu anmelden.')
          return
        }
        await migrateLocalSessionsOnce(scopeId, token)
        if (seq !== loadSeqRef.current)
          return
        const records = await fetchChatSessions(token)
        if (seq !== loadSeqRef.current)
          return
        const prevLocal = sessionsRef.current
        const active = activeIdRef.current
        /**
         * Refresh transcript fetches: API `messageCount` is only bumped server-side on agent
         * completion (not on user turns / PUT transcript), so comparing it to `messages.length`
         * forces a refetch for almost every session → one Sync explodes Redis reads.
         * On refresh we only load full transcript for the active tab and for sessions we have
         * not seen yet; other tabs keep local messages until the user opens them or uses Sync
         * again after switching.
         */
        const transcripts = await Promise.all(
          records.map(m => {
            if (mode === 'initial')
              return fetchSessionTranscript(token, m.id)
            const local = prevLocal[m.id]
            const needFetch = !local || m.id === active
            if (needFetch)
              return fetchSessionTranscript(token, m.id)
            return Promise.resolve({
              toolType: local.toolType,
              messages: local.messages,
            })
          }),
        )
        if (seq !== loadSeqRef.current)
          return
        const nextSessions: Record<string, ChatSession> = {}
        const order: string[] = []
        for (let i = 0; i < records.length; i++) {
          const m = records[i]
          const tr = transcripts[i]
          const tool = normalizeToolFromApi(tr.toolType || m.toolType)
          const parsedMessages = parseTranscriptMessages(tr.messages)
          let messages = parsedMessages
          if (messages.length === 0)
            messages = welcomeMessages(tool)
          nextSessions[m.id] = {
            id: m.id,
            toolType: tool,
            messages,
            createdAt: m.createdAt,
            title: m.title,
          }
          order.push(m.id)
        }
        if (seq !== loadSeqRef.current)
          return

        const fpNew = buildRemoteSyncFingerprint(order, nextSessions)
        const prevFp = remoteSyncFingerprintRef.current
        remoteSyncFingerprintRef.current = fpNew
        if (mode === 'refresh' && prevFp !== '' && prevFp !== fpNew) {
          if (remoteSyncToastTimerRef.current)
            clearTimeout(remoteSyncToastTimerRef.current)
          setRemoteSyncNotice('Aktualisiert — Chats mit dem Server abgeglichen.')
          remoteSyncToastTimerRef.current = setTimeout(() => {
            remoteSyncToastTimerRef.current = null
            setRemoteSyncNotice(null)
          }, 2800)
        }

        setSessions(nextSessions)
        setSessionOrder(order)
        setSessionsLoadError(null)
        setSessionsStaleHint(null)
        setSessionsLastSyncedAt(new Date().toISOString())
        if (mode === 'initial') {
          const stored = readStoredLastActiveChatId(scopeId)
          const preferred = stored && nextSessions[stored] ? stored : null
          const firstForGeneral = order.find(id => nextSessions[id]?.toolType === 'general')
          setActiveId(preferred ?? firstForGeneral ?? order[0] ?? null)
        }
        else {
          setActiveId(prev => {
            if (prev && nextSessions[prev])
              return prev
            const stored = readStoredLastActiveChatId(scopeId)
            if (stored && nextSessions[stored])
              return stored
            const firstForTool = order.find(id => nextSessions[id]?.toolType === currentToolRef.current)
            return firstForTool ?? order[0] ?? null
          })
        }
      }
      catch (e) {
        if (seq === loadSeqRef.current) {
          console.error('[sessions] Remote load failed', e)
          const msg = e instanceof Error ? e.message : 'Chats konnten nicht geladen werden.'
          setSessionsLoadError(msg.length > 220 ? `${msg.slice(0, 220)}…` : msg)
          setSessions({})
          setSessionOrder([])
          setActiveId(null)
        }
      }
      finally {
        if (seq === loadSeqRef.current && mode === 'initial')
          setSessionsRemoteLoading(false)
      }
    },
    [scopeId, getToken],
  )

  const retrySessionsRemoteLoad = useCallback(() => {
    setSessionsLoadError(null)
    void loadSessionsFromApi('initial')
  }, [loadSessionsFromApi])

  const dismissRemoteSyncNotice = useCallback(() => {
    if (remoteSyncToastTimerRef.current) {
      clearTimeout(remoteSyncToastTimerRef.current)
      remoteSyncToastTimerRef.current = null
    }
    setRemoteSyncNotice(null)
  }, [])

  const dismissSessionsStaleHint = useCallback(() => {
    setSessionsStaleHint(null)
  }, [])

  const syncSessionsRemote = useCallback(async () => {
    if (scopeId === '_loading' || scopeId === 'guest')
      return
    setSessionsRemoteSyncing(true)
    setSessionsStaleHint(null)
    try {
      await loadSessionsFromApi('refresh')
    }
    finally {
      setSessionsRemoteSyncing(false)
    }
  }, [scopeId, loadSessionsFromApi])

  const pingOtherTabs = useCallback(() => {
    try {
      broadcastRef.current?.postMessage({ t: 'sessions' })
    }
    catch {
      /* BroadcastChannel may be unavailable */
    }
  }, [])

  useEffect(() => {
    if (scopeId === '_loading' || scopeId === 'guest') {
      setRemoteSyncNotice(null)
      setSessionsStaleHint(null)
    }
  }, [scopeId])

  useEffect(() => {
    if (scopeId === '_loading')
      return
    void loadSessionsFromApi('initial')
    return () => {
      loadSeqRef.current += 1
    }
  }, [scopeId, loadSessionsFromApi])

  /** Tab wieder sichtbar: Hinweis auf manuellen Sync (kein automatischer Server-Refetch). */
  useEffect(() => {
    if (scopeId === '_loading' || scopeId === 'guest')
      return
    let wasHidden = document.visibilityState === 'hidden'
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        wasHidden = true
        return
      }
      if (document.visibilityState === 'visible' && wasHidden) {
        wasHidden = false
        setSessionsStaleHint(
          'Fenster wieder aktiv — tippe auf „Synchronisieren“, um Chats mit dem Server abzugleichen.',
        )
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [scopeId])

  /** Mehrere Browser-Tabs: andere Tabs informieren — kein automatischer Refetch. */
  useEffect(() => {
    if (scopeId === '_loading' || scopeId === 'guest') {
      broadcastRef.current = null
      return
    }
    if (typeof BroadcastChannel === 'undefined')
      return
    let ch: BroadcastChannel
    try {
      ch = new BroadcastChannel('privateprep-chat-sessions-v1')
    }
    catch {
      return
    }
    broadcastRef.current = ch
    ch.onmessage = () => {
      setSessionsStaleHint(
        'In einem anderen Tab wurden Chats geändert — tippe auf „Synchronisieren“, um den Serverstand zu laden.',
      )
    }
    return () => {
      ch.close()
      if (broadcastRef.current === ch)
        broadcastRef.current = null
    }
  }, [scopeId])

  /** Remember open tab per browser profile so refresh does not jump to another device’s “latest” tab order. */
  useEffect(() => {
    if (scopeId === '_loading' || scopeId === 'guest')
      return
    try {
      if (activeId)
        localStorage.setItem(lastActiveChatStorageKey(scopeId), activeId)
      else
        localStorage.removeItem(lastActiveChatStorageKey(scopeId))
    }
    catch {
      /* ignore quota / private mode */
    }
  }, [activeId, scopeId])

  useEffect(() => {
    return () => {
      if (remoteSyncToastTimerRef.current) {
        clearTimeout(remoteSyncToastTimerRef.current)
        remoteSyncToastTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (activeId && sessions[activeId])
      setCurrentTool(sessions[activeId].toolType)
  }, [activeId, sessions])

  const createSessionRemote = useCallback(
    async (tool: ToolType): Promise<string> => {
      const token = await getToken()
      if (!token)
        throw new Error('Nicht angemeldet.')
      const rec = await createChatSessionRemote(token, { toolType: tool })
      const welcome = welcomeMessages(tool)
      const session: ChatSession = {
        id: rec.id,
        toolType: tool,
        messages: welcome,
        createdAt: rec.createdAt,
        title: rec.title,
      }
      setSessions(prev => ({ ...prev, [rec.id]: session }))
      setSessionOrder(prev => [rec.id, ...prev.filter(id => id !== rec.id)])
      await putSessionTranscript(token, rec.id, { toolType: tool, messages: welcome })
      pingOtherTabs()
      return rec.id
    },
    [getToken, pingOtherTabs],
  )

  const switchToTool = useCallback(
    async (tool: ToolType) => {
      setCurrentTool(tool)
      const order = sessionOrderRef.current
      const sess = sessionsRef.current
      const existing = order.find(id => sess[id]?.toolType === tool)
      if (existing) {
        setActiveId(existing)
        return
      }
      const id = await createSessionRemote(tool)
      setActiveId(id)
    },
    [createSessionRemote],
  )

  const setActiveSession = useCallback((id: string) => {
    setActiveId(id)
  }, [])

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      const trimmed = title.trim()
      if (!trimmed) return
      const maxT = trimmed.length > 120 ? trimmed.slice(0, 120) : trimmed
      const previousTitle = sessionsRef.current[sessionId]?.title
      setSessions(prev => {
        const s = prev[sessionId]
        if (!s) return prev
        return { ...prev, [sessionId]: { ...s, title: maxT } }
      })
      try {
        const token = await getToken()
        if (!token) {
          pingOtherTabs()
          return
        }
        const rec = await patchChatSessionTitle(token, sessionId, maxT)
        setSessions(prev => {
          const s = prev[sessionId]
          if (!s) return prev
          return { ...prev, [sessionId]: { ...s, title: rec.title } }
        })
        pingOtherTabs()
      }
      catch (e) {
        console.warn('[sessions] rename failed', e)
        setSessions(prev => {
          const s = prev[sessionId]
          if (!s) return prev
          return { ...prev, [sessionId]: { ...s, title: previousTitle } }
        })
      }
    },
    [getToken, pingOtherTabs],
  )

  const newSession = useCallback(
    async (tool?: ToolType): Promise<string> => {
      const t = tool ?? currentTool
      const id = await createSessionRemote(t)
      setActiveId(id)
      return id
    },
    [currentTool, createSessionRemote],
  )

  const deleteSession = useCallback(
    async (id: string) => {
      try {
        const token = await getToken()
        if (token)
          await deleteChatSessionRemote(token, id)
      } catch (e) {
        console.warn('[sessions] Delete remote failed', e)
      }

      const ord = sessionOrderRef.current.filter(sessionId => sessionId !== id)
      const sess = { ...sessionsRef.current }
      delete sess[id]
      const wasActive = activeIdRef.current === id
      const nextActive = wasActive
        ? ord.find(sessionId => sess[sessionId]?.toolType === currentToolRef.current) ?? null
        : activeIdRef.current

      setSessions(sess)
      setSessionOrder(ord)
      setActiveId(nextActive)

      setStreamingIds(prev => {
        if (!prev[id]) return prev
        const next = { ...prev }
        delete next[id]
        return next
      })
      setStreamingPlaceholder(prev => (prev?.sessionId === id ? null : prev))
      pingOtherTabs()
    },
    [getToken, pingOtherTabs],
  )

  const clearHistory = useCallback(async () => {
    if (scopeId === '_loading' || scopeId === 'guest') return
    const ids = [...sessionOrderRef.current]
    const token = await getToken()
    for (const id of ids) {
      try {
        if (token) await deleteChatSessionRemote(token, id)
      } catch (e) {
        console.warn('[sessions] clearHistory delete', id, e)
      }
    }
    setSessions({})
    setSessionOrder([])
    setActiveId(null)
    setStreamingIds({})
    setStreamingPlaceholder(null)
    pingOtherTabs()
  }, [getToken, scopeId, pingOtherTabs])

  const addMessage = useCallback(
    (sessionId: string, msg: Partial<ChatMessage> & { text: string; isUser: boolean }) => {
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
      schedulePersist(sessionId)
    },
    [schedulePersist],
  )

  const updateMessageText = useCallback(
    (sessionId: string, msgId: string, text: string) => {
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
      schedulePersist(sessionId)
    },
    [schedulePersist],
  )

  const updateMessageTextRef = useRef(updateMessageText)
  updateMessageTextRef.current = updateMessageText

  useEffect(() => {
    setStreamTextApplier((sessionId, messageId, text) => {
      updateMessageTextRef.current(sessionId, messageId, text)
    })
    return () => setStreamTextApplier(null)
  }, [])

  const finalizeMessage = useCallback(
    (sessionId: string, msgId: string, meta: { toolUsed?: string }) => {
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
      schedulePersist(sessionId)
    },
    [schedulePersist],
  )

  const deleteMessage = useCallback(
    (sessionId: string, msgId: string) => {
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
      schedulePersist(sessionId)
    },
    [schedulePersist],
  )

  const setSessionStreaming = useCallback((sessionId: string, streaming: boolean, assistantMessageId?: string) => {
    setStreamingIds(prev => {
      if (streaming) return { ...prev, [sessionId]: true }
      if (!prev[sessionId]) return prev
      const next = { ...prev }
      delete next[sessionId]
      return next
    })
    if (streaming && assistantMessageId)
      setStreamingPlaceholder({ sessionId, messageId: assistantMessageId })

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
    const onChat = locationRef.current.pathname.startsWith('/chat')
    const tabVisible = typeof document === 'undefined' || document.visibilityState === 'visible'
    if (onChat && activeIdRef.current === sessionId && tabVisible)
      return

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

  const reorderSessionsForTool = useCallback(
    async (toolType: ToolType, fromIndex: number, toIndex: number) => {
      const nextOrder = reorderSessionOrderForTool(
        sessionOrderRef.current,
        toolType,
        fromIndex,
        toIndex,
        sessionsRef.current,
      )
      setSessionOrder(nextOrder)
      try {
        const token = await getToken()
        if (token) {
          await putChatSessionOrder(token, nextOrder)
          pingOtherTabs()
        }
      } catch (e) {
        console.warn('[sessions] Order sync failed', e)
      }
    },
    [getToken, pingOtherTabs],
  )

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
    sessionsRemoteLoading,
    sessionsLoadError,
    retrySessionsRemoteLoad,
    setActiveSession,
    renameSession,
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
    remoteSyncNotice,
    dismissRemoteSyncNotice,
    syncSessionsRemote,
    sessionsRemoteSyncing,
    sessionsLastSyncedAt,
    sessionsStaleHint,
    dismissSessionsStaleHint,
  }), [
    sessions,
    sessionOrder,
    activeId,
    currentTool,
    sessionsRemoteLoading,
    sessionsLoadError,
    retrySessionsRemoteLoad,
    setActiveSession,
    renameSession,
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
    remoteSyncNotice,
    dismissRemoteSyncNotice,
    syncSessionsRemote,
    sessionsRemoteSyncing,
    sessionsLastSyncedAt,
    sessionsStaleHint,
    dismissSessionsStaleHint,
  ])

  return (
    <ChatSessionsContext.Provider value={value}>
      {children}
    </ChatSessionsContext.Provider>
  )
}

export function useChatSessions(): SessionStore {
  const ctx = useContext(ChatSessionsContext)
  if (!ctx)
    throw new Error('useChatSessions must be used within ChatSessionsProvider')

  return ctx
}
