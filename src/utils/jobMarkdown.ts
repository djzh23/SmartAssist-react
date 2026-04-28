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
    bg: '#FFFBEB',
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
    bg: '#FFFBEB',
    border: '#22D3EE',
    color: '#B45309',
    chipBg: '#FFFBEB',
    chipColor: '#0E7490',
  },
  interview: {
    chip: 'Interview',
    bg: '#FFFBEB',
    border: '#D97706',
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

/** Split a Markdown pipe row into cells (min 2). Returns null if not a pipe row. */
function splitPipeCells(line: string): string[] | null {
  const t = line.trim()
  if (!t.includes('|')) return null
  const rawParts = t.split('|').map(c => c.trim())
  let cells = [...rawParts]
  if (cells[0] === '') cells.shift()
  if (cells.length > 0 && cells[cells.length - 1] === '') cells.pop()
  if (cells.length < 2) return null
  return cells
}

function isMarkdownTableSeparatorCell(cell: string): boolean {
  return /^:?-{3,}:?$/.test(cell.trim())
}

function isMarkdownTableSeparatorRow(cells: string[]): boolean {
  return cells.length >= 2 && cells.every(isMarkdownTableSeparatorCell)
}

function statusCellMarkup(raw: string): string | null {
  const t = normalizeBrokenText(raw).trim()
  if (t === '' || t === '-' || t === '-') return '<span class="job-cell-status job-cell-status-empty">-</span>'
  if (/^[✓✔\u2713\u2714]$/.test(t)) return '<span class="job-cell-status job-cell-status-yes" title="vorhanden">✓</span>'
  if (/^[✗✘xX]$/.test(t)) return '<span class="job-cell-status job-cell-status-no" title="fehlt">✗</span>'
  return null
}

function padRow(cells: string[], len: number): string[] {
  const row = [...cells]
  while (row.length < len) row.push('')
  return row.slice(0, len)
}

function buildMarkdownTableHtml(header: string[], body: string[][]): string {
  const colCount = header.length
  const thead = `<thead><tr>${header.map(h => `<th scope="col">${formatInline(h)}</th>`).join('')}</tr></thead>`
  const tbodyRows = body.map(row => {
    const cells = padRow(row, colCount)
    return `<tr>${cells.map(cell => {
      const status = statusCellMarkup(cell)
      if (status) return `<td class="job-md-td job-md-td-status">${status}</td>`
      return `<td class="job-md-td">${formatInline(cell)}</td>`
    }).join('')}</tr>`
  }).join('')
  return `<div class="job-md-table-wrap"><table class="job-md-table">${thead}<tbody>${tbodyRows}</tbody></table></div>`
}

/**
 * If lines[start] begins a GFM-style pipe table, return HTML and number of lines consumed; else null.
 */
function tryConsumeMarkdownTable(lines: string[], start: number): { html: string; consumed: number } | null {
  if (start >= lines.length) return null
  const row0 = splitPipeCells(lines[start].trim())
  if (!row0) return null
  if (start + 1 >= lines.length) return null
  const row1 = splitPipeCells(lines[start + 1].trim())
  if (!row1 || row1.length !== row0.length) return null
  if (!isMarkdownTableSeparatorRow(row1)) return null

  const colCount = row0.length
  const body: string[][] = []
  let j = start + 2
  while (j < lines.length) {
    const raw = lines[j]
    const trimmed = raw.trim()
    if (!trimmed) break
    const cells = splitPipeCells(trimmed)
    if (!cells) break
    body.push(padRow(cells, colCount))
    j++
  }

  return { html: buildMarkdownTableHtml(row0, body), consumed: j - start }
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

  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) {
      closeList()
      i++
      continue
    }

    const table = tryConsumeMarkdownTable(lines, i)
    if (table) {
      closeList()
      parts.push(table.html)
      i += table.consumed
      continue
    }

    if (/^[-]{3,}$/.test(line)) {
      closeList()
      i++
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
      i++
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
      i++
      continue
    }

    closeList()

    const keyValue = line.match(/^([A-Za-z0-9][^:]{1,60}):\s+(.+)$/)
    if (keyValue && !/^https?:\/\//i.test(line)) {
      parts.push(`<p class="job-kv"><span class="job-kv-key">${formatInline(keyValue[1])}:</span> ${formatInline(keyValue[2])}</p>`)
      i++
      continue
    }

    const subHeading = line.match(/^([A-Za-z0-9][^:]{1,60}):$/)
    if (subHeading) {
      parts.push(`<h4 class="job-subhead">${formatInline(subHeading[1])}</h4>`)
      i++
      continue
    }

    parts.push(`<p class="job-p">${formatInline(line)}</p>`)
    i++
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
