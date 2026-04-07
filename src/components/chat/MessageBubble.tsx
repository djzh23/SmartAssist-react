import type { ChatMessage, ToolType } from '../../types'
import JobAnalysisCard from './JobAnalysisCard'
import LearningResponse from './LearningResponse'
import ProgrammingResponse from './ProgrammingResponse'
import InterviewResponse from './InterviewResponse'
import CodeBlock from './CodeBlock'
import { parseSegments } from '../../utils/markdownRenderer'

interface Props {
  msg: ChatMessage
  toolType?: ToolType
  targetLang?: string
  nativeLang?: string
  targetLangCode?: string
  progLang?: string
}

export default function MessageBubble({
  msg,
  toolType,
  targetLang = 'Spanish',
  nativeLang = 'German',
  targetLangCode = 'es',
  progLang = 'csharp',
}: Props) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isJobAnalyzerReply = !msg.isUser && (toolType === 'jobanalyzer' || msg.toolUsed === 'analyze_job')

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
  if (isJobAnalyzerReply) {
    return (
      <div className="flex flex-col items-start gap-1 animate-slide-up w-full">
        <JobAnalysisCard text={msg.text} />
        <div className="flex items-center gap-2 pl-1">
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
            Job Analyzer
          </span>
          <span className="text-[11px] text-slate-400">{time}</span>
        </div>
      </div>
    )
  }

  // Programming mode â€” syntax-highlighted code blocks
  if (!msg.isUser && toolType === 'programming') {
    return (
      <ProgrammingResponse
        text={msg.text}
        progLang={progLang}
        timestamp={msg.timestamp}
      />
    )
  }

  // Interview mode â€” professional structured response
  if (!msg.isUser && toolType === 'interview') {
    return (
      <InterviewResponse
        text={msg.text}
        timestamp={msg.timestamp}
      />
    )
  }

  // Standard bubble â€” with code-fence support for assistant messages
  if (!msg.isUser) {
    const segments = parseSegments(msg.text)
    const hasCode = segments.some(s => s.type === 'code')

    return (
      <div className="self-start animate-slide-up flex flex-col gap-1 max-w-[85%]">
        <div className="bg-slate-100 text-slate-800 rounded-[4px_18px_18px_18px] px-3.5 py-2.5 text-sm leading-relaxed break-words">
          {hasCode
            ? segments.map((seg, i) =>
                seg.type === 'code'
                  ? <CodeBlock key={i} code={seg.content} language={seg.language} />
                  : <span key={i} className="whitespace-pre-wrap">{seg.content}</span>
              )
            : <span className="whitespace-pre-wrap">{msg.text}</span>}
        </div>
        <div className="flex items-center gap-2 px-1">
          {msg.toolUsed && msg.toolUsed !== 'analyze_job' && (
            <span className="text-[11px] bg-cyan-50 text-cyan-600 border border-cyan-200 rounded-full px-2.5 py-0.5 font-medium">
              âš™ {msg.toolUsed.replace(/_/g, ' ')}
            </span>
          )}
          <span className="text-[11px] text-slate-400">{time}</span>
        </div>
      </div>
    )
  }

  // User bubble
  return (
    <div className="flex flex-col gap-1 animate-slide-up max-w-[72%] self-end items-end">
      <div className="px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words bg-primary text-white rounded-[18px_18px_4px_18px]">
        {msg.text}
      </div>
      <span className="text-[11px] text-slate-400 px-1">{time}</span>
    </div>
  )
}

