/** Must match CvStudio.Application.Contracts.CvStudioMainSectionOrder (PDF/DOCX). */

export const CV_MAIN_SECTION_KEYS = ['summary', 'skills', 'work', 'education', 'languages', 'projects'] as const

export type CvMainSectionKey = (typeof CV_MAIN_SECTION_KEYS)[number]

export const CV_MAIN_SECTION_LABELS: Record<CvMainSectionKey, string> = {
  summary: 'Qualifikationsprofil',
  skills: 'Kenntnisse',
  work: 'Berufserfahrung',
  education: 'Ausbildung',
  languages: 'Sprachen & Interessen',
  projects: 'Projekte',
}

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
  for (const d of CV_MAIN_SECTION_KEYS) {
    if (!result.includes(d))
      result.push(d)
  }
  return result as CvMainSectionKey[]
}
