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
      className="rounded-2xl bg-[#241913]/80 p-4 shadow-[0_12px_34px_-22px_rgba(0,0,0,0.65)] sm:p-5"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-100/65">
          Bewerbungen, Fluss nach Status
        </h3>
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-100/70">
          Live View
        </span>
      </div>

      {total === 0 ? (
        <p className="rounded-xl bg-amber-300/10 py-8 text-center text-sm text-amber-100/80 shadow-[inset_0_0_0_1px_rgba(251,191,36,0.16)]">
          Noch keine Daten,{' '}
          <Link to="/applications/new" className="font-semibold text-primary hover:underline">
            erste Bewerbung anlegen
          </Link>
          .
        </p>
      ) : (
        <>
          <ApplicationFlowSankey overview={overview} />
          <div className="flex flex-wrap gap-x-3 gap-y-1.5 pt-2.5 text-[10px] text-amber-100/75">
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
