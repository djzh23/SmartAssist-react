import type { ChatMessage, ToolType } from '../../types'
import { BriefcaseBusiness, Settings2 } from 'lucide-react'
import AssistantNoteSaveButton from './AssistantNoteSaveButton'
import JobAnalysisCard from './JobAnalysisCard'
import LearningResponse from './LearningResponse'
import ProgrammingResponse from './ProgrammingResponse'
import InterviewResponse from './InterviewResponse'
import { RenderedMarkdown } from './RenderedMarkdown'
import { normalizeLearningResponseMarkers, parseLearningResponse } from '../../utils/parseLearningResponse'
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
  activeSessionId?: string | null
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
  activeSessionId = null,
}: Props) {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const isJobAnalyzerReply = !msg.isUser && (toolType === 'jobanalyzer' || msg.toolUsed === 'analyze_job')

  if (!msg.isUser && toolType === 'language' && useLanguageCard) {
    // 1. New structured ---ZIELSPRACHE--- format (preferred)
    const structured = parseLearningResponse(msg.text)
    if (structured?.isStructured) {
      return (
        <>
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
          <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
        </>
      )
    }

    // 2. Backend returned a structured LearningData object (legacy / non-streaming)
    if (msg.learningData) {
      return (
        <>
          <LearningResponse
            data={msg.learningData}
            targetLang={targetLang}
            nativeLang={nativeLang}
            targetLangCode={targetLangCode}
            timestamp={msg.timestamp}
            showStreamCursor={showStreamCursor}
          />
          <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
        </>
      )
    }

    // 3. Structured answer still streaming or delimiter mismatch: avoid one mega-card
    //    (wrong TTS + raw --- markers). Show placeholder until parse succeeds.
    if (msg.text.trim()) {
      const normalized = normalizeLearningResponseMarkers(msg.text)
      const looksLikeStructured = /---\s*ZIELSPRACHE\s*---/i.test(normalized)
      if (looksLikeStructured && !structured && showStreamCursor) {
        return (
          <div className="flex max-w-[85%] animate-slide-up flex-col gap-1 self-start">
            <div className="rounded-[4px_18px_18px_18px] border border-amber-500/35 bg-amber-950/45 px-3.5 py-3 text-sm leading-relaxed text-amber-50">
              <p className="text-[13px] font-medium text-amber-100">Antwort wird strukturiert …</p>
              <p className="mt-1 text-[12px] text-amber-200/90">
                Kurz warten, bis Zielsprache und Übersetzung vollständig geliefert sind.
              </p>
              <StreamingTextCursor />
            </div>
            <span className="px-1 text-[11px] text-stone-500">{time}</span>
          </div>
        )
      }

      // 4. Plain or malformed-but-finished reply: single card + audio on full text
      return (
        <>
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
          <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
        </>
      )
    }
  }

  if (isJobAnalyzerReply) {
    return (
      <div className="flex w-full animate-slide-up flex-col items-start gap-1">
        <JobAnalysisCard text={msg.text} showStreamCursor={showStreamCursor} />
        <div className="flex items-center gap-2 pl-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/45 bg-sky-100/95 px-2 py-0.5 text-[11px] font-medium text-sky-900">
            <BriefcaseBusiness size={11} />
            <span>Stellenanalyse</span>
          </span>
          <span className="text-[11px] text-stone-500">{time}</span>
        </div>
        <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
      </div>
    )
  }

  if (!msg.isUser && toolType === 'programming') {
    return (
      <>
        <ProgrammingResponse
          text={msg.text}
          progLang={progLang}
          timestamp={msg.timestamp}
          showStreamCursor={showStreamCursor}
        />
        <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
      </>
    )
  }

  if (!msg.isUser && toolType === 'interview') {
    return (
      <>
        <InterviewResponse
          text={msg.text}
          timestamp={msg.timestamp}
          showStreamCursor={showStreamCursor}
        />
        <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
      </>
    )
  }

  if (!msg.isUser) {
    return (
      <div className="self-start flex max-w-[85%] animate-slide-up flex-col gap-1">
        <div className="break-words rounded-[4px_18px_18px_18px] border border-stone-400/55 bg-app-parchment px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 shadow-[0_10px_28px_-6px_rgba(0,0,0,0.45)]">
          <RenderedMarkdown content={msg.text} variant="assistant" />
          {showStreamCursor ? <StreamingTextCursor /> : null}
        </div>
        <div className="flex items-center gap-2 px-1">
          {msg.toolUsed && msg.toolUsed !== 'analyze_job' && (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/45 bg-amber-100/95 px-2.5 py-0.5 text-[11px] font-medium text-amber-950">
              <Settings2 size={11} />
              <span>{msg.toolUsed.replace(/_/g, ' ')}</span>
            </span>
          )}
          <span className="text-[11px] text-stone-500">{time}</span>
        </div>
        <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
      </div>
    )
  }

  return (
    <div className="flex max-w-[72%] animate-slide-up flex-col items-end gap-1 self-end">
      <div className="break-words whitespace-pre-wrap rounded-[18px_18px_4px_18px] bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-white shadow-[0_8px_22px_-4px_rgba(0,0,0,0.4)]">
        {msg.text}
      </div>
      <span className="px-1 text-[11px] text-stone-500">{time}</span>
    </div>
  )
}
