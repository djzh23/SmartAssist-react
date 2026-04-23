import type { ResumeVersionDto } from '../cvTypes'

export function formatVariantenName(v: ResumeVersionDto): string {
  const basis = v.label?.trim() ? v.label.trim() : 'Ohne Namen'
  return `${basis} v${v.versionNumber}`
}

export function versionBadgeClass(versionNumber: number): string {
  const normalized = Math.max(versionNumber, 1)
  const index = (normalized - 1) % 3
  if (index === 0) return 'bg-amber-500/25 text-amber-200 ring-1 ring-amber-500/40'
  if (index === 1) return 'bg-sky-500/25 text-sky-200 ring-1 ring-sky-500/40'
  return 'bg-violet-500/25 text-violet-200 ring-1 ring-violet-500/40'
}

export function formatUrl(url: string | null | undefined): string {
  if (!url?.trim()) return ''
  return url
    .replace(/^https:\/\//i, '')
    .replace(/^http:\/\//i, '')
    .replace(/\/$/, '')
    .trim()
}
