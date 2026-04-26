import { Link } from 'react-router-dom'
import { GitBranch, Info } from 'lucide-react'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import InfoExplainerButton from '../ui/InfoExplainerButton'

const PIPELINE_ACCENT: Record<string, string> = {
  draft: 'bg-amber-500',
  applied: 'bg-blue-500',
  phoneScreen: 'bg-violet-500',
  interview: 'bg-indigo-500',
  assessment: 'bg-orange-500',
  offer: 'bg-emerald-500',
}

const ARCHIVE_ACCENT: Record<string, string> = {
  accepted: 'bg-emerald-600',
  rejected: 'bg-slate-400',
  withdrawn: 'bg-slate-500',
}

interface Props {
  overview: ApplicationOverview
  hint: string
}

export default function ApplicationPipelinePanel({ overview, hint }: Props) {
  const { total, pipeline, archive, activeInPipeline, inArchive } = overview
  const maxSeg = Math.max(1, ...pipeline.map(p => p.count), ...archive.map(a => a.count))

  return (
    <div className="rounded-xl border border-stone-400/35 bg-white/95 p-4 shadow-card sm:p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 shrink-0 text-primary" aria-hidden />
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">
            Bewerbungen nach Status
          </h3>
        </div>
        <InfoExplainerButton
          variant="onLight"
          modalTitle="So liest du die Grafik"
          ariaLabel="Erklärung zur Bewerbungsübersicht"
          className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
        >
          <p>
            Jeder Block steht für eine Status-Phase wie auf der Seite „Meine Bewerbungen“. Die Breite entspricht dem
            Anteil dieser Phase an allen deinen Bewerbungen (nicht an der Zeit).
          </p>
          <p className="mt-3">
            Die Pipeline (links nach rechts) sind aktive Phasen; Archiv rechts bündelt Abschluss-Statusse. Ohne
            Bewerbungen bleibt die Leiste leer.
          </p>
        </InfoExplainerButton>
      </div>

      {total === 0 ? (
        <p className="rounded-lg border border-dashed border-stone-400/50 bg-app-parchment/60 py-8 text-center text-sm text-stone-600">
          Noch keine Daten —{' '}
          <Link to="/applications/new" className="font-semibold text-primary hover:underline">
            erste Bewerbung anlegen
          </Link>
          .
        </p>
      ) : (
        <>
          {/* Stacked “tree” bar: pipeline then archive */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Pipeline (aktiv)</p>
            <div className="flex h-10 w-full overflow-hidden rounded-lg border border-stone-400/35 bg-stone-100/90">
              {pipeline.map(seg => {
                const pct = (seg.count / total) * 100
                const w = seg.count === 0 ? 0 : Math.max(pct, 2)
                if (seg.count === 0) return null
                return (
                  <div
                    key={seg.status}
                    className={`flex min-w-0 items-center justify-center border-r border-white/30 px-0.5 text-[10px] font-bold text-white last:border-r-0 ${PIPELINE_ACCENT[seg.status] ?? 'bg-stone-500'}`}
                    style={{ width: `${w}%` }}
                    title={`${seg.label}: ${seg.count}`}
                  >
                    {seg.count >= 2 || pct > 14 ? (
                      <span className="truncate px-0.5 tabular-nums">{seg.count}</span>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-stone-600">
              {pipeline.map(seg => (
                <span key={seg.status} className="tabular-nums">
                  <span className={`mr-1 inline-block h-2 w-2 rounded-sm align-middle ${PIPELINE_ACCENT[seg.status] ?? 'bg-stone-400'}`} />
                  {seg.label}: {seg.count}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2 border-t border-stone-200 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">Archiv</p>
            <div className="flex h-9 w-full overflow-hidden rounded-lg border border-stone-400/35 bg-stone-100/90">
              {archive.map(seg => {
                const pct = (seg.count / total) * 100
                const w = seg.count === 0 ? 0 : Math.max(pct, 2)
                if (seg.count === 0) return null
                return (
                  <div
                    key={seg.status}
                    className={`flex min-w-0 items-center justify-center border-r border-white/30 px-0.5 text-[10px] font-bold text-white last:border-r-0 ${ARCHIVE_ACCENT[seg.status] ?? 'bg-slate-500'}`}
                    style={{ width: `${w}%` }}
                    title={`${seg.label}: ${seg.count}`}
                  >
                    {seg.count >= 2 || pct > 12 ? <span className="tabular-nums">{seg.count}</span> : null}
                  </div>
                )
              })}
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-stone-600">
              {archive.map(seg => (
                <span key={seg.status} className="tabular-nums">
                  <span className={`mr-1 inline-block h-2 w-2 rounded-sm align-middle ${ARCHIVE_ACCENT[seg.status] ?? 'bg-slate-400'}`} />
                  {seg.label}: {seg.count}
                </span>
              ))}
            </div>
          </div>

          {/* Nested tree summary */}
          <div className="mt-5 rounded-lg border border-stone-400/30 bg-app-parchment/50 p-3 text-sm text-stone-800">
            <ul className="space-y-1 border-l-2 border-primary/35 pl-3">
              <li className="font-semibold tabular-nums">
                Alle Bewerbungen ({total})
              </li>
              <li className="ml-2 border-l border-stone-300/80 pl-2 text-stone-700">
                <span className="font-medium">Aktive Pipeline:</span>
                {' '}
                <span className="tabular-nums">{activeInPipeline}</span>
                <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                  {pipeline
                    .filter(p => p.count > 0)
                    .map(p => (
                      <li key={p.status}>
                        — {p.label}: <span className="tabular-nums font-medium text-stone-800">{p.count}</span>
                      </li>
                    ))}
                  {pipeline.every(p => p.count === 0) ? <li>— (leer)</li> : null}
                </ul>
              </li>
              <li className="ml-2 border-l border-stone-300/80 pl-2 text-stone-700">
                <span className="font-medium">Archiv:</span>
                {' '}
                <span className="tabular-nums">{inArchive}</span>
                <ul className="mt-1 space-y-0.5 text-xs text-stone-600">
                  {archive
                    .filter(p => p.count > 0)
                    .map(p => (
                      <li key={p.status}>
                        — {p.label}: <span className="tabular-nums font-medium text-stone-800">{p.count}</span>
                      </li>
                    ))}
                  {archive.every(p => p.count === 0) ? <li>— (leer)</li> : null}
                </ul>
              </li>
            </ul>
          </div>

          {/* Sparkline-style micro bars per status (equal width cells, height = relative to max) */}
          <div className="mt-4 border-t border-stone-200 pt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-500">Relativ höchste Phase</p>
            <div className="flex h-16 items-end gap-1">
              {pipeline.map(seg => {
                const h = seg.count === 0 ? 4 : Math.round((seg.count / maxSeg) * 100)
                return (
                  <div key={seg.status} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                    <div className="flex h-12 w-full items-end justify-center rounded-t bg-stone-100">
                      <div
                        className={`w-[70%] max-w-[2.5rem] rounded-t ${PIPELINE_ACCENT[seg.status] ?? 'bg-stone-400'}`}
                        style={{ height: `${Math.max(8, h)}%` }}
                        title={`${seg.label}: ${seg.count}`}
                      />
                    </div>
                    <span className="line-clamp-2 text-center text-[9px] font-medium leading-tight text-stone-600">
                      {seg.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary-light/40 px-3 py-2.5 text-xs leading-relaxed text-stone-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            <span>{hint}</span>
          </p>
        </>
      )}
    </div>
  )
}
