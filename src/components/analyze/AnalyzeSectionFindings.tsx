import type { ReactNode } from 'react'
import {
  User,
  Wrench,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Monitor,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react'
import type { SectionFinding } from '../../api/analyzeClient'
import { plainGerman } from './analyzeFormat'

interface Props {
  findings?: SectionFinding[] | null
}

const SECTION_ICONS: Record<string, ReactNode> = {
  profile: <User className="h-4 w-4" aria-hidden />,
  technical_skills: <Wrench className="h-4 w-4" aria-hidden />,
  experience: <Briefcase className="h-4 w-4" aria-hidden />,
  education: <GraduationCap className="h-4 w-4" aria-hidden />,
  certificates: <Award className="h-4 w-4" aria-hidden />,
  languages: <Languages className="h-4 w-4" aria-hidden />,
  it_kenntnisse: <Monitor className="h-4 w-4" aria-hidden />,
  other: <MoreHorizontal className="h-4 w-4" aria-hidden />,
}

/**
 * Per-CV-section feedback: observation + concrete action. The model only
 * emits a finding when both the CV and the posting have material for that
 * section, so an empty list means "nothing section-specific to say" and the
 * component renders nothing.
 */
export default function AnalyzeSectionFindings({ findings }: Props) {
  const items = (findings ?? []).filter(
    f =>
      typeof f.observation === 'string' &&
      f.observation.trim().length > 0 &&
      typeof f.action === 'string' &&
      f.action.trim().length > 0,
  )
  if (items.length === 0) return null

  return (
    <section aria-label="Analyse nach Lebenslauf-Bereichen">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">
        Feedback nach Lebenslauf-Bereichen
      </p>
      <p className="mt-1 text-[13px] text-[#6e665e]">
        Was in jeder Sektion deines Lebenslaufs auffällt und was du dafür anpassen kannst.
      </p>
      <ul className="mt-5 flex flex-col gap-3">
        {items.map((f, idx) => {
          const icon = SECTION_ICONS[f.section] ?? (
            <MoreHorizontal className="h-4 w-4" aria-hidden />
          )
          return (
            <li
              key={`${f.section}-${idx}`}
              className="rounded-xl border border-[#e8e0d0] bg-white px-4 py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#faf7f0] text-[#b45539]"
                  aria-hidden
                >
                  {icon}
                </span>
                <p className="text-sm font-semibold text-[#1a1613]">{f.label}</p>
              </div>
              <p className="mt-2.5 text-[13px] leading-relaxed text-[#4a4238]">
                {plainGerman(f.observation)}
              </p>
              <div className="mt-2.5 flex gap-2 rounded-lg bg-[#faf7f0] px-3 py-2">
                <ArrowRight
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#b45539]"
                  aria-hidden
                />
                <p className="text-[13px] leading-relaxed text-[#1a1613]">
                  {plainGerman(f.action)}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
