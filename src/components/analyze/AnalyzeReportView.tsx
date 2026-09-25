import { Plus } from 'lucide-react'
import type { AnalyzeReport } from '../../api/analyzeClient'
import AnalyzeHeader from './AnalyzeHeader'
import AnalyzeHero from './AnalyzeHero'
import AnalyzeScoreBreakdown from './AnalyzeScoreBreakdown'
import AnalyzeWarningBanner from './AnalyzeWarningBanner'
import AnalyzeSkillBuckets from './AnalyzeSkillBuckets'
import AnalyzeBulletRewrites from './AnalyzeBulletRewrites'
import AnalyzeRoleSummary from './AnalyzeRoleSummary'
import AnalyzeVerdict from './AnalyzeVerdict'
import AnalyzeActionPlan from './AnalyzeActionPlan'
import AnalyzeSectionFindings from './AnalyzeSectionFindings'
import {
  inventedSkillCount,
  normalizeGap,
  plainGerman,
  requirementCount,
  skillGapState,
  skillWarning,
  splitRoleSummary,
  userFacingWarnings,
} from './analyzeFormat'

interface Props {
  report: AnalyzeReport
  /** Relative creation time shown above the title, e.g. "vor 2 Min. erstellt". */
  createdLabel: string
  onNewAnalysis: () => void
  sourceLabel?: string
}

/**
 * The finished analysis. Mobile first: everything stacks in reading order. From `lg` on, the overall score
 * sits next to its breakdown and the skill comparison next to the hints, so the key result fits on one screen.
 */
export default function AnalyzeReportView({ report, createdLabel, onNewAnalysis, sourceLabel }: Props) {
  const role = splitRoleSummary(plainGerman(report.roleSummary))
  const dims = report.dimensions ?? { cvMatch: 0, roleAlignment: 0, culture: 0, redFlags: 0 }
  const gap = normalizeGap(report.skillGap)
  const skillsReliable = skillGapState(gap) === 'ok'
  const warnings = userFacingWarnings(report.warnings).map(plainGerman)
  const hasHints = skillWarning(gap) !== null || warnings.length > 0
  const bullets = (report.bullets ?? []).map(b => ({ ...b, reasoning: plainGerman(b.reasoning) }))
  const bulletsBlockedByFactCheck = bullets.length === 0 && (report.factViolations ?? []).length > 0
  const unverifiedBullets = (report.unverifiedBullets ?? []).map(b => ({ ...b, reasoning: plainGerman(b.reasoning) }))

  const coveredCount = skillsReliable ? gap.existing.length : undefined
  const requirementTotal = skillsReliable ? requirementCount(gap) : undefined

  return (
    <div className="pp-report-paper px-5 py-7 sm:px-8 sm:py-9 lg:px-10">
      <AnalyzeHeader
        tone="paper"
        title={role.title}
        subtitle={role.subtitle}
        score={report.globalScore}
        kicker={sourceLabel ? `${sourceLabel} · ${createdLabel}` : `Analysebericht · ${createdLabel}`}
        action={
          <button
            type="button"
            onClick={onNewAnalysis}
            className="hidden items-center gap-1.5 rounded-full border border-[#e8e0d0] bg-white px-3.5 py-1.5 text-[13px] font-medium text-[#1a1613] transition hover:border-[#d97757] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50 sm:inline-flex"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
            Neue Analyse
          </button>
        }
      />

      {(report.verdictHeadline || report.verdictParagraph) ? (
        <div className="mt-6">
          <AnalyzeVerdict
            headline={report.verdictHeadline}
            paragraph={report.verdictParagraph}
          />
        </div>
      ) : null}

      <div className="mt-7 grid gap-8 lg:grid-cols-[5fr_7fr] lg:gap-12">
        <AnalyzeHero
          score={report.globalScore}
          factGateCount={inventedSkillCount(report.factViolations)}
          coveredCount={coveredCount}
          requirementTotal={requirementTotal}
          missingSkills={gap.gap}
          roleAlignment={dims.roleAlignment}
          warningCount={warnings.length}
        />
        <AnalyzeScoreBreakdown
          cvMatch={dims.cvMatch}
          roleAlignment={dims.roleAlignment}
          culture={dims.culture}
          redFlags={dims.redFlags}
          coveredCount={coveredCount}
          requirementTotal={requirementTotal}
          warningCount={warnings.length}
          reasons={report.dimensionReasons}
        />
      </div>

      <div className={['mt-8 grid gap-6', hasHints ? 'lg:grid-cols-2 lg:gap-10' : ''].join(' ')}>
        <AnalyzeSkillBuckets skillGap={gap} />
        <AnalyzeWarningBanner skillGap={gap} warnings={warnings} />
      </div>

      {report.actionPlan && report.actionPlan.length > 0 ? (
        <div className="mt-8">
          <AnalyzeActionPlan items={report.actionPlan} />
        </div>
      ) : null}

      <div className="mt-8">
        <AnalyzeBulletRewrites
          bullets={bullets}
          blockedByFactCheck={bulletsBlockedByFactCheck}
          unverifiedBullets={unverifiedBullets}
        />
      </div>

      {report.sectionFindings && report.sectionFindings.length > 0 ? (
        <div className="mt-8">
          <AnalyzeSectionFindings findings={report.sectionFindings} />
        </div>
      ) : null}

      {(report.roleSummary ?? '').trim() ? (
        <div className="mt-6">
          <AnalyzeRoleSummary text={plainGerman(report.roleSummary)} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onNewAnalysis}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#d97757] px-4 py-3.5 text-sm font-semibold text-[#1a1613] transition hover:bg-[#e89372] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50 sm:hidden"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Neue Analyse
      </button>
    </div>
  )
}
