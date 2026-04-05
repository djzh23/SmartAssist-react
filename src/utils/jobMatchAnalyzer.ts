interface MatchInput {
  cvProfile: string
  jobText: string
  jobUrl?: string
}

export interface JobMatchResult {
  score: number
  report: string
  matchedKeywords: string[]
  missingKeywords: string[]
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'you', 'our', 'are', 'was', 'were', 'have', 'has',
  'will', 'can', 'all', 'not', 'but', 'der', 'die', 'das', 'und', 'mit', 'für', 'auf', 'von', 'eine', 'einer', 'einem',
  'ein', 'ist', 'sind', 'war', 'wir', 'ihr', 'sie', 'als', 'auch', 'bei', 'zum', 'zur', 'im', 'in', 'an', 'zu', 'den',
  'dem', 'des', 'oder', 'durch', 'über', 'unter', 'nach', 'vor', 'sowie', 'mehr', 'weniger', 'sehr', 'noch', 'nur',
  'job', 'stelle', 'position', 'role', 'team', 'unternehmen', 'company', 'candidate', 'profil',
])

const PRIORITY_HINTS = [
  'must', 'required', 'requirement', 'mandatory', 'essential', 'minimum',
  'anforderung', 'erforderlich', 'muss', 'zwingend', 'voraussetzung',
]

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\r\n?/g, '\n')
    .replace(/[^a-z0-9äöüß+.#\-\s]/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  const raw = normalize(text).split(/\s+/).filter(Boolean)
  return raw
    .filter(token => token.length >= 3)
    .filter(token => !STOPWORDS.has(token))
}

function topKeywords(tokens: string[], limit = 30): string[] {
  const freq = new Map<string, number>()
  for (const token of tokens) {
    freq.set(token, (freq.get(token) ?? 0) + 1)
  }

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, limit)
}

function pickPriorityLines(jobText: string): string[] {
  return jobText
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => PRIORITY_HINTS.some(h => line.toLowerCase().includes(h)))
}

function extractSectionLines(cvProfile: string, section: 'EXPERIENCE' | 'PROJECTS' | 'EDUCATION'): string[] {
  const lines = cvProfile.split(/\n+/)
  let current = ''
  const out: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^SKILLS:/i.test(trimmed)) current = 'SKILLS'
    else if (/^EXPERIENCE:/i.test(trimmed)) current = 'EXPERIENCE'
    else if (/^PROJECTS:/i.test(trimmed)) current = 'PROJECTS'
    else if (/^EDUCATION:/i.test(trimmed)) current = 'EDUCATION'
    else if (current === section) out.push(trimmed.replace(/^[-*•]\s*/, '').trim())
  }

  return out
}

function formatKeyword(token: string): string {
  if (/^[a-z]+$/i.test(token) && token.length <= 4) return token.toUpperCase()
  return token.charAt(0).toUpperCase() + token.slice(1)
}

function buildReport(args: {
  score: number
  matchedKeywords: string[]
  missingKeywords: string[]
  strengths: string[]
  gaps: string[]
  recommendations: string[]
  jobUrl?: string
}): string {
  const matched = args.matchedKeywords.slice(0, 10).map(formatKeyword)
  const missing = args.missingKeywords.slice(0, 10).map(formatKeyword)

  return [
    `MATCH SCORE: ${args.score}/100`,
    args.jobUrl ? `TARGET URL: ${args.jobUrl}` : null,
    '',
    'MATCHED KEYWORDS:',
    matched.length > 0 ? matched.map(v => `- ${v}`).join('\n') : '- n/a',
    '',
    'MISSING PRIORITY KEYWORDS:',
    missing.length > 0 ? missing.map(v => `- ${v}`).join('\n') : '- n/a',
    '',
    'STRENGTHS:',
    args.strengths.length > 0 ? args.strengths.map(v => `- ${v}`).join('\n') : '- n/a',
    '',
    'GAPS:',
    args.gaps.length > 0 ? args.gaps.map(v => `- ${v}`).join('\n') : '- n/a',
    '',
    'NEXT STEPS:',
    args.recommendations.length > 0 ? args.recommendations.map(v => `- ${v}`).join('\n') : '- n/a',
  ].filter(Boolean).join('\n')
}

export function analyzeCvJobMatch({ cvProfile, jobText, jobUrl }: MatchInput): JobMatchResult {
  const jobTokens = tokenize(jobText)
  const cvTokens = tokenize(cvProfile)

  const jobKeywords = topKeywords(jobTokens, 35)
  const cvKeywordSet = new Set(cvTokens)

  const matchedKeywords = jobKeywords.filter(k => cvKeywordSet.has(k))
  const missingKeywords = jobKeywords.filter(k => !cvKeywordSet.has(k))

  const keywordCoverage = jobKeywords.length > 0 ? matchedKeywords.length / jobKeywords.length : 0

  const priorityLines = pickPriorityLines(jobText)
  const priorityKeywords = topKeywords(tokenize(priorityLines.join(' ')), 20)
  const matchedPriority = priorityKeywords.filter(k => cvKeywordSet.has(k))
  const priorityCoverage = priorityKeywords.length > 0 ? matchedPriority.length / priorityKeywords.length : keywordCoverage

  const cvHasNAs = /\bn\/a\b/i.test(cvProfile)
  const completenessFactor = cvHasNAs ? 0.65 : 1

  let score = Math.round((keywordCoverage * 0.55 + priorityCoverage * 0.45) * 100 * completenessFactor)
  if (score < 20 && matchedKeywords.length > 0) score = 20
  if (score > 95) score = 95

  const expLines = extractSectionLines(cvProfile, 'EXPERIENCE').slice(0, 2)
  const projectLines = extractSectionLines(cvProfile, 'PROJECTS').slice(0, 2)

  const strengths = [
    ...(matchedKeywords.slice(0, 3).map(k => `Passende Kompetenz im Profil: ${formatKeyword(k)}`)),
    ...expLines.map(line => `Erfahrungspunkt: ${line}`),
  ].slice(0, 4)

  const gaps = [
    ...missingKeywords.slice(0, 4).map(k => `Wichtiger Punkt aus der Stelle fehlt oder ist zu schwach sichtbar: ${formatKeyword(k)}`),
  ].slice(0, 4)

  const recommendations = [
    'Lebenslauf auf die wichtigsten Anforderungen der Stelle zuschneiden und gleiche Begriffe verwenden.',
    'Zwei bis drei messbare Erfolge ergänzen, die direkt zur Zielrolle passen.',
    ...(missingKeywords.length > 0 ? [`Fehlende Schlüsselwörter sichtbar in Erfahrung oder Projekten ergänzen: ${missingKeywords.slice(0, 3).map(formatKeyword).join(', ')}.`] : []),
    ...(projectLines.length > 0 ? ['Im Interview ein Projektbeispiel mit Problem, Vorgehen und Ergebnis klar vorbereiten.'] : []),
  ].slice(0, 4)

  const report = buildReport({
    score,
    matchedKeywords,
    missingKeywords,
    strengths,
    gaps,
    recommendations,
    jobUrl,
  })

  return {
    score,
    report,
    matchedKeywords,
    missingKeywords,
  }
}
