import { ShieldCheck } from 'lucide-react'

interface Props {
  count: number
  compact?: boolean
}

export default function AnalyzeFactGateInfo({ count, compact = false }: Props) {
  if (count <= 0) return null

  const body = count === 1 ? '1 erfundene Angabe blockiert' : `${count} erfundene Skills blockiert`

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-[rgba(111,143,109,0.14)] px-[11px] py-[5px] text-xs text-[#5e7a5c]">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>
          <span className="font-semibold">Faktenprüfung aktiv</span>
          <span className="ml-1 text-[#4a6448]">{body}</span>
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-full bg-[rgba(111,143,109,0.14)] px-4 py-3 text-[#5e7a5c]">
      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-semibold">Faktenprüfung aktiv</p>
        <p className="mt-0.5 text-xs leading-relaxed text-[#4a6448]">{body}</p>
      </div>
    </div>
  )
}
