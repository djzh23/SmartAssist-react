import type { ReactNode } from 'react'
import type { SkillGapReport } from '../../api/analyzeClient'
import AnalyzeAccordion from './AnalyzeAccordion'
import { requirementCount, skillGapState } from './analyzeFormat'
import { Check, Info, ListChecks, X } from 'lucide-react'

interface Props {
  skillGap: SkillGapReport
}

type Tone = 'ok' | 'supported' | 'gap'

function Pill({ label, tone }: { label: string; tone: Tone }) {
  const cls =
    tone === 'ok'
      ? 'bg-[rgba(111,143,109,0.12)] text-[#4a6448]'
      : tone === 'supported'
        ? 'bg-[rgba(212,165,116,0.16)] text-[#8a6a3a]'
        : 'bg-[rgba(217,119,87,0.08)] text-[#b45539]'
  return <span className={`inline-flex rounded-full px-3 py-1.5 text-[13px] ${cls}`}>{label}</span>
}

function Group({ icon, title, titleClass, children }: { icon?: ReactNode; title: string; titleClass: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2.5">
        {icon}
        <p className={`text-[13px] ${titleClass}`}>{title}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function SkillContent({ gap }: { gap: SkillGapReport }) {
  const state = skillGapState(gap)

  if (state === 'unavailable') {
    return (
      <div className="flex gap-3 rounded-[10px] bg-[#f5f1eb] px-4 py-3.5">
        <Info className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#b45539]" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-[#1a1613]">Kein automatischer Abgleich möglich</p>
          <p className="mt-1 text-[13px] leading-relaxed text-[#4a4238]">
            In dieser Anzeige konnten keine einzelnen Anforderungen erkannt werden, zum Beispiel weil sie keine Liste
            der Anforderungen enthält. Die Bewertung beruht trotzdem auf dem gesamten Text der Anzeige und deinem
            Lebenslauf.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {state === 'partial' ? (
        <p className="text-[13px] leading-relaxed text-[#8a6a3a]">
          Nicht alle Anforderungen konnten automatisch erkannt werden. Die Liste kann unvollständig sein.
        </p>
      ) : null}

      {gap.existing.length > 0 ? (
        <Group
          icon={<Check className="h-3.5 w-3.5 text-[#5e7a5c]" strokeWidth={2.5} aria-hidden />}
          title="Im Lebenslauf belegt"
          titleClass="text-[#5e7a5c]"
        >
          {gap.existing.map(item => (
            <Pill key={item} label={item} tone="ok" />
          ))}
        </Group>
      ) : null}

      {gap.supportedByResume.length > 0 ? (
        <Group title="Indirekt belegt" titleClass="text-[#8a6a3a]">
          {gap.supportedByResume.map(item => (
            <Pill key={item} label={item} tone="supported" />
          ))}
        </Group>
      ) : null}

      {gap.gap.length > 0 ? (
        <Group
          icon={<X className="h-3.5 w-3.5 text-[#b45539]" strokeWidth={2.5} aria-hidden />}
          title="Nicht im Lebenslauf gefunden"
          titleClass="text-[#b45539]"
        >
          {gap.gap.map(item => (
            <Pill key={item} label={item} tone="gap" />
          ))}
        </Group>
      ) : (
        <p className="flex items-center gap-2 text-[13px] text-[#5e7a5c]">
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} aria-hidden />
          Alle erkannten Anforderungen sind im Lebenslauf belegt.
        </p>
      )}
    </div>
  )
}

export default function AnalyzeSkillBuckets({ skillGap }: Props) {
  const state = skillGapState(skillGap)
  const total = requirementCount(skillGap)
  const covered = skillGap.existing.length
  const subtitle = state === 'unavailable' ? 'Nicht automatisch möglich' : `${covered} von ${total} Anforderungen belegt`

  return (
    <>
      <div className="lg:hidden">
        <AnalyzeAccordion title="Skill-Abgleich" subtitle={subtitle} icon={<ListChecks className="h-4 w-4" />} defaultOpen>
          <SkillContent gap={skillGap} />
        </AnalyzeAccordion>
      </div>
      <section className="hidden lg:block" aria-label="Skill-Abgleich">
        <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">Skill-Abgleich</p>
        <p className="mt-1 mb-4 text-[13px] text-[#6e665e]">{subtitle}</p>
        <SkillContent gap={skillGap} />
      </section>
    </>
  )
}
