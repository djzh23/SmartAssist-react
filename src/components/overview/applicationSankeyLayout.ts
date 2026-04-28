import type { ApplicationStatusApi } from '../../api/client'
import type { ApplicationOverview } from '../../utils/applicationOverview'

export const SANKEY_PIPELINE_FILL: Record<ApplicationStatusApi, string> = {
  draft: '#d97706',
  applied: '#2563eb',
  phoneScreen: '#a855f7',
  interview: '#4f46e5',
  assessment: '#ea580c',
  offer: '#14b8a6',
  accepted: '#16a34a',
  rejected: '#64748b',
  withdrawn: '#a16207',
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
  return Math.max(1.5, Math.min(10, 2 + t * 8))
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

  const hPipeRaw = activeInPipeline > 0 ? Math.max(22, innerH * (activeInPipeline / total) * 0.52) : 22
  const hArchRaw = inArchive > 0 ? Math.max(20, innerH * (inArchive / total) * 0.45) : 20
  const hSum = hPipeRaw + hArchRaw
  const scale = hSum > innerH ? innerH / hSum : 1
  const hPipeS = hPipeRaw * scale
  const hArchS = hArchRaw * scale
  const branchGap = 22
  const leafUsableH = innerH - branchGap
  const pipeAreaH = leafUsableH * 0.56
  const archAreaH = leafUsableH - pipeAreaH
  const pipeAreaY = padT + 2
  const archAreaY = pipeAreaY + pipeAreaH + branchGap
  const yPipe = pipeAreaY + Math.max(0, (pipeAreaH - hPipeS) / 2)
  const yArch = archAreaY + Math.max(0, (archAreaH - hArchS) / 2)

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
    stroke: '#14b8a6',
    strokeWidth: strokeForValue(activeInPipeline, maxV),
    opacity: activeInPipeline > 0 ? 0.62 : 0.1,
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
    opacity: inArchive > 0 ? 0.58 : 0.1,
    muted: inArchive === 0,
  })

  const pipeLeaves = pipeline
  const archLeaves = archive
  const xMidOut = x1 + w1

  const pipeGap = 8
  const archGap = pipeGap
  const minNodeH = 22
  const pipeSlotH = Math.max(minNodeH, (pipeAreaH - pipeGap * (pipeLeaves.length - 1)) / pipeLeaves.length)
  const archSlotH = Math.max(minNodeH, (archAreaH - archGap * (archLeaves.length - 1)) / archLeaves.length)
  const pipeBodyH = pipeLeaves.length * pipeSlotH + (pipeLeaves.length - 1) * pipeGap
  const archBodyH = archLeaves.length * archSlotH + (archLeaves.length - 1) * archGap
  const yPipeBase = pipeAreaY + Math.max(0, (pipeAreaH - pipeBodyH) / 2)
  const yArchBase = archAreaY + Math.max(0, (archAreaH - archBodyH) / 2)

  let accP = 0
  for (let i = 0; i < pipeLeaves.length; i += 1) {
    const p = pipeLeaves[i]
    const h = pipeSlotH
    const yTop = yPipeBase + accP
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
      fill: muted ? 'rgb(245, 243, 240)' : 'rgb(255, 255, 255)',
      stroke: muted ? 'rgba(148,163,184,0.5)' : (SANKEY_PIPELINE_FILL[p.status] ?? 'rgba(15,23,42,0.2)'),
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
      opacity: muted ? 0.1 : 0.68,
      muted,
    })
    accP += h + pipeGap
  }

  let accA = 0
  for (let i = 0; i < archLeaves.length; i += 1) {
    const p = archLeaves[i]
    const h = archSlotH
    const yTop = yArchBase + accA
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
      fill: muted ? 'rgb(245, 243, 240)' : 'rgb(255, 255, 255)',
      stroke: muted ? 'rgba(148,163,184,0.5)' : (SANKEY_PIPELINE_FILL[p.status] ?? 'rgba(15,23,42,0.2)'),
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
      opacity: muted ? 0.1 : 0.64,
      muted,
    })
    accA += h + archGap
  }

  return { rects, bands }
}
