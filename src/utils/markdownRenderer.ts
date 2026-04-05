// Shared markdown parsing utilities used by ProgrammingResponse and InterviewResponse.

export type Block =
  | { type: 'h1'; content: string }
  | { type: 'h2'; content: string }
  | { type: 'h3'; content: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'blockquote'; content: string }
  | { type: 'p';  content: string }
  | { type: 'hr' }

export interface Segment {
  type: 'text' | 'code'
  content: string
  language: string
}

export function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const blocks: Block[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (!line.trim()) { i++; continue }

    if (line.match(/^---+$/))    { blocks.push({ type: 'hr' }); i++; continue }
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', content: line.slice(4) }); i++; continue }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', content: line.slice(3) }); i++; continue }
    if (line.startsWith('# '))   { blocks.push({ type: 'h1', content: line.slice(2) }); i++; continue }

    if (line.startsWith('> ')) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith('> ')) { items.push(lines[i].slice(2)); i++ }
      blocks.push({ type: 'blockquote', content: items.join('\n') })
      continue
    }

    if (line.match(/^[-*•]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*•]\s/)) {
        items.push(lines[i].replace(/^[-*•]\s/, ''))
        i++
      }
      blocks.push({ type: 'ul', items })
      continue
    }

    if (line.match(/^\d+[.)]\s/)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+[.)]\s/)) {
        items.push(lines[i].replace(/^\d+[.)]\s/, ''))
        i++
      }
      blocks.push({ type: 'ol', items })
      continue
    }

    blocks.push({ type: 'p', content: line })
    i++
  }

  return blocks
}

/** Normalize language tags to syntax-highlighter IDs */
function normalizeLang(lang: string, fallback: string): string {
  const l = lang.trim().toLowerCase()
  if (!l) return fallback
  const MAP: Record<string, string> = {
    'c#': 'csharp', 'c++': 'cpp', 'c': 'c',
    'js': 'javascript', 'ts': 'typescript',
    'tsx': 'tsx', 'jsx': 'jsx',
    'py': 'python', 'rb': 'ruby', 'sh': 'bash',
    'yml': 'yaml', 'md': 'markdown',
  }
  return MAP[l] ?? l
}

export function parseSegments(text: string, fallbackLang = 'text'): Segment[] {
  const segments: Segment[] = []
  // Capture full language tag line (allows C#, C++, etc.)
  const re = /```([^\n`]*)\n([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: text.slice(last, m.index), language: '' })
    segments.push({
      type: 'code',
      content: m[2].trimEnd(),
      language: normalizeLang(m[1], fallbackLang),
    })
    last = re.lastIndex
  }

  if (last < text.length) segments.push({ type: 'text', content: text.slice(last), language: '' })
  return segments
}
