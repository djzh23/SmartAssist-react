// Converts the structured job analysis markdown returned by the backend
// into an array of colored section objects for rendering.

export interface JobSection {
  title: string
  body: string        // raw markdown body
  bg: string
  border: string
  color: string
}

const SECTION_STYLES: Record<string, { bg: string; border: string; color: string }> = {
  '📋': { bg: '#EFF6FF', border: '#3B82F6', color: '#1D4ED8' },
  '🎯': { bg: '#F5F3FF', border: '#7C3AED', color: '#5B21B6' },
  '📄': { bg: '#F0FDF4', border: '#10B981', color: '#065F46' },
  '🔑': { bg: '#FFFBEB', border: '#F59E0B', color: '#92400E' },
  '⚡': { bg: '#FFF7ED', border: '#F97316', color: '#9A3412' },
}

const DEFAULT_STYLE = { bg: '#F9FAFB', border: '#9CA3AF', color: '#374151' }

export function parseJobAnalysis(text: string): JobSection[] {
  const chunks = text.trim().split(/(?=## )/)
  return chunks
    .map(chunk => {
      const nl = chunk.indexOf('\n')
      const header = nl < 0 ? chunk.replace(/^##\s*/, '').trim() : chunk.slice(0, nl).replace(/^##\s*/, '').trim()
      const body   = nl < 0 ? '' : chunk.slice(nl + 1).trim()
      const emoji  = Object.keys(SECTION_STYLES).find(e => header.includes(e))
      const style  = emoji ? SECTION_STYLES[emoji] : DEFAULT_STYLE
      return { title: header, body, ...style }
    })
    .filter(s => s.title.length > 0)
}

// Convert a markdown body fragment to HTML (bullets + bold + code)
export function bodyToHtml(text: string): string {
  const lines = text.split('\n')
  const parts: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      if (inList) { parts.push('</ul>'); inList = false }
      continue
    }
    if (line.startsWith('- ')) {
      if (!inList) { parts.push('<ul class="job-ul">'); inList = true }
      parts.push(`<li>${formatInline(line.slice(2))}</li>`)
    } else {
      if (inList) { parts.push('</ul>'); inList = false }
      parts.push(`<p>${formatInline(line)}</p>`)
    }
  }
  if (inList) parts.push('</ul>')
  return parts.join('')
}

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function formatInline(text: string): string {
  let s = escape(text)
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  s = s.replace(/`(.+?)`/g, '<code style="background:#f1f5f9;padding:1px 5px;border-radius:3px;font-size:0.82em">$1</code>')
  return s
}
