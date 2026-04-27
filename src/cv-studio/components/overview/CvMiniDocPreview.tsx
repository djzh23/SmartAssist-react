import type { CvStudioResumeSummary } from '../../../types'

interface Props {
  resume?: CvStudioResumeSummary
}

/**
 * Miniatur-Dokumentvorschau — zeigt die Oberkante des Lebenslaufs (Name, Headline, Basisdaten).
 * Wenn `resume` übergeben wird und profilePreview vorhanden ist, werden echte Daten angezeigt.
 */
export default function CvMiniDocPreview({ resume }: Props) {
  const p = resume?.profilePreview
  const hasData = !!(p?.firstName || p?.lastName)
  const fullName = hasData ? [p?.firstName, p?.lastName].filter(Boolean).join(' ') : null

  return (
    <div
      className="relative flex w-full max-w-[160px] shrink-0 flex-col gap-1 overflow-hidden rounded-lg border border-white/[0.08] bg-gradient-to-b from-white/[0.07] to-black/30 p-2.5"
      style={{ aspectRatio: '0.707' }}
      aria-hidden
    >
      {/* Header bar — name or placeholder */}
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          {fullName ? (
            <p className="truncate text-[7px] font-bold leading-tight text-white/80">{fullName}</p>
          ) : (
            <div className="h-1.5 w-4/5 rounded bg-white/25" />
          )}
          {p?.headline ? (
            <p className="mt-0.5 truncate text-[6px] leading-tight text-primary-light/80">{p.headline}</p>
          ) : (
            <div className="mt-0.5 h-1 w-3/5 rounded bg-primary/30" />
          )}
        </div>
      </div>

      {/* Contact line */}
      {p?.email || p?.location ? (
        <p className="truncate text-[5.5px] leading-tight text-white/40">
          {[p.location, p.email].filter(Boolean).join(' · ')}
        </p>
      ) : (
        <div className="h-[6px] w-full rounded bg-white/8" />
      )}

      {/* Separator */}
      <div className="my-0.5 h-px bg-white/10" />

      {/* Section lines */}
      <div className="h-[5px] w-1/3 rounded bg-primary/30" />
      <div className="space-y-0.5">
        <div className="h-[5px] w-full rounded bg-white/10" />
        <div className="h-[5px] w-[90%] rounded bg-white/8" />
        <div className="h-[5px] w-[80%] rounded bg-white/8" />
      </div>
      <div className="mt-0.5 h-[5px] w-1/3 rounded bg-primary/25" />
      <div className="space-y-0.5">
        <div className="h-[5px] w-full rounded bg-white/10" />
        <div className="h-[5px] w-[85%] rounded bg-white/8" />
      </div>

      {/* Bottom skill bars */}
      <div className="mt-auto flex gap-1">
        <div className="h-3 flex-1 rounded bg-white/[0.06]" />
        <div className="h-3 flex-1 rounded bg-white/[0.06]" />
        <div className="h-3 flex-1 rounded bg-white/[0.06]" />
      </div>
    </div>
  )
}
