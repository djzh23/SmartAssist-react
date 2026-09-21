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
  const count = (skillGap?.gap ?? []).filter(s => s.trim()).length || extra.length

  return (
    <section
      className="mt-8 rounded-[14px] border border-[rgba(217,119,87,0.25)] bg-[rgba(217,119,87,0.05)] px-[22px] py-5"
      role="status"
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-[#b45539]" aria-hidden />
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#b45539]">
          {count === 1 ? '1 Warnzeichen' : `${count} Warnzeichen`}
        </p>
      </div>
      <div className="flex gap-3">
        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b45539]" aria-hidden />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#1a1613]">{title}</p>
          {bodyParts.length > 0 ? (
            <p className="mt-1 text-[13px] leading-relaxed text-[#6e665e]">{bodyParts.join(' ')}</p>
          ) : null}
        </div>
      </div>
    </section>
  )
}
