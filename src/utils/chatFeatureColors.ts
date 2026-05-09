import type { ToolType } from '../types'

/** Warm sepia/brown accents — aligned with dark shell (#120c08), no rainbow primaries. */
export const CHAT_FEATURE_COLORS: Record<string, string> = {
  general: '#B45309',
  jobanalyzer: '#92400E',
  interviewprep: '#A16207',
  interview: '#A16207',
  cover_letter: '#C2410C',
  salary_coach: '#854D0E',
  linkedin: '#57534E',
  programming: '#713F12',
  language: '#78716C',
}

function normalizeFeatureKey(tool: string | ToolType | undefined | null): string {
  if (!tool) return 'general'
  if (tool === 'interview') return 'interviewprep'
  return String(tool).toLowerCase()
}

export function getChatFeatureColor(tool: string | ToolType | undefined | null): string {
  const key = normalizeFeatureKey(tool)
  return CHAT_FEATURE_COLORS[key] ?? CHAT_FEATURE_COLORS.general
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '')
  const chunk = normalized.length === 3
    ? normalized.split('').map(ch => `${ch}${ch}`).join('')
    : normalized
  const r = Number.parseInt(chunk.slice(0, 2), 16)
  const g = Number.parseInt(chunk.slice(2, 4), 16)
  const b = Number.parseInt(chunk.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
