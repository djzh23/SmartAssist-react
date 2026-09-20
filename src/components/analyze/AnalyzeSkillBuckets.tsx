import type { SkillGapReport } from '../../api/analyzeClient'
import AnalyzeAccordion from './AnalyzeAccordion'
import { requirementCount } from './analyzeFormat'
import { ListChecks } from 'lucide-react'

interface Props {
  skillGap: SkillGapReport
}

type Tone = 'ok' | 'supported' | 'gap'

function SkillPills({ items, empty, tone }: { items: string[]; empty: string; tone: Tone }) {
  if (!items.length) {
    return <p className="text-sm text-stone-500">{empty}</p>
  }
  const cls =
    tone === 'ok'
      ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-200'
      : tone === 'supported'
        ? 'border-sky-500/30 bg-sky-500/15 text-sky-200'
        : 'border-rose-500/30 bg-rose-500/15 text-rose-200'
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <li key={item} className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
          {item}
        </li>
      ))}
    </ul>
  )
}

function SkillGroups({ stacked, gap }: { stacked: boolean; gap: SkillGapReport }) {
  const groups: { key: string; label: string; count: number; items: string[]; empty: string; tone: Tone; mark: string }[] = [
    {
      key: 'existing',
      label: 'Im Lebenslauf',
      count: gap.existing.length,
      items: gap.existing,
      empty: 'Keine Treffer',
      tone: 'ok',
      mark: '✓',
    },
    {
      key: 'supported',
      label: 'Indirekt belegt',
      count: gap.supportedByResume.length,
      items: gap.supportedByResume,
      empty: 'Keine Treffer',
      tone: 'supported',
      mark: '→',
    },
    {
      key: 'gap',
      label: 'Fehlt',
      count: gap.gap.length,
      items: gap.gap,
      empty: 'Keine Lücken erkannt',
      tone: 'gap',
      mark: '×',
    },
  ]

  if (stacked) {
    return (
      <div className="space-y-4">
        {groups.map(g => (
          <div key={g.key}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
              {g.mark} {g.label} ({g.count})
            </p>
            <SkillPills items={g.items} empty={g.empty} tone={g.tone} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {groups.map(g => (
        <div key={g.key} className="rounded-2xl border border-stone-600/40 bg-black/20 p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-400">
              {g.mark} {g.label}
            </p>
            <span className="text-xs text-stone-500">{g.count}</span>
          </div>
          <SkillPills items={g.items} empty={g.empty} tone={g.tone} />
        </div>
      ))}
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
      <div className="mt-3 lg:hidden">
        <AnalyzeAccordion
          title="Skill-Analyse"
          subtitle={mobileSubtitle}
          icon={<ListChecks className="h-4 w-4" />}
          defaultOpen
        >
          <SkillGroups stacked gap={skillGap} />
        </AnalyzeAccordion>
      </div>
      <section className="mt-5 hidden lg:block" aria-label="Skill-Analyse">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 className="text-base font-semibold text-stone-50">Skill-Analyse</h2>
          <p className="text-xs text-stone-500">
            {total === 1 ? '1 Anforderung erkannt' : `${total} Anforderungen erkannt`}
          </p>
        </div>
        <SkillGroups stacked={false} gap={skillGap} />
      </section>
    </>
  )
}
