import { ShieldCheck } from 'lucide-react'

interface Props {
  count: number
  compact?: boolean
}

export default function AnalyzeFactGateInfo({ count, compact = false }: Props) {
  if (count <= 0) return null

  return (
    <div
      className={[
        'flex items-start gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-100',
        compact ? 'px-3 py-2.5' : 'px-4 py-3',
      ].join(' ')}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
      <div>
        <p className="text-sm font-semibold">Fact-Gate aktiv</p>
        <p className="mt-0.5 text-xs leading-relaxed text-emerald-200/80">
          {count === 1 ? '1 erfundene Angabe blockiert' : `${count} erfundene Skills blockiert`}
        </p>
      </div>
    </div>
  )
}
