import { ShieldCheck } from 'lucide-react'

interface Props {
  count: number
  compact?: boolean
}

export default function AnalyzeFactGateInfo({ count, compact = false }: Props) {
  if (count <= 0) return null

  const body = count === 1 ? '1 erfundene Angabe blockiert' : `${count} erfundene Skills blockiert`

  return (
    <div
      className={[
        'flex items-start gap-2 rounded-full bg-[rgba(111,143,109,0.14)] text-[#5e7a5c]',
        compact ? 'px-3 py-2' : 'px-4 py-3',
      ].join(' ')}
    >
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-semibold">Fact-Gate aktiv</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#4a6448]">{body}</p>
      </div>
    </div>
  )
}
