import type { CareerProfile } from '../api/profileClient'

/** Gewichtete Vollständigkeit 0–100 (Profil für bessere KI-Antworten). */
export function getProfileCompleteness(profile: CareerProfile): number {
  let score = 0
  const checks = [
    Boolean(profile.field?.trim()),
    Boolean(profile.level?.trim()),
    Boolean(profile.currentRole?.trim()),
    profile.goals.length > 0,
    profile.skills.length > 0,
    profile.experience.length > 0,
    Boolean(profile.cvRawText?.trim()),
    profile.targetJobs.length > 0,
  ]
  const weights = [15, 15, 10, 10, 15, 15, 10, 10]
  checks.forEach((check, i) => {
    if (check) score += weights[i]
  })
  return score
}

/** Kurzer Hinweis, welche Bereiche noch fehlen (für UI unter der Progress-Bar). */
export function getProfileCompletenessGapHint(profile: CareerProfile): string | null {
  const parts: string[] = []
  if (!profile.skills.length) parts.push('Skills fehlen noch')
  if (!profile.experience.length) parts.push('Erfahrung ergänzen')
  if (!profile.cvRawText?.trim()) parts.push('Lebenslauf-Text fehlt')
  if (!profile.targetJobs.length) parts.push('Zielstelle hinzufügen')
  if (!profile.currentRole?.trim()) parts.push('Aktuelle Rolle')
  return parts.length ? `${parts.slice(0, 2).join(' → ')}${parts.length > 2 ? ' …' : ''}` : null
}
