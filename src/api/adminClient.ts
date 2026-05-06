const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface ModelUsage {
  model: string
  /** Groq vs Anthropic (from backend Redis model key). */
  provider?: string
  messages: number
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export interface ToolUsage {
  tool: string
  messages: number
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export interface UserUsageSummary {
  userId: string
  userEmail: string
  plan: string
  totalMessages: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCostUsd: number
  byModel: Record<string, ModelUsage>
  byTool: Record<string, ToolUsage>
  /** Backend: dominant tool for the requested day (from tc_* counters). */
  topTool?: string | null
}

export interface DailyUsage {
  date: string
  messages: number
  inputTokens: number
  outputTokens: number
  costUsd: number
  activeUsers: number
}

export interface AdminDashboardData {
  totalCostToday: number
  totalCostThisMonth: number
  totalMessagesToday: number
  totalMessagesThisMonth: number
  totalInputTokensToday: number
  totalOutputTokensToday: number
  /** Messages attributed to Groq models today (primary path). */
  groqMessagesToday: number
  /** Messages via Anthropic / fallback models today. */
  otherLlmMessagesToday: number
  activeUsersToday: number
  totalRegisteredUsers: number
  payingUsers: number
  monthlyRevenue: number
  monthlyProfit: number
  topUsers: UserUsageSummary[]
  byModel: Record<string, ModelUsage>
  byTool: Record<string, ToolUsage>
  last30Days: DailyUsage[]
  /** Backend: how LLM rows are priced (Groq 0 USD, Anthropic billed). */
  llmCostPolicyNote?: string
}

export interface AdminStats {
  turnsToday: number
  turnsThisWeek: number
  turnsThisMonth: number
  activeUsers7d: number
  recentRecordsCount: number
}

export interface RecentUsageRecord {
  id: string
  userId: string
  toolType: string
  sessionId: string
  createdAt: string
  inputTokens: number
  outputTokens: number
  cacheCreationTokens: number
  cacheReadTokens: number
  model?: string | null
  responseTimeMs?: number | null
  estimatedCostUsd?: number | null
}

export interface ActiveUserUsage {
  userId: string
  turnsCount: number
  lastSeenAt: string
  totalEstimatedCostUsd: number
}

export interface TokenSummary {
  totalInputTokens: number
  totalOutputTokens: number
  totalCacheReadTokens: number
  totalCacheCreationTokens: number
  cacheHitRate: number
  totalEstimatedCostUsd: number
  totalTurns: number
  avgInputTokensPerTurn: number
  avgOutputTokensPerTurn: number
  avgResponseTimeMs: number
  groqTurnPercent: number
}

export interface TokenByTool {
  toolType: string
  turns: number
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export interface TokenByModel {
  model: string
  turns: number
  costUsd: number
}

export interface TokenDaily {
  date: string
  turns: number
  inputTokens: number
  costUsd: number
}

export interface RagSummary {
  turnsWithRag: number
  turnsWithoutRag: number
  avgChunksRetrieved: number
  avgTopScore: number
  avgRagLatencyMs: number
  ragAdoptionPercent: number
}

export async function fetchDashboard(token: string): Promise<AdminDashboardData> {
  const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 403) throw new Error('Not authorized as admin')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<AdminDashboardData>
}

export type FetchTopUsersOptions = {
  /** Single day yyyy-MM-dd (ignored if from+to are set). */
  date?: string
  from?: string
  to?: string
  limit?: number
}

export async function fetchTopUsers(token: string, options?: FetchTopUsersOptions): Promise<UserUsageSummary[]> {
  const params = new URLSearchParams()
  if (options?.date) params.set('date', options.date)
  if (options?.from) params.set('from', options.from)
  if (options?.to) params.set('to', options.to)
  params.set('limit', String(options?.limit ?? 100))
  const res = await fetch(`${API_BASE}/api/admin/top-users?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<UserUsageSummary[]>
}

export async function fetchUserUsage(token: string, userId: string, from?: string, to?: string): Promise<UserUsageSummary> {
  const params = new URLSearchParams()
  if (from) params.set('from', from)
  if (to) params.set('to', to)
  const res = await fetch(`${API_BASE}/api/admin/users/${encodeURIComponent(userId)}/usage?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<UserUsageSummary>
}

export async function fetchDailyStats(token: string, days = 30): Promise<DailyUsage[]> {
  const res = await fetch(`${API_BASE}/api/admin/daily-stats?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<DailyUsage[]>
}

export async function fetchAdminStats(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/api/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<AdminStats>
}

export async function fetchRecentUsage(token: string, limit = 50): Promise<RecentUsageRecord[]> {
  const res = await fetch(`${API_BASE}/api/admin/usage/recent?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<RecentUsageRecord[]>
}

export async function fetchActiveUsers(token: string, days = 7, limit = 50): Promise<ActiveUserUsage[]> {
  const res = await fetch(`${API_BASE}/api/admin/users/active?days=${days}&limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<ActiveUserUsage[]>
}

export async function fetchTokenSummary(token: string, from: string, to: string): Promise<TokenSummary> {
  const res = await fetch(`${API_BASE}/api/admin/tokens/summary?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<TokenSummary>
}

export async function fetchTokensByTool(token: string, from: string, to: string): Promise<TokenByTool[]> {
  const res = await fetch(`${API_BASE}/api/admin/tokens/by-tool?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<TokenByTool[]>
}

export async function fetchTokensByModel(token: string, from: string, to: string): Promise<TokenByModel[]> {
  const res = await fetch(`${API_BASE}/api/admin/tokens/by-model?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<TokenByModel[]>
}

export async function fetchTokensDaily(token: string, days = 30): Promise<TokenDaily[]> {
  const res = await fetch(`${API_BASE}/api/admin/tokens/daily?days=${days}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<TokenDaily[]>
}

export async function fetchTokensRecent(token: string, limit = 20): Promise<RecentUsageRecord[]> {
  const res = await fetch(`${API_BASE}/api/admin/tokens/recent?limit=${limit}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<RecentUsageRecord[]>
}

export async function fetchRagSummary(token: string, from: string, to: string): Promise<RagSummary> {
  const res = await fetch(`${API_BASE}/api/admin/rag/summary?from=${from}&to=${to}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<RagSummary>
}
