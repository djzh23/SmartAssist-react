import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { ToolType } from '../../types'

const PLACEHOLDERS: Record<ToolType, string> = {
  general: 'Nachricht schreiben…',
  jobanalyzer: 'Stellenanzeige einfügen…',
  language: 'Nachricht schreiben…',
  programming: 'Codefrage schreiben…',
  interview: 'Nachricht schreiben…',
}

interface Props {
  toolType: ToolType
  isLoading: boolean
  /** Kein aktiver Chat - Eingabe gesperrt (z. B. nach Tool-Wechsel ohne neue Session). */
  noActiveSession?: boolean
  onSend: (text: string) => void
}

export default function ChatInput({ toolType, isLoading, noActiveSession = false, onSend }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const near = text.length > 3500

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`
  }, [text])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading || noActiveSession) return
    onSend(trimmed)
    setText('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div className="sticky bottom-[calc(56px+env(safe-area-inset-bottom))] z-20 flex-shrink-0 border-t border-stone-700/40 bg-app-muted/94 px-2.5 pb-2 pt-1.5 backdrop-blur-sm min-[391px]:px-3 min-[391px]:pt-2 min-[769px]:bottom-0 min-[769px]:px-4 min-[769px]:py-3">
      <div className="mx-auto max-w-3xl">
        <div
          className={[
            'relative overflow-hidden rounded-[18px] border bg-app-raised/95 transition-all duration-150 shadow-[0_7px_24px_-18px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] min-[391px]:rounded-2xl',
            text.length > 0 || isLoading
              ? 'border-primary/70 shadow-[0_0_0_1.5px_rgba(217,119,6,0.14),0_7px_24px_-16px_rgba(0,0,0,0.75)] min-[391px]:shadow-[0_0_0_2px_rgba(217,119,6,0.15),0_8px_30px_-20px_rgba(0,0,0,0.75)]'
              : noActiveSession
                ? 'border-stone-600/40 bg-stone-900/45'
                : 'border-stone-600/45 hover:border-stone-500/60',
          ].join(' ')}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              noActiveSession
                ? 'Neues Gespräch starten…'
                : PLACEHOLDERS[toolType]
            }
            maxLength={4000}
            rows={1}
            disabled={isLoading || noActiveSession}
            className="block max-h-[150px] min-h-[44px] w-full resize-none overflow-y-auto border-none bg-transparent px-3 pb-8 pr-13 pt-2.5 text-[14px] text-stone-100 outline-none placeholder-stone-500 disabled:opacity-50 min-[391px]:min-h-[46px] min-[391px]:pr-14 min-[391px]:pt-3 min-[769px]:px-4 min-[769px]:pb-8 min-[769px]:pr-16"
          />

          <button
            onClick={handleSend}
            disabled={isLoading || noActiveSession || !text.trim()}
            className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white transition-all duration-150 hover:bg-primary-hover active:scale-95 disabled:bg-stone-700/60 disabled:text-stone-400 min-[391px]:bottom-2.5 min-[391px]:right-2.5 min-[391px]:h-9 min-[391px]:w-9 min-[769px]:h-10 min-[769px]:w-10"
            aria-label="Nachricht senden"
          >
            {isLoading
              ? <Loader2 size={15} className="animate-spin min-[391px]:h-4 min-[391px]:w-4" />
              : <Send size={15} className="min-[391px]:h-4 min-[391px]:w-4" />
            }
          </button>

          <div className="pointer-events-none absolute bottom-2 left-3 right-14 flex items-center justify-end min-[769px]:left-4 min-[769px]:right-16">
            <span className={`text-[10px] ${near ? 'text-red-400 font-semibold' : 'text-stone-500/85'} min-[769px]:text-[11px]`}>
              {text.length}/4000
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
