import { AlertTriangle } from 'lucide-react'
import type { SkillGapReport } from '../../api/analyzeClient'
import {
  dedupeSkillWarnings,
  skillSummaryIsRedundant,
  skillWarning,
  userFacingWarnings,
} from './analyzeFormat'

interface Props {
  skillGap?: SkillGapReport
  warnings?: string[]
}

export default function AnalyzeWarningBanner({ skillGap, warnings }: Props) {
  const extra = dedupeSkillWarnings(userFacingWarnings(warnings))
  // The derived hint and the model's own "Fehlend: X" lines describe the same gaps, so only
  // one of them belongs in the panel.
  const skill = skillSummaryIsRedundant(skillGap?.gap ?? [], extra) ? null : skillWarning(skillGap)
  if (!skill && extra.length === 0) return null

  const items: { title: string; body?: string }[] = []
  if (skill) items.push({ title: skill.title, body: skill.body })
  extra.forEach(w => items.push({ title: w }))

  const count = items.length
  const heading = skill && extra.length === 0
    ? (count === 1 ? '1 Hinweis' : `${count} Hinweise`)
    : (count === 1 ? '1 Warnzeichen in der Anzeige' : `${count} Warnzeichen in der Anzeige`)

  return (
    <section
      className="rounded-[14px] border border-[rgba(217,119,87,0.25)] bg-[rgba(217,119,87,0.05)] px-[22px] py-5"
      role="status"
    >
      <div className="mb-3.5 flex items-center gap-2.5">
        <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-[#b45539]" aria-hidden />
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#b45539]">{heading}</p>
      </div>
      <ul className="flex flex-col gap-3">
        {items.map(item => (
          <li key={item.title} className="flex gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#b45539]" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#1a1613]">{item.title}</p>
              {item.body ? (
                <p className="mt-0.5 text-[13px] leading-relaxed text-[#6e665e]">{item.body}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
