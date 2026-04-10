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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
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

const TOOL_LABELS: Record<string, string> = {
  general: 'Allgemeiner Chat',
  language: 'Sprachen',
  jobanalyzer: 'Stellenanalyse',
  interviewprep: 'Interview',
  interview: 'Interview',
  programming: 'Code',
  weather: 'Wetter',
  jokes: 'Witze',
}

const PIE_COLORS = ['#7C3AED', '#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#94a3b8']

function formatUsd(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 4 }).format(n)
}

function formatUsdShort(n: number): string {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n)
}

function formatInt(n: number): string {
  return new Intl.NumberFormat('de-DE').format(n)
}

function toolLabel(key: string): string {
  return TOOL_LABELS[key] ?? key
}

function getTopTool(summary: UserUsageSummary): string {
  if (summary.topTool) return toolLabel(summary.topTool)
  const by = summary.byTool ?? {}
  const entries = Object.entries(by)
  if (entries.length === 0) return '—'
  const top = entries.reduce((a, b) => (b[1].costUsd > a[1].costUsd ? b : a))
  return toolLabel(top[0])
}

function isoDateDaysAgo(days: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString().slice(0, 10)
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function MetricSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 h-3 w-24 rounded bg-slate-200" />
      <div className="h-8 w-32 rounded bg-slate-200" />
    </div>
  )
}

function ChartSkeleton({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`animate-pulse rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${tall ? 'min-h-[320px]' : 'min-h-[280px]'}`}
    >
      <div className="mb-3 h-4 w-40 rounded bg-slate-200" />
      <div className="h-[240px] rounded bg-slate-100" />
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

  const pieModelData = useMemo(() => {
    if (!data?.byModel) return []
    return Object.entries(data.byModel)
      .map(([name, m]) => ({ name, value: m.costUsd }))
      .filter(x => x.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [data])

  const toolBarData = useMemo(() => {
    if (!data?.byTool) return []
    return Object.entries(data.byTool).map(([key, t]) => ({
      name: toolLabel(key),
      key,
      costUsd: t.costUsd,
    })).sort((a, b) => b.costUsd - a.costUsd)
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

  const estimatedMonthlyProfit = useMemo(() => {
    if (!data) return 0
    return data.monthlyRevenue - data.totalCostThisMonth - fixedMonthlyCosts
  }, [data, fixedMonthlyCosts])

  if (forbidden) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
        <ShieldAlert className="mb-4 text-amber-500" size={48} />
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
            <div>
              <h1 className="text-lg font-bold text-slate-900">Admin-Dashboard</h1>
              <p className="text-xs text-slate-500">Token- &amp; Kostenübersicht · Aktualisierung alle 60s</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {refreshing && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Loader2 size={14} className="animate-spin" />
                Aktualisiere…
              </span>
            )}
            <button
              type="button"
              onClick={() => void load(false)}
              disabled={refreshing || initialLoad}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Jetzt aktualisieren
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Metric cards */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Kennzahlen</h2>
          {initialLoad ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <MetricSkeleton key={i} />
              ))}
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <MetricCard title="API-Kosten heute" value={formatUsd(data.totalCostToday)} accent="text-violet-700" />
              <MetricCard title="API-Kosten Monat" value={formatUsd(data.totalCostThisMonth)} accent="text-violet-600" />
              <MetricCard title="Nachrichten heute" value={formatInt(data.totalMessagesToday)} accent="text-slate-800" />
              <MetricCard title="Aktive User heute" value={formatInt(data.activeUsersToday)} accent="text-sky-700" />
              <MetricCard title="Zahlende User" value={formatInt(data.payingUsers)} accent="text-emerald-700" />
              <MetricCard
                title="Geschätzter Monatsgewinn"
                subtitle={`Umsatz − API − Fix (${formatUsdShort(fixedMonthlyCosts)}/Monat)`}
                value={formatUsd(estimatedMonthlyProfit)}
                accent={estimatedMonthlyProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}
              />
            </div>
          ) : null}
        </section>

        {/* Charts row 1 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Verlauf &amp; Modelle</h2>
          {initialLoad ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartSkeleton tall />
              <ChartSkeleton tall />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Letzte 30 Tage</h3>
                <p className="mb-3 text-xs text-slate-500">Kosten (USD) und Nachrichten — zwei Y-Achsen</p>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis
                        yAxisId="cost"
                        tick={{ fontSize: 11 }}
                        stroke="#7c3aed"
                        tickFormatter={v => `$${v}`}
                      />
                      <YAxis
                        yAxisId="msg"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        stroke="#0ea5e9"
                      />
                      <Tooltip
                        formatter={(value, name) => {
                          const n = typeof value === 'number' ? value : Number(value)
                          const label = String(name)
                          return [
                            label === 'costUsd' && !Number.isNaN(n) ? formatUsd(n) : formatInt(Number.isNaN(n) ? 0 : n),
                            label === 'costUsd' ? 'Kosten' : 'Nachrichten',
                          ]
                        }}
                        labelFormatter={(_, payload) => {
                          const row = payload?.[0]?.payload as { date?: string } | undefined
                          return row?.date ?? ''
                        }}
                      />
                      <Legend />
                      <Line yAxisId="cost" type="monotone" dataKey="costUsd" name="Kosten (USD)" stroke="#7c3aed" dot={false} strokeWidth={2} />
                      <Line yAxisId="msg" type="monotone" dataKey="messages" name="Nachrichten" stroke="#0ea5e9" dot={false} strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Kosten nach Modell</h3>
                <p className="mb-3 text-xs text-slate-500">Anteil der API-Kosten heute (global nach Modell)</p>
                <div className="h-[300px] w-full">
                  {pieModelData.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-slate-400">Noch keine Daten</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieModelData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                        >
                          {pieModelData.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={v => formatUsd(typeof v === 'number' ? v : Number(v) || 0)} />
                        <Legend layout="horizontal" verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Charts row 2 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Werkzeuge &amp; Tokens</h2>
          {initialLoad ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <ChartSkeleton />
              <ChartSkeleton />
            </div>
          ) : data ? (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Kosten pro Werkzeug</h3>
                <p className="mb-3 text-xs text-slate-500">Heute (global)</p>
                <div className="h-[280px] w-full">
                  {toolBarData.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-slate-400">Noch keine Daten</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={toolBarData} layout="vertical" margin={{ left: 16, right: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `$${v}`} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={v => formatUsd(typeof v === 'number' ? v : Number(v) || 0)} />
                        <Bar dataKey="costUsd" name="Kosten" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <h3 className="mb-1 text-sm font-semibold text-slate-800">Tokens Input vs. Output</h3>
                <p className="mb-3 text-xs text-slate-500">Pro Modell (heute)</p>
                <div className="h-[280px] w-full">
                  {modelTokenBars.length === 0 ? (
                    <p className="flex h-full items-center justify-center text-sm text-slate-400">Noch keine Daten</p>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modelTokenBars} margin={{ bottom: 48, left: 0, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="model" tick={{ fontSize: 10 }} angle={-28} textAnchor="end" height={60} interval={0} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="input" name="Input" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="output" name="Output" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </section>

        {/* Top users */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Top-Nutzer (heute)</h2>
          {initialLoad ? (
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-4">
              <div className="h-40 rounded bg-slate-100" />
            </div>
          ) : data ? (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Nutzer</th>
                      <th className="px-4 py-3">Plan</th>
                      <th className="px-4 py-3 text-right">Nachrichten</th>
                      <th className="px-4 py-3 text-right">Input-Tokens</th>
                      <th className="px-4 py-3 text-right">Output-Tokens</th>
                      <th className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setCostSortDesc(d => !d)}
                          className="font-semibold uppercase tracking-wide text-slate-500 hover:text-primary"
                        >
                          Kosten {costSortDesc ? '↓' : '↑'}
                        </button>
                      </th>
                      <th className="px-4 py-3">Top-Tool</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedTopUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                          Keine Nutzer aktiv heute
                        </td>
                      </tr>
                    ) : (
                      sortedTopUsers.map(u => (
                        <tr
                          key={u.userId}
                          className="cursor-pointer transition-colors hover:bg-violet-50/60"
                          onClick={() => void openUserDetail(u.userId)}
                        >
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {u.userEmail?.trim() ? u.userEmail : u.userId}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{u.plan}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatInt(u.totalMessages)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatInt(u.totalInputTokens)}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-700">{formatInt(u.totalOutputTokens)}</td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-violet-700">
                            {formatUsd(u.totalCostUsd)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{getTopTool(u)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
                Klick auf eine Zeile: Detail (letzte 30 Tage)
              </p>
            </div>
          ) : null}
        </section>
      </main>

      {/* Detail modal */}
      {(selectedUser || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
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
              {detailError && (
                <p className="text-red-600">{detailError}</p>
              )}
              {selectedUser && !detailLoading && (
                <>
                  <p className="text-xs text-slate-500">Zeitraum: letzte 30 Tage</p>
                  <p className="font-mono text-xs text-slate-700">{selectedUser.userId}</p>
                  {selectedUser.userEmail?.trim() ? (
                    <p className="text-slate-800">{selectedUser.userEmail}</p>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-500">Nachrichten</span>
                      <p className="font-semibold tabular-nums">{formatInt(selectedUser.totalMessages)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-500">Kosten</span>
                      <p className="font-semibold tabular-nums text-violet-700">{formatUsd(selectedUser.totalCostUsd)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-500">Input-Tokens</span>
                      <p className="font-semibold tabular-nums">{formatInt(selectedUser.totalInputTokens)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <span className="text-slate-500">Output-Tokens</span>
                      <p className="font-semibold tabular-nums">{formatInt(selectedUser.totalOutputTokens)}</p>
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Nach Modell</h4>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {Object.entries(selectedUser.byModel ?? {}).map(([k, m]) => (
                        <li key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                          <span className="truncate text-slate-700">{k}</span>
                          <span className="shrink-0 tabular-nums text-slate-600">{formatUsd(m.costUsd)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 text-xs font-semibold uppercase text-slate-500">Nach Werkzeug</h4>
                    <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
                      {Object.entries(selectedUser.byTool ?? {}).map(([k, t]) => (
                        <li key={k} className="flex justify-between gap-2 border-b border-slate-100 py-1">
                          <span className="text-slate-700">{toolLabel(k)}</span>
                          <span className="shrink-0 tabular-nums text-slate-600">{formatUsd(t.costUsd)}</span>
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

function MetricCard({
  title,
  value,
  subtitle,
  accent,
}: {
  title: string
  value: string
  subtitle?: string
  accent: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      {subtitle ? <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{subtitle}</p> : null}
      <p className={`mt-2 text-lg font-bold tabular-nums sm:text-xl ${accent}`}>{value}</p>
    </div>
  )
}
