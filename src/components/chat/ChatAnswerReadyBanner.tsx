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

export default function ChatAnswerReadyBanner() {
  const navigate = useNavigate()
  const { answerReadyToast, dismissAnswerToast, setActiveSession } = useChatSessions()

  if (!answerReadyToast) return null

  const toolLabel = TOOL_LABEL[answerReadyToast.toolType] ?? 'Chat'

  return (
    <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <MessageCircle size={16} className="mt-0.5 flex-shrink-0 text-amber-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-amber-900">Antwort fertig in einem anderen Gespräch</p>
            <p className="text-[11px] text-amber-800/90">{toolLabel}</p>
            <p className="mt-0.5 line-clamp-2 text-xs text-amber-950/80">{answerReadyToast.preview}</p>
          </div>
        </div>
        <div className="flex w-full flex-shrink-0 items-center gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => {
              const q = TOOL_TO_QUERY[answerReadyToast.toolType]
              navigate(`/chat?tool=${encodeURIComponent(q)}`)
              setActiveSession(answerReadyToast.sessionId)
              dismissAnswerToast()
            }}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Zum Gespräch
          </button>
          <button
            type="button"
            onClick={dismissAnswerToast}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-700 hover:bg-amber-100"
            aria-label="Hinweis schließen"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
