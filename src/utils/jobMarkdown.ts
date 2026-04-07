export type JobSectionTone =
  | 'score'
  | 'strength'
  | 'gaps'
  | 'actions'
  | 'keywords'
  | 'interview'
  | 'risk'
  | 'salary'
  | 'general'

export interface JobSection {
  title: string
  body: string
  tone: JobSectionTone
  chip: string
  bg: string
  border: string
  color: string
  chipBg: string
  chipColor: string
  score?: number
}

interface ToneStyle {
  chip: string
  bg: string
  border: string
  color: string
  chipBg: string
  chipColor: string
}

const TONE_STYLES: Record<JobSectionTone, ToneStyle> = {
  score: {
    chip: 'Match',
    bg: '#ECFEFF',
    border: '#0EA5E9',
    color: '#0369A1',
    chipBg: '#CFFAFE',
    chipColor: '#0E7490',
  },
  strength: {
    chip: 'Staerken',
    bg: '#ECFDF3',
    border: '#10B981',
    color: '#047857',
    chipBg: '#D1FAE5',
    chipColor: '#065F46',
  },
  gaps: {
    chip: 'Luecken',
    bg: '#FFFBEB',
    border: '#F59E0B',
    color: '#B45309',
    chipBg: '#FEF3C7',
    chipColor: '#92400E',
  },
  actions: {
    chip: 'Naechste Schritte',
    bg: '#FFF7ED',
    border: '#F97316',
    color: '#C2410C',
    chipBg: '#FFEDD5',
    chipColor: '#9A3412',
  },
  keywords: {
    chip: 'Keywords',
    bg: '#ECFEFF',
    border: '#22D3EE',
    color: '#0891B2',
    chipBg: '#ECFEFF',
    chipColor: '#0E7490',
  },
  interview: {
    chip: 'Interview',
    bg: '#ECFEFF',
    border: '#06B6D4',
    color: '#0E7490',
    chipBg: '#CFFAFE',
    chipColor: '#155E75',
  },
  risk: {
    chip: 'Risiko',
    bg: '#FEF2F2',
    border: '#EF4444',
    color: '#B91C1C',
    chipBg: '#FEE2E2',
    chipColor: '#991B1B',
  },
  salary: {
    chip: 'Verguetung',
    bg: '#F0FDF4',
    border: '#22C55E',
    color: '#15803D',
    chipBg: '#DCFCE7',
    chipColor: '#166534',
  },
  general: {
    chip: 'Kontext',
    bg: '#F8FAFC',
    border: '#94A3B8',
    color: '#334155',
    chipBg: '#E2E8F0',
    chipColor: '#334155',
  },
}

const BROKEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\u00C3\u00BC/g, 'ue'],
  [/\u00C3\u00A4/g, 'ae'],
  [/\u00C3\u00B6/g, 'oe'],
  [/\u00C3\u009F/g, 'ss'],
  [/\u00C3\u0153/g, 'Ue'],
  [/\u00C3\u201E/g, 'Ae'],
  [/\u00C3\u2013/g, 'Oe'],
  [/\u00E2\u20AC\u00A2/g, '-'],
  [/\u00E2\u20AC\u00A6/g, '...'],
  [/\u00E2\u20AC\u201D|\u00E2\u20AC\u201C/g, '-'],
]

function normalizeBrokenText(value: string): string {
  let out = value
  for (const [pattern, replacement] of BROKEN_REPLACEMENTS) {
    out = out.replace(pattern, replacement)
  }
  return out
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function extractScore(content: string): number | undefined {
  const fractionMatch = content.match(/(\d{1,3})\s*\/\s*100/)
  if (fractionMatch) return clampScore(Number(fractionMatch[1]))

  const percentMatch = content.match(/(\d{1,3})\s*%/)
  if (percentMatch) return clampScore(Number(percentMatch[1]))

  return undefined
}

function normalizeHeader(raw: string): string {
  return raw
    .replace(/^#+\s*/, '')
    .replace(/\*\*/g, '')
    .replace(/^[-*\s]+/, '')
    .replace(/\s*:\s*$/, '')
    .trim()
}

function splitHeadingAndInlineBody(normalizedHeading: string): { title: string; inlineBody: string } {
  const valueMatch = normalizedHeading.match(/^(.{2,80}?):\s+(.+)$/)
  if (!valueMatch) {
    return { title: normalizedHeading, inlineBody: '' }
  }

  const maybeTitle = valueMatch[1].trim()
  const maybeValue = valueMatch[2].trim()
  if (/^https?:\/\//i.test(maybeValue)) {
    return { title: normalizedHeading, inlineBody: '' }
  }

  return { title: maybeTitle, inlineBody: maybeValue }
}

function isLikelyHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  if (/^#+\s+/.test(trimmed)) return true
  if (/^[A-Z0-9/&+\- ][A-Z0-9/&+\- ]{1,80}:\s*$/.test(trimmed)) return true
  if (/^[A-Za-z][^:]{1,80}:\s*$/.test(trimmed)) return true

  return false
}

function detectTone(title: string, body: string): JobSectionTone {
  const haystack = `${title} ${body}`.toLowerCase()

  if (
    haystack.includes('match score')
    || haystack.includes('score')
    || haystack.includes('fit')
    || haystack.includes('uebereinst')
    || haystack.includes('passung')
  ) return 'score'

  if (
    haystack.includes('staerke')
    || haystack.includes('strength')
    || haystack.includes('geeignet')
  ) return 'strength'

  if (
    haystack.includes('luecke')
    || haystack.includes('gap')
    || haystack.includes('fehl')
    || haystack.includes('missing')
  ) return 'gaps'

  if (
    haystack.includes('next step')
    || haystack.includes('action')
    || haystack.includes('empfehl')
    || haystack.includes('verbesser')
    || haystack.includes('plan')
  ) return 'actions'

  if (
    haystack.includes('keyword')
    || haystack.includes('ats')
    || haystack.includes('suchbegriff')
  ) return 'keywords'

  if (
    haystack.includes('interview')
    || haystack.includes('frage')
    || haystack.includes('pitch')
  ) return 'interview'

  if (
    haystack.includes('risk')
    || haystack.includes('warn')
    || haystack.includes('red flag')
    || haystack.includes('kritisch')
  ) return 'risk'

  if (
    haystack.includes('salary')
    || haystack.includes('gehalt')
    || haystack.includes('benefit')
    || haystack.includes('compensation')
  ) return 'salary'

  return 'general'
}

function buildSection(title: string, body: string): JobSection {
  const cleanTitle = normalizeBrokenText(title.trim() || 'Analyse Ueberblick')
  const cleanBody = normalizeBrokenText(body)
  const tone = detectTone(cleanTitle, cleanBody)
  const style = TONE_STYLES[tone]
  const score = extractScore(`${cleanTitle}\n${cleanBody}`)

  return {
    title: cleanTitle,
    body: cleanBody,
    tone,
    score,
    ...style,
  }
}

export function parseJobAnalysis(text: string): JobSection[] {
  const raw = normalizeBrokenText(text).replace(/\r\n?/g, '\n').trim()
  if (!raw) return []

  const lines = raw.split('\n')
  const sections: JobSection[] = []
  let currentHeader = ''
  let currentBodyLines: string[] = []

  const flush = () => {
    const body = currentBodyLines.join('\n').trim()
    if (!currentHeader && !body) return
    sections.push(buildSection(currentHeader || 'Analyse Ueberblick', body))
    currentBodyLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      currentBodyLines.push('')
      continue
    }

    if (/^[-]{3,}$/.test(trimmed)) {
      currentBodyLines.push('')
      continue
    }

    if (isLikelyHeading(trimmed)) {
      flush()

      const headingSource = /^#+\s+/.test(trimmed)
        ? trimmed.replace(/^#+\s+/, '')
        : trimmed
      const normalized = normalizeHeader(headingSource)
      const { title, inlineBody } = splitHeadingAndInlineBody(normalized)

      currentHeader = title
      if (inlineBody) currentBodyLines.push(inlineBody)
      continue
    }

    currentBodyLines.push(trimmed)
  }

  flush()

  if (sections.length === 0) {
    return [buildSection('Analyse Ueberblick', raw)]
  }

  return sections
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatInline(input: string): string {
  let value = escapeHtml(normalizeBrokenText(input))
  value = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  value = value.replace(/`(.+?)`/g, '<code class="job-inline-code">$1</code>')
  value = value.replace(/(\b\d{1,3}\s*\/\s*100\b)/g, '<span class="job-inline-score">$1</span>')
  value = value.replace(/(\b\d{1,3}\s*%\b)/g, '<span class="job-inline-percent">$1</span>')
  return value
}

export function bodyToHtml(text: string): string {
  const lines = normalizeBrokenText(text).split('\n')
  const parts: string[] = []
  let listMode: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listMode === 'ul') parts.push('</ul>')
    if (listMode === 'ol') parts.push('</ol>')
    listMode = null
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }

    if (/^[-]{3,}$/.test(line)) {
      closeList()
      continue
    }

    const unordered = line.match(/^[-*]\s+(.+)$/)
    if (unordered) {
      if (listMode !== 'ul') {
        closeList()
        parts.push('<ul class="job-ul">')
        listMode = 'ul'
      }
      parts.push(`<li>${formatInline(unordered[1])}</li>`)
      continue
    }

    const ordered = line.match(/^(\d{1,2})[.)]\s+(.+)$/)
    if (ordered) {
      if (listMode !== 'ol') {
        closeList()
        parts.push('<ol class="job-ol">')
        listMode = 'ol'
      }
      parts.push(`<li value="${ordered[1]}">${formatInline(ordered[2])}</li>`)
      continue
    }

    closeList()

    const keyValue = line.match(/^([A-Za-z0-9][^:]{1,60}):\s+(.+)$/)
    if (keyValue && !/^https?:\/\//i.test(line)) {
      parts.push(`<p class="job-kv"><span class="job-kv-key">${formatInline(keyValue[1])}:</span> ${formatInline(keyValue[2])}</p>`)
      continue
    }

    const subHeading = line.match(/^([A-Za-z0-9][^:]{1,60}):$/)
    if (subHeading) {
      parts.push(`<h4 class="job-subhead">${formatInline(subHeading[1])}</h4>`)
      continue
    }

    parts.push(`<p class="job-p">${formatInline(line)}</p>`)
  }

  closeList()
  return parts.join('')
}

export function pickOverallScore(sections: JobSection[]): number | undefined {
  for (const section of sections) {
    if (typeof section.score === 'number') return section.score
  }
  return undefined
}
