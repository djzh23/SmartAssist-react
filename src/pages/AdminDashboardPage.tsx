import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  fetchDashboard,
  fetchUserUsage,
  type AdminDashboardData,
  type UserUsageSummary,
} from '../api/adminClient'

const C = {
  teal: '#0d9488',
  orange: '#ea580c',
  indigo: '#4f46e5',
  slate: '#64748b',
  toolChat: '#94a3b8',
  toolInterview: '#9a3412',
  tokenIn: '#93c5fd',
  tokenOut: '#1e40af',
} as const

const TOOL_LABELS: Record<string, string> = {
  general: 'Chat',
  language: 'Sprachen',
  jobanalyzer: 'Stellenanalyse',
  interviewprep: 'Interview',
  interview: 'Interview',
  programming: 'Code',
  weather: 'Wetter',
  jokes: 'Witze',
}

function fmt(value: number, type: 'usd' | 'tokens' | 'pct'): string {
  if (type === 'usd') {
    if (value === 0) return '$0'
    if (Math.abs(value) < 0.01) return `$${value.toFixed(4)}`
    if (Math.abs(value) < 1) return `$${value.toFixed(3)}`
    if (Math.abs(value) < 100) return `$${value.toFixed(2)}`
    return `$${Math.round(value).toLocaleString('en-US')}`
  }
  if (type === 'tokens') {
    if (value < 1000) return value.toString()
    if (value < 10000) return `${(value / 1000).toFixed(1)}K`
    if (value < 1_000_000) return `${Math.round(value / 1000)}K`
    return `${(value / 1_000_000).toFixed(1)}M`
  }
  if (type === 'pct') return `${Math.round(value)}%`
  return value.toString()
}

function toolLabel(key: string): string {
  return TOOL_LABELS[key] ?? key
}

function getToolBarColor(key: string): string {
  const k = key.toLowerCase()
  if (k === 'general') return C.toolChat
  if (k === 'language') return C.teal
  if (k === 'jobanalyzer') return C.orange
  if (k === 'interviewprep' || k === 'interview') return C.toolInterview
  if (k === 'programming') return C.indigo
  return C.slate
}

function getTopTool(summary: UserUsageSummary): string {
  if (summary.topTool) return toolLabel(summary.topTool)
  const by = summary.byTool ?? {}
  const entries = Object.entries(by)
  if (entries.length === 0) return '—'
  const top = entries.reduce((a, b) => (b[1].costUsd > a[1].costUsd ? b : a))
  return toolLabel(top[0])
}

function modelSliceColor(name: string, index: number): string {
  const n = name.toLowerCase()
  if (n.includes('haiku')) return C.teal
  if (n.includes('sonnet')) return C.indigo
  return index % 2 === 0 ? C.teal : C.indigo
}

function shortModelLabel(name: string): string {
  if (name.toLowerCase().includes('haiku')) return 'Haiku 4.5'
  if (name.toLowerCase().includes('sonnet')) return 'Sonnet 4'
  return name.length > 18 ? `${name.slice(0, 16)}…` : name
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function truncateEmail(email: string, max = 20): string {
  const t = email.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

function planBadgeClass(plan: string): string {
  const p = (plan || '').toLowerCase()
  if (p === 'pro') return 'bg-[#fef3c7] text-[#92400e]'
  if (p === 'premium') return 'bg-[#e0e7ff] text-[#3730a3]'
  return 'bg-[#f1f5f9] text-[#475569]'
}

function planDisplayLabel(plan: string): string {
  const p = (plan || 'free').toLowerCase()
  if (p === 'premium') return 'Starter'
  if (p === 'pro') return 'Pro'
  return 'Free'
}

function MetricSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-50 p-4 ${tall ? 'min-h-[132px]' : 'min-h-[88px]'}`}
    >
      <div className="mb-2 h-3 w-24 rounded bg-slate-200/80" />
      <div className="h-8 w-36 rounded bg-slate-200/80" />
    </div>
  )
}

function ChartSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4 ${tall ? 'min-h-[320px]' : 'min-h-[280px]'}`}
    >
      <div className="h-[240px] rounded bg-slate-100/80" />
    </div>
  )
}

export default function AdminDashboardPage() {
  const { getToken } = useAuth()
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserUsageSummary | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [costSortDesc, setCostSortDesc] = useState(true)

  const fixedMonthlyCosts = useMemo(() => {
    const raw = import.meta.env.VITE_ADMIN_FIXED_COSTS_USD_MONTHLY
    const n = raw != null && raw !== '' ? Number(raw) : 0
    return Number.isFinite(n) ? n : 0
  }, [])

  const monthlyBudget = useMemo(() => {
    const raw = import.meta.env.VITE_ADMIN_MONTHLY_BUDGET
    const n = raw != null && raw !== '' ? Number(raw) : 50
    return Number.isFinite(n) && n > 0 ? n : 50
  }, [])

  const load = useCallback(async (isInitial: boolean) => {
    try {
      if (isInitial) setInitialLoad(true)
      else setRefreshing(true)
      setError(null)
      setForbidden(false)
      const token = await getToken()
      if (!token) {
        setError('Nicht angemeldet.')
        return
      }
      const dash = await fetchDashboard(token)
      setData(dash)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unbekannter Fehler'
      if (msg.includes('Not authorized') || msg.includes('403')) {
        setForbidden(true)
      } else {
        setError(msg)
      }
    } finally {
      setInitialLoad(false)
      setRefreshing(false)
    }
  }, [getToken])

  useEffect(() => {
    void load(true)
  }, [load])

  useEffect(() => {
    const id = window.setInterval(() => {
      void load(false)
    }, 60_000)
    return () => window.clearInterval(id)
  }, [load])

  const openUserDetail = async (userId: string) => {
    setDetailError(null)
    setDetailLoading(true)
    setSelectedUser(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Kein Token')
      const from = isoDateDaysAgo(29)
      const to = todayIso()
      const summary = await fetchUserUsage(token, userId, from, to)
      setSelectedUser(summary)
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : 'Laden fehlgeschlagen')
    } finally {
      setDetailLoading(false)
    }
  }

  const lineData = useMemo(() => {
    if (!data?.last30Days?.length) return []
    return data.last30Days.map(d => ({
      ...d,
      label: d.date.slice(5),
    }))
  }, [data])

  const yesterdayCompare = useMemo(() => {
    if (lineData.length < 2) return null
    const today = lineData[lineData.length - 1]
    const yest = lineData[lineData.length - 2]
    const delta = yest.costUsd > 0 ? ((today.costUsd - yest.costUsd) / yest.costUsd) * 100 : today.costUsd > 0 ? 100 : 0
    return { yesterdayCost: yest.costUsd, deltaPct: delta }
  }, [lineData])

  const pieModelData = useMemo(() => {
    if (!data?.byModel) return []
    const totalCost = Object.values(data.byModel).reduce((s, m) => s + m.costUsd, 0)
    return Object.entries(data.byModel)
      .map(([name, m]) => ({
        name,
        value: m.costUsd,
        messages: m.messages,
        pct: totalCost > 0 ? (m.costUsd / totalCost) * 100 : 0,
      }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data])

  const toolBarData = useMemo(() => {
    if (!data?.byTool) return []
    return Object.entries(data.byTool)
      .map(([key, t]) => ({
        name: toolLabel(key),
        key,
        costUsd: t.costUsd,
      }))
      .sort((a, b) => b.costUsd - a.costUsd)
  }, [data])

  const modelTokenBars = useMemo(() => {
    if (!data?.byModel) return []
    return Object.entries(data.byModel).map(([model, m]) => ({
      model: model.length > 22 ? `${model.slice(0, 20)}…` : model,
      fullModel: model,
      input: m.inputTokens,
      output: m.outputTokens,
    }))
  }, [data])

  const sortedTopUsers = useMemo(() => {
    if (!data?.topUsers) return []
    return [...data.topUsers].sort((a, b) =>
      costSortDesc ? b.totalCostUsd - a.totalCostUsd : a.totalCostUsd - b.totalCostUsd,
    )
  }, [data, costSortDesc])

  const totalTopCostToday = useMemo(
    () => sortedTopUsers.reduce((s, u) => s + u.totalCostUsd, 0),
    [sortedTopUsers],
  )

  const payingSubtitle = useMemo(() => {
    if (!data?.topUsers?.length) return '—'
    let starter = 0
    let pro = 0
    for (const u of data.topUsers) {
      const p = (u.plan || '').toLowerCase()
      if (p === 'premium') starter += 1
      else if (p === 'pro') pro += 1
    }
    return `${starter} Starter + ${pro} Pro`
  }, [data])

  const estimatedMonthlyProfit = useMemo(() => {
    if (!data) return 0
    return data.monthlyRevenue - data.totalCostThisMonth - fixedMonthlyCosts
  }, [data, fixedMonthlyCosts])

  const avgCostPerMsg = useMemo(() => {
    if (!data || data.totalMessagesToday <= 0) return 0
    return data.totalCostToday / data.totalMessagesToday
  }, [data])

  const monthSpendPct = useMemo(() => {
    if (!data) return 0
    return Math.min(100, (data.totalCostThisMonth / monthlyBudget) * 100)
  }, [data, monthlyBudget])

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <ShieldAlert className="mb-4 text-[#ea580c]" size={48} />
        <h1 className="mb-2 text-xl font-semibold text-slate-800">Kein Zugriff</h1>
        <p className="mb-6 max-w-md text-center text-sm text-slate-600">
          Du bist nicht als Administrator eingetragen. Der Endpunkt hat mit 403 geantwortet.
        </p>
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <ArrowLeft size={16} />
          Zurück zum Chat
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
              aria-label="Zurück"
            >
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">Admin dashboard</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-[#64748b]">
              <span className="h-2 w-2 rounded-full bg-[#0d9488]" aria-hidden />
              Live
            </span>
            {refreshing && (
              <span className="flex items-center gap-1 text-xs text-[#64748b]">
                <Loader2 size={14} className="animate-spin" />
                Aktualisiere…
              </span>
            )}
            <button
              type="button"
              onClick={() => void load(false)}
              disabled={refreshing || initialLoad}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Jetzt
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        {error && (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#ea580c]">
            {error}
          </div>
        )}

        {/* Hero + small metrics */}
        {initialLoad ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <MetricSkeleton key={i} tall />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <MetricSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : data ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-[#64748b]">API-Kosten heute</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums leading-tight text-[#ea580c]">
                  {fmt(data.totalCostToday, 'usd')}
                </p>
                {yesterdayCompare ? (
                  <p className="mt-2 text-[11px] text-[#64748b]">
                    Gestern: {fmt(yesterdayCompare.yesterdayCost, 'usd')}
                    <span className={yesterdayCompare.deltaPct >= 0 ? ' text-[#ea580c]' : ' text-[#0d9488]'}>
                      {' '}
                      ({yesterdayCompare.deltaPct >= 0 ? '+' : ''}
                      {fmt(yesterdayCompare.deltaPct, 'pct')} vs. Gestern)
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-[#64748b]">Kein Vortagesvergleich</p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-[#64748b]">API-Kosten Monat</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums leading-tight text-[#ea580c]">
                  {fmt(data.totalCostThisMonth, 'usd')}
                </p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/80">
                  <div
                    className="h-full rounded-full bg-[#ea580c] transition-all duration-300"
                    style={{ width: `${monthSpendPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-[#64748b]">
                  Budget {fmt(monthlyBudget, 'usd')} · {fmt(monthSpendPct, 'pct')} verbraucht
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-[#64748b]">Geschätzter Gewinn</p>
                <p
                  className={`mt-1 text-[26px] font-bold tabular-nums leading-tight ${
                    estimatedMonthlyProfit >= 0 ? 'text-[#0d9488]' : 'text-[#ea580c]'
                  }`}
                >
                  {fmt(estimatedMonthlyProfit, 'usd')}
                </p>
                <p className="mt-2 text-[11px] leading-snug text-[#64748b]">
                  Umsatz {fmt(data.monthlyRevenue, 'usd')} − API {fmt(data.totalCostThisMonth, 'usd')} − Fix{' '}
                  {fmt(fixedMonthlyCosts, 'usd')} = {fmt(estimatedMonthlyProfit, 'usd')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-[#64748b]">Nachrichten heute</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[#4f46e5]">
                  {data.totalMessagesToday.toLocaleString('de-DE')}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-[#64748b]">Aktive User heute</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[#4f46e5]">
                  {data.activeUsersToday.toLocaleString('de-DE')}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-[#64748b]">Zahlende User</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[#4f46e5]">
                  {data.payingUsers.toLocaleString('de-DE')}
                </p>
                <p className="mt-0.5 text-[11px] text-[#64748b]">{payingSubtitle}</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs text-[#64748b]">Ø Kosten/Nachricht</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[#ea580c]">
                  {fmt(avgCostPerMsg, 'usd')}
                </p>
                <p className="mt-0.5 text-[11px] text-[#64748b]">Ziel: unter $0.01</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Charts row 1 */}
        {initialLoad ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartSkeleton tall />
            <ChartSkeleton tall />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-1 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.orange} stopOpacity={0.12} />
                        <stop offset="100%" stopColor={C.orange} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: C.slate }}
                      stroke="#cbd5e1"
                      interval={0}
                      tickFormatter={(value, index) => (index % 5 === 0 ? value : '')}
                    />
                    <YAxis
                      yAxisId="cost"
                      tick={{ fontSize: 10, fill: C.orange }}
                      stroke={C.orange}
                      tickFormatter={v => fmt(Number(v), 'usd')}
                      width={56}
                    />
                    <YAxis
                      yAxisId="msg"
                      orientation="right"
                      tick={{ fontSize: 10, fill: C.indigo }}
                      stroke={C.indigo}
                      tickFormatter={v => Math.round(Number(v)).toLocaleString('de-DE')}
                      width={40}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const row = payload[0]?.payload as { costUsd?: number; messages?: number; date?: string }
                        return (
                          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
                            <p className="mb-1 font-medium text-slate-700">{row.date ?? label}</p>
                            <p className="text-[#ea580c]">Kosten: {fmt(row.costUsd ?? 0, 'usd')}</p>
                            <p className="text-[#4f46e5]">
                              Nachrichten: {(row.messages ?? 0).toLocaleString('de-DE')}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Area
                      yAxisId="cost"
                      type="monotone"
                      dataKey="costUsd"
                      stroke="none"
                      fill="url(#costFill)"
                      fillOpacity={1}
                    />
                    <Line
                      yAxisId="cost"
                      type="monotone"
                      dataKey="costUsd"
                      name="Kosten"
                      stroke={C.orange}
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      yAxisId="msg"
                      type="monotone"
                      dataKey="messages"
                      name="Nachrichten"
                      stroke={C.indigo}
                      strokeDasharray="4 4"
                      dot={false}
                      strokeWidth={2}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              {pieModelData.length === 0 ? (
                <p className="flex h-[300px] items-center justify-center text-sm text-[#64748b]">Noch keine Daten</p>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-6 lg:flex-nowrap lg:justify-start">
                  <div className="h-[140px] w-[140px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieModelData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={70}
                          paddingAngle={2}
                          stroke="none"
                        >
                          {pieModelData.map((entry, i) => (
                            <Cell key={entry.name} fill={modelSliceColor(entry.name, i)} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => fmt(typeof v === 'number' ? v : Number(v) || 0, 'usd')} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="min-w-0 flex-1 space-y-4 text-sm">
                    {pieModelData.map((entry, i) => (
                      <li key={entry.name} className="flex gap-3">
                        <span
                          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: modelSliceColor(entry.name, i) }}
                        />
                        <div>
                          <p className="font-medium text-slate-800">{shortModelLabel(entry.name)}</p>
                          <p className="text-lg font-semibold tabular-nums text-[#ea580c]">
                            {fmt(entry.value, 'usd')}
                          </p>
                          <p className="text-xs text-[#64748b]">
                            {entry.messages.toLocaleString('de-DE')} Msgs ({fmt(entry.pct, 'pct')})
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Charts row 2 */}
        {initialLoad ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
        ) : data ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-[280px] w-full">
                {toolBarData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-[#64748b]">Noch keine Daten</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={toolBarData} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: C.slate }} tickFormatter={v => fmt(Number(v), 'usd')} />
                      <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 11, fill: C.slate }} />
                      <Tooltip formatter={v => fmt(typeof v === 'number' ? v : Number(v) || 0, 'usd')} />
                      <Bar dataKey="costUsd" radius={[0, 4, 4, 0]} barSize={22}>
                        {toolBarData.map(row => (
                          <Cell key={row.key} fill={getToolBarColor(row.key)} />
                        ))}
                        <LabelList
                          dataKey="costUsd"
                          position="right"
                          fill="#475569"
                          fontSize={11}
                          formatter={(v: unknown) => fmt(Number(v), 'usd')}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="h-[280px] w-full">
                {modelTokenBars.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-[#64748b]">Noch keine Daten</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={modelTokenBars}
                      margin={{ bottom: 48, left: 4, right: 8, top: 8 }}
                      barSize={modelTokenBars.length <= 2 ? 40 : undefined}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="model" tick={{ fontSize: 10, fill: C.slate }} angle={-24} textAnchor="end" height={52} interval={0} />
                      <YAxis tick={{ fontSize: 10, fill: C.slate }} tickFormatter={v => fmt(Number(v), 'tokens')} width={44} />
                      <Tooltip
                        formatter={(value, name) => [fmt(Number(value), 'tokens'), String(name)]}
                      />
                      <Bar dataKey="input" name="Input" fill={C.tokenIn} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="output" name="Output" fill={C.tokenOut} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Top users */}
        {initialLoad ? (
          <div className="animate-pulse rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="h-40 rounded bg-slate-100/80" />
          </div>
        ) : data ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs font-semibold text-[#64748b]">
                  <tr>
                    <th className="px-4 py-3">Nutzer</th>
                    <th className="px-4 py-3">Plan</th>
                    <th className="px-4 py-3 text-right">Nachrichten</th>
                    <th className="px-4 py-3 text-right">Tokens</th>
                    <th className="px-4 py-3">Anteil</th>
                    <th className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setCostSortDesc(d => !d)}
                        className="font-semibold text-[#64748b] hover:text-[#4f46e5]"
                      >
                        Kosten {costSortDesc ? '↓' : '↑'}
                      </button>
                    </th>
                    <th className="px-4 py-3">Top-Tool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {sortedTopUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[#64748b]">
                        Keine Nutzer aktiv heute
                      </td>
                    </tr>
                  ) : (
                    sortedTopUsers.map(u => {
                      const denom = data.totalCostToday > 0 ? data.totalCostToday : totalTopCostToday
                      const sharePct = denom > 0 ? (u.totalCostUsd / denom) * 100 : 0
                      const tokensSum = u.totalInputTokens + u.totalOutputTokens
                      const display = u.userEmail?.trim() ? truncateEmail(u.userEmail) : u.userId
                      return (
                        <tr
                          key={u.userId}
                          className="cursor-pointer transition-colors hover:bg-white/80"
                          onClick={() => void openUserDetail(u.userId)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-800">{display}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${planBadgeClass(u.plan)}`}
                            >
                              {planDisplayLabel(u.plan)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                            {u.totalMessages.toLocaleString('de-DE')}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-800">
                            {fmt(tokensSum, 'tokens')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-1.5 w-[60px] overflow-hidden rounded-full bg-slate-200/90">
                              <div
                                className="h-full rounded-full bg-[#ea580c]"
                                style={{ width: `${Math.min(100, sharePct)}%` }}
                              />
                            </div>
                            <span className="sr-only">{fmt(sharePct, 'pct')} Anteil</span>
                          </td>
                          <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-[#ea580c]">
                            {fmt(u.totalCostUsd, 'usd')}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{getTopTool(u)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-200 px-4 py-2 text-[11px] text-[#64748b]">
              Zeile anklicken: Detail (letzte 30 Tage) · Aktualisierung alle 60s
            </p>
          </div>
        ) : null}
      </main>

      {(selectedUser || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Nutzungsdetails</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null)
                  setDetailError(null)
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-4 text-sm">
              {detailLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                  <Loader2 className="animate-spin" size={20} />
                  Lade…
                </div>
              )}
              {detailError && <p className="text-[#ea580c]">{detailError}</p>}
              {selectedUser && !detailLoading && (
                <>
                  <p className="text-xs text-[#64748b]">Zeitraum: letzte 30 Tage</p>
                  <p className="font-mono text-xs text-slate-700">{selectedUser.userId}</p>
                  {selectedUser.userEmail?.trim() ? (
                    <p className="text-slate-800">{selectedUser.userEmail}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <span className="text-[#64748b]">Nachrichten</span>
                      <p className="font-semibold tabular-nums">{selectedUser.totalMessages.toLocaleString('de-DE')}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <span className="text-[#64748b]">Kosten</span>
                      <p className="font-semibold tabular-nums text-[#ea580c]">
                        {fmt(selectedUser.totalCostUsd, 'usd')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <span className="text-[#64748b]">Input-Tokens</span>
                      <p className="font-semibold tabular-nums">{fmt(selectedUser.totalInputTokens, 'tokens')}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2">
                      <span className="text-[#64748b]">Output-Tokens</span>
                      <p className="font-semibold tabular-nums">{fmt(selectedUser.totalOutputTokens, 'tokens')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-[#64748b]">Nach Modell</h4>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {Object.entries(selectedUser.byModel ?? {}).map(([k, m]) => (
                        <li key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                          <span className="truncate text-slate-700">{k}</span>
                          <span className="shrink-0 tabular-nums text-slate-600">{fmt(m.costUsd, 'usd')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-[#64748b]">Nach Werkzeug</h4>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {Object.entries(selectedUser.byTool ?? {}).map(([k, t]) => (
                        <li key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                          <span className="text-slate-700">{toolLabel(k)}</span>
                          <span className="shrink-0 tabular-nums text-slate-600">{fmt(t.costUsd, 'usd')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
