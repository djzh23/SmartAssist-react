import { Briefcase, Target } from 'lucide-react'

type ToolKind = 'job' | 'interview'

interface Props {
  kind: ToolKind
  /** Hauptwert 0–100 oder undefined wenn noch keine Daten */
  primaryScore?: number
  /** Sekundärer / Heuristik-Wert für Transparenz (Job) */
  secondaryScore?: number
  /** Kurzer Hinweis unter den Werten */
  caption: string
}

export default function CareerScoreBanner({ kind, primaryScore, secondaryScore, caption }: Props) {
  const hasPrimary = typeof primaryScore === 'number'
  const hasSecondary = typeof secondaryScore === 'number' && kind === 'job'

  if (!hasPrimary && !hasSecondary) return null

  const Icon = kind === 'job' ? Briefcase : Target
  const title = kind === 'job' ? 'Job-Match & Einordnung' : 'Interview-Readiness'

  return (
    <div className="mx-auto mb-3 flex max-w-3xl flex-col gap-1.5 rounded-xl border border-violet-100 bg-violet-50/90 px-4 py-3 text-sm shadow-sm">
      <div className="flex items-center gap-2 font-semibold text-violet-900">
        <Icon size={18} className="text-primary" />
        {title}
      </div>
      <div className="flex flex-wrap items-baseline gap-4 text-slate-800">
        {hasPrimary && (
          <div>
            <span className="text-2xl font-bold tabular-nums text-violet-800">{primaryScore}</span>
            <span className="ml-1 text-slate-500">/100</span>
            <span className="ml-2 text-xs font-medium uppercase tracking-wide text-slate-500">
              {kind === 'job' ? 'Modell / Antwort' : 'Readiness'}
            </span>
          </div>
        )}
        {hasSecondary && secondaryScore !== primaryScore && (
          <div className="text-slate-600">
            <span className="tabular-nums font-semibold">{secondaryScore}</span>
            <span className="ml-1 text-slate-400">/100</span>
            <span className="ml-2 text-xs text-slate-500">Heuristik (Profil + Stelle + Chat)</span>
          </div>
        )}
      </div>
      <p className="text-xs leading-snug text-slate-600">{caption}</p>
    </div>
  )
}
