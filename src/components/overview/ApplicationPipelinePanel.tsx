import { Link } from 'react-router-dom'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import ApplicationFlowSankey from './ApplicationFlowSankey'
import { SANKEY_PIPELINE_FILL } from './applicationSankeyLayout'
import type { ApplicationStatusApi } from '../../api/client'

interface Props {
  overview: ApplicationOverview
}

function legendDot(status: ApplicationStatusApi): string {
  return SANKEY_PIPELINE_FILL[status] ?? '#64748b'
}

export default function ApplicationPipelinePanel({ overview }: Props) {
  const { total, pipeline, archive } = overview

  return (
    <div
      className="rounded-2xl border border-amber-200/15 bg-[#241913]/80 p-4 shadow-landing-md sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/65">
          Bewerbungen, Fluss nach Status
        </h3>
        <span className="rounded-full border border-amber-200/20 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/65">
          Live View
        </span>
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
