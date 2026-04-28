import type { ApplicationStatusApi } from '../../api/client'
import type { ApplicationOverview } from '../../utils/applicationOverview'

export const SANKEY_PIPELINE_FILL: Record<ApplicationStatusApi, string> = {
  draft: '#d97706',
  applied: '#2563eb',
  phoneScreen: '#7c3aed',
  interview: '#4f46e5',
  assessment: '#ea580c',
  offer: '#059669',
  accepted: '#047857',
  rejected: '#94a3b8',
  withdrawn: '#78716c',
}

export interface SankeyRect {
  id: string
  label: string
  status?: ApplicationStatusApi
  sub?: string
  count: number
  pct: number
  x: number
  y: number
  w: number
  h: number
  fill: string
  stroke: string
  muted?: boolean
}

export interface SankeyBand {
  id: string
  fromId: string
  toId: string
  label: string
  count: number
  pct: number
  x0: number
  y0: number
  x1: number
  y1: number
  stroke: string
  strokeWidth: number
  opacity: number
  muted?: boolean
}

export interface SankeyLayout {
  rects: SankeyRect[]
  bands: SankeyBand[]
}

export function curvePath(x0: number, y0: number, x1: number, y1: number): string {
  const mid = (x0 + x1) / 2
  return `M ${x0} ${y0} C ${mid} ${y0}, ${mid} ${y1}, ${x1} ${y1}`
}

function strokeForValue(v: number, maxV: number): number {
  if (maxV <= 0 || v <= 0) return 1.5
  const t = Math.sqrt(v / maxV)
  return Math.max(1.5, Math.min(20, 3 + t * 17))
}

/**
 * Snapshot „Sankey“: Alle → (Pipeline | Archiv) → Status-Zähler.
 * Keine Historie — nur aktuelle Verteilung wie in der Pipeline.
 */
export function buildApplicationSankeyLayout(
  overview: ApplicationOverview,
  width: number,
  height: number,
): SankeyLayout {
  const rects: SankeyRect[] = []
  const bands: SankeyBand[] = []
  const { total, activeInPipeline, inArchive, pipeline, archive } = overview

  const padL = 12
  const padR = 12
  const padT = 14
  const padB = 18
  const innerW = width - padL - padR
  const innerH = height - padT - padB

  if (total <= 0) {
    return { rects, bands }
  }

  const w0 = Math.min(120, innerW * 0.18)
  const gap = innerW * 0.04
  const w1 = Math.min(132, innerW * 0.2)
  const x0 = padL
  const x1 = x0 + w0 + gap
  const x2 = x1 + w1 + gap
  const w2 = Math.max(150, innerW - (x2 - padL) - 4)

  const hAll = Math.max(58, innerH * 0.62)
  const yAll = padT + (innerH - hAll) / 2
  const baseNodeFill = 'rgb(238, 233, 226)'
  const baseNodeStroke = 'rgba(120, 113, 108, 0.45)'

  rects.push({
    id: 'all',
    label: 'Alle Bewerbungen',
    sub: String(total),
    count: total,
    pct: 1,
    x: x0,
    y: yAll,
    w: w0,
    h: hAll,
    fill: baseNodeFill,
    stroke: baseNodeStroke,
  })

  const hPipeRaw = activeInPipeline > 0 ? Math.max(22, innerH * (activeInPipeline / total) * 0.7) : 22
  const hArchRaw = inArchive > 0 ? Math.max(20, innerH * (inArchive / total) * 0.55) : 20
  const hSum = hPipeRaw + hArchRaw
  const scale = hSum > innerH ? innerH / hSum : 1
  const hPipeS = hPipeRaw * scale
  const hArchS = hArchRaw * scale
  const centerY = padT + innerH / 2
  const yPipe = Math.max(padT + 8, centerY - hPipeS - 18)
  const yArch = Math.min(padT + innerH - hArchS - 8, centerY + 18)

  const maxV = Math.max(
    total,
    activeInPipeline,
    inArchive,
    1,
    ...pipeline.map(p => p.count),
    ...archive.map(a => a.count),
  )

  const xExitAll = x0 + w0
  const yExitPipe = yAll + hAll * 0.34
  const yExitArch = yAll + hAll * 0.68

  rects.push({
    id: 'pipe',
    label: 'Aktive Pipeline',
    sub: String(activeInPipeline),
    count: activeInPipeline,
    pct: total > 0 ? activeInPipeline / total : 0,
    x: x1,
    y: yPipe,
    w: w1,
    h: hPipeS,
    fill: baseNodeFill,
    stroke: baseNodeStroke,
    muted: activeInPipeline === 0,
  })
  bands.push({
    id: 'band-all-pipe',
    fromId: 'all',
    toId: 'pipe',
    label: 'Alle → Aktive Pipeline',
    count: activeInPipeline,
    pct: total > 0 ? activeInPipeline / total : 0,
    x0: xExitAll,
    y0: yExitPipe,
    x1: x1,
    y1: yPipe + hPipeS / 2,
    stroke: '#0ea5a5',
    strokeWidth: strokeForValue(activeInPipeline, maxV),
    opacity: activeInPipeline > 0 ? 0.35 : 0.08,
    muted: activeInPipeline === 0,
  })

  rects.push({
    id: 'arch',
    label: 'Archiv / Geschlossen',
    sub: String(inArchive),
    count: inArchive,
    pct: total > 0 ? inArchive / total : 0,
    x: x1,
    y: yArch,
    w: w1,
    h: hArchS,
    fill: baseNodeFill,
    stroke: baseNodeStroke,
    muted: inArchive === 0,
  })
  bands.push({
    id: 'band-all-arch',
    fromId: 'all',
    toId: 'arch',
    label: 'Alle → Archiv / Geschlossen',
    count: inArchive,
    pct: total > 0 ? inArchive / total : 0,
    x0: xExitAll,
    y0: yExitArch,
    x1: x1,
    y1: yArch + hArchS / 2,
    stroke: '#94a3b8',
    strokeWidth: strokeForValue(inArchive, maxV),
    opacity: inArchive > 0 ? 0.33 : 0.08,
    muted: inArchive === 0,
  })

  const pipeLeaves = pipeline
  const archLeaves = archive
  const xMidOut = x1 + w1

  const pipeGap = Math.max(8, Math.floor((innerH * 0.024)))
  const archGap = pipeGap
  const minNodeH = 18
  const pipeBodyH = Math.max(
    minNodeH * pipeLeaves.length + pipeGap * (pipeLeaves.length - 1),
    hPipeS,
  )
  const archBodyH = Math.max(
    minNodeH * archLeaves.length + archGap * (archLeaves.length - 1),
    hArchS,
  )
  const yPipeBase = Math.max(padT + 4, yPipe - Math.max(0, (pipeBodyH - hPipeS) / 2))
  const yArchBase = Math.min(
    padT + innerH - archBodyH - 4,
    yArch + Math.max(0, (hArchS - archBodyH) / 2),
  )
  const pipeWeights = pipeLeaves.map(p => (p.count > 0 ? p.count : 0.25))
  const archWeights = archLeaves.map(p => (p.count > 0 ? p.count : 0.25))
  const pipeWeightSum = pipeWeights.reduce((s, n) => s + n, 0) || 1
  const archWeightSum = archWeights.reduce((s, n) => s + n, 0) || 1

  let accP = 0
  for (let i = 0; i < pipeLeaves.length; i += 1) {
    const p = pipeLeaves[i]
    const weight = pipeWeights[i]
    const h = Math.max(minNodeH, (pipeBodyH * weight) / pipeWeightSum)
    const stagger = (i % 2 === 0 ? -1 : 1) * Math.min(4, i)
    const yTop = yPipeBase + accP + stagger
    const muted = p.count === 0
    rects.push({
      id: `p-${p.status}`,
      label: p.label,
      sub: String(p.count),
      status: p.status,
      count: p.count,
      pct: total > 0 ? p.count / total : 0,
      x: x2,
      y: yTop,
      w: w2,
      h,
      fill: baseNodeFill,
      stroke: muted ? 'rgba(148,163,184,0.5)' : 'rgba(15,23,42,0.2)',
      muted,
    })
    const sy = yPipe + Math.min(hPipeS, accP + h / 2)
    const ty = yTop + h / 2
    bands.push({
      id: `band-pipe-${p.status}`,
      fromId: 'pipe',
      toId: `p-${p.status}`,
      label: `Aktive Pipeline → ${p.label}`,
      count: p.count,
      pct: total > 0 ? p.count / total : 0,
      x0: xMidOut,
      y0: sy,
      x1: x2,
      y1: ty,
      stroke: SANKEY_PIPELINE_FILL[p.status] ?? '#94a3b8',
      strokeWidth: strokeForValue(p.count, maxV),
      opacity: muted ? 0.08 : 0.3,
      muted,
    })
    accP += h + pipeGap
  }

  let accA = 0
  for (let i = 0; i < archLeaves.length; i += 1) {
    const p = archLeaves[i]
    const weight = archWeights[i]
    const h = Math.max(minNodeH, (archBodyH * weight) / archWeightSum)
    const stagger = (i % 2 === 0 ? 1 : -1) * Math.min(4, i)
    const yTop = yArchBase + accA + stagger
    const muted = p.count === 0
    rects.push({
      id: `a-${p.status}`,
      label: p.label,
      sub: String(p.count),
      status: p.status,
      count: p.count,
      pct: total > 0 ? p.count / total : 0,
      x: x2,
      y: yTop,
      w: w2,
      h,
      fill: baseNodeFill,
      stroke: muted ? 'rgba(148,163,184,0.5)' : 'rgba(15,23,42,0.2)',
      muted,
    })
    const sy = yArch + Math.min(hArchS, accA + h / 2)
    const ty = yTop + h / 2
    bands.push({
      id: `band-arch-${p.status}`,
      fromId: 'arch',
      toId: `a-${p.status}`,
      label: `Archiv / Geschlossen → ${p.label}`,
      count: p.count,
      pct: total > 0 ? p.count / total : 0,
      x0: xMidOut,
      y0: sy,
      x1: x2,
      y1: ty,
      stroke: SANKEY_PIPELINE_FILL[p.status] ?? '#a8a29e',
      strokeWidth: strokeForValue(p.count, maxV),
      opacity: muted ? 0.08 : 0.28,
      muted,
    })
    accA += h + archGap
  }

  return { rects, bands }
}
