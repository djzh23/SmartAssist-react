import type { ResumeDto, ResumeVersionSummaryDto } from '../cvTypes'

function sanitizeSegment(s: string | null | undefined, max = 36): string {
  const t = (s ?? '').trim()
  if (!t) return ''
  return t
    .replace(/[/\\:*?"<>|]+/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, max)
}

/** Relative Zeit auf Deutsch (grob, für Editor-Header). */
export function formatRelativeTimeDe(iso: string | undefined | null, now = new Date()): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sec = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (sec < 45) return 'vor wenigen Sekunden'
  const min = Math.floor(sec / 60)
  if (min < 2) return 'vor 1 Min'
  if (min < 60) return `vor ${min} Min`
  const h = Math.floor(min / 60)
  if (h < 2) return 'vor 1 Std.'
  if (h < 24) return `vor ${h} Std.`
  const days = Math.floor(h / 24)
  if (days < 7) return `vor ${days} Tag${days === 1 ? '' : 'en'}`
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })
}

function maxVersionNumber(versions: ResumeVersionSummaryDto[]): number {
  return versions.reduce((m, v) => Math.max(m, v.versionNumber), 0)
}

/** Vorschlag für PDF/DOCX-Stamm: `CV_{Nachname}_{Firma}_{Rolle}_v{N}` (Arbeitsversion: N = höchste Snapshot-Nummer + 1). */
export function buildCvExportStem(
  resume: ResumeDto,
  versions: ResumeVersionSummaryDto[],
  opts?: { pinnedVersionNumber?: number | null },
): string {
  const last = sanitizeSegment(resume.resumeData.profile.lastName) || 'CV'
  const co = sanitizeSegment(resume.targetCompany)
  const role = sanitizeSegment(resume.targetRole)
  const mid = [last, co, role].filter(Boolean).join('_')
  const vn = opts?.pinnedVersionNumber
  const vNum = vn != null && vn > 0 ? vn : maxVersionNumber(versions) + 1
  return mid ? `CV_${mid}_v${vNum}` : `CV_${last}_v${vNum}`
}
