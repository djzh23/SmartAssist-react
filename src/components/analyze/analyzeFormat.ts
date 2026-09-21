import type { FactGateViolation, SkillGapReport } from '../../api/analyzeClient'

export function scoreLabel(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function scoreCaption(score: number): string {
  if (score < 2.5) return 'Passt derzeit schlecht. Lebenslauf und Anzeige weichen stark voneinander ab.'
  if (score < 3.5) return 'Bewerbung nur mit klarem Grund empfohlen.'
  if (score < 4.5) return 'Brauchbare Passung. Lücken vorher prüfen.'
  return 'Gute Passung mit den vorliegenden Angaben.'
}

export function scoreBadge(score: number): string {
  if (score < 2.5) return 'Schwache Passung'
  if (score < 3.5) return 'Eingeschränkte Passung'
  if (score < 4.5) return 'Brauchbare Passung'
  return 'Gute Passung'
}

export function scorePercent(score: number): number {
  if (!Number.isFinite(score)) return 0
  return Math.max(0, Math.min(100, (score / 5) * 100))
}

export function emptySkillGap(): SkillGapReport {
  return { existing: [], supportedByResume: [], gap: [], extractedJdSkills: [], reasonCode: '' }
}

/** Fills gaps in an API answer so partial or older stored reports never break the view. */
export function normalizeGap(gap?: SkillGapReport): SkillGapReport {
  const base = emptySkillGap()
  if (!gap) return base
  return {
    existing: gap.existing ?? base.existing,
    supportedByResume: gap.supportedByResume ?? base.supportedByResume,
    gap: gap.gap ?? base.gap,
    extractedJdSkills: gap.extractedJdSkills ?? base.extractedJdSkills,
    reasonCode: gap.reasonCode ?? base.reasonCode,
  }
}

export function requirementCount(gap: SkillGapReport): number {
  const fromJd = gap.extractedJdSkills.map(s => s.trim()).filter(Boolean)
  if (fromJd.length > 0) return new Set(fromJd).size
  const union = [...gap.existing, ...gap.supportedByResume, ...gap.gap]
    .map(s => s.trim())
    .filter(Boolean)
  return new Set(union).size
}

/**
 * Whether the automatic skill comparison can be trusted.
 * `unavailable`: nothing was recognised (short posting, no list of requirements).
 * `partial`: something was recognised but the extractor flagged its result as incomplete.
 */
export type SkillGapState = 'ok' | 'partial' | 'unavailable'

export function skillGapState(gap: SkillGapReport): SkillGapState {
  if (gap.existing.length + gap.supportedByResume.length + gap.gap.length === 0) return 'unavailable'
  const reason = gap.reasonCode.trim()
  return reason !== '' && reason !== 'ok' ? 'partial' : 'ok'
}

export type LevelTone = 'good' | 'mid' | 'low'

/** Plain-language reading of a 1 to 5 score. Higher is better. */
export function scoreLevel(score: number): { word: string; tone: LevelTone } {
  if (score >= 4.5) return { word: 'Sehr gut', tone: 'good' }
  if (score >= 3.5) return { word: 'Gut', tone: 'good' }
  if (score >= 2.5) return { word: 'Teilweise', tone: 'mid' }
  return { word: 'Gering', tone: 'low' }
}

/** Warning signs run the other way: 1 means nothing found, 5 means many. */
export function warningLevel(score: number): { word: string; tone: LevelTone } {
  if (score < 1.5) return { word: 'Keine Auffälligkeiten', tone: 'good' }
  if (score < 2.5) return { word: 'Wenige Hinweise', tone: 'mid' }
  return { word: 'Deutliche Warnsignale', tone: 'low' }
}

/** Model text may abbreviate the posting as "JD". Users do not know that word. */
export function plainGerman(text: string | null | undefined): string {
  return (text ?? '').replace(/\bJDs\b/g, 'Stellenanzeigen').replace(/\bJD\b/g, 'Stellenanzeige')
}

export function splitRoleSummary(raw: string | undefined): { title: string; subtitle?: string } {
  const text = (raw ?? '').trim()
  if (!text) return { title: 'Stellenanalyse' }
  const comma = text.indexOf(',')
  if (comma <= 0) return { title: text }
  const title = text.slice(0, comma).trim()
  const subtitle = text.slice(comma + 1).trim()
  return subtitle ? { title, subtitle } : { title }
}

export function skillWarning(gap: SkillGapReport | undefined): { title: string; body: string } | null {
  const missing = (gap?.gap ?? []).map(s => s.trim()).filter(Boolean)
  if (missing.length === 0) return null
  if (missing.length === 1) {
    return {
      title: `${missing[0]} fehlt im Lebenslauf`,
      body: 'Steht in der Ausschreibung, ohne Beleg im Lebenslauf.',
    }
  }
  if (missing.length === 2) {
    return {
      title: `${missing[0]} und ${missing[1]} fehlen im Lebenslauf`,
      body: 'Beide sind in der Ausschreibung als Voraussetzung genannt. Falls du diese Kenntnisse hast, ergänze sie im Lebenslauf.',
    }
  }
  return {
    title: `${missing.length} Skill-Lücken erkannt`,
    body: `${missing.join(', ')} sind zentrale Anforderungen der Ausschreibung, ohne Beleg im Lebenslauf.`,
  }
}

export function userFacingWarnings(warnings: string[] | undefined): string[] {
  return (warnings ?? []).filter(w => {
    const t = w.trim()
    if (!t) return false
    if (t.toLowerCase().includes('factgate')) return false
    if (t.toLowerCase().includes('culture-cap')) return false
    return true
  })
}

export function inventedSkillCount(violations: FactGateViolation[] | undefined): number {
  return (violations ?? []).length
}

export function formatRelativeCreated(iso: string | null | undefined): string {
  if (!iso) return 'gerade eben erstellt'
  const then = new Date(iso).getTime()
  if (!Number.isFinite(then)) return 'gerade eben erstellt'
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (sec < 8) return 'gerade eben erstellt'
  if (sec < 60) return `vor ${sec} Sek. erstellt`
  const min = Math.round(sec / 60)
  if (min < 60) return `vor ${min} Min. erstellt`
  const hours = Math.round(min / 60)
  if (hours < 24) return `vor ${hours} Std. erstellt`
  try {
    return `vom ${new Date(iso).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}`
  } catch {
    return 'zuvor erstellt'
  }
}

export function reportLead(options: {
  covered?: number
  total?: number
  missing?: number
  roleAlignment?: number
  warningCount?: number
  score: number
}): string {
  const { covered, total, missing = 0, roleAlignment, warningCount = 0, score } = options
  const sentences: string[] = []

  const hasCoverage = typeof covered === 'number' && typeof total === 'number' && total > 0
  const roleFits = typeof roleAlignment === 'number' && roleAlignment >= 3.5
  const coverage = `Dein Lebenslauf belegt ${covered} von ${total} Anforderungen der Stellenanzeige`
  if (hasCoverage && roleFits) sentences.push(`${coverage}, und die Rolle passt zu deinem Profil.`)
  else if (hasCoverage) sentences.push(`${coverage}.`)
  else if (roleFits) sentences.push('Die Rolle passt zu deinem Profil.')

  const issues: string[] = []
  if (missing === 1) issues.push('eine Anforderung fehlt im Lebenslauf')
  else if (missing > 1) issues.push(`${missing} Anforderungen fehlen im Lebenslauf`)
  if (warningCount === 1) issues.push('die Anzeige enthält ein Warnzeichen')
  else if (warningCount > 1) issues.push('die Anzeige enthält Warnzeichen')
  if (issues.length > 0) sentences.push(`Zu prüfen: ${issues.join(' und ')}.`)

  sentences.push(scoreCaption(score))
  return sentences.join(' ')
}
