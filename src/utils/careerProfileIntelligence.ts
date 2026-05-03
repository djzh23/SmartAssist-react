import type { CareerProfile } from '../api/profileClient'
import { getProfileCompleteness } from './profileCompleteness'

export type CareerSectionKey =
  | 'overview'
  | 'basis'
  | 'skills'
  | 'experience'
  | 'education'
  | 'languages'
  | 'summary'
  | 'targets'

export interface MissingItem {
  id: string
  label: string
  section: CareerSectionKey
  priority: number
}

export function calculateProfileCompleteness(profile: CareerProfile): number {
  return getProfileCompleteness(profile)
}

export function getProfileStatusLabel(completeness: number): string {
  if (completeness >= 90) return 'Sehr gut'
  if (completeness >= 70) return 'Gut'
  if (completeness >= 40) return 'Ausbaufähig'
  return 'Unvollständig'
}

export function getMissingProfileItems(profile: CareerProfile): MissingItem[] {
  const items: MissingItem[] = []
  if (!profile.field?.trim()) items.push({ id: 'field', label: 'Berufsfeld wählen', section: 'basis', priority: 100 })
  if (!profile.level?.trim()) items.push({ id: 'level', label: 'Karrierelevel setzen', section: 'basis', priority: 95 })
  if (!profile.currentRole?.trim()) items.push({ id: 'role', label: 'Aktuelle Rolle ergänzen', section: 'basis', priority: 90 })
  if (profile.goals.length === 0) items.push({ id: 'goals', label: 'Ziele definieren', section: 'basis', priority: 85 })
  if (profile.skills.length === 0) items.push({ id: 'skills', label: 'Skills hinzufügen', section: 'skills', priority: 80 })
  if (profile.experience.length === 0) items.push({ id: 'experience', label: 'Berufserfahrung ergänzen', section: 'experience', priority: 75 })
  if (profile.educationEntries.length === 0) items.push({ id: 'education', label: 'Ausbildung ergänzen', section: 'education', priority: 70 })
  if (profile.languages.length === 0) items.push({ id: 'languages', label: 'Sprachen ergänzen', section: 'languages', priority: 65 })
  if (!profile.cvRawText?.trim()) items.push({ id: 'cv', label: 'Lebenslauf hochladen', section: 'basis', priority: 60 })
  if (!profile.cvSummary?.trim() && !profile.cvSummaryEn?.trim()) items.push({ id: 'summary', label: 'KI-Zusammenfassung erstellen', section: 'summary', priority: 55 })
  if (profile.targetJobs.length === 0) items.push({ id: 'targets', label: 'Wunschstelle hinzufügen', section: 'targets', priority: 50 })
  return items.sort((a, b) => b.priority - a.priority)
}

export function getAIReadiness(profile: CareerProfile): { label: string; description: string } {
  const completeness = calculateProfileCompleteness(profile)
  const hasSummary = Boolean(profile.cvSummary?.trim() || profile.cvSummaryEn?.trim())
  if (completeness >= 90 && hasSummary) {
    return { label: 'Sehr hoch', description: 'Das Profil liefert eine starke Basis für präzise KI-Empfehlungen.' }
  }
  if (completeness >= 70) {
    return { label: 'Stabil', description: 'Gute Grundlage, mit wenigen Ergänzungen werden Antworten noch genauer.' }
  }
  if (completeness >= 40) {
    return { label: 'Mittel', description: 'Mehr Kontext in Kernfeldern verbessert Analysen und Coaching spürbar.' }
  }
  return { label: 'Niedrig', description: 'Wichtige Profildaten fehlen noch für hochwertige KI-Antworten.' }
}

export function getSectionCompletion(section: CareerSectionKey, profile: CareerProfile): 'complete' | 'attention' | 'incomplete' {
  const hasSummary = Boolean(profile.cvSummary?.trim() || profile.cvSummaryEn?.trim())
  switch (section) {
    case 'overview':
      return 'complete'
    case 'basis':
      return profile.field && profile.level && profile.currentRole ? 'complete' : (profile.field || profile.level || profile.currentRole ? 'attention' : 'incomplete')
    case 'skills':
      return profile.skills.length >= 5 ? 'complete' : (profile.skills.length > 0 ? 'attention' : 'incomplete')
    case 'experience':
      return profile.experience.length > 0 ? 'complete' : 'incomplete'
    case 'education':
      return profile.educationEntries.length > 0 ? 'complete' : 'incomplete'
    case 'languages':
      return profile.languages.length > 0 ? 'complete' : 'incomplete'
    case 'summary':
      return hasSummary ? 'complete' : 'incomplete'
    case 'targets':
      return profile.targetJobs.length >= 1 ? 'complete' : 'incomplete'
    default:
      return 'incomplete'
  }
}

export function getNextProfileAction(profile: CareerProfile): { section: CareerSectionKey; title: string; description: string } {
  const missing = getMissingProfileItems(profile)
  if (missing.length === 0) {
    return {
      section: 'overview',
      title: 'Dein Profil ist bereit',
      description: 'Alle Kernbereiche sind gepflegt, du kannst direkt mit KI-Features weiterarbeiten.',
    }
  }
  const first = missing[0]
  return {
    section: first.section,
    title: first.label,
    description: 'Dieser Schritt bringt den größten Qualitätsgewinn für Analyse, Coaching und Bewerbungsantworten.',
  }
}
