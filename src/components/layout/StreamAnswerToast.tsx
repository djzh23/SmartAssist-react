import { useNavigate } from 'react-router-dom'
import { MessageCircle, X } from 'lucide-react'
import { useChatSessions, TOOL_TO_QUERY } from '../../hooks/useChatSessions'

const TOOL_LABEL: Record<string, string> = {
  general: 'Allgemeiner Chat',
  jobanalyzer: 'Stellenanalyse',
  language: 'Sprachen',
  programming: 'Programmierung',
  interview: 'Interview',
}

export default function StreamAnswerToast() {
  const navigate = useNavigate()
  const { answerReadyToast, dismissAnswerToast, setActiveSession } = useChatSessions()

  if (!answerReadyToast) return null

  const toolLabel = TOOL_LABEL[answerReadyToast.toolType] ?? 'Chat'

  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[60] w-[min(92vw,28rem)] -translate-x-1/2 px-3">
      <div
        role="status"
        className="pointer-events-auto flex items-start gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 shadow-lg"
      >
        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <MessageCircle size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800">Antwort bereit</p>
          <p className="mt-0.5 text-xs text-slate-500">{toolLabel}</p>
          <p className="mt-1 line-clamp-2 text-xs text-slate-600">{answerReadyToast.preview}</p>
          <button
            type="button"
            onClick={() => {
              const q = TOOL_TO_QUERY[answerReadyToast.toolType]
              navigate(`/chat?tool=${encodeURIComponent(q)}`)
              setActiveSession(answerReadyToast.sessionId)
              dismissAnswerToast()
            }}
            className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Zum Chat
          </button>
        </div>
        <button
          type="button"
          onClick={dismissAnswerToast}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
