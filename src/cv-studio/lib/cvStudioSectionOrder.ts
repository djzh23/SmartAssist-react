/** Must match CvStudio.Application.Contracts.CvStudioMainSectionOrder (PDF/DOCX). */

export const CV_MAIN_SECTION_KEYS = [
  'summary',
  'skills',
  'work',
  'education',
  'languages',
  'interests',
  'projects',
] as const

export type CvMainSectionKey = (typeof CV_MAIN_SECTION_KEYS)[number]

export const CV_MAIN_SECTION_LABELS: Record<CvMainSectionKey, string> = {
  summary: 'Qualifikationsprofil',
  skills: 'Kenntnisse',
  work: 'Berufserfahrung',
  education: 'Ausbildung',
  languages: 'Sprachen',
  interests: 'Interessen',
  projects: 'Projekte',
}

const DEFAULT_BASE = ['summary', 'skills', 'work', 'education', 'languages', 'projects'] as const

export function normalizeContentSectionOrder(raw: string[] | null | undefined): CvMainSectionKey[] {
  const result: string[] = []
  const known = new Set<string>(CV_MAIN_SECTION_KEYS)
  for (const k of raw ?? []) {
    const key = (k || '').trim().toLowerCase()
    if (!known.has(key))
      continue
    if (result.includes(key))
      continue
    result.push(key)
  }
  for (const d of DEFAULT_BASE) {
    if (!result.includes(d))
      result.push(d)
  }

  const langIdx = result.indexOf('languages')
  const intIdx = result.indexOf('interests')
  if (langIdx >= 0 && intIdx < 0)
    result.splice(langIdx + 1, 0, 'interests')

  return result as CvMainSectionKey[]
}
