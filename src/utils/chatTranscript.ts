import type { ChatMessage } from '../types'

const MAX_CHARS = 3500

/** Concatenates recent user messages for client-side heuristics (job match, context). */
export function buildUserMessageTranscript(messages: ChatMessage[], maxChars = MAX_CHARS): string {
  const userTexts = messages
    .filter(m => m.isUser)
    .map(m => m.text.trim())
    .filter(Boolean)

  let out = ''
  for (let i = userTexts.length - 1; i >= 0; i--) {
    const line = userTexts[i]
    const next = out.length ? `${line}\n${out}` : line
    if (next.length > maxChars) {
      const slice = next.slice(0, maxChars)
      return slice.endsWith('…') ? slice : `${slice}…`
    }
    out = next
  }
  return out
}
