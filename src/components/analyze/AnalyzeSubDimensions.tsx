import { scoreLabel } from './analyzeFormat'

interface Props {
  cvMatch: number
  roleAlignment: number
  culture: number
  redFlags: number
}

export default function AnalyzeSubDimensions({ cvMatch, roleAlignment, culture, redFlags }: Props) {
  const items = [
    { label: 'CV-Match', value: cvMatch, accent: false },
    { label: 'Rolle', value: roleAlignment, accent: false },
    { label: 'Kultur', value: culture, accent: false },
    { label: 'Red Flags', value: redFlags, accent: true },
  ]

  return (
    <section aria-label="Teilbewertungen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(item => (
        <div
          key={item.label}
          className={
            item.accent
              ? 'rounded-xl border border-[rgba(217,119,87,0.25)] bg-[rgba(217,119,87,0.06)] px-3.5 py-4'
              : 'rounded-xl border border-[#ebe3d3] bg-[#faf7f0] px-3.5 py-4'
          }
        >
          <p
            className={`text-[11px] uppercase tracking-[0.08em] ${
              item.accent ? 'text-[#b45539]' : 'text-[#8a7f70]'
            }`}
          >
            {item.label}
          </p>
          <p
            className={`mt-2 flex items-baseline gap-1 font-display text-[28px] leading-none ${
              item.accent ? 'text-[#b45539]' : 'text-[#1a1613]'
            }`}
          >
            {scoreLabel(item.value)}
            <span className={`text-[11px] font-normal ${item.accent ? 'text-[#b45539]' : 'text-[#8a7f70]'}`}>
              /5
            </span>
          </p>
        </div>
      ))}
    </section>
  )
}
