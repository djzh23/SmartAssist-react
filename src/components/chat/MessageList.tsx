import { useEffect, useRef } from 'react'
import type { ChatMessage, ToolType } from '../../types'
import MessageBubble from './MessageBubble'
import { MessageCircle } from 'lucide-react'

interface Props {
  messages: ChatMessage[]
  isLoading: boolean
  toolType?: ToolType
  targetLang?: string
  nativeLang?: string
  targetLangCode?: string
  progLang?: string
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
  messages, isLoading, toolType,
  targetLang, nativeLang, targetLangCode, progLang,
}: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
        <MessageCircle size={40} className="text-slate-200" />
        <p className="text-slate-400 font-medium">Start a new conversation</p>
        <p className="text-slate-300 text-sm">Type a message below or click "+ New Chat"</p>
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
            />
          )
        })
      })()}
      {isLoading && <TypingDots />}
      <div ref={bottomRef} />
    </div>
  )
}
