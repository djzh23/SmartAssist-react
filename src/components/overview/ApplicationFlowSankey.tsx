import { useMemo, useState, useEffect, useRef } from 'react'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import { buildApplicationSankeyLayout, curvePath } from './applicationSankeyLayout'

interface Props {
  overview: ApplicationOverview
}

const VIEW_H = 360
const DEFAULT_W = 720
const BOX_BG = 'rgb(238, 233, 226)'

interface HoverInfo {
  x: number
  y: number
  title: string
  count: number
  pct: number
}

export default function ApplicationFlowSankey({ overview }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(DEFAULT_W)
  const [hover, setHover] = useState<HoverInfo | null>(null)
  const [activeBandId, setActiveBandId] = useState<string | null>(null)
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
      className="relative mb-4 w-full overflow-x-auto rounded-xl border border-stone-300/80 px-2 py-3 shadow-inner"
      style={{ backgroundColor: BOX_BG }}
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
            strokeOpacity={activeBandId == null || activeBandId === b.id ? b.opacity : 0.08}
            strokeLinecap="round"
            onMouseEnter={e => {
              setActiveBandId(b.id)
              setHover({
                x: e.clientX,
                y: e.clientY,
                title: b.label,
                count: b.count,
                pct: b.pct,
              })
            }}
            onMouseMove={e => {
              setHover(h => (h ? { ...h, x: e.clientX, y: e.clientY } : null))
            }}
            onMouseLeave={() => {
              setActiveBandId(null)
              setHover(null)
            }}
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
              fillOpacity={r.muted ? 0.65 : (r.id === 'all' ? 0.97 : 0.9)}
              stroke={r.stroke}
              strokeWidth={1}
              onMouseEnter={e => {
                setHover({
                  x: e.clientX,
                  y: e.clientY,
                  title: r.label,
                  count: r.count,
                  pct: r.pct,
                })
              }}
              onMouseMove={e => {
                setHover(h => (h ? { ...h, x: e.clientX, y: e.clientY } : null))
              }}
              onMouseLeave={() => setHover(null)}
            />
            <text
              x={r.x + r.w / 2}
              y={r.y + r.h / 2 - (r.sub ? 5 : 0)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={r.muted ? 'rgba(68,64,60,0.72)' : 'rgb(41,37,36)'}
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
                fill={r.muted ? 'rgba(87,83,78,0.8)' : 'rgba(41,37,36,0.9)'}
                style={{ fontSize: 10 }}
                className="font-semibold tabular-nums"
              >
                {r.sub}
              </text>
            ) : null}
          </g>
        ))}
      </svg>
      {hover && (
        <div
          className="pointer-events-none fixed z-[220] rounded-lg border border-stone-300 bg-white px-2.5 py-2 text-[11px] shadow-xl"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <p className="font-semibold text-stone-900">{hover.title}</p>
          <p className="mt-0.5 text-stone-700 tabular-nums">Anzahl: {hover.count}</p>
          <p className="text-stone-600 tabular-nums">Anteil: {(hover.pct * 100).toFixed(1)}%</p>
        </div>
      )}
      <p className="px-1 pb-1 pt-1 text-center text-[10px] text-stone-500">
        Linienstärke grob nach Anteil — Momentaufnahme deiner Status, kein chronologischer Ablauf.
      </p>
    </div>
  )
}
