import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  X,
} from 'lucide-react'
import { ServerSyncControl } from '../components/ui/ServerSyncControl'
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
  fetchTopUsers,
  fetchUserUsage,
  type AdminDashboardData,
  type UserUsageSummary,
} from '../api/adminClient'

const C = {
  teal: '#0d9488',
  groq: '#059669',
  orange: '#ea580c',
  indigo: '#4f46e5',
  slate: '#64748b',
  toolChat: '#94a3b8',
  toolInterview: '#9a3412',
  tokenIn: '#93c5fd',
  tokenOut: '#1e40af',
} as const

/** Matches Redis token key retention (see SmartAssistApi TokenTrackingService). */
const USAGE_RETENTION_DAYS = 90

const chartGrid = '#334155'
const chartTick = '#94a3b8'

type TopUserRangePreset = 'retention' | '30d' | '7d' | 'today'

type PieModelRow = {
  name: string
  value: number
  messages: number
  pct: number
  metric: 'usd' | 'tokens'
}

const TOOL_LABELS: Record<string, string> = {
  general: 'Chat',
  language: 'Sprachen',
  jobanalyzer: 'Stellenanalyse',
  interviewprep: 'Interview',
  interview: 'Interview',
  programming: 'Code',
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
  if (entries.length === 0) return '-'
  const top = entries.reduce((a, b) => (b[1].costUsd > a[1].costUsd ? b : a))
  return toolLabel(top[0])
}

function modelSliceColor(name: string, index: number): string {
  const n = name.toLowerCase()
  if (n.startsWith('groq_') || n.startsWith('groq')) return C.groq
  if (n.includes('haiku')) return C.teal
  if (n.includes('sonnet')) return C.indigo
  return index % 2 === 0 ? C.teal : C.indigo
}

function shortModelLabel(name: string): string {
  const n = name.toLowerCase()
  if (n.startsWith('groq_')) return `Groq · ${name.slice(5)}`
  if (n.startsWith('groq')) return `Groq · ${name.slice(4)}`
  if (n.includes('haiku')) return 'Haiku 4.5'
  if (n.includes('sonnet')) return 'Sonnet 4'
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
  if (p === 'pro') return 'bg-amber-500/15 text-amber-200 ring-1 ring-amber-400/35'
  if (p === 'premium') return 'bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30'
  return 'bg-slate-600/40 text-slate-300 ring-1 ring-slate-500/35'
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
      className={`animate-pulse rounded-xl border border-slate-700/60 bg-slate-900/50 p-4 ${tall ? 'min-h-[132px]' : 'min-h-[88px]'}`}
    >
      <div className="mb-2 h-3 w-24 rounded bg-slate-700/80" />
      <div className="h-8 w-36 rounded bg-slate-700/80" />
    </div>
  )
}

function ChartSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-slate-700/60 bg-slate-900/40 p-4 ${tall ? 'min-h-[320px]' : 'min-h-[280px]'}`}
    >
      <div className="h-[240px] rounded bg-slate-800/60" />
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
  const [topUsersList, setTopUsersList] = useState<UserUsageSummary[]>([])
  const [topUsersLoading, setTopUsersLoading] = useState(false)
  const [topUsersError, setTopUsersError] = useState<string | null>(null)
  const [topRange, setTopRange] = useState<TopUserRangePreset>('retention')
  const [userSearch, setUserSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<'all' | 'free' | 'starter' | 'pro'>('all')
  const [detailRangeLabel, setDetailRangeLabel] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)

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

  const daysForPreset = useCallback((preset: TopUserRangePreset) => {
    switch (preset) {
      case 'retention':
        return USAGE_RETENTION_DAYS - 1
      case '30d':
        return 29
      case '7d':
        return 6
      case 'today':
        return 0
      default:
        return USAGE_RETENTION_DAYS - 1
    }
  }, [])

  const loadTopUsers = useCallback(async () => {
    try {
      setTopUsersError(null)
      const token = await getToken()
      if (!token) return
      setTopUsersLoading(true)
      const days = daysForPreset(topRange)
      const from = isoDateDaysAgo(days)
      const to = todayIso()
      const list = await fetchTopUsers(token, { from, to, limit: 250 })
      setTopUsersList(list)
      setLastSyncedAt(new Date().toISOString())
    } catch (e) {
      setTopUsersError(e instanceof Error ? e.message : 'Top-Nutzer konnten nicht geladen werden.')
    } finally {
      setTopUsersLoading(false)
    }
  }, [getToken, topRange, daysForPreset])

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
      setLastSyncedAt(new Date().toISOString())
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
    void loadTopUsers()
  }, [loadTopUsers])

  const openUserDetail = async (userId: string) => {
    setDetailError(null)
    setDetailLoading(true)
    setSelectedUser(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Kein Token')
      const days = daysForPreset(topRange)
      const from = isoDateDaysAgo(days)
      const to = todayIso()
      setDetailRangeLabel(`${from} → ${to}`)
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

  const pieModelData = useMemo((): PieModelRow[] => {
    if (!data?.byModel) return []
    const rows = Object.entries(data.byModel).map(([name, m]) => ({
      name,
      messages: m.messages,
      costUsd: m.costUsd,
      tokens: m.inputTokens + m.outputTokens,
    }))
    const withData = rows.filter(r => r.costUsd > 0 || r.tokens > 0)
    if (withData.length === 0) return []
    const anyUsd = withData.some(r => r.costUsd > 0)
    const total = anyUsd
      ? withData.reduce((s, r) => s + r.costUsd, 0)
      : withData.reduce((s, r) => s + r.tokens, 0) || 1
    return withData
      .map(r => {
        const value = anyUsd ? r.costUsd : r.tokens
        return {
          name: r.name,
          value,
          messages: r.messages,
          pct: total > 0 ? (value / total) * 100 : 0,
          metric: anyUsd ? ('usd' as const) : ('tokens' as const),
        }
      })
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
    return Object.entries(data.byModel).map(([model, m]) => {
      const label = shortModelLabel(model)
      return {
        model: label.length > 22 ? `${label.slice(0, 20)}…` : label,
        fullModel: model,
        input: m.inputTokens,
        output: m.outputTokens,
      }
    })
  }, [data])

  const sortedTopUsers = useMemo(
    () =>
      [...topUsersList].sort((a, b) =>
        costSortDesc ? b.totalCostUsd - a.totalCostUsd : a.totalCostUsd - b.totalCostUsd,
      ),
    [topUsersList, costSortDesc],
  )

  const filteredTopUsers = useMemo(() => {
    let rows = sortedTopUsers
    const q = userSearch.trim().toLowerCase()
    if (q) {
      rows = rows.filter(
        u =>
          u.userId.toLowerCase().includes(q) ||
          Boolean(u.userEmail?.trim() && u.userEmail.toLowerCase().includes(q)),
      )
    }
    if (planFilter === 'free') {
      rows = rows.filter(u => !(u.plan || '').trim() || (u.plan || '').toLowerCase() === 'free')
    } else if (planFilter === 'starter') {
      rows = rows.filter(u => (u.plan || '').toLowerCase() === 'premium')
    } else if (planFilter === 'pro') {
      rows = rows.filter(u => (u.plan || '').toLowerCase() === 'pro')
    }
    return rows
  }, [sortedTopUsers, userSearch, planFilter])

  const totalFilteredCost = useMemo(
    () => filteredTopUsers.reduce((s, u) => s + u.totalCostUsd, 0),
    [filteredTopUsers],
  )

  const payingSubtitle = useMemo(() => {
    if (!data?.topUsers?.length) return '-'
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

  const llmModelRows = useMemo(() => {
    if (!data?.byModel) return []
    return Object.entries(data.byModel)
      .map(([key, m]) => ({ key, m }))
      .sort((a, b) => {
        const pa = (a.m.provider ?? '').toLowerCase() === 'groq' ? 0 : 1
        const pb = (b.m.provider ?? '').toLowerCase() === 'groq' ? 0 : 1
        if (pa !== pb) return pa - pb
        return shortModelLabel(a.key).localeCompare(shortModelLabel(b.key), 'de')
      })
  }, [data])

  const monthSpendPct = useMemo(() => {
    if (!data) return 0
    return Math.min(100, (data.totalCostThisMonth / monthlyBudget) * 100)
  }, [data, monthlyBudget])

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-200">
        <ShieldAlert className="mb-4 text-orange-400" size={48} />
        <h1 className="mb-2 text-xl font-semibold text-slate-100">Kein Zugriff</h1>
        <p className="mb-6 max-w-md text-center text-sm text-slate-400">
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
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 text-slate-400 transition-colors hover:border-slate-500 hover:bg-slate-800 hover:text-slate-200"
              aria-label="Zurück"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-100">Admin dashboard</h1>
              <p className="text-[11px] text-slate-500">Kosten, Modelle, Nutzer – kompakte Übersicht</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-3">
            <p className="max-w-[220px] text-right text-[11px] leading-snug text-slate-500">
              Daten manuell synchronisieren - kein automatischer Hintergrund-Abruf.
            </p>
            <ServerSyncControl
              variant="dark"
              onSync={() => {
                void load(false)
                void loadTopUsers()
              }}
              syncing={refreshing || topUsersLoading}
              lastSyncedAt={lastSyncedAt}
              error={error ?? topUsersError}
              disabled={initialLoad}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        {error && (
          <div className="rounded-xl border border-orange-500/40 bg-orange-950/50 px-4 py-3 text-sm text-orange-200">
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
            {data.llmCostPolicyNote ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-3 text-sm leading-snug text-emerald-100/90">
                {data.llmCostPolicyNote}
              </div>
            ) : null}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-md shadow-black/20">
                <p className="text-xs font-medium text-slate-400">API-Kosten heute</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums leading-tight text-orange-400">
                  {fmt(data.totalCostToday, 'usd')}
                </p>
                {yesterdayCompare ? (
                  <p className="mt-2 text-[11px] text-slate-500">
                    Gestern: {fmt(yesterdayCompare.yesterdayCost, 'usd')}
                    <span className={yesterdayCompare.deltaPct >= 0 ? ' text-orange-400' : ' text-teal-400'}>
                      {' '}
                      ({yesterdayCompare.deltaPct >= 0 ? '+' : ''}
                      {fmt(yesterdayCompare.deltaPct, 'pct')} vs. Gestern)
                    </span>
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] text-slate-500">Kein Vortagesvergleich</p>
                )}
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-md shadow-black/20">
                <p className="text-xs font-medium text-slate-400">API-Kosten Monat</p>
                <p className="mt-1 text-[26px] font-bold tabular-nums leading-tight text-orange-400">
                  {fmt(data.totalCostThisMonth, 'usd')}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500 transition-all duration-300"
                    style={{ width: `${monthSpendPct}%` }}
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500">
                  Budget {fmt(monthlyBudget, 'usd')} · {fmt(monthSpendPct, 'pct')} verbraucht
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 shadow-md shadow-black/20">
                <p className="text-xs font-medium text-slate-400">Geschätzter Gewinn</p>
                <p
                  className={`mt-1 text-[26px] font-bold tabular-nums leading-tight ${
                    estimatedMonthlyProfit >= 0 ? 'text-teal-400' : 'text-orange-400'
                  }`}
                >
                  {fmt(estimatedMonthlyProfit, 'usd')}
                </p>
                <p className="mt-2 text-[11px] leading-snug text-slate-500">
                  Umsatz {fmt(data.monthlyRevenue, 'usd')} − API {fmt(data.totalCostThisMonth, 'usd')} − Fix{' '}
                  {fmt(fixedMonthlyCosts, 'usd')} = {fmt(estimatedMonthlyProfit, 'usd')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-500">Nachrichten heute</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-indigo-300">
                  {data.totalMessagesToday.toLocaleString('de-DE')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-500">Aktive User heute</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-indigo-300">
                  {data.activeUsersToday.toLocaleString('de-DE')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-500">Zahlende User</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-indigo-300">
                  {data.payingUsers.toLocaleString('de-DE')}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">{payingSubtitle}</p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-500">Ø Kosten/Nachricht</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-orange-400">
                  {fmt(avgCostPerMsg, 'usd')}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">Ziel: unter $0.01</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-500">Nachrichten heute (Groq primär)</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-400">
                  {(data.groqMessagesToday ?? 0).toLocaleString('de-DE')}
                </p>
              </div>
              <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3">
                <p className="text-xs text-slate-500">Nachrichten heute (Haiku / Fallback)</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-teal-400">
                  {(data.otherLlmMessagesToday ?? 0).toLocaleString('de-DE')}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 shadow-lg shadow-black/25">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                LLM-Endpunkte (konfiguriert · heute)
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="border-b border-slate-700 text-xs font-semibold text-slate-400">
                    <tr>
                      <th className="py-2 pr-3">Anbieter</th>
                      <th className="py-2 pr-3">Modell</th>
                      <th className="py-2 pr-3 text-right">Nachr.</th>
                      <th className="py-2 pr-3 text-right">Tokens</th>
                      <th className="py-2 text-right">Kosten (SmartAssist)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60">
                    {llmModelRows.map(({ key, m }) => {
                      const tok = m.inputTokens + m.outputTokens
                      const prov = (m.provider ?? '').toLowerCase() === 'groq' ? 'Groq' : 'Anthropic'
                      return (
                        <tr key={key} className="text-slate-200">
                          <td className="py-2 pr-3">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${
                                prov === 'Groq'
                                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30'
                                  : 'bg-slate-600/40 text-slate-200 ring-1 ring-slate-500/35'
                              }`}
                            >
                              {prov}
                            </span>
                          </td>
                          <td className="max-w-[220px] truncate py-2 pr-3 font-mono text-xs" title={key}>
                            {shortModelLabel(key)}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums text-slate-300">
                            {m.messages.toLocaleString('de-DE')}
                          </td>
                          <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{fmt(tok, 'tokens')}</td>
                          <td className="py-2 text-right tabular-nums text-orange-400">{fmt(m.costUsd, 'usd')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
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
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 shadow-lg shadow-black/20">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Trend (30 Tage)</h3>
                <span className="text-[10px] text-slate-500">Kosten + Nachrichten</span>
              </div>
              <div className="mb-1 h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                    <defs>
                      <linearGradient id="costFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.orange} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={C.orange} stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} opacity={0.6} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: chartTick }}
                      stroke={chartGrid}
                      interval={0}
                      tickFormatter={(value, index) => (index % 5 === 0 ? value : '')}
                    />
                    <YAxis
                      yAxisId="cost"
                      tick={{ fontSize: 10, fill: '#fb923c' }}
                      stroke="#9a3412"
                      tickFormatter={v => fmt(Number(v), 'usd')}
                      width={56}
                    />
                    <YAxis
                      yAxisId="msg"
                      orientation="right"
                      tick={{ fontSize: 10, fill: '#a5b4fc' }}
                      stroke="#4f46e5"
                      tickFormatter={v => Math.round(Number(v)).toLocaleString('de-DE')}
                      width={40}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null
                        const row = payload[0]?.payload as { costUsd?: number; messages?: number; date?: string }
                        return (
                          <div className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs shadow-xl shadow-black/40">
                            <p className="mb-1 font-medium text-slate-200">{row.date ?? label}</p>
                            <p className="text-orange-400">Kosten: {fmt(row.costUsd ?? 0, 'usd')}</p>
                            <p className="text-indigo-300">
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
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 shadow-lg shadow-black/20">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Modell-Mix (heute)</h3>
                <span className="text-[10px] text-slate-500">Kosten oder Tokens</span>
              </div>
              {pieModelData.length === 0 ? (
                <p className="flex h-[300px] items-center justify-center text-sm text-slate-500">Noch keine Daten</p>
              ) : (
                <div className="flex flex-wrap items-center justify-center gap-6 lg:flex-nowrap lg:justify-start">
                  <div className="h-[160px] w-[160px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieModelData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={48}
                          outerRadius={72}
                          paddingAngle={2}
                          stroke="rgba(15,23,42,0.9)"
                          strokeWidth={2}
                        >
                          {pieModelData.map((entry, i) => (
                            <Cell key={entry.name} fill={modelSliceColor(entry.name, i)} />
                          ))}
                        </Pie>
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const row = payload[0]?.payload as PieModelRow
                            const v = row?.value ?? 0
                            return (
                              <div className="rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-xs shadow-xl shadow-black/40">
                                <p className="font-medium text-slate-100">{shortModelLabel(row.name)}</p>
                                <p className="text-slate-300">
                                  {row.metric === 'usd' ? fmt(v, 'usd') : fmt(v, 'tokens')}
                                </p>
                              </div>
                            )
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="min-w-0 flex-1 space-y-3 text-sm">
                    {pieModelData.map((entry, i) => (
                      <li key={entry.name} className="flex gap-3 rounded-lg border border-slate-700/40 bg-slate-950/40 px-2 py-2">
                        <span
                          className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ring-2 ring-slate-700"
                          style={{ backgroundColor: modelSliceColor(entry.name, i) }}
                        />
                        <div>
                          <p className="font-medium text-slate-200">{shortModelLabel(entry.name)}</p>
                          <p className="text-lg font-semibold tabular-nums text-orange-400">
                            {entry.metric === 'usd' ? fmt(entry.value, 'usd') : fmt(entry.value, 'tokens')}
                          </p>
                          <p className="text-xs text-slate-500">
                            {entry.messages.toLocaleString('de-DE')} Nachr. · {fmt(entry.pct, 'pct')}{' '}
                            {entry.metric === 'usd' ? '(Kosten)' : '(Tokens)'}
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
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 shadow-lg shadow-black/20">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kosten nach Werkzeug</h3>
                <span className="text-[10px] text-slate-500">Heute · USD</span>
              </div>
              <div className="h-[280px] w-full">
                {toolBarData.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">Noch keine Daten</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={toolBarData} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} opacity={0.6} horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: chartTick }}
                        stroke={chartGrid}
                        tickFormatter={v => fmt(Number(v), 'usd')}
                      />
                      <YAxis type="category" dataKey="name" width={108} tick={{ fontSize: 11, fill: chartTick }} stroke={chartGrid} />
                      <Tooltip
                        cursor={{ fill: 'rgba(148,163,184,0.08)' }}
                        formatter={v => fmt(typeof v === 'number' ? v : Number(v) || 0, 'usd')}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#e2e8f0',
                        }}
                      />
                      <Bar dataKey="costUsd" radius={[0, 6, 6, 0]} barSize={24}>
                        {toolBarData.map(row => (
                          <Cell key={row.key} fill={getToolBarColor(row.key)} />
                        ))}
                        <LabelList
                          dataKey="costUsd"
                          position="right"
                          fill="#cbd5e1"
                          fontSize={11}
                          formatter={(v: unknown) => fmt(Number(v), 'usd')}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-700/70 bg-slate-900/50 p-4 shadow-lg shadow-black/20">
              <div className="mb-2 flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Tokens nach Modell</h3>
                <span className="text-[10px] text-slate-500">Input vs. Output</span>
              </div>
              <div className="h-[280px] w-full">
                {modelTokenBars.length === 0 ? (
                  <p className="flex h-full items-center justify-center text-sm text-slate-500">Noch keine Daten</p>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={modelTokenBars}
                      margin={{ bottom: 48, left: 4, right: 8, top: 8 }}
                      barSize={modelTokenBars.length <= 2 ? 40 : undefined}
                    >
                      <CartesianGrid strokeDasharray="3 6" stroke={chartGrid} opacity={0.6} />
                      <XAxis
                        dataKey="model"
                        tick={{ fontSize: 10, fill: chartTick }}
                        stroke={chartGrid}
                        angle={-24}
                        textAnchor="end"
                        height={52}
                        interval={0}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: chartTick }}
                        stroke={chartGrid}
                        tickFormatter={v => fmt(Number(v), 'tokens')}
                        width={44}
                      />
                      <Tooltip
                        formatter={(value, name) => [fmt(Number(value), 'tokens'), String(name)]}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: '1px solid #475569',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#e2e8f0',
                        }}
                      />
                      <Bar dataKey="input" name="Input" fill="#7dd3fc" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="output" name="Output" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* Top users */}
        {initialLoad ? (
          <div className="animate-pulse rounded-xl border border-slate-700/60 bg-slate-900/40 p-4">
            <div className="h-40 rounded bg-slate-800/60" />
          </div>
        ) : data ? (
          <div className="overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/50 shadow-lg shadow-black/30">
            <div className="flex flex-col gap-3 border-b border-slate-700/60 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top-Nutzer</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Aggregiert nach Zeitraum (Redis max. {USAGE_RETENTION_DAYS} Tage). Anteil relativ zur gefilterten Liste.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="sr-only" htmlFor="admin-top-range">
                  Zeitraum
                </label>
                <select
                  id="admin-top-range"
                  value={topRange}
                  onChange={e => setTopRange(e.target.value as TopUserRangePreset)}
                  className="rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="retention">Gesamt ({USAGE_RETENTION_DAYS} Tage)</option>
                  <option value="30d">Letzte 30 Tage</option>
                  <option value="7d">Letzte 7 Tage</option>
                  <option value="today">Heute</option>
                </select>
                <label className="sr-only" htmlFor="admin-plan-filter">
                  Plan
                </label>
                <select
                  id="admin-plan-filter"
                  value={planFilter}
                  onChange={e => setPlanFilter(e.target.value as typeof planFilter)}
                  className="rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1.5 text-xs font-medium text-slate-200 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="all">Alle Pläne</option>
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                </select>
                <input
                  type="search"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Suche ID / E-Mail…"
                  className="min-w-[10rem] flex-1 rounded-lg border border-slate-600 bg-slate-950 px-2.5 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:max-w-[220px]"
                />
                {topUsersLoading ? (
                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Loader2 size={12} className="animate-spin" />
                    Nutzer…
                  </span>
                ) : null}
              </div>
            </div>
            {topUsersError ? (
              <p className="border-b border-amber-500/30 bg-amber-950/40 px-4 py-2 text-xs text-amber-200">{topUsersError}</p>
            ) : null}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="border-b border-slate-700/80 text-xs font-semibold text-slate-400">
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
                        className="font-semibold text-slate-400 hover:text-teal-300"
                      >
                        Kosten {costSortDesc ? '↓' : '↑'}
                      </button>
                    </th>
                    <th className="px-4 py-3">Top-Tool</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredTopUsers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                        {topUsersList.length === 0 && !topUsersLoading
                          ? 'Keine Nutzungsdaten im gewählten Zeitraum.'
                          : 'Keine Treffer für die aktuellen Filter.'}
                      </td>
                    </tr>
                  ) : (
                    filteredTopUsers.map(u => {
                      const denom = totalFilteredCost > 0 ? totalFilteredCost : 0
                      const sharePct = denom > 0 ? (u.totalCostUsd / denom) * 100 : 0
                      const tokensSum = u.totalInputTokens + u.totalOutputTokens
                      const display = u.userEmail?.trim() ? truncateEmail(u.userEmail) : u.userId
                      return (
                        <tr
                          key={u.userId}
                          className="cursor-pointer transition-colors hover:bg-slate-800/70"
                          onClick={() => void openUserDetail(u.userId)}
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-200">{display}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-xs font-medium ${planBadgeClass(u.plan)}`}
                            >
                              {planDisplayLabel(u.plan)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                            {u.totalMessages.toLocaleString('de-DE')}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-slate-200">
                            {fmt(tokensSum, 'tokens')}
                          </td>
                          <td className="px-4 py-3">
                            <div className="h-1.5 w-[72px] overflow-hidden rounded-full bg-slate-700">
                              <div
                                className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-500"
                                style={{ width: `${Math.min(100, sharePct)}%` }}
                              />
                            </div>
                            <span className="mt-0.5 block text-[10px] tabular-nums text-slate-500">
                              {fmt(sharePct, 'pct')}
                            </span>
                            <span className="sr-only">{fmt(sharePct, 'pct')} Anteil</span>
                          </td>
                          <td className="px-4 py-3 text-right text-base font-bold tabular-nums text-orange-400">
                            {fmt(u.totalCostUsd, 'usd')}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{getTopTool(u)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-700/60 px-4 py-2 text-[11px] text-slate-500">
              Zeile anklicken: Nutzungsdetails (gleicher Zeitraum wie oben) · Dashboard &amp; Tabelle alle 60s
            </p>
          </div>
        ) : null}
      </main>

      {(selectedUser || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-100">Nutzungsdetails</h3>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null)
                  setDetailError(null)
                }}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4 p-4 text-sm text-slate-200">
              {detailLoading && (
                <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
                  <Loader2 className="animate-spin" size={20} />
                  Lade…
                </div>
              )}
              {detailError && <p className="text-orange-400">{detailError}</p>}
              {selectedUser && !detailLoading && (
                <>
                  <p className="text-xs text-slate-500">
                    Zeitraum: {detailRangeLabel || '-'} (wie Tabellen-Filter)
                  </p>
                  <p className="font-mono text-xs text-slate-300">{selectedUser.userId}</p>
                  {selectedUser.userEmail?.trim() ? (
                    <p className="text-slate-200">{selectedUser.userEmail}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-2">
                      <span className="text-slate-500">Nachrichten</span>
                      <p className="font-semibold tabular-nums text-slate-100">
                        {selectedUser.totalMessages.toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-2">
                      <span className="text-slate-500">Kosten</span>
                      <p className="font-semibold tabular-nums text-orange-400">
                        {fmt(selectedUser.totalCostUsd, 'usd')}
                      </p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-2">
                      <span className="text-slate-500">Input-Tokens</span>
                      <p className="font-semibold tabular-nums">{fmt(selectedUser.totalInputTokens, 'tokens')}</p>
                    </div>
                    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-2">
                      <span className="text-slate-500">Output-Tokens</span>
                      <p className="font-semibold tabular-nums">{fmt(selectedUser.totalOutputTokens, 'tokens')}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-slate-500">Nach Modell</h4>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {Object.entries(selectedUser.byModel ?? {}).map(([k, m]) => (
                        <li key={k} className="flex justify-between gap-2 border-b border-slate-700/60 py-1">
                          <span className="min-w-0 truncate text-slate-300" title={k}>
                            <span
                              className={`mr-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                (m.provider ?? '').toLowerCase() === 'groq'
                                  ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25'
                                  : 'bg-slate-600/40 text-slate-200 ring-1 ring-slate-500/35'
                              }`}
                            >
                              {(m.provider ?? '').toLowerCase() === 'groq' ? 'Groq' : 'Anthropic'}
                            </span>
                            {shortModelLabel(k)}
                          </span>
                          <span className="shrink-0 tabular-nums text-slate-400">{fmt(m.costUsd, 'usd')}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-medium text-slate-500">Nach Werkzeug</h4>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {Object.entries(selectedUser.byTool ?? {}).map(([k, t]) => (
                        <li key={k} className="flex justify-between gap-2 border-b border-slate-700/60 py-1">
                          <span className="text-slate-300">{toolLabel(k)}</span>
                          <span className="shrink-0 tabular-nums text-slate-400">{fmt(t.costUsd, 'usd')}</span>
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
