import { useEffect, useRef, type ReactNode, type RefObject } from 'react'
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
}: Props) {
  const prevSeqRef = useRef(0)

  const typingOnThisSession =
    streamingPlaceholder !== null
    && viewSessionId !== null
    && streamingPlaceholder.sessionId === viewSessionId

  useEffect(() => {
    const el = scrollContainerRef?.current
    if (!el) return

    const forced = scrollToBottomSeq > prevSeqRef.current
    prevSeqRef.current = scrollToBottomSeq

    const distance = el.scrollHeight - el.scrollTop - el.clientHeight
    if (forced || distance <= STICK_THRESHOLD_PX) {
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

  if (messages.length === 0 && !typingOnThisSession) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
        <MessageCircle size={40} className="text-slate-200" />
        <p className="font-medium text-slate-400">Starte ein neues Gespräch</p>
        <p className="text-sm text-slate-300">Schreib eine Nachricht unten oder tippe auf Neues Gespräch</p>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4 py-2">
      {(() => {
        let userSeen = false

        return messages.map(msg => {
          const useLanguageCard = toolType === 'language' && !msg.isUser && userSeen
          if (msg.isUser) userSeen = true

          const isPlaceholderTyping =
            typingOnThisSession
            && streamingPlaceholder!.messageId === msg.id
            && !msg.isUser
            && msg.text.trim() === ''

          if (isPlaceholderTyping) {
            if (thinkingSlot) {
              return (
                <div key={msg.id} className="self-start">
                  {thinkingSlot}
                </div>
              )
            }
            return <TypingDots key={msg.id} />
          }

          const showStreamCursor =
            streamCursorActive
            && streamCursorMessageId !== null
            && streamCursorMessageId === msg.id
            && !msg.isUser

          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              toolType={toolType}
              targetLang={targetLang}
              nativeLang={nativeLang}
              targetLangCode={targetLangCode}
              progLang={progLang}
              useLanguageCard={useLanguageCard}
              showStreamCursor={showStreamCursor}
            />
          )
        })
      })()}
    </div>
  )
}
