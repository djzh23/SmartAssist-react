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
import StreamingTextCursor from './StreamingTextCursor'

interface Props {
  text: string
  showStreamCursor?: boolean
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
    return 'border-slate-200 bg-slate-100 text-slate-600'
  }

  if (score >= 75) return 'border-emerald-200 bg-emerald-100 text-emerald-700'
  if (score >= 50) return 'border-amber-200 bg-amber-100 text-amber-700'
  return 'border-rose-200 bg-rose-100 text-rose-700'
}

function scoreBarClasses(score?: number): string {
  if (typeof score !== 'number') return 'bg-slate-300'
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

export default function JobAnalysisCard({ text, showStreamCursor = false }: Props) {
  const sections = parseJobAnalysis(text)
  const nonEmptySections = sections.filter(section => section.body.trim().length > 0)
  const visibleSections = nonEmptySections.length > 0 ? nonEmptySections : sections

  if (visibleSections.length === 0) {
    return (
      <p className="whitespace-pre-wrap text-sm text-slate-700">
        {text}
        {showStreamCursor ? <StreamingTextCursor /> : null}
      </p>
    )
  }

  const overallScore = pickOverallScore(visibleSections)

  return (
    <div className="w-full space-y-3">
      <div className="rounded-xl border border-sky-100 bg-gradient-to-r from-white via-sky-50/50 to-white px-4 py-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
              Job Analyzer
            </p>
            <p className="text-sm font-semibold text-slate-800">
              Strukturierte Match Analyse
            </p>
          </div>
          <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${scorePillClasses(overallScore)}`}>
            {typeof overallScore === 'number' ? `Match Score ${overallScore}/100` : 'Score wird berechnet'}
          </span>
        </div>

        {typeof overallScore === 'number' && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Uebereinstimmung</span>
              <span>{overallScore}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-500 ${scoreBarClasses(overallScore)}`}
                style={{ width: `${Math.max(3, overallScore)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex w-full flex-col gap-2.5">
        {visibleSections.map((section, index) => {
          const Icon = ICON_BY_TONE[section.tone] ?? FileSearch
          return (
            <article
              key={`${section.title}-${index}`}
              className="rounded-xl border px-4 py-3.5 shadow-sm backdrop-blur-[1px]"
              style={{
                background: section.bg,
                borderColor: section.border,
              }}
            >
              <header className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={16} style={{ color: section.color }} />
                  <h3 className="truncate text-sm font-semibold" style={{ color: section.color }}>
                    {section.title}
                  </h3>
                </div>
                <span
                  className="rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: section.chipBg,
                    borderColor: section.border,
                    color: section.chipColor,
                  }}
                >
                  {section.chip}
                </span>
              </header>

              <div
                className="job-analysis-body text-[0.89rem] leading-relaxed text-slate-700"
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
