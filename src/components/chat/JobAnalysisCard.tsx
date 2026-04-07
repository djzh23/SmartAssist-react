import { bodyToHtml, parseJobAnalysis, pickOverallScore } from '../../utils/jobMarkdown'

interface Props {
  text: string
}

function scorePillClasses(score?: number): string {
  if (typeof score !== 'number') {
    return 'bg-slate-100 text-slate-600 border-slate-200'
  }

  if (score >= 75) return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  if (score >= 50) return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-rose-100 text-rose-700 border-rose-200'
}

function scoreBarClasses(score?: number): string {
  if (typeof score !== 'number') return 'bg-slate-300'
  if (score >= 75) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  return 'bg-rose-500'
}

export default function JobAnalysisCard({ text }: Props) {
  const sections = parseJobAnalysis(text)
  const nonEmptySections = sections.filter(section => section.body.trim().length > 0)
  const visibleSections = nonEmptySections.length > 0 ? nonEmptySections : sections

  if (visibleSections.length === 0) {
    return <p className="whitespace-pre-wrap text-sm text-slate-700">{text}</p>
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
              <span>Ãœbereinstimmung</span>
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
        {visibleSections.map((section, index) => (
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
                <span className="text-base leading-none">{section.icon}</span>
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
        ))}
      </div>
    </div>
  )
}

