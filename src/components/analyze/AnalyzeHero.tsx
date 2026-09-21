import { AlertCircle, AlertTriangle, Check } from 'lucide-react'
import AnalyzeFactGateInfo from './AnalyzeFactGateInfo'
import ScoreRing from '../report/ScoreRing'
import { reportLead } from './analyzeFormat'

interface Props {
  score: number
  factGateCount: number
  coveredCount?: number
  requirementTotal?: number
  missingCount?: number
  roleAlignment?: number
  warningCount?: number
}

export default function AnalyzeHero({
  score,
  factGateCount,
  coveredCount,
  requirementTotal,
  missingCount = 0,
  roleAlignment,
  warningCount = 0,
}: Props) {
  const lead = reportLead({
    covered: coveredCount,
    total: requirementTotal,
    missing: missingCount,
    roleAlignment,
    warningCount,
    score,
  })

  const roleFit = typeof roleAlignment === 'number' && roleAlignment >= 3.5

  return (
    <section className="flex flex-col gap-8 py-8 sm:flex-row sm:items-center sm:gap-11">
      <ScoreRing score={score} size={190} caption="VON 5,0" />
      <div className="min-w-0 flex-1">
        <p className="text-[15px] leading-relaxed text-[#4a4238]">{lead}</p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {roleFit ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(111,143,109,0.14)] px-[11px] py-[5px] text-xs text-[#5e7a5c]">
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              Erfahrung passt
            </span>
          ) : null}
          {missingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(212,165,116,0.16)] px-[11px] py-[5px] text-xs text-[#8a6a3a]">
              <AlertCircle className="h-3 w-3" aria-hidden />
              {missingCount === 1 ? '1 Skill fehlt' : `${missingCount} Skills fehlen`}
            </span>
          ) : null}
          {warningCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(217,119,87,0.12)] px-[11px] py-[5px] text-xs text-[#b45539]">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              {warningCount === 1 ? '1 Red Flag' : `${warningCount} Red Flags`}
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
