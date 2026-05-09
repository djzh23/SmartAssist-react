import type { ToolType } from '../types'

/**
 * Muted Tailwind 300/400 accents for dark UI (#1C1917 / app canvas) — bright 500s are meant for light surfaces.
 * Active row/card tint: use {@link CHAT_FEATURE_ACTIVE_BG_ALPHA} with {@link hexToRgba}.
 */
export const CHAT_FEATURE_ACTIVE_BG_ALPHA = 0.08

export const CHAT_FEATURE_COLORS: Record<string, string> = {
  general: '#5EEAD4', // Teal 300 — Karriere-Chat
  jobanalyzer: '#818CF8', // Indigo 400 — Stellenanalyse
  interviewprep: '#F9A8D4', // Pink 300 — Interview
  interview: '#F9A8D4',
  cover_letter: '#FCD34D', // Amber 300 — Anschreiben
  salary_coach: '#C4B5FD', // Violet 300 — Gehalt
  linkedin: '#94A3B8', // Slate 400 — LinkedIn (dim when unavailable)
  /** Distinct from general teal; keeps tool language elsewhere */
  programming: '#7DD3FC', // Sky 300
  language: '#6EE7B7', // Emerald 300
}

function normalizeFeatureKey(tool: string | ToolType | undefined | null): string {
  if (!tool) return 'general'
  const s = String(tool).toLowerCase()
  if (s === 'interview') return 'interviewprep'
  if (s === 'salarycoach' || s === 'salary' || s === 'gehalt') return 'salary_coach'
  return s
}

export function getChatFeatureColor(tool: string | ToolType | undefined | null): string {
  const key = normalizeFeatureKey(tool)
  return CHAT_FEATURE_COLORS[key] ?? CHAT_FEATURE_COLORS.general
}

/** Solid fills (user bubble, send): Slate accent needs a darker surface + light text for contrast. */
export function getChatFeatureSolidFill(tool: string | ToolType | undefined | null): string {
  const key = normalizeFeatureKey(tool)
  if (key === 'linkedin') return '#475569'
  return getChatFeatureColor(tool)
}

/** Foreground on solid fills — dark ink on pastels; light on LinkedIn slate button. */
export function getChatFeatureOnAccentFg(tool: string | ToolType | undefined | null): string {
  const key = normalizeFeatureKey(tool)
  if (key === 'linkedin') return '#fafaf9'
  return '#1c1917'
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
