import { useState, useRef, useEffect } from 'react'
import { Send, Loader2 } from 'lucide-react'
import type { ToolType } from '../../types'

const PLACEHOLDERS: Record<ToolType, string> = {
  general:     'Type a message…',
  weather:     'Ask about weather in any city… e.g. "What\'s the weather in Berlin?"',
  jobanalyzer: 'Paste a job posting or URL to analyze…',
  jokes:       'Ask for a joke… e.g. "Tell me a programming joke"',
  language:    'Write something and I\'ll translate it for you…',
}

interface Props {
  toolType: ToolType
  isLoading: boolean
  onSend: (text: string) => void
}

export default function ChatInput({ toolType, isLoading, onSend }: Props) {
  const [text, setText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const near = text.length > 3500

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [text])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed)
    setText('')
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex-shrink-0 border-t border-slate-100 bg-white px-4 py-3">
      <div className="max-w-3xl mx-auto flex items-end gap-2">
        <div
          className={[
            'flex-1 border rounded-xl bg-white transition-all duration-150 overflow-hidden',
            text.length > 0 || isLoading
              ? 'border-primary shadow-[0_0_0_3px_rgba(124,58,237,0.08)]'
              : 'border-slate-200 hover:border-slate-300',
          ].join(' ')}
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={PLACEHOLDERS[toolType]}
            maxLength={4000}
            rows={1}
            disabled={isLoading}
            className="block w-full resize-none border-none outline-none bg-transparent px-4 pt-3 pb-2 text-sm text-slate-800 placeholder-slate-400 disabled:opacity-50"
          />
          <div className="flex items-center justify-between px-4 pb-2.5">
            <span className="text-[11px] text-slate-300">Enter to send · Shift+Enter for newline</span>
            <span className={`text-[11px] ${near ? 'text-red-500 font-semibold' : 'text-slate-300'}`}>
              {text.length}/4000
            </span>
          </div>
        </div>

        <button
          onClick={handleSend}
          disabled={isLoading || !text.trim()}
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
