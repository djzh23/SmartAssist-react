import { useEffect, useRef, type ReactNode } from 'react'
import type { ChatMessage, ToolType } from '../../types'
import type { StreamingPlaceholder } from '../../context/ChatSessionsProvider'
import MessageBubble from './MessageBubble'
import { MessageCircle } from 'lucide-react'

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
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  const typingOnThisSession =
    streamingPlaceholder !== null
    && viewSessionId !== null
    && streamingPlaceholder.sessionId === viewSessionId

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingPlaceholder, typingOnThisSession])

  if (messages.length === 0 && !typingOnThisSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <MessageCircle size={40} className="text-slate-200" />
        <p className="text-slate-400 font-medium">Starte ein neues Gespräch</p>
        <p className="text-slate-300 text-sm">Schreib eine Nachricht unten oder tippe auf Neues Gespräch</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
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
      <div ref={bottomRef} />
    </div>
  )
}
