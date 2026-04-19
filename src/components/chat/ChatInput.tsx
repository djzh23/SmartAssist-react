import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { ToolType } from '../../types'

const PLACEHOLDERS: Record<ToolType, string> = {
  general:     'Schreib eine Nachricht…',
  jobanalyzer: 'Stellenbeschreibung oder Link einfügen…',
  language:    'Schreib etwas, ich helfe dir beim Übersetzen und Üben…',
  programming: 'Fragen zu Algorithmen, Datenstrukturen oder Code…',
  interview:   'Stellenausschreibung oder URL einfügen, oder Fragen zur Vorbereitung…',
}

interface Props {
  toolType: ToolType
  isLoading: boolean
  /** Kein aktiver Chat — Eingabe gesperrt (z. B. nach Tool-Wechsel ohne neue Session). */
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
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
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
    <div className="flex-shrink-0 border-t border-stone-600/35 bg-app-muted/95 px-4 py-3 backdrop-blur-sm max-[768px]:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <div
          className={[
            'flex-1 border rounded-xl bg-app-raised/95 transition-all duration-150 overflow-hidden',
            text.length > 0 || isLoading
              ? 'border-primary shadow-[0_0_0_3px_rgba(217,119,6,0.2)]'
              : noActiveSession
                ? 'border-stone-600/40 bg-stone-900/40'
                : 'border-stone-600/45 hover:border-stone-500/55',
          ].join(' ')}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={
              noActiveSession
                ? 'Wähle zuerst „Neues Gespräch“ in der Seitenleiste …'
                : PLACEHOLDERS[toolType]
            }
            maxLength={4000}
            rows={1}
            disabled={isLoading || noActiveSession}
            className="block max-h-[120px] w-full resize-none overflow-y-auto border-none bg-transparent px-4 pb-2 pt-3 text-sm text-stone-100 outline-none placeholder-stone-500 disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-4 pb-2.5">
            <span className="text-[11px] text-stone-500">Enter zum Senden · Umschalt+Enter für neue Zeile</span>
            <span className={`text-[11px] ${near ? 'text-red-400 font-semibold' : 'text-stone-500'}`}>
              {text.length}/4000
            </span>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading || noActiveSession || !text.trim()}
          className="w-10 h-10 mb-[3px] flex-shrink-0 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.04] active:scale-95"
        >
          {isLoading
            ? <Loader2 size={17} className="animate-spin" />
            : <Send size={17} />
          }
        </button>
      </div>
    </div>
  )
}
