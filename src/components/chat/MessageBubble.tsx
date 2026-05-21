import { memo, useMemo, type CSSProperties } from 'react'
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
import {
  CHAT_FEATURE_ACTIVE_BG_ALPHA,
  getChatFeatureColor,
  getChatFeatureOnAccentFg,
  getChatFeatureSolidFill,
  hexToRgba,
} from '../../utils/chatFeatureColors'

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

function MessageBubble({
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

  // Stable style objects per bubble: tool colours are pure functions of toolType / toolUsed,
  // so memoising keyed by the input strings prevents a fresh object on every parent render
  // and keeps the React diff cheap when a bubble re-renders for an unrelated reason.
  const jobAnalyzerBorderStyle = useMemo<CSSProperties>(
    () => ({ borderLeftColor: getChatFeatureColor('jobanalyzer') }),
    [],
  )
  const jobAnalyzerChipStyle = useMemo<CSSProperties>(() => {
    const jobColor = getChatFeatureColor('jobanalyzer')
    return {
      borderColor: hexToRgba(jobColor, 0.45),
      backgroundColor: hexToRgba(jobColor, CHAT_FEATURE_ACTIVE_BG_ALPHA),
      color: jobColor,
    }
  }, [])
  const toolUsedChipStyle = useMemo<CSSProperties | undefined>(() => {
    if (!msg.toolUsed) return undefined
    const color = getChatFeatureColor(msg.toolUsed)
    return {
      borderColor: hexToRgba(color, 0.45),
      backgroundColor: hexToRgba(color, 0.14),
      color,
    }
  }, [msg.toolUsed])
  const userBubbleStyle = useMemo<CSSProperties>(
    () => ({
      backgroundColor: getChatFeatureSolidFill(toolType),
      color: getChatFeatureOnAccentFg(toolType),
    }),
    [toolType],
  )

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
    const jobColor = getChatFeatureColor('jobanalyzer')
    return (
      <div className="flex w-full animate-slide-up flex-col items-start gap-1">
        <div className="w-full rounded-xl border-l-[3px] pl-2" style={jobAnalyzerBorderStyle}>
          <JobAnalysisCard text={msg.text} showStreamCursor={showStreamCursor} accentColor={jobColor} />
        </div>
        <div className="flex items-center gap-2 pl-1">
          <span
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium"
            style={jobAnalyzerChipStyle}
          >
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
      <div className="self-start flex max-w-[87%] animate-slide-up flex-col gap-0.5 min-[391px]:max-w-[85%] min-[391px]:gap-1">
        <div className="break-words rounded-[4px_16px_16px_16px] border border-stone-600/45 bg-app-raised px-3 py-2 text-[14px] leading-relaxed text-stone-200 shadow-[inset_0_1px_0_0_rgba(255,251,235,0.05),0_10px_28px_-12px_rgba(0,0,0,0.55)] min-[391px]:rounded-[4px_18px_18px_18px] min-[391px]:px-3.5 min-[391px]:py-2.5 min-[391px]:text-sm">
          <RenderedMarkdown content={msg.text} variant="assistant" />
          {showStreamCursor ? <StreamingTextCursor /> : null}
        </div>
        <div className="flex items-center gap-1.5 px-1 min-[391px]:gap-2">
          {msg.toolUsed && msg.toolUsed !== 'analyze_job' && (
            <span
              className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium min-[391px]:px-2.5 min-[391px]:text-[11px]"
              style={toolUsedChipStyle}
            >
              <Settings2 size={11} />
              <span>{msg.toolUsed.replace(/_/g, ' ')}</span>
            </span>
          )}
          <span className="text-[10px] text-stone-500 min-[391px]:text-[11px]">{time}</span>
        </div>
        <AssistantNoteSaveButton msg={msg} toolType={toolType} activeSessionId={activeSessionId} />
      </div>
    )
  }

  return (
    <div className="flex max-w-[76%] animate-slide-up flex-col items-end gap-0.5 self-end min-[391px]:max-w-[72%] min-[391px]:gap-1">
      <div
        className="break-words whitespace-pre-wrap rounded-[16px_16px_4px_16px] px-3 py-2 text-[14px] leading-relaxed shadow-[0_8px_18px_-8px_rgba(0,0,0,0.45)] min-[391px]:rounded-[18px_18px_4px_18px] min-[391px]:px-3.5 min-[391px]:py-2.5 min-[391px]:text-sm min-[391px]:shadow-[0_8px_22px_-4px_rgba(0,0,0,0.4)]"
        style={userBubbleStyle}
      >
        {msg.text}
      </div>
      <span className="px-1 text-[10px] text-stone-500 min-[391px]:text-[11px]">{time}</span>
    </div>
  )
}

// Memoised so streaming token updates only re-render the one bubble whose `msg` reference
// changed. The reducer in ChatSessionsProvider.updateMessageText replaces only the streamed
// message via .map(m => m.id === id ? { ...m, text } : m), so reference equality on the other
// messages is preserved; without memo, every bubble's RenderedMarkdown would re-parse on every
// SSE chunk.
export default memo(MessageBubble)
