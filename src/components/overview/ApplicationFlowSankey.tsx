import { useMemo, useState, useEffect, useRef } from 'react'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import { buildApplicationSankeyLayout, curvePath, SANKEY_PIPELINE_FILL } from './applicationSankeyLayout'
import type { SankeyBand, SankeyRect } from './applicationSankeyLayout'

interface Props {
  overview: ApplicationOverview
}

const DEFAULT_W = 720
const BOX_BG = 'rgb(238, 233, 226)'

// ── Node renderer ─────────────────────────────────────────────────────────────
function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  if (h.length !== 6) return hex
  const n = Number.parseInt(h, 16)
  if (Number.isNaN(n)) return hex
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function nodeAccentColor(rect: SankeyRect): string {
  if (rect.status) return SANKEY_PIPELINE_FILL[rect.status] ?? '#94a3b8'
  if (rect.id === 'pipe') return '#0d9488'
  if (rect.id === 'arch') return '#64748b'
  return '#7c3aed'
}

function compactNodeLabel(rect: SankeyRect): string {
  if (rect.id === 'all') return 'Alle'
  if (rect.id === 'pipe') return 'Aktiv'
  if (rect.id === 'arch') return 'Archiv'
  if (rect.status === 'phoneScreen') return 'Gespräch'
  if (rect.status === 'assessment') return 'Test'
  if (rect.status === 'withdrawn') return 'Zurück'
  return rect.label
}

function NodeRect({
  rect,
  viewportWidth,
  isHovered,
  onEnter,
  onLeave,
}: {
  rect: SankeyRect
  viewportWidth: number
  isHovered: boolean
  onEnter: (r: SankeyRect, e: React.MouseEvent) => void
  onLeave: () => void
}) {
  const isMobile = viewportWidth <= 768
  const isCompact = viewportWidth <= 360
  const isWideMobile = viewportWidth >= 390 && viewportWidth < 768
  const accent = nodeAccentColor(rect)
  const isMuted = Boolean(rect.muted)
  const isLeaf = Boolean(rect.status)
  const rx = isLeaf ? (isCompact ? 4 : isMobile ? 5 : 6) : (isCompact ? 7 : isMobile ? 8 : 10)
  const textColor = isMuted
    ? '#94a3b8'
    : isLeaf
      ? '#1f2937'
      : '#ffffff'

  // Mobile compact labels only affect rendered text, not underlying data.
  const displayLabel = isMobile ? compactNodeLabel(rect) : rect.label

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
        fill={isMuted ? 'rgb(245,243,240)' : isLeaf ? withAlpha(accent, 0.12) : withAlpha(accent, 0.72)}
        stroke={isMuted ? 'rgba(148,163,184,0.24)' : withAlpha(accent, isLeaf ? 0.28 : 0.55)}
        strokeWidth={isLeaf ? 0.8 : 1}
        style={{
          transition: 'filter 160ms ease, opacity 160ms ease',
          filter: isHovered
            ? 'drop-shadow(0 5px 12px rgba(24,24,27,0.16))'
            : 'drop-shadow(0 2px 6px rgba(24,24,27,0.10))',
          opacity: isMuted ? 0.72 : 1,
        }}
      />

      {/* Label */}
      {isLeaf ? (
        // Status node: colored dot + label + count inline
        <>
          <circle
            cx={rect.x + (isCompact ? 6 : isMobile ? 7 : 8)}
            cy={rect.y + rect.h / 2}
            r={isCompact ? 2.6 : isMobile ? 3 : 3.5}
            fill={isMuted ? '#cbd5e1' : accent}
            fillOpacity={isMuted ? 0.5 : 1}
          />
          <text
            x={rect.x + (isCompact ? 11 : isMobile ? 13 : 16)}
            y={rect.y + rect.h / 2}
            dominantBaseline="middle"
            fill={textColor}
            style={{ fontSize: isCompact ? 9 : isWideMobile ? 10.5 : isMobile ? 10 : 11, fontWeight: isMuted ? 400 : 500 }}
          >
            {displayLabel}
          </text>
          <text
            x={rect.x + rect.w - (isCompact ? 4 : isMobile ? 5 : 6)}
            y={rect.y + rect.h / 2}
            dominantBaseline="middle"
            textAnchor="end"
            fill={isMuted ? '#cbd5e1' : withAlpha(accent, 0.96)}
            style={{ fontSize: isCompact ? 9 : isWideMobile ? 10.5 : isMobile ? 10 : 11, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
          >
            {rect.count}
          </text>
        </>
      ) : (
        // Group / "All" box: stacked label + count
        <>
          <text
            x={rect.x + rect.w / 2}
            y={rect.y + rect.h / 2 - (isCompact ? 6 : 7)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={textColor}
            style={{ fontSize: isCompact ? 9 : isMobile ? 10 : 11, fontWeight: 600, letterSpacing: '0.01em' }}
          >
            {displayLabel}
          </text>
          <text
            x={rect.x + rect.w / 2}
            y={rect.y + rect.h / 2 + (isCompact ? 6 : 7)}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={isMuted ? '#cbd5e1' : '#ffffff'}
            style={{ fontSize: isCompact ? 13 : isMobile ? 14 : 15, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}
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
      className="pointer-events-none fixed z-[220] min-w-[150px] rounded-xl border border-amber-400/35 bg-[#1d140f]/95 px-3 py-2.5 text-[11px] shadow-xl backdrop-blur"
      style={{ left: info.x + 14, top: info.y + 14 }}
    >
      <p className="mb-1 font-semibold text-amber-100">{info.title}</p>
      <p className="tabular-nums text-stone-200">
        Anzahl: <span className="font-semibold text-white">{info.count}</span>
      </p>
      <p className="tabular-nums text-stone-400">
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
  const isMobile = w <= 768
  const isCompactMobile = w <= 360
  const isWideMobile = w >= 390 && w < 768

  const viewH = useMemo(() => {
    if (w <= 360) return 470
    if (w <= 375) return 485
    if (w <= 414) return 500
    if (w <= 520) return 520
    if (w >= 1040) return 620
    if (w >= 860) return 560
    if (w >= 700) return 520
    return 460
  }, [w])

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
    () => buildApplicationSankeyLayout(overview, w, viewH),
    [overview, w, viewH],
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
      className="relative h-full min-h-[460px] w-full overflow-hidden rounded-2xl bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_0_0_1px_rgba(245,158,11,0.18),0_16px_30px_-20px_rgba(15,23,42,0.6)] md:min-h-[520px] md:px-3 md:py-3 xl:min-h-[560px] xl:px-4 xl:py-4"
      style={{
        backgroundColor: BOX_BG,
        paddingLeft: isCompactMobile ? 6 : isMobile ? 8 : 12,
        paddingRight: isCompactMobile ? 6 : isMobile ? 8 : 12,
        paddingTop: isCompactMobile ? 6 : isMobile ? 8 : 12,
        paddingBottom: isCompactMobile ? 6 : isMobile ? 8 : 12,
      }}
    >
      <svg
        viewBox={`0 0 ${w} ${viewH}`}
        className="mx-auto block w-full max-w-full"
        style={{ height: viewH }}
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
            viewportWidth={w}
            isHovered={tooltip?.isNode === true && tooltip.title === r.label}
            onEnter={handleNodeEnter}
            onLeave={handleLeave}
          />
        ))}
      </svg>

      {tooltip && <SankeyTooltip info={tooltip} />}

      <p className="px-1 pb-0.5 text-center text-stone-500/80 md:text-[10px]" style={{ paddingTop: isCompactMobile ? 4 : isWideMobile ? 6 : 5, fontSize: isCompactMobile ? 8.5 : 9 }}>
        Momentaufnahme · Linienstärke nach Anteil · kein chronologischer Ablauf
      </p>
    </div>
  )
}
