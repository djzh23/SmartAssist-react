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

function strokeW(v: number, maxV: number, maxStroke = 9): number {
  if (maxV <= 0 || v <= 0) return 1.2
  const t = Math.sqrt(v / maxV)
  return Math.max(1.2, Math.min(maxStroke, 1.4 + t * (maxStroke - 1.4)))
}

function bandOpacity(v: number, total: number, muted: boolean): number {
  if (muted) return 0.08
  if (total <= 0 || v <= 0) return 0.1
  const pct = v / total
  return Math.max(0.16, Math.min(0.68, 0.18 + Math.sqrt(pct) * 0.52))
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

  const isMobile = width < 560
  const isCompactMobile = width <= 360
  const isWideMobile = width >= 390 && width < 560
  const PAD_L = isCompactMobile ? 8 : isMobile ? 10 : 14
  const PAD_R = isCompactMobile ? 8 : isMobile ? 10 : 14
  const PAD_T = isCompactMobile ? 14 : isMobile ? 16 : 22
  const PAD_B = isCompactMobile ? 20 : isMobile ? 22 : 28
  const innerW = width - PAD_L - PAD_R
  const innerH = height - PAD_T - PAD_B

  if (total <= 0) return { rects, bands }

  // ── Column geometry ─────────────────────────────────────────────────────────
  const w0 = isMobile ? Math.max(isCompactMobile ? 48 : 50, Math.min(isWideMobile ? 86 : 82, innerW * 0.17)) : Math.min(108, innerW * 0.17)
  const w1 = isMobile ? Math.max(isCompactMobile ? 54 : 56, Math.min(isWideMobile ? 96 : 92, innerW * 0.19)) : Math.min(124, innerW * 0.19)
  const gap01 = isMobile ? Math.max(isCompactMobile ? 8 : 10, innerW * (isCompactMobile ? 0.018 : 0.02)) : Math.max(22, innerW * 0.045)
  const gap12 = isMobile ? Math.max(isCompactMobile ? 10 : 12, innerW * (isCompactMobile ? 0.024 : 0.028)) : Math.max(26, innerW * 0.05)
  const x0 = PAD_L
  const x1 = x0 + w0 + gap01
  const x2 = x1 + w1 + gap12
  const w2 = Math.max(isMobile ? (isWideMobile ? 128 : 120) : 110, width - PAD_R - x2)
  const nodeH = isCompactMobile ? 20 : isMobile ? 22 : 24
  const nodeGap = isCompactMobile ? 6 : isMobile ? 7 : 9
  const groupGap = isCompactMobile ? 18 : isMobile ? 20 : 28

  // ── Right column: fixed-height nodes ────────────────────────────────────────
  const pipelineH = pipeline.length * nodeH + Math.max(0, pipeline.length - 1) * nodeGap
  const archiveH = archive.length * nodeH + Math.max(0, archive.length - 1) * nodeGap
  const totalRightH = pipelineH + groupGap + archiveH
  const yRightStart = PAD_T + Math.max(0, (innerH - totalRightH) / 2)
  const yPipeStart = yRightStart
  const yArchStart = yRightStart + pipelineH + groupGap

  // Group centers (used for fan link origins)
  const pipeCenterY = yPipeStart + pipelineH / 2
  const archCenterY = yArchStart + archiveH / 2

  // ── Group boxes (col 1) ──────────────────────────────────────────────────────
  const hPipeBox = Math.max(isCompactMobile ? 40 : isMobile ? 44 : 48, pipelineH * 0.72)
  const yPipeBox = pipeCenterY - hPipeBox / 2

  const hArchBox = Math.max(isCompactMobile ? 30 : isMobile ? 32 : 36, archiveH * 0.72)
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
  const hAllBox = Math.min(innerH * 0.72, Math.max(isCompactMobile ? 56 : isMobile ? 62 : 72, totalRightH * 0.68))
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
  const maxStroke = isCompactMobile ? 6.1 : isMobile ? 6.8 : 9

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
    strokeWidth: strokeW(activeInPipeline, maxV, maxStroke),
    opacity: bandOpacity(activeInPipeline, total, activeInPipeline === 0),
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
    strokeWidth: strokeW(inArchive, maxV, maxStroke),
    opacity: bandOpacity(inArchive, total, inArchive === 0),
    muted: inArchive === 0,
  })

  // ── Pipeline status nodes (col 2, fixed height, fan from pipeCenterY) ────────
  const xFanPipe = x1 + w1

  for (let i = 0; i < pipeline.length; i++) {
    const p = pipeline[i]
    const yTop = yPipeStart + i * (nodeH + nodeGap)
    const nodeCenterY = yTop + nodeH / 2
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
      h: nodeH,
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
      strokeWidth: strokeW(p.count, maxV, maxStroke),
      opacity: bandOpacity(p.count, total, muted),
      muted,
    })
  }

  // ── Archive status nodes (col 2, fixed height, fan from archCenterY) ─────────
  const xFanArch = x1 + w1

  for (let i = 0; i < archive.length; i++) {
    const p = archive[i]
    const yTop = yArchStart + i * (nodeH + nodeGap)
    const nodeCenterY = yTop + nodeH / 2
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
      h: nodeH,
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
      strokeWidth: strokeW(p.count, maxV, maxStroke),
      opacity: bandOpacity(p.count, total, muted),
      muted,
    })
  }

  return { rects, bands }
}
