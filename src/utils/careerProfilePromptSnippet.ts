import type { CareerProfile } from '../api/profileClient'
import type { ProfileContextToggles } from '../types'

/**
 * Structured excerpt from the saved career profile for inclusion in agent prompts.
 * Respects toggles so the prompt matches what the user expects from the UI.
 */
export function buildCareerProfilePromptAppendix(
  profile: CareerProfile,
  toggles: ProfileContextToggles,
  maxChars: number,
): string {
  if (maxChars < 120) return ''

  const chunks: string[] = []

  if (toggles.includeBasicProfile) {
    const lines: string[] = []
    if (profile.fieldLabel?.trim()) lines.push(`Berufsfeld: ${profile.fieldLabel.trim()}`)
    if (profile.levelLabel?.trim()) lines.push(`Level: ${profile.levelLabel.trim()}`)
    if (profile.currentRole?.trim()) lines.push(`Aktuelle Rolle: ${profile.currentRole.trim()}`)
    if (profile.goals?.length) lines.push(`Ziele: ${profile.goals.join(', ')}`)
    if (lines.length) chunks.push(`Basis:\n${lines.join('\n')}`)
  }

  if (toggles.includeSkills && profile.skills.length > 0) {
    const list = profile.skills
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 30)
      .map(s => `- ${s}`)
      .join('\n')
    if (list) chunks.push(`Skills:\n${list}`)
  }

  if (toggles.includeExperience && profile.experience.length > 0) {
    const lines = profile.experience
      .map(exp => {
        const title = exp.title?.trim() ?? ''
        const company = exp.company?.trim() ?? ''
        const duration = exp.duration?.trim() ?? ''
        const summary = exp.summary?.trim() ?? ''
        const head = [title, company].filter(Boolean).join(' — ')
        const meta = [duration, summary].filter(Boolean).join(' · ')
        if (!head && !meta) return ''
        return meta ? `${head}\n  ${meta}` : head
      })
      .filter(Boolean)
    if (lines.length) chunks.push(`Berufserfahrung:\n${lines.join('\n')}`)
  }

  if (toggles.includeCv) {
    const raw = (profile.cvSummary?.trim() || profile.cvRawText?.trim() || '')
    if (raw) chunks.push(`Lebenslauf (Auszug):\n${raw}`)
  }

  if (toggles.activeTargetJobId) {
    const job = profile.targetJobs.find(j => j.id === toggles.activeTargetJobId)
    if (job) {
      const bits = [
        job.title?.trim() && `Zielstelle: ${job.title.trim()}`,
        job.company?.trim() && `Firma: ${job.company.trim()}`,
        job.description?.trim() && `Beschreibung: ${job.description.trim()}`,
      ].filter(Boolean)
      if (bits.length) chunks.push(bits.join('\n'))
    }
  }

  let out = chunks.join('\n\n')
  if (out.length > maxChars) {
    out = `${out.slice(0, maxChars - 1).trim()}…`
  }
  return out
}
