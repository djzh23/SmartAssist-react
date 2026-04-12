import type { ChatMessage, ToolType } from '../../types'
import { BriefcaseBusiness, Settings2 } from 'lucide-react'
import JobAnalysisCard from './JobAnalysisCard'
import LearningResponse from './LearningResponse'
import ProgrammingResponse from './ProgrammingResponse'
import InterviewResponse from './InterviewResponse'
import { RenderedMarkdown } from './RenderedMarkdown'
import { parseLearningResponse } from '../../utils/parseLearningResponse'
import StreamingTextCursor from './StreamingTextCursor'

interface Props {
  msg: ChatMessage
  toolType?: ToolType
  targetLang?: string
  nativeLang?: string
  targetLangCode?: string
  progLang?: string
  useLanguageCard?: boolean
  /** Blinkender Cursor während gedrosseltem Stream-Rendering */
  showStreamCursor?: boolean
}

export default function MessageBubble({
  msg,
  toolType,
  targetLang = 'Spanish',
  nativeLang = 'German',
  targetLangCode = 'es',
  progLang = 'csharp',
  useLanguageCard = false,
  showStreamCursor = false,
}: Props) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isJobAnalyzerReply = !msg.isUser && (toolType === 'jobanalyzer' || msg.toolUsed === 'analyze_job')

  if (!msg.isUser && toolType === 'language' && useLanguageCard) {
    // 1. New structured ---ZIELSPRACHE--- format (preferred)
    const structured = parseLearningResponse(msg.text)
    if (structured?.isStructured) {
      return (
        <LearningResponse
          data={{
            targetLanguageText: structured.targetText,
            nativeLanguageText: structured.translationText,
            learnContext: structured.contextText ?? undefined,
            learnVariants: structured.variantsText ?? undefined,
            learnTip: structured.tipText ?? undefined,
          }}
          targetLang={targetLang}
          nativeLang={nativeLang}
          targetLangCode={targetLangCode}
          timestamp={msg.timestamp}
          showStreamCursor={showStreamCursor}
        />
      )
    }

    // 2. Backend returned a structured LearningData object (legacy / non-streaming)
    if (msg.learningData) {
      return (
        <LearningResponse
          data={msg.learningData}
          targetLang={targetLang}
          nativeLang={nativeLang}
          targetLangCode={targetLangCode}
          timestamp={msg.timestamp}
          showStreamCursor={showStreamCursor}
        />
      )
    }

    // 3. Fallback: render ANY language response as a LearningResponse card so
    //    (a) the user always sees the purple bordered card style, and
    //    (b) the audio button is available for the whole text.
    //    An empty nativeLanguageText hides the translation card automatically.
    if (msg.text.trim()) {
      return (
        <LearningResponse
          data={{
            targetLanguageText: msg.text.trim(),
            nativeLanguageText: '',
          }}
          targetLang={targetLang}
          nativeLang={nativeLang}
          targetLangCode={targetLangCode}
          timestamp={msg.timestamp}
          showStreamCursor={showStreamCursor}
        />
      )
    }
  }

  if (isJobAnalyzerReply) {
    return (
      <div className="flex w-full animate-slide-up flex-col items-start gap-1">
        <JobAnalysisCard text={msg.text} showStreamCursor={showStreamCursor} />
        <div className="flex items-center gap-2 pl-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-600">
            <BriefcaseBusiness size={11} />
            <span>Stellenanalyse</span>
          </span>
          <span className="text-[11px] text-slate-400">{time}</span>
        </div>
      </div>
    )
  }

  if (!msg.isUser && toolType === 'programming') {
    return (
      <ProgrammingResponse
        text={msg.text}
        progLang={progLang}
        timestamp={msg.timestamp}
        showStreamCursor={showStreamCursor}
      />
    )
  }

  if (!msg.isUser && toolType === 'interview') {
    return (
      <InterviewResponse
        text={msg.text}
        timestamp={msg.timestamp}
        showStreamCursor={showStreamCursor}
      />
    )
  }

  if (!msg.isUser) {
    return (
      <div className="self-start flex max-w-[85%] animate-slide-up flex-col gap-1">
        <div className="break-words rounded-[4px_18px_18px_18px] bg-slate-100 px-3.5 py-2.5 text-sm leading-relaxed text-slate-800">
          <RenderedMarkdown content={msg.text} />
          {showStreamCursor ? <StreamingTextCursor /> : null}
        </div>
        <div className="flex items-center gap-2 px-1">
          {msg.toolUsed && msg.toolUsed !== 'analyze_job' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-600">
              <Settings2 size={11} />
              <span>{msg.toolUsed.replace(/_/g, ' ')}</span>
            </span>
          )}
          <span className="text-[11px] text-slate-400">{time}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex max-w-[72%] animate-slide-up flex-col items-end gap-1 self-end">
      <div className="break-words whitespace-pre-wrap rounded-[18px_18px_4px_18px] bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-white">
        {msg.text}
      </div>
      <span className="px-1 text-[11px] text-slate-400">{time}</span>
    </div>
  )
}
