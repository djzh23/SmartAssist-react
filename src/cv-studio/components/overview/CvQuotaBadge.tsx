interface CvQuotaBadgeProps {
  used: number
  limit: number
}

export default function CvQuotaBadge({ used, limit }: CvQuotaBadgeProps) {
  if (limit <= 0) return null

  const pct = Math.min(100, Math.round((used / limit) * 100))
  const isFull = used >= limit
  const isWarning = pct >= 80

  const barColor = isFull
    ? 'bg-rose-500'
    : isWarning
      ? 'bg-amber-400'
      : 'bg-primary'

  const textColor = isFull
    ? 'text-rose-300'
    : isWarning
      ? 'text-amber-300'
      : 'text-stone-400'

  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs tabular-nums ${textColor}`}>
        {used}/{limit} PDF-Exports
      </span>
    </div>
  )
}
