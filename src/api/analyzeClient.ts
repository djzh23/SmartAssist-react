import { BASE, authHeaders } from './apiBase'
import { UsageLimitError } from './agentClient'

export interface ScoreDimensions {
  cvMatch: number
  roleAlignment: number
  culture: number
  redFlags: number
}

export interface SkillGapReport {
  existing: string[]
  supportedByResume: string[]
  gap: string[]
  extractedJdSkills: string[]
  reasonCode: string
}

export interface BulletRewriteSuggestion {
  originalBullet: string
  rewrittenBullet: string
  reasoning: string
}

export interface FactGateViolation {
  violationType: string
  snippet: string
  reason: string
}

export interface AnalyzeReport {
  globalScore: number
  dimensions: ScoreDimensions
  skillGap: SkillGapReport
  bullets: BulletRewriteSuggestion[]
  roleSummary: string
  warnings: string[]
  cultureScreen: string
  factViolations: FactGateViolation[]
  modelUsed?: string | null
  inputTokens?: number | null
  outputTokens?: number | null
}

export interface AnalyzeUsageMeta {
  usageToday?: number
  usageLimit?: string
  plan?: string
}

export class AnalyzeApiError extends Error {
  constructor(
    public readonly errorCode: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'AnalyzeApiError'
  }
}

const MIN_JD_CHARS = 100
const MAX_JD_CHARS = 12_000

export function jobDescriptionLengthOk(text: string): boolean {
  const n = text.trim().length
  return n >= MIN_JD_CHARS && n <= MAX_JD_CHARS
}

export { MIN_JD_CHARS, MAX_JD_CHARS }

export async function analyzeJob(
  jobDescription: string,
  token: string,
): Promise<{ report: AnalyzeReport; usage: AnalyzeUsageMeta }> {
  const res = await fetch(`${BASE}/api/agent/analyze`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ jobDescription }),
  })

  if (res.status === 429) {
    let reason = 'usage_limit_reached'
    let message = 'Tageslimit erreicht.'
    try {
      const err = await res.json() as { reason?: string; message?: string; error?: string }
      reason = err.reason ?? err.error ?? reason
      message = err.message ?? message
    } catch { /* ignore */ }
    throw new UsageLimitError(message || reason, 429)
  }

  if (!res.ok) {
    let errorCode = 'analyze_error'
    let message = `Analyse fehlgeschlagen (${res.status})`
    try {
      const err = await res.json() as { error?: string; message?: string }
      if (err.error) errorCode = err.error
      if (err.message) message = err.message
      else if (err.error) message = err.error
    } catch { /* fallback */ }
    throw new AnalyzeApiError(errorCode, message, res.status)
  }

  const report = (await res.json()) as AnalyzeReport
  return {
    report,
    usage: {
      usageToday: headerNumber(res, 'X-Usage-Today'),
      usageLimit: res.headers.get('X-Usage-Limit') ?? undefined,
      plan: res.headers.get('X-Usage-Plan') ?? undefined,
    },
  }
}

function headerNumber(res: Response, name: string): number | undefined {
  const raw = res.headers.get(name)
  if (raw === null || raw === '') return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}
