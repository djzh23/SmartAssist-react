import {
  AlertTriangle,
  CheckCircle2,
  FileSearch,
  KeyRound,
  Landmark,
  MessageSquareMore,
  Rocket,
  ShieldAlert,
  Target,
  type LucideIcon,
} from 'lucide-react'
import { bodyToHtml, parseJobAnalysis, pickOverallScore, type JobSectionTone } from '../../utils/jobMarkdown'
import { CHAT_FEATURE_ACTIVE_BG_ALPHA, getChatFeatureColor, hexToRgba } from '../../utils/chatFeatureColors'
import StreamingTextCursor from './StreamingTextCursor'

interface Props {
  text: string
  showStreamCursor?: boolean
  accentColor?: string
}

const ICON_BY_TONE: Record<JobSectionTone, LucideIcon> = {
  score: Target,
  strength: CheckCircle2,
  gaps: AlertTriangle,
  actions: Rocket,
  keywords: KeyRound,
  interview: MessageSquareMore,
  risk: ShieldAlert,
  salary: Landmark,
  general: FileSearch,
}

function scorePillClasses(score?: number): string {
  if (typeof score !== 'number') {
    return 'bg-stone-800/75 text-stone-400 ring-1 ring-inset ring-white/10'
  }

  if (score >= 75) return 'bg-amber-950/45 text-amber-100 ring-1 ring-inset ring-amber-500/25'
  if (score >= 50) return 'bg-stone-800/85 text-stone-200 ring-1 ring-inset ring-white/10'
  return 'bg-orange-950/35 text-orange-100 ring-1 ring-inset ring-orange-500/25'
}

function scoreBarClasses(score?: number): string {
  if (typeof score !== 'number') return 'bg-stone-700'
  if (score >= 75) return 'bg-amber-500'
  if (score >= 50) return 'bg-amber-700'
  return 'bg-orange-800'
}

export default function JobAnalysisCard({ text, showStreamCursor = false, accentColor }: Props) {
  const sections = parseJobAnalysis(text)
  const nonEmptySections = sections.filter(section => section.body.trim().length > 0)
  const visibleSections = nonEmptySections.length > 0 ? nonEmptySections : sections
  const featureColor = accentColor ?? getChatFeatureColor('jobanalyzer')

  if (visibleSections.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-sm text-stone-300">
        {text}
        {showStreamCursor ? <StreamingTextCursor /> : null}
      </p>
    )
  }

  const overallScore = pickOverallScore(visibleSections)

  return (
    <div className="w-full space-y-3">
      <div
        className="rounded-xl border-0 border-l-[3px] bg-app-raised px-4 py-3 pl-[1.05rem] shadow-none"
        style={{
          borderLeftColor: featureColor,
          backgroundImage: `linear-gradient(90deg, ${hexToRgba(featureColor, CHAT_FEATURE_ACTIVE_BG_ALPHA)} 0%, #1f1a16 68%)`,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-[0.14em]"
              style={{ color: hexToRgba(featureColor, 0.88) }}
            >
              Job Analyzer
            </p>
            <p className="text-sm font-semibold text-stone-100">
              Strukturierte Match Analyse
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${scorePillClasses(overallScore)}`}>
            {typeof overallScore === 'number' ? `Match Score ${overallScore}/100` : 'Score wird berechnet'}
          </span>
        </div>

        {typeof overallScore === 'number' && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-stone-500">
              <span>Uebereinstimmung</span>
              <span>{overallScore}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-stone-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarClasses(overallScore)}`}
                style={{ width: `${Math.max(3, overallScore)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2 sm:gap-2.5">
        {visibleSections.map((section, index) => {
          const Icon = ICON_BY_TONE[section.tone] ?? FileSearch
          return (
            <article
              key={`${section.title}-${index}`}
              className="rounded-r-xl rounded-l-md border-0 border-l-[3px] bg-[#1a1612]/95 py-3 pl-3 pr-3 sm:py-3.5 sm:pl-3.5 sm:pr-4"
              style={{
                borderLeftColor: section.border,
              }}
            >
              <header className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:mb-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={16} style={{ color: section.color }} />
                  <h3 className="truncate text-sm font-semibold" style={{ color: section.color }}>
                    {section.title}
                  </h3>
                </div>
                <span
                  className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ring-white/10"
                  style={{ color: section.chipColor }}
                >
                  {section.chip}
                </span>
              </header>

              <div
                className="job-analysis-body text-[0.89rem] leading-relaxed text-stone-200 [&_a]:text-amber-400 [&_strong]:text-stone-50"
                dangerouslySetInnerHTML={{ __html: bodyToHtml(section.body) }}
              />
            </article>
          )
        })}
      </div>
      {showStreamCursor ? (
        <div className="pl-1 pt-1">
          <StreamingTextCursor />
        </div>
      ) : null}
    </div>
  )
}
