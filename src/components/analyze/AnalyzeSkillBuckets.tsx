import type { SkillGapReport } from '../../api/analyzeClient'
import AnalyzeAccordion from './AnalyzeAccordion'
import { requirementCount } from './analyzeFormat'
import { Check, ListChecks, X } from 'lucide-react'

interface Props {
  skillGap: SkillGapReport
}

type Tone = 'ok' | 'supported' | 'gap'

function SkillPills({ items, empty, tone }: { items: string[]; empty: string; tone: Tone }) {
  if (!items.length) {
    return <p className="text-sm text-[#8a7f70]">{empty}</p>
  }
  const cls =
    tone === 'ok'
      ? 'bg-[rgba(111,143,109,0.12)] text-[#4a6448]'
      : tone === 'supported'
        ? 'bg-[rgba(212,165,116,0.16)] text-[#8a6a3a]'
        : 'bg-[rgba(217,119,87,0.08)] text-[#b45539]'
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(item => (
        <li key={item} className={`rounded-full px-3 py-1.5 text-[13px] ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SkillGroups({ gap }: { gap: SkillGapReport }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        <Check className="h-3.5 w-3.5 text-[#5e7a5c]" strokeWidth={2.5} aria-hidden />
        <p className="text-[13px] text-[#5e7a5c]">Nachgewiesen</p>
      </div>
      <SkillPills items={gap.existing} empty="Keine Treffer" tone="ok" />

      {gap.supportedByResume.length > 0 ? (
        <div className="mt-5">
          <p className="mb-2.5 text-[13px] text-[#8a6a3a]">Indirekt belegt</p>
          <SkillPills items={gap.supportedByResume} empty="Keine Treffer" tone="supported" />
        </div>
      ) : null}

      <div className="mt-5">
        <div className="mb-2.5 flex items-center gap-2.5">
          <X className="h-3.5 w-3.5 text-[#b45539]" strokeWidth={2.5} aria-hidden />
          <p className="text-[13px] text-[#b45539]">Nicht vorhanden</p>
        </div>
        <SkillPills items={gap.gap} empty="Keine Lücken erkannt" tone="gap" />
      </div>
    </div>
  )
}

export default function AnalyzeSkillBuckets({ skillGap }: Props) {
  const total = requirementCount(skillGap)
  const missing = skillGap.gap.length
  const mobileSubtitle = total > 0
    ? `${missing} fehlen von ${total} Anforderungen`
    : 'Keine Anforderungen erkannt'

  return (
    <>
      <div className="mt-6 lg:hidden">
        <AnalyzeAccordion
          title="Skill-Analyse"
          subtitle={mobileSubtitle}
          icon={<ListChecks className="h-4 w-4" />}
          defaultOpen
        >
          <SkillGroups gap={skillGap} />
        </AnalyzeAccordion>
      </div>
      <section className="mt-8 hidden border-b border-[#f0e8d5] pb-6 lg:block" aria-label="Skill-Analyse">
        <div className="mb-3.5 flex items-end justify-between gap-3">
          <h2 className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">Skill-Analyse</h2>
          <p className="text-xs text-[#8a7f70]">
            {total === 1 ? '1 Anforderung erkannt' : `${total} Anforderungen erkannt`}
          </p>
        </div>
        <SkillGroups gap={skillGap} />
      </section>
    </>
  )
}
