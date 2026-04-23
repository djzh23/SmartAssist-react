import type { ResumeData } from '../cvTypes'

export function isLanguageSkillCategory(categoryName: string): boolean {
  const n = (categoryName || '').toLowerCase()
  return n.includes('sprach') || n.includes('language')
}

export function isLinkSkillCategory(categoryName: string): boolean {
  return (categoryName || '').toLowerCase().includes('link')
}

/** Kenntnisse ohne Sprachen-/Links-Kategorien (gleiche Logik wie PDF-Kenntnisse-Block). */
export function visibleSkillGroupsForPreview(d: ResumeData) {
  return d.skills.filter(
    g =>
      (g.categoryName || '').trim()
      && !isLanguageSkillCategory(g.categoryName)
      && !isLinkSkillCategory(g.categoryName),
  )
}

export function buildLanguagePreviewLine(d: ResumeData): string {
  if (d.languageItems?.length) {
    return d.languageItems
      .filter(li => li.label?.trim())
      .map((li) => {
        const label = li.label.trim()
        const lvl = li.level?.trim()
        return lvl ? `${label} (${lvl})` : label
      })
      .join(' · ')
  }
  return d.skills
    .filter(g => isLanguageSkillCategory(g.categoryName))
    .flatMap(g => g.items || [])
    .map(s => s.trim())
    .filter(Boolean)
    .join(' · ')
}
