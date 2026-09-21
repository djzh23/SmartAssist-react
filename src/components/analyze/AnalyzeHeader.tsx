import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { scoreBadge } from './analyzeFormat'

interface Props {
  title: string
  subtitle?: string
  tone?: 'app' | 'paper'
  kicker?: string
  score?: number
  /** Shown next to the score badge in the paper header, e.g. a "new analysis" button. */
  action?: ReactNode
}

export default function AnalyzeHeader({ title, subtitle, tone = 'app', kicker, score, action }: Props) {
  if (tone === 'paper') {
    const badge = typeof score === 'number' ? scoreBadge(score) : null
    const strong = typeof score === 'number' && score >= 3.5
    return (
      <header className="flex flex-col gap-3 border-b border-[#f0e8d5] pb-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">
            {kicker ?? 'Analysebericht'}
          </p>
          <h1 className="mt-1.5 font-display text-[26px] leading-tight text-[#1a1613]">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-[#6e665e]">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {badge ? (
            <span
              className={[
                'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px]',
                strong
                  ? 'bg-[rgba(111,143,109,0.14)] text-[#5e7a5c]'
                  : 'bg-[rgba(217,119,87,0.12)] text-[#b45539]',
              ].join(' ')}
            >
              {strong ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden /> : null}
              {badge}
            </span>
          ) : null}
          {action}
        </div>
      </header>
    )
  }

  return (
    <header className="mb-4 sm:mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a89e91]">
        {kicker ?? 'Analyse'}
      </p>
      <h1 className="mt-1 font-display text-xl leading-tight text-[#f5f1eb] sm:text-[26px]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-[#a89e91]">{subtitle}</p>
      ) : null}
    </header>
  )
}
