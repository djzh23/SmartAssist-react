import type { FactGateViolation, SkillGapReport } from '../../api/analyzeClient'

export function scoreLabel(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

export function scoreCaption(score: number): string {
  if (score < 2.5) return 'Passt derzeit schlecht. Lebenslauf und Anzeige weichen stark voneinander ab.'
  if (score < 3.5) return 'Bewerbung nur mit klarem Grund empfohlen'
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

export function requirementCount(gap: SkillGapReport): number {
  const fromJd = gap.extractedJdSkills.map(s => s.trim()).filter(Boolean)
  if (fromJd.length > 0) return new Set(fromJd).size
  const union = [...gap.existing, ...gap.supportedByResume, ...gap.gap]
    .map(s => s.trim())
    .filter(Boolean)
  return new Set(union).size
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
  const head: string[] = []
  if (typeof covered === 'number' && typeof total === 'number' && total > 0) {
    head.push(`Du deckst ${covered} von ${total} Kernanforderungen`)
  }
  if (typeof roleAlignment === 'number' && roleAlignment >= 3.5) {
    head.push('hast klare Rollenpassung')
  }

  const tails: string[] = []
  if (missing === 1) tails.push('ein Skill fehlt')
  else if (missing > 1) tails.push(`${missing} Skills fehlen`)
  if (warningCount > 0) tails.push('die Anzeige enthält Warnzeichen')

  let lead = ''
  if (head.length > 0) {
    lead = head.join(', ')
    if (tails.length === 1) lead += `, aber ${tails[0]}`
    else if (tails.length > 1) lead += `, aber ${tails.slice(0, -1).join(', ')} und ${tails[tails.length - 1]}`
    lead += '.'
  } else if (tails.length > 0) {
    lead = `${tails.join(', ')}.`
  }

  const caption = scoreCaption(score)
  return [lead, caption].filter(Boolean).join(' ')
}
