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
  sub?: string
  x: number
  y: number
  w: number
  h: number
  fill: string
}

export interface SankeyBand {
  x0: number
  y0: number
  x1: number
  y1: number
  stroke: string
  strokeWidth: number
  opacity: number
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
  if (maxV <= 0 || v <= 0) return 2
  const t = Math.sqrt(v / maxV)
  return Math.max(2, Math.min(22, 4 + t * 18))
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

  const padL = 10
  const padR = 8
  const padT = 16
  const padB = 22
  const innerW = width - padL - padR
  const innerH = height - padT - padB

  if (total <= 0) {
    return { rects, bands }
  }

  const w0 = Math.min(86, innerW * 0.14)
  const gap = innerW * 0.04
  const w1 = Math.min(100, innerW * 0.16)
  const x0 = padL
  const x1 = x0 + w0 + gap
  const x2 = x1 + w1 + gap
  const w2 = Math.max(120, innerW - (x2 - padL) - 4)

  const hAll = Math.max(48, innerH * 0.88)
  const yAll = padT + (innerH - hAll) / 2

  rects.push({
    id: 'all',
    label: 'Alle Bewerbungen',
    sub: String(total),
    x: x0,
    y: yAll,
    w: w0,
    h: hAll,
    fill: '#0d9488',
  })

  const hPipeRaw = activeInPipeline > 0 ? Math.max(12, innerH * (activeInPipeline / total)) : 0
  const hArchRaw = inArchive > 0 ? Math.max(12, innerH * (inArchive / total)) : 0
  const hSum = hPipeRaw + hArchRaw
  const scale = hSum > innerH ? innerH / hSum : 1
  const hPipeS = hPipeRaw * scale
  const hArchS = hArchRaw * scale
  const yPipe = padT + (innerH - hPipeS - hArchS) / 2
  const yArch = yPipe + hPipeS

  const maxV = Math.max(
    total,
    activeInPipeline,
    inArchive,
    1,
    ...pipeline.map(p => p.count),
    ...archive.map(a => a.count),
  )

  const xExitAll = x0 + w0
  const yExitPipe =
    activeInPipeline > 0 && inArchive > 0 ? yAll + hAll * 0.28 : yAll + hAll / 2
  const yExitArch =
    activeInPipeline > 0 && inArchive > 0 ? yAll + hAll * 0.72 : yAll + hAll / 2

  if (activeInPipeline > 0 && hPipeS > 0) {
    rects.push({
      id: 'pipe',
      label: 'Aktive Pipeline',
      sub: String(activeInPipeline),
      x: x1,
      y: yPipe,
      w: w1,
      h: hPipeS,
      fill: '#0369a1',
    })
    bands.push({
      x0: xExitAll,
      y0: activeInPipeline > 0 && inArchive > 0 ? yExitPipe : yAll + hAll / 2,
      x1: x1,
      y1: yPipe + hPipeS / 2,
      stroke: '#2dd4bf',
      strokeWidth: strokeForValue(activeInPipeline, maxV),
      opacity: 0.42,
    })
  }

  if (inArchive > 0 && hArchS > 0) {
    rects.push({
      id: 'arch',
      label: 'Archiv',
      sub: String(inArchive),
      x: x1,
      y: yArch,
      w: w1,
      h: hArchS,
      fill: '#57534e',
    })
    bands.push({
      x0: xExitAll,
      y0: activeInPipeline > 0 && inArchive > 0 ? yExitArch : yAll + hAll / 2,
      x1: x1,
      y1: yArch + hArchS / 2,
      stroke: '#a8a29e',
      strokeWidth: strokeForValue(inArchive, maxV),
      opacity: 0.38,
    })
  }

  const pipeLeaves = pipeline.filter(p => p.count > 0)
  const archLeaves = archive.filter(p => p.count > 0)
  const sumP = pipeLeaves.reduce((s, p) => s + p.count, 0) || 1
  const sumA = archLeaves.reduce((s, p) => s + p.count, 0) || 1

  const xMidOut = x1 + w1

  let accP = 0
  for (const p of pipeLeaves) {
    const h = hPipeS > 0 ? Math.max(10, (hPipeS * p.count) / sumP) : 0
    const yTop = yPipe + accP
    rects.push({
      id: `p-${p.status}`,
      label: p.label,
      sub: String(p.count),
      x: x2,
      y: yTop,
      w: w2,
      h,
      fill: SANKEY_PIPELINE_FILL[p.status] ?? '#64748b',
    })
    if (activeInPipeline > 0 && hPipeS > 0) {
      const sy = yPipe + accP + h / 2
      const ty = yTop + h / 2
      bands.push({
        x0: xMidOut,
        y0: sy,
        x1: x2,
        y1: ty,
        stroke: SANKEY_PIPELINE_FILL[p.status] ?? '#94a3b8',
        strokeWidth: strokeForValue(p.count, maxV),
        opacity: 0.34,
      })
    }
    accP += h
  }

  let accA = 0
  for (const p of archLeaves) {
    const h = hArchS > 0 ? Math.max(10, (hArchS * p.count) / sumA) : 0
    const yTop = yArch + accA
    rects.push({
      id: `a-${p.status}`,
      label: p.label,
      sub: String(p.count),
      x: x2,
      y: yTop,
      w: w2,
      h,
      fill: SANKEY_PIPELINE_FILL[p.status] ?? '#78716c',
    })
    if (inArchive > 0 && hArchS > 0) {
      const sy = yArch + accA + h / 2
      const ty = yTop + h / 2
      bands.push({
        x0: xMidOut,
        y0: sy,
        x1: x2,
        y1: ty,
        stroke: SANKEY_PIPELINE_FILL[p.status] ?? '#a8a29e',
        strokeWidth: strokeForValue(p.count, maxV),
        opacity: 0.3,
      })
    }
    accA += h
  }

  return { rects, bands }
}
