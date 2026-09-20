import AnalyzeFactGateInfo from './AnalyzeFactGateInfo'
import { scoreCaption, scoreLabel, scorePercent } from './analyzeFormat'

interface Props {
  score: number
  factGateCount: number
}

export default function AnalyzeHero({ score, factGateCount }: Props) {
  const pct = scorePercent(score)

  return (
    <section className="rounded-2xl border border-stone-600/40 bg-app-surface/90 p-4 shadow-landing sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center lg:gap-6">
        <div className="text-center lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            Gesamt-Match
          </p>
          <div className="mt-2 flex items-baseline justify-center gap-2 lg:justify-start">
            <p className="font-serif text-[40px] font-bold leading-none text-stone-50 sm:text-[44px]">
              {scoreLabel(score)}
            </p>
            <p className="text-sm text-stone-400">von 5,0</p>
          </div>
        </div>
        <div>
          <div
            className="h-1.5 w-full overflow-hidden rounded-[3px] bg-stone-800"
            role="progressbar"
            aria-label="Gesamt-Match"
            aria-valuemin={1}
            aria-valuemax={5}
            aria-valuenow={Number(score.toFixed(1))}
          >
            <div className="h-full rounded-[3px] bg-amber-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2.5 text-center text-sm text-stone-300 lg:max-w-sm lg:text-left">
            {scoreCaption(score)}
          </p>
        </div>
        {factGateCount > 0 ? (
          <div className="lg:w-56 lg:shrink-0">
            <AnalyzeFactGateInfo count={factGateCount} />
          </div>
        ) : null}
      </div>
    </section>
  )
}
