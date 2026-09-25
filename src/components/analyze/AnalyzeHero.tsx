import { AlertCircle, AlertTriangle, Check } from 'lucide-react'
import AnalyzeFactGateInfo from './AnalyzeFactGateInfo'
import ScoreRing from '../report/ScoreRing'
import { reportLead } from './analyzeFormat'

interface Props {
  score: number
  factGateCount: number
  /** Only set when the automatic skill comparison is reliable. */
  coveredCount?: number
  requirementTotal?: number
  /** Names of the missing requirements, so the lead sentence can say which ones instead of just a count. */
  missingSkills?: string[]
  roleAlignment?: number
  warningCount?: number
  /**
   * v2: suppress the computed lead sentence. Set when the model returned its own
   * verdict paragraph, which says the same thing better and sits above this block.
   */
  hideLead?: boolean
}

export default function AnalyzeHero({
  score,
  factGateCount,
  coveredCount,
  requirementTotal,
  missingSkills = [],
  roleAlignment,
  warningCount = 0,
  hideLead = false,
}: Props) {
  const missingCount = missingSkills.length
  const lead = hideLead
    ? ''
    : reportLead({
        covered: coveredCount,
        total: requirementTotal,
        missingSkills,
        roleAlignment,
        warningCount,
        score,
      })

  const roleFit = typeof roleAlignment === 'number' && roleAlignment >= 3.5

  return (
    <section
      className="flex flex-col items-center gap-5 text-center sm:flex-row sm:gap-7 sm:text-left"
      aria-label="Gesamtbewertung"
    >
      <ScoreRing score={score} size={150} caption="VON 5,0" />
      <div className="min-w-0 flex-1">
        {lead ? <p className="text-[15px] leading-relaxed text-[#4a4238]">{lead}</p> : null}
        <div
          className={[
            'flex flex-wrap justify-center gap-2 sm:justify-start',
            lead ? 'mt-3' : '',
          ].join(' ')}
        >
          {roleFit ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(111,143,109,0.14)] px-[11px] py-[5px] text-xs text-[#5e7a5c]">
              <Check className="h-3 w-3" strokeWidth={2.5} aria-hidden />
              Rolle passt
            </span>
          ) : null}
          {missingCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(212,165,116,0.16)] px-[11px] py-[5px] text-xs text-[#8a6a3a]">
              <AlertCircle className="h-3 w-3" aria-hidden />
              {missingCount === 1 ? '1 Anforderung fehlt' : `${missingCount} Anforderungen fehlen`}
            </span>
          ) : null}
          {warningCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(217,119,87,0.12)] px-[11px] py-[5px] text-xs text-[#b45539]">
              <AlertTriangle className="h-3 w-3" aria-hidden />
              {warningCount === 1 ? '1 Warnzeichen' : `${warningCount} Warnzeichen`}
            </span>
          ) : null}
          {factGateCount > 0 ? <AnalyzeFactGateInfo count={factGateCount} compact /> : null}
        </div>
      </div>
    </section>
  )
}
