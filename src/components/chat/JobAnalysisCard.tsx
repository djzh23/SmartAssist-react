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
    return 'bg-stone-800/75 text-stone-300 ring-1 ring-inset ring-white/10'
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
      <p className="whitespace-pre-wrap text-sm text-stone-200">
        {text}
        {showStreamCursor ? <StreamingTextCursor /> : null}
      </p>
    )
  }

  const overallScore = pickOverallScore(visibleSections)

  return (
    <div
      className="w-full overflow-hidden rounded-[4px_18px_18px_18px] border border-stone-600/35 bg-app-raised shadow-[inset_0_1px_0_0_rgba(255,251,235,0.04)]"
      style={{ borderLeftWidth: 3, borderLeftColor: featureColor }}
    >
      <div
        className="px-4 py-3.5"
        style={{
          backgroundImage: `linear-gradient(135deg, ${hexToRgba(featureColor, CHAT_FEATURE_ACTIVE_BG_ALPHA)} 0%, transparent 70%)`,
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
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${scorePillClasses(overallScore)}`}>
            {typeof overallScore === 'number' ? `Match Score ${overallScore}/100` : 'Score wird berechnet'}
          </span>
        </div>

        {typeof overallScore === 'number' && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-stone-400">
              <span>Uebereinstimmung</span>
              <span>{overallScore}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-stone-800/90">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarClasses(overallScore)}`}
                style={{ width: `${Math.max(3, overallScore)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {visibleSections.map((section, index) => {
        const Icon = ICON_BY_TONE[section.tone] ?? FileSearch
        return (
          <article
            key={`${section.title}-${index}`}
            className="border-t border-stone-700/30 px-4 py-3.5"
          >
            <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <Icon size={15} style={{ color: section.color }} aria-hidden />
                <h3 className="truncate text-sm font-semibold text-stone-100">
                  {section.title}
                </h3>
              </div>
              <span
                className="rounded-md bg-white/[0.06] px-2 py-0.5 text-[11px] font-semibold text-stone-300 ring-1 ring-inset ring-white/8"
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

      {showStreamCursor ? (
        <div className="border-t border-stone-700/30 px-4 py-2">
          <StreamingTextCursor />
        </div>
      ) : null}
    </div>
  )
}
