import { Clock } from 'lucide-react'
import type { ActionPlanItem } from '../../api/analyzeClient'
import { plainGerman } from './analyzeFormat'

interface Props {
  items?: ActionPlanItem[] | null
}

function impactTone(
  impact: string | null | undefined,
): { label: string; className: string } | null {
  switch (impact) {
    case 'high':
      return {
        label: 'Hoher Hebel',
        className: 'bg-[rgba(217,119,87,0.12)] text-[#b45539]',
      }
    case 'medium':
      return {
        label: 'Mittlerer Hebel',
        className: 'bg-[rgba(212,165,116,0.16)] text-[#8a6a3a]',
      }
    case 'low':
      return {
        label: 'Kleiner Hebel',
        className: 'bg-[rgba(111,143,109,0.14)] text-[#5e7a5c]',
      }
    default:
      return null
  }
}

/** null = "länger", i.e. multi-day / ongoing (Sprachkurs, Zertifikat). */
function effortLabel(minutes: number | null | undefined): string {
  if (minutes == null) return 'länger'
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.round(minutes / 60)
  return hours === 1 ? '1 Std.' : `${hours} Std.`
}

/**
 * Priority-ordered next-step checklist. The model returns items with an
 * intended priority number; we render in that order and never re-sort by
 * effort or impact — the model already weighted those in.
 */
export default function AnalyzeActionPlan({ items }: Props) {
  const cleaned = (items ?? [])
    .filter(i => typeof i.action === 'string' && i.action.trim().length > 0)
    .slice()
    .sort((a, b) => a.priority - b.priority)

  if (cleaned.length === 0) return null

  return (
    <section aria-label="Konkrete nächste Schritte">
      <p className="text-[11px] uppercase tracking-[0.08em] text-[#8a7f70]">
        Was du als nächstes tun kannst
      </p>
      <p className="mt-1 text-[13px] text-[#6e665e]">
        Priorisiert nach Hebel und Aufwand — von oben nach unten abarbeiten.
      </p>
      <ol className="mt-5 flex flex-col gap-3">
        {cleaned.map((item, idx) => {
          const impact = impactTone(item.impact)
          const effort = effortLabel(item.effortMinutes)
          return (
            <li
              key={`${item.priority}-${idx}`}
              className="flex gap-3 rounded-xl border border-[#e8e0d0] bg-white px-4 py-3.5"
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#d97757] text-[13px] font-semibold text-[#1a1613]"
                aria-hidden
              >
                {item.priority}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-[#1a1613]">
                  {plainGerman(item.action)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#faf7f0] px-2.5 py-[3px] text-[11px] text-[#6e665e]">
                    <Clock className="h-3 w-3" aria-hidden />
                    {effort}
                  </span>
                  {impact ? (
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-[3px] text-[11px] ${impact.className}`}
                    >
                      {impact.label}
                    </span>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
