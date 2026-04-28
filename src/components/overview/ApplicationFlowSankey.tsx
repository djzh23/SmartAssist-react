import { useMemo, useState, useEffect, useRef, type Dispatch, type SetStateAction } from 'react'
import type { ApplicationOverview } from '../../utils/applicationOverview'
import { buildApplicationSankeyLayout, curvePath } from './applicationSankeyLayout'
import type { SankeyBand, SankeyRect } from './applicationSankeyLayout'

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

function colorForNode(rect: SankeyRect): { from: string; to: string; text: string; stroke: string } {
  if (rect.id === 'all') {
    return { from: '#ffffff', to: '#f1f5f9', text: '#0f172a', stroke: '#94a3b8' }
  }
  if (rect.id === 'pipe') {
    return { from: '#c4f1ec', to: '#8de3da', text: '#0f172a', stroke: '#0d9488' }
  }
  if (rect.id === 'arch') {
    return { from: '#eef2f7', to: '#dbe4ee', text: '#111827', stroke: '#94a3b8' }
  }
  if (rect.status === 'draft') {
    return { from: '#ffedd5', to: '#fed7aa', text: '#7c2d12', stroke: '#ea580c' }
  }
  if (rect.status === 'applied') {
    return { from: '#dbeafe', to: '#bfdbfe', text: '#1e3a8a', stroke: '#2563eb' }
  }
  if (rect.status === 'interview' || rect.status === 'phoneScreen') {
    return { from: '#ede9fe', to: '#ddd6fe', text: '#4c1d95', stroke: '#7c3aed' }
  }
  if (rect.status === 'offer' || rect.status === 'accepted') {
    return { from: '#ccfbf1', to: '#99f6e4', text: '#134e4a', stroke: '#0f766e' }
  }
  if (rect.status === 'rejected' || rect.status === 'withdrawn') {
    return { from: '#f3f4f6', to: '#e5e7eb', text: '#374151', stroke: '#9ca3af' }
  }
  return { from: '#f8fafc', to: '#e2e8f0', text: '#1f2937', stroke: '#94a3b8' }
}

function nodeLabel(rect: SankeyRect): string {
  const label = `${rect.label} (${rect.count})`
  return label.length > 28 ? `${label.slice(0, 26)}…` : label
}

interface CustomNodeProps {
  rect: SankeyRect
  hover: HoverInfo | null
  setHover: Dispatch<SetStateAction<HoverInfo | null>>
}

function CustomNode({ rect, hover, setHover }: CustomNodeProps) {
  const palette = colorForNode(rect)
  const gradientId = `node-grad-${rect.id}`
  const shadowId = `node-shadow-${rect.id}`
  const isActive = hover?.title === rect.label
  const isMuted = Boolean(rect.muted)
  const strokeDasharray = isMuted ? '5 4' : undefined
  const scale = isActive ? 1.01 : 1
  return (
    <g
      style={{
        transform: `scale(${scale})`,
        transformOrigin: `${rect.x + rect.w / 2}px ${rect.y + rect.h / 2}px`,
        transition: 'transform 180ms ease, filter 180ms ease',
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={palette.from} stopOpacity={isMuted ? 0.45 : 0.96} />
          <stop offset="100%" stopColor={palette.to} stopOpacity={isMuted ? 0.35 : 0.96} />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy={isActive ? '2.2' : '1.4'}
            stdDeviation={isActive ? '2.4' : '1.6'}
            floodColor="#0f172a"
            floodOpacity={isMuted ? '0.06' : (isActive ? '0.18' : '0.12')}
          />
        </filter>
      </defs>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.w}
        height={Math.max(rect.h, 6)}
        rx={8}
        fill={`url(#${gradientId})`}
        stroke={palette.stroke}
        strokeWidth={isActive ? 1.8 : 1.2}
        strokeDasharray={strokeDasharray}
        filter={`url(#${shadowId})`}
        style={{ transition: 'all 180ms ease' }}
        onMouseEnter={e => {
          setHover({
            x: e.clientX,
            y: e.clientY,
            title: rect.label,
            count: rect.count,
            pct: rect.pct,
          })
        }}
        onMouseMove={e => {
          setHover(h => (h ? { ...h, x: e.clientX, y: e.clientY } : null))
        }}
        onMouseLeave={() => setHover(null)}
      />
      <text
        x={rect.x + rect.w / 2}
        y={rect.y + rect.h / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={palette.text}
        style={{ fontSize: rect.w < 72 ? 10 : 12 }}
        className="font-semibold"
      >
        {nodeLabel(rect)}
      </text>
    </g>
  )
}

interface CustomLinkProps {
  band: SankeyBand
  activeBandId: string | null
  setActiveBandId: (id: string | null) => void
  setHover: Dispatch<SetStateAction<HoverInfo | null>>
}

function CustomLink({ band, activeBandId, setActiveBandId, setHover }: CustomLinkProps) {
  const gradId = `band-grad-${band.id}`
  const isActive = activeBandId === band.id
  const isDimmed = activeBandId != null && !isActive
  const opacity = isDimmed ? 0.08 : (isActive ? Math.max(0.68, band.opacity + 0.16) : Math.max(0.42, band.opacity))
  return (
    <g>
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" x1={band.x0} y1={band.y0} x2={band.x1} y2={band.y1}>
          <stop offset="0%" stopColor={band.stroke} stopOpacity={0.88} />
          <stop offset="100%" stopColor={band.stroke} stopOpacity={0.3} />
        </linearGradient>
      </defs>
      <path
        d={curvePath(band.x0, band.y0, band.x1, band.y1)}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={isActive ? band.strokeWidth + 1 : band.strokeWidth}
        strokeOpacity={opacity}
        strokeLinecap="round"
        style={{ transition: 'stroke-opacity 180ms ease, stroke-width 180ms ease' }}
        onMouseEnter={e => {
          setActiveBandId(band.id)
          setHover({
            x: e.clientX,
            y: e.clientY,
            title: band.label,
            count: band.count,
            pct: band.pct,
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
    </g>
  )
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
        {layout.bands.map(b => (
          <CustomLink
            key={b.id}
            band={b}
            activeBandId={activeBandId}
            setActiveBandId={setActiveBandId}
            setHover={setHover}
          />
        ))}
        {layout.rects.map(r => (
          <CustomNode key={r.id} rect={r} hover={hover} setHover={setHover} />
        ))}
      </svg>
      {hover && (
        <div
          className="pointer-events-none fixed z-[220] rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 text-[11px] shadow-2xl backdrop-blur"
          style={{ left: hover.x + 12, top: hover.y + 12 }}
        >
          <p className="font-semibold text-slate-900">{hover.title}</p>
          <p className="mt-0.5 text-slate-700 tabular-nums">Anzahl: {hover.count}</p>
          <p className="text-slate-600 tabular-nums">Anteil: {(hover.pct * 100).toFixed(1)}%</p>
        </div>
      )}
      <p className="px-1 pb-1 pt-1 text-center text-[10px] text-stone-500">
        Linienstärke grob nach Anteil, Momentaufnahme deiner Status, kein chronologischer Ablauf.
      </p>
    </div>
  )
}
