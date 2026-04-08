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

// ── Agent streaming ────────────────────────────────────────────────────────
export interface StreamChunk {
  type: 'chunk' | 'done' | 'error'
  text?: string
  toolUsed?: string
  message?: string
}

/** Stream a chat response as SSE tokens. Calls onChunk for each text piece. */
export async function askAgentStream(
  request: AgentRequest,
  token: string | null | undefined,
  onChunk: (text: string) => void,
): Promise<{ toolUsed: string; serverUsageToday?: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/agent/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (res.status === 429) {
    let reason = 'usage_limit'
    try { const err = await res.json() as Record<string, string>; reason = err?.reason ?? err?.error ?? reason } catch { /**/ }
    throw new UsageLimitError(reason, 429)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try { const err = await res.json() as Record<string, string>; if (err?.error) message = err.error } catch { /**/ }
    throw new Error(message)
  }

  const rawUsage = res.headers.get('X-Usage-Today')
  const serverUsageToday = rawUsage !== null ? Number(rawUsage) : undefined

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let toolUsed = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue
      try {
        const chunk = JSON.parse(raw) as StreamChunk
        if (chunk.type === 'chunk' && chunk.text)  onChunk(chunk.text)
        else if (chunk.type === 'done')             toolUsed = chunk.toolUsed ?? ''
        else if (chunk.type === 'error')            throw new Error(chunk.message ?? 'Stream error')
      } catch (e) {
        if (e instanceof SyntaxError) continue // incomplete JSON line — skip
        throw e
      }
    }
  }

  return { toolUsed, serverUsageToday }
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

// Audio is handled directly via Web Speech API in LearningResponse.tsx
