import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { ChatMessage, ToolType } from '../../types'
import type { StreamingPlaceholder } from '../../context/ChatSessionsProvider'
import MessageBubble from './MessageBubble'
import { MessageCircle } from 'lucide-react'

/** Pixels from bottom to still treat as "following" the stream (auto-scroll). */
const STICK_THRESHOLD_PX = 120

interface Props {
  messages: ChatMessage[]
  viewSessionId: string | null
  streamingPlaceholder: StreamingPlaceholder | null
  toolType?: ToolType
  targetLang?: string
  nativeLang?: string
  targetLangCode?: string
  progLang?: string
  /** Ersetzt Typing-Dots während der Thinking-Phase (leerer Assistant-Placeholder). */
  thinkingSlot?: ReactNode
  streamCursorActive?: boolean
  streamCursorMessageId?: string | null
  /** Scroll area (e.g. ChatPage); stick-to-bottom uses this element. */
  scrollContainerRef?: RefObject<HTMLDivElement | null>
  /** Increment after each send to force scroll to latest (user message + reply). */
  scrollToBottomSeq?: number
  /** Current session (for saving assistant replies as notes). */
  activeSessionId?: string | null
}

function TypingDots() {
  return (
    <div className="self-start bg-slate-100 rounded-[18px_18px_18px_4px] px-4 py-3 flex gap-1.5 items-center">
      {[0, 150, 300].map(delay => (
        <span
          key={delay}
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce-dot"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  )
}

export default function MessageList({
  messages,
  viewSessionId,
  streamingPlaceholder,
  toolType,
  targetLang,
  nativeLang,
  targetLangCode,
  progLang,
  thinkingSlot,
  streamCursorActive = false,
  streamCursorMessageId = null,
  scrollContainerRef,
  scrollToBottomSeq = 0,
  activeSessionId = null,
}: Props) {
  const prevSeqRef = useRef(0)
  const autoFollowRef = useRef(true)
  const lastScrollTopRef = useRef(0)

  const typingOnThisSession =
    streamingPlaceholder !== null
    && viewSessionId !== null
    && streamingPlaceholder.sessionId === viewSessionId

  useEffect(() => {
    const el = scrollContainerRef?.current
    if (!el) return

    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight
      const scrollingUp = el.scrollTop < lastScrollTopRef.current
      lastScrollTopRef.current = el.scrollTop
      if (distance <= STICK_THRESHOLD_PX) {
        autoFollowRef.current = true
        return
      }
      if (scrollingUp) {
        autoFollowRef.current = false
      }
    }

    lastScrollTopRef.current = el.scrollTop
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [scrollContainerRef])

  useEffect(() => {
    const el = scrollContainerRef?.current
    if (!el) return

    const forced = scrollToBottomSeq > prevSeqRef.current
    prevSeqRef.current = scrollToBottomSeq
    if (forced) autoFollowRef.current = true

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    const shouldFollow = forced || autoFollowRef.current || distance <= STICK_THRESHOLD_PX
    if (shouldFollow) {
      el.scrollTo({
        top: el.scrollHeight,
        behavior: forced ? 'smooth' : 'auto',
      })
    }
  }, [
    messages,
    streamingPlaceholder,
    typingOnThisSession,
    streamCursorActive,
    scrollToBottomSeq,
    scrollContainerRef,
  ])

  // Precompute the "previous user message has been seen" flag once per render so the
  // virtualised row renderer below can stay pure (no shared state during iteration).
  const useLanguageCardByIndex = useMemo(() => {
    const flags = new Array<boolean>(messages.length)
    let userSeen = false
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i]
      flags[i] = toolType === 'language' && !msg.isUser && userSeen
      if (msg.isUser) userSeen = true
    }
    return flags
  }, [messages, toolType])

  // Render the message list as a row-virtualised column inside the same scroll container
  // the page already manages. The scroll-stick effects above keep working because the
  // virtualiser exposes the same scrollHeight via the spacer it sizes to totalSize.
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => scrollContainerRef?.current ?? null,
    // Rough first guess; dynamic measurement below corrects it once each row mounts.
    estimateSize: () => 96,
    overscan: 6,
    measureElement: typeof window === 'undefined'
      ? undefined
      : element => element?.getBoundingClientRect().height ?? 0,
    getItemKey: index => messages[index].id,
  })

  if (messages.length === 0 && !typingOnThisSession) {
    const noActiveSession = viewSessionId === null
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <MessageCircle size={40} className="text-slate-200" />
        <p className="font-medium text-slate-400">
          {noActiveSession ? 'Kein Gespräch aktiv' : 'Starte ein neues Gespräch'}
        </p>
        <p className="max-w-md text-sm text-slate-300">
          {noActiveSession
            ? 'Tippe in der Seitenleiste auf „Neues Gespräch“, um für dieses Tool eine Session zu beginnen. Danach kannst du hier schreiben.'
            : 'Schreib eine Nachricht unten oder tippe auf Neues Gespräch'}
        </p>
      </div>
    )
  }

  const items = virtualizer.getVirtualItems()

  return (
    <div
      className="relative w-full"
      style={{ height: `${virtualizer.getTotalSize()}px` }}
    >
      {items.map(virtualRow => {
        const msg = messages[virtualRow.index]
        const useLanguageCard = useLanguageCardByIndex[virtualRow.index]

        const isPlaceholderTyping =
          typingOnThisSession
          && streamingPlaceholder!.messageId === msg.id
          && !msg.isUser
          && msg.text.trim() === ''

        const showStreamCursor =
          streamCursorActive
          && streamCursorMessageId !== null
          && streamCursorMessageId === msg.id
          && !msg.isUser

        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            className="absolute left-0 top-0 w-full px-0 pb-3 min-[391px]:pb-3.5"
            style={{ transform: `translateY(${virtualRow.start}px)` }}
          >
            {isPlaceholderTyping
              ? (thinkingSlot
                ? <div className="self-start">{thinkingSlot}</div>
                : <TypingDots />)
              : (
                <MessageBubble
                  msg={msg}
                  toolType={toolType}
                  targetLang={targetLang}
                  nativeLang={nativeLang}
                  targetLangCode={targetLangCode}
                  progLang={progLang}
                  useLanguageCard={useLanguageCard}
                  showStreamCursor={showStreamCursor}
                  activeSessionId={activeSessionId}
                />
              )}
          </div>
        )
      })}
    </div>
  )
}
