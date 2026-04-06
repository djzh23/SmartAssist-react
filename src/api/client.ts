import type { AgentRequest, AgentResponse } from '../types'

const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : ''

// ── Custom error for 429 usage-limit responses ─────────────────────────────
export class UsageLimitError extends Error {
  constructor(
    public readonly reason: string,
    public readonly status: number = 429,
  ) {
    super(reason)
    this.name = 'UsageLimitError'
  }
}

// ── Extended response with optional server-side usage metadata ─────────────
export interface AgentResponseWithUsage extends AgentResponse {
  /** Real usage count from X-Usage-Today header, if provided by backend */
  serverUsageToday?: number
  /** Real daily limit from X-Usage-Limit header, if provided by backend */
  serverUsageLimit?: number
}

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// ── Agent ask ──────────────────────────────────────────────────────────────
export async function askAgent(
  request: AgentRequest,
  token?: string,
): Promise<AgentResponseWithUsage> {
  const res = await fetch(`${BASE}/api/agent/ask`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(request),
  })

  if (res.status === 429) {
    let reason = 'usage_limit'
    try {
      const err = await res.json() as Record<string, string>
      reason = err?.reason ?? err?.error ?? 'usage_limit'
    } catch { /* ignore */ }
    throw new UsageLimitError(reason, 429)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = await res.json() as Record<string, string>
      if (err?.error) message = err.error
    } catch { /* ignore */ }
    throw new Error(message)
  }

  const data = await res.json() as AgentResponse

  const rawToday = res.headers.get('X-Usage-Today')
  const rawLimit = res.headers.get('X-Usage-Limit')

  return {
    ...data,
    serverUsageToday: rawToday !== null ? Number(rawToday) : undefined,
    serverUsageLimit: rawLimit !== null ? Number(rawLimit) : undefined,
  }
}

// ── Usage sync — fetches real usage from backend on load ───────────────────
export interface UsageStatus {
  usageToday: number
  dailyLimit: number
  plan: string
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: string; message?: string }
    return payload.error ?? payload.message ?? fallback
  } catch {
    return fallback
  }
}

export async function getAgentUsage(token?: string): Promise<UsageStatus> {
  const res = await fetch(`${BASE}/api/agent/usage`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to fetch usage (${res.status})`))
  }

  const data = await res.json() as Partial<UsageStatus>
  if (typeof data.usageToday !== 'number' || typeof data.dailyLimit !== 'number' || typeof data.plan !== 'string') {
    throw new Error('Invalid usage payload from backend')
  }

  return {
    usageToday: data.usageToday,
    dailyLimit: data.dailyLimit,
    plan: data.plan,
  }
}

// ── Speech API ─────────────────────────────────────────────────────────────
export async function generateSpeech(text: string, languageCode: string): Promise<ArrayBuffer | null> {
  const res = await fetch(`${BASE}/api/speech/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, languageCode }),
  })
  if (!res.ok) return null
  return res.arrayBuffer()
}

// ── Browser TTS fallback ───────────────────────────────────────────────────
export function speakWithBrowser(text: string, lang: string): void {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang
  window.speechSynthesis.speak(utt)
}

export async function speak(text: string, langCode: string): Promise<void> {
  try {
    const buf = await generateSpeech(text, langCode)
    if (buf && buf.byteLength > 0) {
      const blob = new Blob([buf], { type: 'audio/mpeg' })
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.onended = () => URL.revokeObjectURL(url)
      await audio.play()
      return
    }
  } catch { /* fall through */ }
  speakWithBrowser(text, langCode)
}
