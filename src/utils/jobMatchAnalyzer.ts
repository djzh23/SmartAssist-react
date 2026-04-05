interface MatchInput {
  cvProfile: string
  jobText: string
  jobUrl?: string
}

type MatchStrength = 'none' | 'low' | 'medium' | 'high'

interface RequirementMatch {
  text: string
  essential: boolean
  matched: boolean
  strength: MatchStrength
  matchedTerms: string[]
}

interface MatchBreakdown {
  essentials: number
  requirements: number
  evidence: number
  keywords: number
}

export interface JobMatchResult {
  score: number
  report: string
  matchedKeywords: string[]
  missingKeywords: string[]
  breakdown: MatchBreakdown
  requirementMatches: RequirementMatch[]
}

interface RequirementLine {
  text: string
  tokens: string[]
  essential: boolean
  weight: number
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'these', 'those', 'from', 'into', 'your', 'our', 'you', 'are', 'was', 'were',
  'have', 'has', 'had', 'will', 'can', 'all', 'per', 'via', 'very', 'more', 'less', 'must', 'should', 'would', 'could',
  'der', 'die', 'das', 'und', 'oder', 'mit', 'für', 'fuer', 'auf', 'von', 'eine', 'einer', 'einem', 'ein', 'ist', 'sind',
  'war', 'wir', 'ihr', 'sie', 'als', 'auch', 'bei', 'zum', 'zur', 'im', 'in', 'an', 'zu', 'den', 'dem', 'des', 'durch',
  'über', 'ueber', 'unter', 'nach', 'vor', 'sowie', 'noch', 'nur', 'mehr', 'weniger', 'job', 'stelle', 'position', 'role',
  'team', 'unternehmen', 'company', 'profil', 'candidate', 'mwd', 'wmd',
])

const MUST_HAVE_HINTS = [
  'must', 'required', 'mandatory', 'essential', 'minimum', 'need to',
  'anforderung', 'anforderungen', 'erforderlich', 'muss', 'zwingend', 'voraussetzung', 'unbedingt',
]

const SENTENCE_SPLIT_RE = /[.!?]\s+/

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\r\n?/g, '\n')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9+.#/\-\s]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function cleanLine(line: string): string {
  return line
    .replace(/^[-*•\u2022\u25AA\u25CF\s]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  const prepared = normalize(text)
  if (!prepared) return []

  return prepared
    .split(/\s+/)
    .filter(Boolean)
    .filter(token => token.length >= 3 && token.length <= 28)
    .filter(token => !/^\d+$/.test(token))
    .filter(token => !STOPWORDS.has(token))
}

function unique(values: string[]): string[] {
  return [...new Set(values)]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toPercent(value: number): number {
  return Math.round(clamp(value, 0, 1) * 100)
}

function topKeywords(tokens: string[], limit: number): string[] {
  const freq = new Map<string, number>()
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1)
  }

  return [...freq.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1]
      return b[0].length - a[0].length
    })
    .map(([token]) => token)
    .slice(0, limit)
}

function detectEssentialLine(line: string): boolean {
  const normalized = normalize(line)
  return MUST_HAVE_HINTS.some(hint => normalized.includes(normalize(hint)))
}

function splitLines(text: string): string[] {
  const baseLines = text
    .replace(/[;|]+/g, '\n')
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map(cleanLine)
    .filter(Boolean)

  const expanded: string[] = []

  for (const line of baseLines) {
    if (line.length <= 150) {
      expanded.push(line)
      continue
    }

    const parts = line
      .split(SENTENCE_SPLIT_RE)
      .map(cleanLine)
      .filter(Boolean)

    if (parts.length === 0) {
      expanded.push(line)
      continue
    }

    for (const part of parts) {
      if (part.length >= 8) expanded.push(part)
    }
  }

  return expanded
}

function extractRequirementLines(jobText: string): RequirementLine[] {
  const rawLines = splitLines(jobText)
    .filter(line => line.length >= 8)
    .filter(line => /[A-Za-zÄÖÜäöüß]/.test(line))

  const deduped = unique(rawLines)
  const candidates = deduped.length > 0 ? deduped : [jobText]

  const picked = candidates
    .sort((a, b) => tokenize(b).length - tokenize(a).length)
    .slice(0, 16)

  return picked.map(line => {
    const tokens = unique(tokenize(line)).slice(0, 12)
    const essential = detectEssentialLine(line)
    const weight = essential ? 2.2 : 1
    return { text: line, tokens, essential, weight }
  }).filter(line => line.tokens.length > 0)
}

function scoreRequirement(req: RequirementLine, cvTokenSet: Set<string>): RequirementMatch & { coverage: number; weight: number } {
  const matchedTerms = req.tokens.filter(token => cvTokenSet.has(token))
  const coverage = req.tokens.length > 0 ? matchedTerms.length / req.tokens.length : 0

  let strength: MatchStrength = 'none'
  if (coverage >= 0.55 && matchedTerms.length >= 3) strength = 'high'
  else if (coverage >= 0.35 && matchedTerms.length >= 2) strength = 'medium'
  else if (matchedTerms.length >= 1) strength = 'low'

  const matched = strength === 'medium' || strength === 'high'

  return {
    text: req.text,
    essential: req.essential,
    matched,
    strength,
    matchedTerms: matchedTerms.slice(0, 5),
    coverage,
    weight: req.weight,
  }
}

function formatKeyword(token: string): string {
  if (token.length <= 4) return token.toUpperCase()
  return token.charAt(0).toUpperCase() + token.slice(1)
}

function formatCoverageLabel(value: number): string {
  if (value >= 0.75) return 'stark'
  if (value >= 0.5) return 'solide'
  if (value >= 0.35) return 'teilweise'
  return 'niedrig'
}

function buildReport(args: {
  score: number
  breakdown: MatchBreakdown
  matchedKeywords: string[]
  missingKeywords: string[]
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  sourceQuality: string
  jobUrl?: string
}): string {
  return [
    `MATCH SCORE: ${args.score}/100`,
    args.jobUrl ? `STELLEN-LINK: ${args.jobUrl}` : null,
    `DATENQUALITÄT: ${args.sourceQuality}`,
    '',
    'DETAILBEWERTUNG:',
    `- Muss-Anforderungen: ${args.breakdown.essentials}/100`,
    `- Gesamtanforderungen: ${args.breakdown.requirements}/100`,
    `- Nachweis im Lebenslauf: ${args.breakdown.evidence}/100`,
    `- Schlüsselbegriffe: ${args.breakdown.keywords}/100`,
    '',
    'STÄRKEN:',
    args.strengths.length > 0 ? args.strengths.map(line => `- ${line}`).join('\n') : '- n/a',
    '',
    'LÜCKEN:',
    args.gaps.length > 0 ? args.gaps.map(line => `- ${line}`).join('\n') : '- n/a',
    '',
    'TREFFER-BEGRIFFE:',
    args.matchedKeywords.length > 0
      ? args.matchedKeywords.slice(0, 10).map(token => `- ${formatKeyword(token)}`).join('\n')
      : '- n/a',
    '',
    'FEHLENDE BEGRIFFE:',
    args.missingKeywords.length > 0
      ? args.missingKeywords.slice(0, 10).map(token => `- ${formatKeyword(token)}`).join('\n')
      : '- n/a',
    '',
    'NÄCHSTE SCHRITTE:',
    args.recommendations.length > 0 ? args.recommendations.map(line => `- ${line}`).join('\n') : '- n/a',
  ].filter(Boolean).join('\n')
}

export function analyzeCvJobMatch({ cvProfile, jobText, jobUrl }: MatchInput): JobMatchResult {
  const cvTokens = tokenize(cvProfile)
  const cvTokenSet = new Set(cvTokens)
  const requirementLines = extractRequirementLines(jobText)

  const requirementMatches = requirementLines.map(line => scoreRequirement(line, cvTokenSet))

  const weightedTotal = requirementMatches.reduce((sum, item) => sum + item.weight, 0)
  const weightedMatched = requirementMatches.reduce((sum, item) => {
    if (!item.matched) return sum
    const multiplier = item.strength === 'high' ? 1 : 0.72
    return sum + item.weight * multiplier
  }, 0)

  const essentials = requirementMatches.filter(item => item.essential)
  const essentialsTotal = essentials.reduce((sum, item) => sum + item.weight, 0)
  const essentialsMatched = essentials.reduce((sum, item) => {
    if (!item.matched) return sum
    return sum + item.weight * (item.strength === 'high' ? 1 : 0.7)
  }, 0)

  const essentialCoverage = essentialsTotal > 0
    ? essentialsMatched / essentialsTotal
    : (weightedTotal > 0 ? weightedMatched / weightedTotal : 0)

  const requirementCoverage = weightedTotal > 0 ? weightedMatched / weightedTotal : 0
  const evidenceCoverage = requirementMatches.length > 0
    ? requirementMatches.filter(item => item.strength !== 'none').length / requirementMatches.length
    : 0

  const jobKeywords = topKeywords(tokenize(jobText), 30)
  const matchedKeywords = jobKeywords.filter(token => cvTokenSet.has(token))
  const missingKeywords = jobKeywords.filter(token => !cvTokenSet.has(token))
  const keywordCoverage = jobKeywords.length > 0 ? matchedKeywords.length / jobKeywords.length : 0

  const hasWeakCv = cvTokens.length < 55 || /\bn\/a\b/i.test(cvProfile)
  const cvPenalty = hasWeakCv ? 0.66 : cvTokens.length < 95 ? 0.84 : 1

  const missingEssentialCount = essentials.filter(item => !item.matched).length
  const essentialPenalty = clamp(missingEssentialCount * 0.08, 0, 0.28)

  const rawScore =
    essentialCoverage * 58 +
    requirementCoverage * 20 +
    evidenceCoverage * 14 +
    keywordCoverage * 8

  const score = Math.round(clamp(rawScore * cvPenalty * (1 - essentialPenalty), 0, 97))

  const strengths = [
    ...requirementMatches
      .filter(item => item.matched)
      .sort((a, b) => b.coverage - a.coverage)
      .slice(0, 3)
      .map(item => `Treffer auf Anforderung (${formatCoverageLabel(item.coverage)}): ${item.text}`),
    ...(matchedKeywords.length > 0
      ? [`Passende Kernbegriffe: ${matchedKeywords.slice(0, 5).map(formatKeyword).join(', ')}`]
      : []),
  ].slice(0, 4)

  const gaps = [
    ...essentials
      .filter(item => !item.matched)
      .slice(0, 2)
      .map(item => `Wichtige Muss-Anforderung noch unklar im Lebenslauf: ${item.text}`),
    ...missingKeywords
      .slice(0, 3)
      .map(token => `Fehlender oder zu schwacher Schlüsselbegriff: ${formatKeyword(token)}`),
  ].slice(0, 5)

  const recommendations = [
    missingKeywords.length > 0
      ? `Ergänze im Lebenslauf konkrete Nachweise für diese Punkte: ${missingKeywords.slice(0, 4).map(formatKeyword).join(', ')}.`
      : 'Hebe deine stärksten Nachweise als messbare Ergebnisse hervor.',
    missingEssentialCount > 0
      ? 'Spiegle Muss-Anforderungen aus der Stellenanzeige in deinen Erfahrungs- und Projektpunkten mit denselben Begriffen.'
      : 'Muss-Anforderungen sind gut abgedeckt. Optimiere jetzt auf Wirkung und Präzision.',
    'Nutze pro Station aktive Verben plus Ergebnis, zum Beispiel optimiert, gesteigert oder reduziert, inklusive Zahl oder Prozentwert.',
  ].slice(0, 3)

  const breakdown: MatchBreakdown = {
    essentials: toPercent(essentialCoverage),
    requirements: toPercent(requirementCoverage),
    evidence: toPercent(evidenceCoverage),
    keywords: toPercent(keywordCoverage),
  }

  const sourceQuality = cvTokens.length < 55 || requirementLines.length < 4
    ? 'mittel - mehr strukturierte CV- und Jobdaten erhöhen die Genauigkeit'
    : 'hoch - ausreichende Datentiefe in Lebenslauf und Stellenprofil'

  const report = buildReport({
    score,
    breakdown,
    matchedKeywords,
    missingKeywords,
    strengths,
    gaps,
    recommendations,
    sourceQuality,
    jobUrl,
  })

  return {
    score,
    report,
    matchedKeywords,
    missingKeywords,
    breakdown,
    requirementMatches: requirementMatches.slice(0, 10).map(item => ({
      text: item.text,
      essential: item.essential,
      matched: item.matched,
      strength: item.strength,
      matchedTerms: item.matchedTerms,
    })),
  }
}
