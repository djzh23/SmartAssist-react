import { Link } from 'react-router-dom'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import InfoExplainerButton from '../ui/InfoExplainerButton'
import ApplicationFlowSankey from './ApplicationFlowSankey'
import { SANKEY_PIPELINE_FILL } from './applicationSankeyLayout'
import type { ApplicationStatusApi } from '../../api/client'

interface Props {
  overview: ApplicationOverview
  hint: string
}

function legendDot(status: ApplicationStatusApi): string {
  return SANKEY_PIPELINE_FILL[status] ?? '#64748b'
}

export default function ApplicationPipelinePanel({ overview, hint }: Props) {
  const { total, pipeline, archive } = overview

  return (
    <div
      className="rounded-2xl border border-amber-200/15 bg-[#241913]/80 p-4 shadow-landing-md sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/65">
          Bewerbungen, Fluss nach Status
        </h3>
        <InfoExplainerButton
          variant="onDark"
          trigger="hint"
          modalTitle="So liest du den Fluss"
          ariaLabel="Hinweis: Bewerbungsflussdiagramm"
          className="border-amber-200/20 text-amber-100/75 hover:bg-white/12"
        >
          <p>
            Das Diagramm zeigt nur den <strong>aktuellen Stand</strong>: wie viele Bewerbungen in welchem Status
            liegen. Breite der Verbindungen ist näherungsweise nach Anteil skaliert, nicht nach Zeit oder
            Reihenfolge der Bewerbung.
          </p>
          <p className="mt-3">
            Zuerst siehst du die Gesamtzahl, dann die Aufteilung in <strong>aktive Pipeline</strong> und{' '}
            <strong>Archiv</strong>, danach die einzelnen Status, wie auf der Seite „Meine Bewerbungen“.
          </p>
          <p className="mt-3 rounded-lg border border-amber-200/25 bg-amber-300/10 px-3 py-2 text-amber-100/85">
            <span className="font-semibold text-amber-100">Tipp: </span>
            {hint}
          </p>
        </InfoExplainerButton>
      </div>

      {total === 0 ? (
        <p className="rounded-xl border border-dashed border-amber-100/25 bg-amber-300/10 py-8 text-center text-sm text-amber-100/80">
          Noch keine Daten,{' '}
          <Link to="/applications/new" className="font-semibold text-primary hover:underline">
            erste Bewerbung anlegen
          </Link>
          .
        </p>
      ) : (
        <>
          <ApplicationFlowSankey overview={overview} />
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 border-t border-amber-100/10 pt-3 text-[10px] text-amber-100/75">
            <span className="font-semibold text-amber-100/60">Legende:</span>
            {pipeline.map(seg => (
              <span key={seg.status} className="inline-flex items-center gap-1 tabular-nums">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: legendDot(seg.status) }}
                  aria-hidden
                />
                {seg.label}
                {' '}
                ({seg.count})
              </span>
            ))}
            <span className="text-amber-100/35" aria-hidden>
              |
            </span>
            {archive.map(seg => (
              <span key={seg.status} className="inline-flex items-center gap-1 tabular-nums">
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: legendDot(seg.status) }}
                  aria-hidden
                />
                {seg.label}
                {' '}
                ({seg.count})
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
