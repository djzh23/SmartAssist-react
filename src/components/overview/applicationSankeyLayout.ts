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
  total: number
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

/** Smooth cubic bezier, control point slightly biased toward target */
export function curvePath(x0: number, y0: number, x1: number, y1: number): string {
  const cp = x0 + (x1 - x0) * 0.55
  return `M ${x0} ${y0} C ${cp} ${y0}, ${cp} ${y1}, ${x1} ${y1}`
}

const NODE_H = 24
const NODE_GAP = 9
const GROUP_GAP = 28

function strokeW(v: number, maxV: number): number {
  if (maxV <= 0 || v <= 0) return 1.5
  const t = Math.sqrt(v / maxV)
  return Math.max(1.5, Math.min(9, 1.8 + t * 7.2))
}

const BASE_FILL = 'rgb(238, 233, 226)'
const BASE_STROKE = 'rgba(120, 113, 108, 0.4)'
const MUTED_FILL = 'rgb(245, 243, 240)'
const MUTED_STROKE = 'rgba(148, 163, 184, 0.45)'

/**
 * Tree-style Sankey: All → (Pipeline | Archive) → Status nodes.
 * Fixed NODE_H per status, fan links from group-box center.
 */
export function buildApplicationSankeyLayout(
  overview: ApplicationOverview,
  width: number,
  height: number,
): SankeyLayout {
  const rects: SankeyRect[] = []
  const bands: SankeyBand[] = []
  const { total, activeInPipeline, inArchive, pipeline, archive } = overview

  const PAD_L = 14
  const PAD_R = 14
  const PAD_T = 22
  const PAD_B = 28
  const innerW = width - PAD_L - PAD_R
  const innerH = height - PAD_T - PAD_B

  if (total <= 0) return { rects, bands }

  // ── Column geometry ─────────────────────────────────────────────────────────
  const w0 = Math.min(108, innerW * 0.17)
  const w1 = Math.min(124, innerW * 0.19)
  const gap01 = Math.max(22, innerW * 0.045)
  const gap12 = Math.max(26, innerW * 0.05)
  const x0 = PAD_L
  const x1 = x0 + w0 + gap01
  const x2 = x1 + w1 + gap12
  const w2 = Math.max(110, width - PAD_R - x2)

  // ── Right column: fixed-height nodes ────────────────────────────────────────
  const pipelineH = pipeline.length * NODE_H + Math.max(0, pipeline.length - 1) * NODE_GAP
  const archiveH = archive.length * NODE_H + Math.max(0, archive.length - 1) * NODE_GAP
  const totalRightH = pipelineH + GROUP_GAP + archiveH
  const yRightStart = PAD_T + Math.max(0, (innerH - totalRightH) / 2)
  const yPipeStart = yRightStart
  const yArchStart = yRightStart + pipelineH + GROUP_GAP

  // Group centers (used for fan link origins)
  const pipeCenterY = yPipeStart + pipelineH / 2
  const archCenterY = yArchStart + archiveH / 2

  // ── Group boxes (col 1) ──────────────────────────────────────────────────────
  const hPipeBox = Math.max(48, pipelineH * 0.72)
  const yPipeBox = pipeCenterY - hPipeBox / 2

  const hArchBox = Math.max(36, archiveH * 0.72)
  const yArchBox = archCenterY - hArchBox / 2

  rects.push({
    id: 'pipe',
    label: 'Aktive Pipeline',
    sub: String(activeInPipeline),
    count: activeInPipeline,
    pct: total > 0 ? activeInPipeline / total : 0,
    x: x1,
    y: yPipeBox,
    w: w1,
    h: hPipeBox,
    fill: BASE_FILL,
    stroke: BASE_STROKE,
    muted: activeInPipeline === 0,
  })

  rects.push({
    id: 'arch',
    label: 'Archiv',
    sub: String(inArchive),
    count: inArchive,
    pct: total > 0 ? inArchive / total : 0,
    x: x1,
    y: yArchBox,
    w: w1,
    h: hArchBox,
    fill: BASE_FILL,
    stroke: BASE_STROKE,
    muted: inArchive === 0,
  })

  // ── "All" box (col 0) — centered between both group centers ─────────────────
  const allCenterY = (pipeCenterY + archCenterY) / 2
  const hAllBox = Math.min(innerH * 0.72, Math.max(72, totalRightH * 0.68))
  const yAllBox = Math.max(PAD_T, allCenterY - hAllBox / 2)

  rects.push({
    id: 'all',
    label: 'Alle Bewerbungen',
    sub: String(total),
    count: total,
    pct: 1,
    x: x0,
    y: yAllBox,
    w: w0,
    h: hAllBox,
    fill: BASE_FILL,
    stroke: BASE_STROKE,
  })

  // ── All → Pipeline band ──────────────────────────────────────────────────────
  const xExitAll = x0 + w0
  const yExitPipe = yAllBox + hAllBox * 0.36
  const yExitArch = yAllBox + hAllBox * 0.66
  const maxV = Math.max(total, 1)

  bands.push({
    id: 'band-all-pipe',
    fromId: 'all',
    toId: 'pipe',
    label: 'Aktive Pipeline',
    count: activeInPipeline,
    total,
    pct: total > 0 ? activeInPipeline / total : 0,
    x0: xExitAll,
    y0: yExitPipe,
    x1: x1,
    y1: pipeCenterY,
    stroke: '#0d9488',
    strokeWidth: strokeW(activeInPipeline, maxV),
    opacity: activeInPipeline > 0 ? 0.55 : 0.1,
    muted: activeInPipeline === 0,
  })

  bands.push({
    id: 'band-all-arch',
    fromId: 'all',
    toId: 'arch',
    label: 'Archiv / Geschlossen',
    count: inArchive,
    total,
    pct: total > 0 ? inArchive / total : 0,
    x0: xExitAll,
    y0: yExitArch,
    x1: x1,
    y1: archCenterY,
    stroke: '#94a3b8',
    strokeWidth: strokeW(inArchive, maxV),
    opacity: inArchive > 0 ? 0.52 : 0.1,
    muted: inArchive === 0,
  })

  // ── Pipeline status nodes (col 2, fixed height, fan from pipeCenterY) ────────
  const xFanPipe = x1 + w1

  for (let i = 0; i < pipeline.length; i++) {
    const p = pipeline[i]
    const yTop = yPipeStart + i * (NODE_H + NODE_GAP)
    const nodeCenterY = yTop + NODE_H / 2
    const muted = p.count === 0
    const accentColor = SANKEY_PIPELINE_FILL[p.status] ?? '#94a3b8'

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
      h: NODE_H,
      fill: muted ? MUTED_FILL : BASE_FILL,
      stroke: muted ? MUTED_STROKE : accentColor,
      muted,
    })

    bands.push({
      id: `band-pipe-${p.status}`,
      fromId: 'pipe',
      toId: `p-${p.status}`,
      label: p.label,
      count: p.count,
      total,
      pct: total > 0 ? p.count / total : 0,
      x0: xFanPipe,
      y0: pipeCenterY,          // all fan from same point (group center)
      x1: x2,
      y1: nodeCenterY,
      stroke: accentColor,
      strokeWidth: strokeW(p.count, maxV),
      opacity: muted ? 0.1 : 0.55,
      muted,
    })
  }

  // ── Archive status nodes (col 2, fixed height, fan from archCenterY) ─────────
  const xFanArch = x1 + w1

  for (let i = 0; i < archive.length; i++) {
    const p = archive[i]
    const yTop = yArchStart + i * (NODE_H + NODE_GAP)
    const nodeCenterY = yTop + NODE_H / 2
    const muted = p.count === 0
    const accentColor = SANKEY_PIPELINE_FILL[p.status] ?? '#94a3b8'

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
      h: NODE_H,
      fill: muted ? MUTED_FILL : BASE_FILL,
      stroke: muted ? MUTED_STROKE : accentColor,
      muted,
    })

    bands.push({
      id: `band-arch-${p.status}`,
      fromId: 'arch',
      toId: `a-${p.status}`,
      label: p.label,
      count: p.count,
      total,
      pct: total > 0 ? p.count / total : 0,
      x0: xFanArch,
      y0: archCenterY,          // all fan from same point (group center)
      x1: x2,
      y1: nodeCenterY,
      stroke: accentColor,
      strokeWidth: strokeW(p.count, maxV),
      opacity: muted ? 0.1 : 0.52,
      muted,
    })
  }

  return { rects, bands }
}
