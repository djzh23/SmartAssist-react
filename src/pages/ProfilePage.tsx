import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, BarChart2, Calendar, Crown, Loader2, Sparkles, Star, Zap } from 'lucide-react'
import { useUserPlan, getPlanColors, getPlanLabel } from '../hooks/useUserPlan'
import { createPortalSession } from '../services/StripeService'

const WEEK_HISTORY = [
  { day: 'Mo', count: 4 },
  { day: 'Di', count: 11 },
  { day: 'Mi', count: 8 },
  { day: 'Do', count: 15 },
  { day: 'Fr', count: 20 },
  { day: 'Sa', count: 6 },
  { day: 'So', count: 8 },
]

const MAX_HISTORY = Math.max(...WEEK_HISTORY.map(d => d.count), 1)
const TODAY_INDEX = 6

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, limit > 0 ? (used / limit) * 100 : 0)
  const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-slate-700">Daily Responses</span>
        <span className="text-slate-500">{used} / {limit === Infinity ? '∞' : limit}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Responses used today: {used}</span>
        <span>Remaining: {limit === Infinity ? '∞' : Math.max(0, limit - used)}</span>
        <span>Resets at midnight</span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useUserPlan()
  const { refreshUsage, syncError, isSyncingUsage } = user
  const planColors = getPlanColors(user.plan)
  const planLabel = getPlanLabel(user.plan)

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [upgradeSyncNotice, setUpgradeSyncNotice] = useState<string | null>(null)

  const justUpgraded = (searchParams.get('upgraded') ?? '').toLowerCase() === 'true'
  const PlanIcon = user.plan === 'pro' ? Crown : user.plan === 'premium' ? Sparkles : Zap

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true)
      setPortalError(null)
      const portalUrl = await createPortalSession()
      window.location.href = portalUrl
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Portal error')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleRetryUsageSync = async () => {
    try {
      await refreshUsage({ retries: 1, retryDelayMs: 1000 })
      setUpgradeSyncNotice(null)
    } catch (error) {
      setUpgradeSyncNotice(error instanceof Error ? error.message : 'Usage sync failed')
    }
  }

  useEffect(() => {
    if (!justUpgraded) return

    let cancelled = false

    const syncAfterUpgrade = async () => {
      setUpgradeSyncNotice('Synchronizing your upgraded plan with the server...')

      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const nextPlan = await refreshUsage({ retries: 0 })
          if (cancelled) return

          if (nextPlan === 'premium' || nextPlan === 'pro') {
            setUpgradeSyncNotice(null)
            return
          }
        } catch (error) {
          if (!cancelled) {
            setUpgradeSyncNotice(error instanceof Error ? error.message : 'Usage sync failed')
          }
        }

        await new Promise(resolve => window.setTimeout(resolve, 2000))
        if (cancelled) return
      }

      if (!cancelled) {
        setUpgradeSyncNotice('Payment completed, but plan sync is still pending. Please retry in a few seconds.')
      }
    }

    void syncAfterUpgrade()

    return () => {
      cancelled = true
    }
  }, [justUpgraded, refreshUsage])

  if (!user.isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5f6fb]">
        <Loader2 size={22} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div
      className="relative h-full overflow-y-auto"
      style={{
        backgroundColor: '#f5f6fb',
        backgroundImage:
          'linear-gradient(to right, rgba(100,116,139,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.09) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-violet-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-violet-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl space-y-6 px-6 py-12">
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">Mein Konto</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-800">Profil und Nutzung</h1>
        </div>

        {justUpgraded && (
          <div
            style={{
              background: '#D1FAE5',
              color: '#065F46',
              padding: '12px 20px',
              borderRadius: '10px',
              marginBottom: '20px',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            🎉 Welcome to Premium! Your plan has been upgraded.
          </div>
        )}

        {upgradeSyncNotice && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span>{upgradeSyncNotice}</span>
            <button
              onClick={() => void handleRetryUsageSync()}
              disabled={isSyncingUsage}
              className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-60"
            >
              {isSyncingUsage ? 'Syncing...' : 'Sync now'}
            </button>
          </div>
        )}

        {syncError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>Usage sync error: {syncError}</span>
            <button
              onClick={() => void handleRetryUsageSync()}
              disabled={isSyncingUsage}
              className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
            >
              {isSyncingUsage ? 'Retrying...' : 'Retry sync'}
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-400"
          >
            Go to Chat
          </button>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{ backgroundImage: 'radial-gradient(circle at 88% 0%, rgba(124,58,237,0.07), transparent 50%)' }}
          />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-xl font-bold text-violet-700">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-slate-800">
                  {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email ?? 'Guest User'}
                </p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${planColors.badge}`}>
                  <PlanIcon size={10} />
                  {planLabel}
                </span>
              </div>
              {user.email && <p className="mt-0.5 truncate text-xs text-slate-500">{user.email}</p>}
              {user.isSignedIn && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={11} />
                  Signed in
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Your Usage Today</h2>
          <UsageBar used={user.usageToday} limit={user.dailyLimit} />

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <BarChart2 size={14} className="text-indigo-500" />, label: 'Total Responses', value: user.totalResponses },
              { icon: <Calendar size={14} className="text-cyan-500" />, label: 'Days Active', value: user.daysActive },
              { icon: <Star size={14} className="text-amber-500" />, label: 'Favorite Tool', value: user.favoriteTool ?? '—' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-slate-100 bg-slate-50/85 px-3 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {stat.icon}
                  {stat.label}
                </div>
                <p className="text-base font-bold text-slate-800">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Aktueller Plan</h2>

          <div className={`rounded-2xl border-2 p-4 ${planColors.border} bg-white/80`}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                <PlanIcon size={16} className={user.plan === 'pro' ? 'text-amber-500' : user.plan === 'premium' ? 'text-violet-600' : 'text-slate-500'} />
              </div>
              <div>
                <p className="font-bold text-slate-800">{planLabel}</p>
                <p className="text-xs text-slate-500">
                  {user.plan === 'free' ? '20 responses/day (after login)' : user.plan === 'premium' ? '200 responses/day' : 'Unlimited responses'}
                </p>
              </div>
            </div>

            {(user.plan === 'premium' || user.plan === 'pro') && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                style={{
                  marginTop: '12px',
                  padding: '8px 16px',
                  background: 'transparent',
                  border: '1px solid #7C3AED',
                  color: '#7C3AED',
                  borderRadius: '8px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  opacity: portalLoading ? 0.7 : 1,
                }}
              >
                {portalLoading ? 'Opening...' : 'Manage Subscription →'}
              </button>
            )}

            {portalError && <p className="mt-3 text-sm text-red-600">{portalError}</p>}
          </div>

          {user.plan !== 'pro' && (
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {user.plan === 'free' ? 'Upgrade to Premium' : 'Upgrade to Pro'}
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        <div className="rounded-3xl border border-slate-200/90 bg-white/90 p-5 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Usage History — last 7 days</h2>

          <div className="flex h-28 items-end gap-2">
            {WEEK_HISTORY.map((day, idx) => {
              const heightPct = Math.max(4, (day.count / MAX_HISTORY) * 100)
              const isToday = idx === TODAY_INDEX
              return (
                <div key={day.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className="text-[9px] font-semibold text-slate-400">{day.count}</span>
                  <div className="w-full overflow-hidden rounded-t-lg" style={{ height: '72px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-slate-200'}`}
                      style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${isToday ? 'text-primary' : 'text-slate-400'}`}>
                    {day.day}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
