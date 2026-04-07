// Parse and format job analyzer output into structured, color coded sections.

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
  icon: string
  chip: string
  bg: string
  border: string
  color: string
  chipBg: string
  chipColor: string
  score?: number
}

interface ToneStyle {
  icon: string
  chip: string
  bg: string
  border: string
  color: string
  chipBg: string
  chipColor: string
}

const TONE_STYLES: Record<JobSectionTone, ToneStyle> = {
  score: {
    icon: '🎯',
    chip: 'Match',
    bg: '#EEF2FF',
    border: '#6366F1',
    color: '#4338CA',
    chipBg: '#E0E7FF',
    chipColor: '#3730A3',
  },
  strength: {
    icon: '✅',
    chip: 'Stärken',
    bg: '#ECFDF3',
    border: '#10B981',
    color: '#047857',
    chipBg: '#D1FAE5',
    chipColor: '#065F46',
  },
  gaps: {
    icon: '⚠️',
    chip: 'Lücken',
    bg: '#FFFBEB',
    border: '#F59E0B',
    color: '#B45309',
    chipBg: '#FEF3C7',
    chipColor: '#92400E',
  },
  actions: {
    icon: '🚀',
    chip: 'Nächste Schritte',
    bg: '#FFF7ED',
    border: '#F97316',
    color: '#C2410C',
    chipBg: '#FFEDD5',
    chipColor: '#9A3412',
  },
  keywords: {
    icon: '🔑',
    chip: 'Keywords',
    bg: '#F5F3FF',
    border: '#8B5CF6',
    color: '#6D28D9',
    chipBg: '#EDE9FE',
    chipColor: '#5B21B6',
  },
  interview: {
    icon: '🎤',
    chip: 'Interview',
    bg: '#ECFEFF',
    border: '#06B6D4',
    color: '#0E7490',
    chipBg: '#CFFAFE',
    chipColor: '#155E75',
  },
  risk: {
    icon: '🛑',
    chip: 'Risiko',
    bg: '#FEF2F2',
    border: '#EF4444',
    color: '#B91C1C',
    chipBg: '#FEE2E2',
    chipColor: '#991B1B',
  },
  salary: {
    icon: '💶',
    chip: 'Vergütung',
    bg: '#F0FDF4',
    border: '#22C55E',
    color: '#15803D',
    chipBg: '#DCFCE7',
    chipColor: '#166534',
  },
  general: {
    icon: '📌',
    chip: 'Kontext',
    bg: '#F8FAFC',
    border: '#94A3B8',
    color: '#334155',
    chipBg: '#E2E8F0',
    chipColor: '#334155',
  },
}

function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0
  if (value < 0) return 0
  if (value > 100) return 100
  return value
}

function extractScore(content: string): number | undefined {
  const fractionMatch = content.match(/(\d{1,3})\s*\/\s*100/)
  if (fractionMatch) {
    return clampScore(Number(fractionMatch[1]))
  }

  const percentMatch = content.match(/(\d{1,3})\s*%/)
  if (percentMatch) {
    return clampScore(Number(percentMatch[1]))
  }

  return undefined
}

function normalizeHeader(raw: string): string {
  return raw
    .replace(/^#+\s*/, '')
    .replace(/^\*\*(.+)\*\*$/, '$1')
    .replace(/\s*:\s*$/, '')
    .trim()
}

function isLikelyHeading(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false

  if (/^##+\s+/.test(trimmed)) return true

  // Upper-case style headings: STRENGTHS:
  if (/^[A-Z0-9ÄÖÜ/&+\- ][A-Z0-9ÄÖÜ/&+\- ]{1,80}:\s*$/.test(trimmed)) return true

  // Normal title style headings with trailing colon.
  if (/^[A-Za-zÄÖÜäöüß][^:]{1,80}:\s*$/.test(trimmed)) return true

  return false
}

function detectTone(title: string, body: string): JobSectionTone {
  const haystack = `${title} ${body}`.toLowerCase()

  if (
    haystack.includes('match score')
    || haystack.includes('score')
    || haystack.includes('fit')
    || haystack.includes('uebereinst')
    || haystack.includes('übereinst')
    || haystack.includes('passung')
  ) return 'score'

  if (
    haystack.includes('starke')
    || haystack.includes('strength')
    || haystack.includes('profil fit')
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
  const cleanTitle = title.trim() || 'Analyse Überblick'
  const tone = detectTone(cleanTitle, body)
  const style = TONE_STYLES[tone]
  const score = extractScore(`${cleanTitle}\n${body}`)

  return {
    title: cleanTitle,
    body,
    tone,
    score,
    ...style,
  }
}

export function parseJobAnalysis(text: string): JobSection[] {
  const raw = text.replace(/\r\n?/g, '\n').trim()
  if (!raw) return []

  const lines = raw.split('\n')
  const sections: JobSection[] = []
  let currentHeader = ''
  let currentBodyLines: string[] = []

  const flush = () => {
    const body = currentBodyLines.join('\n').trim()
    if (!currentHeader && !body) return
    sections.push(buildSection(currentHeader || 'Analyse Überblick', body))
    currentBodyLines = []
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    if (isLikelyHeading(line)) {
      flush()
      currentHeader = normalizeHeader(line)
      continue
    }

    // Markdown heading form with body on same line.
    const markdownHeading = line.match(/^##+\s+(.+)$/)
    if (markdownHeading) {
      flush()
      currentHeader = normalizeHeader(markdownHeading[1])
      continue
    }

    currentBodyLines.push(line)
  }

  flush()

  if (sections.length === 0) {
    return [buildSection('Analyse Überblick', raw)]
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
  let value = escapeHtml(input)

  value = value.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  value = value.replace(
    /`(.+?)`/g,
    '<code class="job-inline-code">$1</code>',
  )
  value = value.replace(/(\b\d{1,3}\s*\/\s*100\b)/g, '<span class="job-inline-score">$1</span>')
  value = value.replace(/(\b\d{1,3}\s*%\b)/g, '<span class="job-inline-percent">$1</span>')

  return value
}

export function bodyToHtml(text: string): string {
  const lines = text.split('\n')
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

    const unordered = line.match(/^[-*•]\s+(.+)$/)
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

    const inlineKeyValue = line.match(/^([A-Za-zÄÖÜäöüß0-9][^:]{1,60}):\s+(.+)$/)
    if (inlineKeyValue && !/^https?:\/\//i.test(line)) {
      parts.push(
        `<p class="job-kv"><span class="job-kv-key">${formatInline(inlineKeyValue[1])}:</span> ${formatInline(inlineKeyValue[2])}</p>`,
      )
      continue
    }

    const subHeading = line.match(/^([A-Za-zÄÖÜäöüß0-9][^:]{1,60}):$/)
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
