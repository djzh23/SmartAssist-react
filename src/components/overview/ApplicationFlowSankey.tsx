import { useMemo, useState, useEffect, useRef } from 'react'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import { buildApplicationSankeyLayout, curvePath, SANKEY_PIPELINE_FILL } from './applicationSankeyLayout'
import type { SankeyBand, SankeyRect } from './applicationSankeyLayout'

interface Props {
  overview: ApplicationOverview
}

const VIEW_H = 300
const DEFAULT_W = 720
const BOX_BG = 'rgb(238, 233, 226)'

// ── Node renderer ─────────────────────────────────────────────────────────────

function nodeAccentColor(rect: SankeyRect): string {
  if (rect.status) return SANKEY_PIPELINE_FILL[rect.status] ?? '#94a3b8'
  if (rect.id === 'pipe') return '#0d9488'
  if (rect.id === 'arch') return '#64748b'
  return '#7c3aed'
}

function NodeRect({
  rect,
  isHovered,
  onEnter,
  onLeave,
}: {
  rect: SankeyRect
  isHovered: boolean
  onEnter: (r: SankeyRect, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const accent = nodeAccentColor(rect)
  const isMuted = Boolean(rect.muted)
  const isLeaf = Boolean(rect.status)
  const rx = isLeaf ? 4 : 7

  // Group / "All" boxes get a left accent bar
  const accentBarW = isLeaf ? 0 : 3

  return (
    <g
      onMouseEnter={e => onEnter(rect, e)}
      onMouseLeave={onLeave}
      style={{ cursor: 'default' }}
    >
      {/* Background rect */}
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={rect.h}
        rx={rx}
        fill={isMuted ? 'rgb(245,243,240)' : BOX_BG}
        stroke="none"
        style={{
          transition: 'filter 160ms ease, opacity 160ms ease',
          filter: isHovered
            ? 'drop-shadow(0 5px 12px rgba(24,24,27,0.16))'
            : 'drop-shadow(0 2px 6px rgba(24,24,27,0.10))',
          opacity: isMuted ? 0.72 : 1,
        }}
      />

      {/* Left accent bar (group/all nodes only) */}
      {accentBarW > 0 && !isMuted && (
        <rect
          x={rect.x}
          y={rect.y + rx}
          width={accentBarW}
          height={rect.h - rx * 2}
          rx={1}
          fill={accent}
          fillOpacity={isHovered ? 0.8 : 0.55}
          style={{ transition: 'fill-opacity 150ms ease' }}
        />
      )}

      {/* Label */}
      {isLeaf ? (
        // Status node: colored dot + label + count inline
        <>
          <circle
            cx={rect.x + 8}
            cy={rect.y + rect.h / 2}
            r={3.5}
            fill={isMuted ? '#cbd5e1' : accent}
            fillOpacity={isMuted ? 0.5 : 1}
          />
          <text
            x={rect.x + 16}
            y={rect.y + rect.h / 2}
            dominantBaseline="middle"
            fill={isMuted ? '#94a3b8' : '#292524'}
            style={{ fontSize: 11, fontWeight: isMuted ? 400 : 500 }}
          >
            {rect.label}
          </text>
          <text
            x={rect.x + rect.w - 6}
            y={rect.y + rect.h / 2}
            dominantBaseline="middle"
            textAnchor="end"
            fill={isMuted ? '#cbd5e1' : accent}
            style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}
          >
            {rect.count}
          </text>
        </>
      ) : (
        // Group / "All" box: stacked label + count
        <>
          <text
            x={rect.x + (accentBarW > 0 ? accentBarW + 8 : rect.w / 2)}
            y={rect.y + rect.h / 2 - 7}
            textAnchor={accentBarW > 0 ? 'start' : 'middle'}
            dominantBaseline="middle"
            fill={isMuted ? '#94a3b8' : '#44403c'}
            style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.01em' }}
          >
            {rect.label}
          </text>
          <text
            x={rect.x + (accentBarW > 0 ? accentBarW + 8 : rect.w / 2)}
            y={rect.y + rect.h / 2 + 7}
            textAnchor={accentBarW > 0 ? 'start' : 'middle'}
            dominantBaseline="middle"
            fill={isMuted ? '#cbd5e1' : accent}
            style={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {rect.sub ?? rect.count}
          </text>
        </>
      )}
    </g>
  )
}

// ── Band renderer ─────────────────────────────────────────────────────────────

function BandPath({
  band,
  activeBandId,
  onEnter,
  onLeave,
}: {
  band: SankeyBand
  activeBandId: string | null
  onEnter: (b: SankeyBand, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const isActive = activeBandId === band.id
  const isDimmed = activeBandId != null && !isActive
  const opacity = isDimmed
    ? 0.06
    : isActive
      ? Math.min(0.85, band.opacity + 0.22)
      : band.opacity
  const sw = isActive ? band.strokeWidth + 1.2 : band.strokeWidth
  const d = curvePath(band.x0, band.y0, band.x1, band.y1)

  return (
    <g>
      {/* Invisible wide hit area */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(12, sw + 8)}
        onMouseEnter={e => onEnter(band, e)}
        onMouseMove={e => onEnter(band, e)}
        onMouseLeave={onLeave}
        style={{ cursor: 'crosshair' }}
      />
      {/* Visible band */}
      <path
        d={d}
        fill="none"
        stroke={band.stroke}
        strokeWidth={sw}
        strokeOpacity={opacity}
        strokeLinecap="round"
        pointerEvents="none"
        style={{ transition: 'stroke-opacity 160ms ease, stroke-width 160ms ease' }}
      />
    </g>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

interface TooltipInfo {
  x: number
  y: number
  title: string
  count: number
  total: number
  pct: number
  isNode: boolean
}

function SankeyTooltip({ info }: { info: TooltipInfo }) {
  const pct = (info.pct * 100).toFixed(1)
  return (
    <div
      className="pointer-events-none fixed z-[220] min-w-[140px] rounded-xl border border-stone-200/80 bg-white/96 px-3 py-2.5 text-[11px] shadow-xl backdrop-blur"
      style={{ left: info.x + 14, top: info.y + 14 }}
    >
      <p className="mb-1 font-semibold text-stone-900">{info.title}</p>
      <p className="tabular-nums text-stone-700">
        Anzahl: <span className="font-semibold">{info.count}</span>
      </p>
      <p className="tabular-nums text-stone-500">
        Anteil: {pct}%
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ApplicationFlowSankey({ overview }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(DEFAULT_W)
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  const [activeBandId, setActiveBandId] = useState<string | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(entries => {
      const cr = entries[0]?.contentRect
      if (cr && cr.width > 48) setW(Math.min(960, Math.floor(cr.width)))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const layout = useMemo(
    () => buildApplicationSankeyLayout(overview, w, VIEW_H),
    [overview, w],
  )

  if (overview.total <= 0) return null

  function handleNodeEnter(rect: SankeyRect, e: React.MouseEvent) {
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: rect.label,
      count: rect.count,
      total: overview.total,
      pct: rect.pct,
      isNode: true,
    })
  }

  function handleBandEnter(band: SankeyBand, e: React.MouseEvent) {
    setActiveBandId(band.id)
    setTooltip({
      x: e.clientX,
      y: e.clientY,
      title: band.label,
      count: band.count,
      total: band.total,
      pct: band.pct,
      isNode: false,
    })
  }

  function handleLeave() {
    setActiveBandId(null)
    setTooltip(null)
  }

  function handleBandLeave() {
    setActiveBandId(null)
    setTooltip(null)
  }

  return (
    <div
      ref={wrapRef}
      className="relative mb-2 w-full overflow-x-auto rounded-2xl bg-white/70 px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_10px_24px_-18px_rgba(15,23,42,0.5)]"
      style={{ backgroundColor: BOX_BG }}
    >
      <svg
        viewBox={`0 0 ${w} ${VIEW_H}`}
        className="mx-auto h-auto w-full max-w-full"
        role="img"
        aria-label="Flussdiagramm: Bewerbungen von Gesamtzahl zu Pipeline und Archiv, dann nach Status"
      >
        <title>Bewerbungsfluss nach aktuellem Status</title>

        {/* Bands drawn first (behind nodes) */}
        {layout.bands.map(b => (
          <BandPath
            key={b.id}
            band={b}
            activeBandId={activeBandId}
            onEnter={handleBandEnter}
            onLeave={handleBandLeave}
          />
        ))}

        {/* Nodes on top */}
        {layout.rects.map(r => (
          <NodeRect
            key={r.id}
            rect={r}
            isHovered={tooltip?.isNode === true && tooltip.title === r.label}
            onEnter={handleNodeEnter}
            onLeave={handleLeave}
          />
        ))}
      </svg>

      {tooltip && <SankeyTooltip info={tooltip} />}

      <p className="px-1 pb-0.5 pt-1 text-center text-[10px] text-stone-500">
        Momentaufnahme · Linienstärke nach Anteil · kein chronologischer Ablauf
      </p>
    </div>
  )
}
