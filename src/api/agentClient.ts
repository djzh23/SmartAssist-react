import { BASE, authHeaders, readApiError } from './apiBase'

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

// ── Usage sync - fetches real usage from backend on load ───────────────────
export interface UsageStatus {
  usageToday: number
  dailyLimit: number
  plan: string
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

// ── Job posting preview (URL or pasted text) ───────────────────────────────
// Note: this has a real, working backend endpoint (PrivatePrep/Controllers/JobsController.cs,
// POST /api/jobs/preview, rate-limited) but no UI currently calls fetchJobPreview - kept as-is
// rather than removed, since unlike the chat/session/notes family above this is not a leftover
// from a removed feature, it looks like a still-unfinished one.

export interface JobPreviewResponse {
  success: boolean
  jobTitle: string | null
  companyName: string | null
  location: string | null
  rawJobText: string | null
  keyRequirements: string[] | null
  keywords: string[] | null
  error: string | null
}

export async function fetchJobPreview(token: string, input: string): Promise<JobPreviewResponse> {
  const res = await fetch(`${BASE}/api/jobs/preview`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ input }),
  })
  if (res.status === 401)
    throw new Error('Anmeldung erforderlich für die Stellen-Vorschau.')
  if (res.status === 429) {
    let reason = 'Zu viele Anfragen. Bitte kurz warten.'
    try {
      const err = await res.json() as Record<string, string>
      reason = err?.reason ?? err?.error ?? reason
    } catch { /* ignore */ }
    throw new UsageLimitError(reason, 429)
  }
  if (!res.ok)
    throw new Error(await readApiError(res, `Stellen-Vorschau fehlgeschlagen (${res.status})`))
  return (await res.json()) as JobPreviewResponse
}
