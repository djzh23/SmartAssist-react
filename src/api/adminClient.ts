const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

export interface ModelUsage {
  model: string
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
  activeUsersToday: number
  totalRegisteredUsers: number
  payingUsers: number
  monthlyRevenue: number
  monthlyProfit: number
  topUsers: UserUsageSummary[]
  byModel: Record<string, ModelUsage>
  byTool: Record<string, ToolUsage>
  last30Days: DailyUsage[]
}

export async function fetchDashboard(token: string): Promise<AdminDashboardData> {
  const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 403) throw new Error('Not authorized as admin')
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json() as Promise<AdminDashboardData>
}

export async function fetchTopUsers(token: string, date?: string, limit = 20): Promise<UserUsageSummary[]> {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  params.set('limit', limit.toString())
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
