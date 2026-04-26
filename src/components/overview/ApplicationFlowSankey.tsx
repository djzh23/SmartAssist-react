import { useMemo, useState, useEffect, useRef } from 'react'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import { buildApplicationSankeyLayout, curvePath } from './applicationSankeyLayout'

interface Props {
  overview: ApplicationOverview
}

const VIEW_H = 240
const DEFAULT_W = 720

export default function ApplicationFlowSankey({ overview }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(DEFAULT_W)
  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect
      if (cr && cr.width > 48) setW(Math.min(900, Math.floor(cr.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(
    () => buildApplicationSankeyLayout(overview, w, VIEW_H),
    [overview, w],
  )

  if (overview.total <= 0) {
    return null
  }

  return (
    <div
      ref={wrapRef}
      className="mb-4 w-full overflow-x-auto rounded-xl border border-stone-200/90 bg-gradient-to-b from-white to-stone-50/95 px-2 py-3 shadow-inner"
    >
      <svg
        viewBox={`0 0 ${w} ${VIEW_H}`}
        className="mx-auto h-auto w-full max-w-full"
        role="img"
        aria-label="Flussdiagramm: Bewerbungen von Gesamtzahl zu Pipeline und Archiv, dann nach Status"
      >
        <title>Bewerbungsfluss nach aktuellem Status</title>
        {layout.bands.map((b, i) => (
          <path
            key={`b-${i}`}
            d={curvePath(b.x0, b.y0, b.x1, b.y1)}
            fill="none"
            stroke={b.stroke}
            strokeWidth={b.strokeWidth}
            strokeOpacity={b.opacity}
            strokeLinecap="round"
          />
        ))}
        {layout.rects.map(r => (
          <g key={r.id}>
            <rect
              x={r.x}
              y={r.y}
              width={r.w}
              height={Math.max(r.h, 6)}
              rx={4}
              fill={r.fill}
              fillOpacity={r.id === 'all' ? 0.92 : 0.88}
              stroke="rgba(15,23,42,0.12)"
              strokeWidth={1}
            />
            <text
              x={r.x + r.w / 2}
              y={r.y + r.h / 2 - (r.sub ? 5 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              style={{ fontSize: r.w < 70 ? 9 : 11 }}
              className="font-bold"
            >
              {r.label.length > 18 ? `${r.label.slice(0, 16)}…` : r.label}
            </text>
            {r.sub ? (
              <text
                x={r.x + r.w / 2}
                y={r.y + r.h / 2 + 10}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.92)"
                style={{ fontSize: 10 }}
                className="font-semibold tabular-nums"
              >
                {r.sub}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      <p className="px-1 pb-1 text-center text-[10px] text-stone-500">
        Linienstärke grob nach Anteil — Momentaufnahme deiner Status, kein chronologischer Ablauf.
      </p>
    </div>
  )
}
