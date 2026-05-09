import type { ToolType } from '../types'

export const CHAT_FEATURE_COLORS: Record<string, string> = {
  general: '#0D9488',
  jobanalyzer: '#6366F1',
  interviewprep: '#EC4899',
  interview: '#EC4899',
  cover_letter: '#F59E0B',
  salary_coach: '#8B5CF6',
  linkedin: '#64748B',
  programming: '#06B6D4',
  language: '#10B981',
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
