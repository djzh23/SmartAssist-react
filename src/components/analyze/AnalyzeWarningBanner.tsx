import { AlertTriangle } from 'lucide-react'
import type { SkillGapReport } from '../../api/analyzeClient'
import { skillWarning, userFacingWarnings } from './analyzeFormat'

interface Props {
  skillGap?: SkillGapReport
  warnings?: string[]
}

export default function AnalyzeWarningBanner({ skillGap, warnings }: Props) {
  const skill = skillWarning(skillGap)
  const extra = userFacingWarnings(warnings)
  if (!skill && extra.length === 0) return null

  const title = skill?.title ?? extra[0]
  const bodyParts = [
    skill?.body,
    ...(skill ? extra : extra.slice(1)),
  ].filter(Boolean)

  return (
    <section
      className="mt-3 flex items-start gap-2.5 rounded-2xl bg-amber-400 px-3.5 py-3 text-stone-950 sm:px-4"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0">
        <p className="text-sm font-semibold leading-snug">{title}</p>
        {bodyParts.length > 0 ? (
          <p className="mt-1 text-xs leading-relaxed text-stone-800">{bodyParts.join(' ')}</p>
        ) : null}
      </div>
    </section>
  )
}
