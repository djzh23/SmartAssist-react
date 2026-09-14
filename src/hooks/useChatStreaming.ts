import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { ToolType } from '../types'
import { useDeliberateStream } from './useDeliberateStream'
import { STREAM_CHARS_PER_SECOND } from '../components/chat/ThinkingIndicator'
import { applyStreamText } from '../chat/streamTextBridge'
import { dispatchServerUsage } from './useUserPlan'

export interface StreamStore {
  sessions: Record<string, { messages: Array<{ id?: string; text: string; isUser: boolean }> }>
  finalizeMessage: (sessionId: string, msgId: string, meta: { toolUsed?: string }) => void
  notifyAnswerReady: (sessionId: string, toolType: ToolType, preview: string) => void
  setSessionStreaming: (sessionId: string, streaming: boolean, msgId?: string) => void
  deleteMessage: (sessionId: string, msgId: string) => void
}

export interface UseChatStreamingResult {
  deliberate: ReturnType<typeof useDeliberateStream>
  thinkingSession: { sessionId: string; messageId: string; toolType: ToolType } | null
  setThinkingSession: React.Dispatch<React.SetStateAction<{ sessionId: string; messageId: string; toolType: ToolType } | null>>
  stopStreaming: () => void
  handleThinkingComplete: () => void
  streamCtxRef: React.MutableRefObject<{ sessionId: string; msgId: string; sessionToolType: ToolType } | null>
  streamAbortRef: React.MutableRefObject<AbortController | null>
  streamResultRef: React.MutableRefObject<{ toolUsed: string; serverUsageToday?: number } | null>
  incrementUsageRef: React.MutableRefObject<() => void>
}

export function useChatStreaming(
  store: StreamStore,
  incrementUsage: () => void,
): UseChatStreamingResult {
  const streamCtxRef = useRef<{
    sessionId: string
    msgId: string
    sessionToolType: ToolType
  } | null>(null)
  const streamResultRef = useRef<{ toolUsed: string; serverUsageToday?: number } | null>(null)
  const streamAbortRef = useRef<AbortController | null>(null)
  const incrementUsageRef = useRef(incrementUsage)
  incrementUsageRef.current = incrementUsage

  const onDisplayUpdateStable = useCallback((text: string) => {
    const c = streamCtxRef.current
    if (c) applyStreamText(c.sessionId, c.msgId, text)
  }, [])

  const onRevealCompleteStable = useCallback((finalText: string) => {
    const c = streamCtxRef.current
    const r = streamResultRef.current
    if (!c) return
    flushSync(() => {
      store.finalizeMessage(c.sessionId, c.msgId, { toolUsed: r?.toolUsed || undefined })
    })
    const preview = finalText.trim().split('\n')[0] ?? 'Neue Antwort'
    store.notifyAnswerReady(c.sessionId, c.sessionToolType, preview)
    if (typeof r?.serverUsageToday === 'number') {
      dispatchServerUsage(r.serverUsageToday)
    } else {
      incrementUsageRef.current()
    }
    store.setSessionStreaming(c.sessionId, false)
    streamCtxRef.current = null
    streamResultRef.current = null
  }, [store])

  const deliberate = useDeliberateStream({
    charsPerSecond: 80,
    initialDelayMs: 200,
    onDisplayUpdate: onDisplayUpdateStable,
    onRevealComplete: onRevealCompleteStable,
  })

  const [thinkingSession, setThinkingSession] = useState<{
    sessionId: string
    messageId: string
    toolType: ToolType
  } | null>(null)

  const handleThinkingComplete = useCallback(() => {
    setThinkingSession(null)
    const c = streamCtxRef.current
    const cps = c ? STREAM_CHARS_PER_SECOND[c.sessionToolType] ?? 80 : 80
    deliberate.startReveal(cps)
  }, [deliberate])

  const stopStreaming = useCallback(() => {
    if (streamAbortRef.current) {
      // Network still in progress - abort the fetch; AbortError catch handles cleanup
      streamAbortRef.current.abort()
      streamAbortRef.current = null
    } else {
      // Network done but deliberate animation still running
      const c = streamCtxRef.current
      if (c) {
        deliberate.reset()
        setThinkingSession(null)
        const msgs = store.sessions[c.sessionId]?.messages ?? []
        const currentText = msgs.find(m => m.id === c.msgId)?.text ?? ''
        if (currentText.trim()) {
          store.finalizeMessage(c.sessionId, c.msgId, {})
        } else {
          store.deleteMessage(c.sessionId, c.msgId)
        }
        store.setSessionStreaming(c.sessionId, false)
        streamCtxRef.current = null
        streamResultRef.current = null
      }
    }
  }, [deliberate, store])

  // Abort any in-flight stream on unmount
  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort()
      streamAbortRef.current = null
    }
  }, [])

  return {
    deliberate,
    thinkingSession,
    setThinkingSession,
    stopStreaming,
    handleThinkingComplete,
    streamCtxRef,
    streamAbortRef,
    streamResultRef,
    incrementUsageRef,
  }
}
