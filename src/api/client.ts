import type { AgentRequest, AgentResponse } from '../types'

// In development the Vite proxy forwards /api/* to the backend.
// In production set VITE_API_BASE_URL to the deployed backend origin.
const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : ''

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = await res.json()
      if (err?.error) message = err.error
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message)
  }

  return res.json() as Promise<T>
}

// ── Agent API ─────────────────────────────────────────────
export async function askAgent(request: AgentRequest): Promise<AgentResponse> {
  return post<AgentResponse>('/api/agent/ask', request)
}

// ── CV Summarisation (browser-side, one-shot call) ────────
// Sends raw CV text to the AI and gets back a compact structured
// summary containing only skills / experience / projects.
// Personal data (name, address, phone) is intentionally excluded.
export async function summarizeCvText(rawText: string): Promise<string> {
  const prompt = `You are a CV parser. Extract ONLY the professional data below into this compact structure:

SKILLS: comma-separated list of all technical skills, languages, frameworks, tools
EXPERIENCE: one line per role → "Title, Company (years) — key technologies"
PROJECTS: one line per project → "Name: brief description (tech stack)"
EDUCATION: one line per degree → "Degree, Field, Institution (year)"

Rules:
- Be extremely concise — max 300 words total
- Exclude completely: full name, email, phone, address, nationality, date of birth, hobbies, references, personal statements
- Keep only professional/technical content

CV TEXT:
${rawText.slice(0, 2500)}`

  const res = await post<AgentResponse>('/api/agent/ask', {
    message: prompt,
    sessionId: `cv-extract-${Date.now()}`,
  })
  return res.reply.trim()
}

// ── Speech API ────────────────────────────────────────────
export async function generateSpeech(text: string, languageCode: string): Promise<ArrayBuffer | null> {
  const res = await fetch(`${BASE}/api/speech/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, languageCode }),
  })
  if (!res.ok) return null
  return res.arrayBuffer()
}

// ── Browser TTS fallback ──────────────────────────────────
export function speakWithBrowser(text: string, lang: string): void {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang
  window.speechSynthesis.speak(utt)
}

// ── Speak (ElevenLabs → browser fallback) ────────────────
export async function speak(text: string, langCode: string): Promise<void> {
  try {
    const buf = await generateSpeech(text, langCode)
    if (buf && buf.byteLength > 0) {
      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url  = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      await audio.play()
      return
    }
  } catch {
    // fall through to browser TTS
  }
  speakWithBrowser(text, langCode)
}
