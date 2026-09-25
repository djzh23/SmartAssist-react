import type { FactGateViolation, SkillGapReport } from '../../api/analyzeClient'

export function scoreLabel(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function scoreCaption(score: number): string {
  if (score < 2.5) return 'Passt aktuell schlecht: Lebenslauf und Stellenanzeige weichen deutlich voneinander ab.'
  if (score < 3.5) return 'Bewerbung nur mit klarem Grund empfohlen.'
  if (score < 4.5) return 'Gute Grundlage für eine Bewerbung. Lücken vorher prüfen.'
  return 'Starke Übereinstimmung mit den vorliegenden Angaben.'
}

export function scoreBadge(score: number): string {
  if (score < 2.5) return 'Passt kaum'
  if (score < 3.5) return 'Passt teilweise'
  if (score < 4.5) return 'Passt gut'
  return 'Passt sehr gut'
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

/** "3 Skill-Lücken erkannt: A, B, C" — a roll-up the specifics below it already say. */
const SKILL_GAP_SUMMARY = /^\s*\d+\s*skill[-\s]?(?:l(?:ü|ue)cken|gaps?)\s*(?:erkannt|detected|found)/i
/** "Fehlend: Microsoft SQL Server (Muss-Kriterium) — ..." names one concrete gap. */
const SKILL_GAP_SPECIFIC = /^\s*(?:fehlend|missing)\s*:/i

/** The skill names a summary warning lists after its colon, if any. */
function summarySkillNames(summary: string): string[] {
  const colon = summary.indexOf(':')
  if (colon < 0) return []
  return summary
    .slice(colon + 1)
    .split(/[,;]|\bund\b|\band\b/i)
    .map(s => s.trim().replace(/[.!]+$/, ''))
    .filter(s => s.length >= 2)
}

/**
 * Drops a roll-up warning when the specific ones below it already name the same gaps.
 * The model sometimes emits both ("3 Skill-Lücken erkannt: SQL Server, Apache, ERP" plus
 * one "Fehlend: ..." per skill), which makes the user read the same thing twice. A summary
 * whose skills nothing else mentions is kept — it is then the only place they appear.
 */
export function dedupeSkillWarnings(list: string[]): string[] {
  const specifics = list.filter(w => SKILL_GAP_SPECIFIC.test(w))
  if (specifics.length === 0) return list

  return list.filter(w => {
    if (!SKILL_GAP_SUMMARY.test(w)) return true
    const names = summarySkillNames(w)
    if (names.length === 0) return true
    return !names.some(name => specifics.some(s => s.toLowerCase().includes(name.toLowerCase())))
  })
}

/**
 * Whether the locally derived skill-gap hint would only repeat the model's own warnings.
 * `skillWarning()` builds its text from `gap.gap`, so when "Fehlend: X" warnings already
 * name those skills, showing both puts the same gap in the panel twice.
 */
export function skillSummaryIsRedundant(missingSkills: string[], warnings: string[]): boolean {
  const named = missingSkills.map(s => s.trim()).filter(Boolean)
  if (named.length === 0) return false
  const specifics = warnings.filter(w => SKILL_GAP_SPECIFIC.test(w))
  if (specifics.length === 0) return false
  return named.every(name => specifics.some(s => s.toLowerCase().includes(name.toLowerCase())))
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

/** Natural German list: "A", "A und B", "A, B und C". */
export function joinGerman(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} und ${items[items.length - 1]}`
}

export function reportLead(options: {
  covered?: number
  total?: number
  /** Names of the missing requirements, not just a count — the user should not have to look further to know which ones. */
  missingSkills?: string[]
  roleAlignment?: number
  warningCount?: number
  score: number
}): string {
  const { covered, total, missingSkills = [], roleAlignment, warningCount = 0, score } = options
  const sentences: string[] = []

  const hasCoverage = typeof covered === 'number' && typeof total === 'number' && total > 0
  const roleFits = typeof roleAlignment === 'number' && roleAlignment >= 3.5
  const coverage = `Dein Lebenslauf belegt ${covered} von ${total} Anforderungen der Stellenanzeige`
  if (hasCoverage && roleFits) sentences.push(`${coverage}, und die Rolle passt zu deinem Profil.`)
  else if (hasCoverage) sentences.push(`${coverage}.`)
  else if (roleFits) sentences.push('Die Rolle passt zu deinem Profil.')

  const issues: string[] = []
  if (missingSkills.length === 1) issues.push(`${missingSkills[0]} fehlt im Lebenslauf`)
  else if (missingSkills.length > 1) issues.push(`${joinGerman(missingSkills)} fehlen im Lebenslauf`)
  if (warningCount === 1) issues.push('die Anzeige enthält ein Warnzeichen')
  else if (warningCount > 1) issues.push(`die Anzeige enthält ${warningCount} Warnzeichen`)
  if (issues.length > 0) sentences.push(`Zu prüfen: ${issues.join(' und ')}.`)

  sentences.push(scoreCaption(score))
  return sentences.join(' ')
}
