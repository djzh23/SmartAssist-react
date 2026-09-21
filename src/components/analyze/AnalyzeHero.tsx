import AnalyzeFactGateInfo from './AnalyzeFactGateInfo'
import ScoreRing from '../report/ScoreRing'
import { scoreCaption } from './analyzeFormat'

interface Props {
  score: number
  factGateCount: number
  coveredCount?: number
  requirementTotal?: number
  missingCount?: number
}

export default function AnalyzeHero({
  score,
  factGateCount,
  coveredCount,
  requirementTotal,
  missingCount,
}: Props) {
  const hasCoverage =
    typeof coveredCount === 'number' &&
    typeof requirementTotal === 'number' &&
    requirementTotal > 0

  return (
    <section className="flex flex-col gap-8 py-8 sm:flex-row sm:items-center sm:gap-11">
      <ScoreRing score={score} size={190} caption="von 5,0" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed text-[#4a4238]">
          {hasCoverage ? (
            <>
              Du deckst{' '}
              <strong className="font-semibold text-[#1a1613]">
                {coveredCount} von {requirementTotal}
              </strong>{' '}
              Kernanforderungen. {scoreCaption(score)}
            </>
          ) : (
            scoreCaption(score)
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {typeof missingCount === 'number' && missingCount > 0 ? (
            <span className="rounded-full bg-[rgba(212,165,116,0.16)] px-2.5 py-1 text-xs text-[#8a6a3a]">
              {missingCount === 1 ? '1 Skill fehlt' : `${missingCount} Skills fehlen`}
            </span>
          ) : null}
          {factGateCount > 0 ? (
            <AnalyzeFactGateInfo count={factGateCount} compact />
          ) : null}
        </div>
      </div>
    </section>
  )
}
