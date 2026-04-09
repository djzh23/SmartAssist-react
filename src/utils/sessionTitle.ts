import type { ChatSession, ToolType } from '../types'

const DEFAULT_MAX = 34

function firstLine(raw: string): string {
  return raw.replace(/\r\n?/g, '\n').split('\n')[0]?.trim().replace(/\s+/g, ' ') ?? ''
}

function trimMax(s: string, max: number): string {
  if (s.length <= max) return s
  return `${s.slice(0, Math.max(1, max - 1))}…`
}

/**
 * Short label for the session list from persisted title or first user line.
 */
export function sessionListLabel(session: ChatSession, maxLen = DEFAULT_MAX): string {
  const persisted = session.title?.trim()
  if (persisted) return trimMax(persisted, maxLen)

  const firstUser = session.messages.find(m => m.isUser)?.text
  const line = firstUser ? firstLine(firstUser) : ''
  if (!line) return 'Neues Gespräch'
  return trimMax(line, maxLen)
}

/**
 * Sets once on the first user message — tool-aware, short German-friendly titles.
 */
export function suggestSessionTitle(toolType: ToolType, rawUserText: string): string {
  const line = firstLine(rawUserText)
  if (!line) return 'Neues Gespräch'

  const lower = line.toLowerCase()

  if (toolType === 'jobanalyzer') {
    if (lower.includes('bitte starte') && lower.includes('analyse')) return 'Stellenanalyse'
    const analyseStart = line.match(/^Analyse starten:\s*(.+)$/i)
    if (analyseStart?.[1]) return trimMax(`Job: ${analyseStart[1].trim()}`, DEFAULT_MAX)
  }

  if (toolType === 'interview') {
    if (
      lower.includes('interview preparation')
      || lower.includes('please start an interview')
      || lower.includes('bitte start')
    ) {
      return 'Interview-Vorbereitung'
    }
    const role = line.match(/preparing for an interview for:\s*(.+?)(?:\.|$)/i)
    if (role?.[1]) return trimMax(`Interview: ${role[1].trim()}`, DEFAULT_MAX)
  }

  if (toolType === 'programming') {
    const working = line.match(/^I am working with\s+([^.]+)/i)
    if (working?.[1]) return trimMax(`Code: ${working[1].trim()}`, DEFAULT_MAX)
  }

  return trimMax(line, DEFAULT_MAX)
}
