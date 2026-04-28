import type { CvStudioResumeSummary } from '../../../types'

interface Props {
  resume?: CvStudioResumeSummary
  /** Compact mode: smaller max-width for narrow card columns */
  compact?: boolean
}

/**
 * Miniatur-Dokumentvorschau - zeigt die Oberkante des Lebenslaufs.
 * Wenn `resume` übergeben wird und profilePreview vorhanden ist, werden echte Daten angezeigt.
 */
export default function CvMiniDocPreview({ resume, compact }: Props) {
  const p = resume?.profilePreview
  const hasData = !!(p?.firstName || p?.lastName)
  const fullName = hasData ? [p?.firstName, p?.lastName].filter(Boolean).join(' ') : null

  return (
    <div
      className={[
        'relative flex w-full shrink-0 flex-col gap-1 overflow-hidden rounded-md border border-white/[0.1]',
        'bg-gradient-to-b from-stone-700/60 to-stone-800/80 p-2',
        compact ? 'max-w-[120px]' : 'max-w-[148px]',
      ].join(' ')}
      style={{ aspectRatio: '0.707' }}
      aria-hidden
    >
      {/* Name + headline */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          {fullName ? (
            <p className="truncate text-[7px] font-bold leading-tight text-stone-100">{fullName}</p>
          ) : (
            <div className="h-1.5 w-4/5 rounded bg-stone-400/30" />
          )}
          {p?.headline ? (
            <p className="mt-0.5 truncate text-[5.5px] leading-tight text-violet-300/80">{p.headline}</p>
          ) : (
            <div className="mt-0.5 h-1 w-3/5 rounded bg-violet-400/25" />
          )}
        </div>
      </div>

      {/* Contact line */}
      {p?.email || p?.location ? (
        <p className="truncate text-[5.5px] leading-tight text-stone-400/80">
          {[p.location, p.email].filter(Boolean).join(' · ')}
        </p>
      ) : (
        <div className="h-[6px] w-full rounded bg-stone-500/20" />
      )}

      {/* Divider */}
      <div className="my-0.5 h-px bg-stone-500/30" />

      {/* Section lines */}
      <div className="h-[5px] w-1/3 rounded bg-violet-400/30" />
      <div className="space-y-0.5">
        <div className="h-[4px] w-full rounded bg-stone-400/20" />
        <div className="h-[4px] w-[88%] rounded bg-stone-400/15" />
        <div className="h-[4px] w-[75%] rounded bg-stone-400/12" />
      </div>

      <div className="mt-0.5 h-[5px] w-1/3 rounded bg-violet-400/25" />
      <div className="space-y-0.5">
        <div className="h-[4px] w-full rounded bg-stone-400/20" />
        <div className="h-[4px] w-[82%] rounded bg-stone-400/15" />
      </div>

      {/* Skill bars */}
      <div className="mt-auto flex gap-1">
        <div className="h-2.5 flex-1 rounded bg-stone-500/25" />
        <div className="h-2.5 flex-1 rounded bg-stone-500/20" />
        <div className="h-2.5 flex-1 rounded bg-stone-500/15" />
      </div>
    </div>
  )
}
