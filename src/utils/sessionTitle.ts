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
 * Strip common German/English conversation openers so the title focuses on
 * the actual topic. Returns the cleaned text (may be empty if all openers).
 */
function stripStarters(text: string): string {
  return text
    // Salutations
    .replace(/^(hallo|hey|hi|moin|guten\s+(tag|morgen|abend)|servus|grüezi)[,!.?\s]+/i, '')
    // Polite request prefixes
    .replace(/^(bitte|please|könntest\s+du|kannst\s+du(mir)?|können\s+sie|würden\s+sie)\s+/i, '')
    // "Ich möchte/will/brauche/habe/suche/bin…" — keep what follows
    .replace(/^(ich\s+(möchte|will|würde\s+gerne|hätte\s+gerne|brauche|suche|habe|bin))\s+/i, '')
    // "Can you…", "Could you…", "I need…", "I want…"
    .replace(/^(can\s+you|could\s+you|i\s+(need|want|would\s+like|am\s+looking))\s+/i, '')
    // Trailing question/punctuation marks
    .replace(/[?!.,;:]+$/, '')
    .trim()
}

/**
 * Return a clean 3–5 word title from free text.
 * Strips openers, takes first meaningful words, trims to max.
 */
function compactTitle(text: string, max = DEFAULT_MAX): string {
  const cleaned = stripStarters(text) || text
  // Take up to the first 6 words, then trim to max chars
  const words = cleaned.split(/\s+/).slice(0, 6).join(' ')
  return trimMax(words, max)
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
 * Generates a short session title from the first user message.
 * Tool-aware: produces structured labels for job/interview/code tools.
 * For general chat: strips conversation starters, takes first 5–6 words.
 */
export function suggestSessionTitle(toolType: ToolType, rawUserText: string): string {
  const line = firstLine(rawUserText)
  if (!line) return 'Neues Gespräch'

  const lower = line.toLowerCase()

  if (toolType === 'jobanalyzer') {
    if (lower.includes('bitte starte') && lower.includes('analyse')) return 'Stellenanalyse'
    if (lower.includes('allgemeines coaching') || lower.includes('general coaching')) return 'Allgemeines Coaching'
    const analyseStart = line.match(/^Analyse starten:\s*(.+)$/i)
    if (analyseStart?.[1]) return trimMax(`Job: ${analyseStart[1].trim()}`, DEFAULT_MAX)
    return 'Stellenanalyse'
  }

  if (toolType === 'interview') {
    if (
      lower.includes('interview preparation')
      || lower.includes('please start an interview')
      || lower.includes('please start general')
      || lower.includes('bitte start')
    ) {
      return 'Interview-Vorbereitung'
    }
    const role = line.match(/preparing for an interview for:\s*(.+?)(?:\.|$)/i)
    if (role?.[1]) return trimMax(`Interview: ${role[1].trim()}`, DEFAULT_MAX)
    return 'Interview-Vorbereitung'
  }

  if (toolType === 'programming') {
    const working = line.match(/^I am working with\s+([^.]+)/i)
    if (working?.[1]) return trimMax(`Code: ${working[1].trim()}`, DEFAULT_MAX)
    return compactTitle(line)
  }

  if (toolType === 'language') {
    return compactTitle(line)
  }

  // General: strip conversation starters, keep the topic
  return compactTitle(line)
}
