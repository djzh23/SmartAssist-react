import { scoreLabel } from './analyzeFormat'

interface Props {
  cvMatch: number
  roleAlignment: number
  culture: number
  redFlags: number
}

export default function AnalyzeSubDimensions({ cvMatch, roleAlignment, culture, redFlags }: Props) {
  const items = [
    { label: 'CV-Match', value: cvMatch },
    { label: 'Rollenpassung', value: roleAlignment },
    { label: 'Kultur', value: culture },
    { label: 'Red Flags', value: redFlags },
  ]

  return (
    <section aria-label="Teilbewertungen" className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
      {items.map(item => (
        <div
          key={item.label}
          className="rounded-2xl border border-stone-600/40 bg-app-surface/90 px-3 py-3 sm:px-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">{item.label}</p>
          <p className="mt-1 text-[18px] font-semibold text-stone-50 sm:text-[20px]">{scoreLabel(item.value)}</p>
        </div>
      ))}
    </section>
  )
}
