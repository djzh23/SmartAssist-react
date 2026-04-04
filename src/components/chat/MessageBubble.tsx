import type { ChatMessage } from '../../types'
import JobAnalysisCard from './JobAnalysisCard'
import LearningResponse from './LearningResponse'

interface Props {
  msg: ChatMessage
  targetLang?: string
  nativeLang?: string
  targetLangCode?: string
}

export default function MessageBubble({ msg, targetLang = 'Spanish', nativeLang = 'German', targetLangCode = 'es' }: Props) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  // Language learning response
  if (!msg.isUser && msg.learningData) {
    return (
      <LearningResponse
        data={msg.learningData}
        targetLang={targetLang}
        nativeLang={nativeLang}
        targetLangCode={targetLangCode}
        timestamp={msg.timestamp}
      />
    )
  }

  // Job analysis response
  if (!msg.isUser && msg.toolUsed === 'analyze_job') {
    return (
      <div className="flex flex-col items-start gap-1 animate-slide-up w-full">
        <JobAnalysisCard text={msg.text} />
        <span className="text-[11px] text-slate-400 pl-1">{time}</span>
      </div>
    )
  }

  // Standard bubble
  return (
    <div className={`flex flex-col gap-1 animate-slide-up max-w-[72%] ${msg.isUser ? 'self-end items-end' : 'self-start items-start'}`}>
      <div
        className={[
          'px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
          msg.isUser
            ? 'bg-primary text-white rounded-[18px_18px_4px_18px]'
            : 'bg-slate-100 text-slate-800 rounded-[18px_18px_18px_4px]',
        ].join(' ')}
      >
        {msg.text}
      </div>

      <div className="flex items-center gap-2 px-1">
        {msg.toolUsed && msg.toolUsed !== 'analyze_job' && (
          <span className="text-[11px] bg-violet-50 text-violet-600 border border-violet-200 rounded-full px-2.5 py-0.5 font-medium">
            ⚙ {msg.toolUsed.replace(/_/g, ' ')}
          </span>
        )}
        <span className="text-[11px] text-slate-400">{time}</span>
      </div>
    </div>
  )
}
