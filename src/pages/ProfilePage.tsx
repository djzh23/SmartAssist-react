import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { ArrowRight, BarChart2, Calendar, Crown, Loader2, Sparkles, Star, Zap } from 'lucide-react'
import { IconHubIcon } from '../components/ui/IconHubIcon'
import { useUserPlan, getPlanColors, getPlanLabel } from '../hooks/useUserPlan'
import { confirmPlanFromSession, createPortalSession, syncPlanFromStripe } from '../services/StripeService'

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, limit > 0 ? (used / limit) * 100 : 0)
  const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
  const limitLabel = limit === Infinity ? '∞' : String(limit)
  const remainingLabel = limit === Infinity ? '∞' : String(Math.max(0, limit - used))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-stone-200">Tägliche Antworten</span>
        <span className="text-stone-400">{used} / {limitLabel}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-800/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
        <span>Heute genutzt: {used}</span>
        <span>Verbleibend: {remainingLabel}</span>
        <span>Setzt um Mitternacht zurück</span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [searchParams] = useSearchParams()
  const user = useUserPlan()
  const { refreshUsage, syncError, isSyncingUsage, isUpgradePending, pendingUpgradePlan, markUpgradePending } = user
  const planColors = getPlanColors(user.plan)
  const planLabel = getPlanLabel(user.plan)

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)
  const [upgradeSyncNotice, setUpgradeSyncNotice] = useState<string | null>(null)
  const [isSyncingPlan, setIsSyncingPlan] = useState(false)
  const [syncPlanError, setSyncPlanError] = useState<string | null>(null)

  const justUpgraded = (searchParams.get('upgraded') ?? '').toLowerCase() === 'true'
  const checkoutSessionId = searchParams.get('session_id') ?? null
  const PlanIcon = user.plan === 'pro' ? Crown : user.plan === 'premium' ? Sparkles : Zap

  const weekHistory = user.weekHistory
  const maxCount = Math.max(...weekHistory.map(d => d.count), 1)
  const todayDate = new Date().toISOString().split('T')[0]

  const handleManageSubscription = async () => {
    try {
      setPortalLoading(true)
      setPortalError(null)

      const token = await getToken()
      if (!token) {
        throw new Error('Kein Authentifizierungs-Token. Bitte erneut anmelden.')
      }
      if (!user.userId) {
        throw new Error('Benutzer-ID fehlt. Bitte Seite neu laden.')
      }

      const portalUrl = await createPortalSession({ token, userId: user.userId })
      window.location.href = portalUrl
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : 'Portal-Fehler')
    } finally {
      setPortalLoading(false)
    }
  }

  const handleSyncPlan = async () => {
    try {
      setIsSyncingPlan(true)
      setSyncPlanError(null)
      const token = await getToken()
      if (!token) throw new Error('Kein Authentifizierungs-Token. Bitte erneut anmelden.')
      const result = await syncPlanFromStripe(token, user.email)
      if (result.plan === 'premium' || result.plan === 'pro') {
        markUpgradePending(result.plan as 'premium' | 'pro', 120)
        await refreshUsage({ retries: 1, retryDelayMs: 800 })
        setUpgradeSyncNotice(null)
      } else {
        setSyncPlanError('Kein aktives Premium-Abonnement bei Stripe gefunden. Bitte Zahlungsdetails prüfen.')
      }
    } catch (err) {
      setSyncPlanError(err instanceof Error ? err.message : 'Synchronisierung fehlgeschlagen')
    } finally {
      setIsSyncingPlan(false)
    }
  }

  const handleRetryUsageSync = async () => {
    try {
      // 1. Try confirm-plan with session ID (if we still have it)
      if (checkoutSessionId) {
        const token = await getToken()
        if (token) {
          const result = await confirmPlanFromSession(checkoutSessionId, token)
          if (result.plan === 'premium' || result.plan === 'pro') {
            const confirmedPlan = result.plan as 'premium' | 'pro'
            markUpgradePending(confirmedPlan, 120)
            await refreshUsage({ retries: 1, retryDelayMs: 800 })
            setUpgradeSyncNotice(null)
            return
          }
        }
      }
      // 2. Query Stripe directly for active subscriptions (authoritative fallback)
      const token = await getToken()
      if (token) {
        const syncResult = await syncPlanFromStripe(token, user.email)
        if (syncResult.plan === 'premium' || syncResult.plan === 'pro') {
          markUpgradePending(syncResult.plan as 'premium' | 'pro', 120)
          await refreshUsage({ retries: 1, retryDelayMs: 800 })
          setUpgradeSyncNotice(null)
          return
        }
      }
      // 3. Plain refresh as last resort
      const nextPlan = await refreshUsage({ retries: 1, retryDelayMs: 1000 })
      if (nextPlan === 'premium' || nextPlan === 'pro') {
        setUpgradeSyncNotice(null)
      }
    } catch (error) {
      setUpgradeSyncNotice(error instanceof Error ? error.message : 'Synchronisierung fehlgeschlagen')
    }
  }

  useEffect(() => {
    if (!justUpgraded) return

    let cancelled = false

    const syncAfterUpgrade = async () => {
      setUpgradeSyncNotice('Zahlung erhalten. Plan wird verifiziert…')

      if (checkoutSessionId) {
        try {
          const token = await getToken()
          if (token) {
            const result = await confirmPlanFromSession(checkoutSessionId, token)
            if (!cancelled && (result.plan === 'premium' || result.plan === 'pro')) {
              const confirmedPlan = result.plan as 'premium' | 'pro'
              markUpgradePending(confirmedPlan, 120)
              await refreshUsage({ retries: 1, retryDelayMs: 800 })
              if (!cancelled) setUpgradeSyncNotice(null)
              return
            }
          }
        } catch (error) {
          console.warn('[ProfilePage] Session-Bestätigung fehlgeschlagen, Polling wird gestartet', error)
        }
      }

      try {
        const nextPlan = await refreshUsage({ retries: 0 })
        if (!cancelled && (nextPlan === 'premium' || nextPlan === 'pro')) {
          setUpgradeSyncNotice(null)
          return
        }
        markUpgradePending(nextPlan === 'pro' ? 'pro' : 'premium', 120)
      } catch {
        markUpgradePending('premium', 120)
      }

      setUpgradeSyncNotice('Zahlung erhalten. Temporärer Zugriff aktiv, während Server-Bestätigung aussteht…')

      for (let attempt = 0; attempt < 4; attempt++) {
        if (cancelled) return
        await new Promise(resolve => window.setTimeout(resolve, 2000))
        if (cancelled) return
        try {
          const nextPlan = await refreshUsage({ retries: 0 })
          if (nextPlan === 'premium' || nextPlan === 'pro') {
            if (!cancelled) setUpgradeSyncNotice(null)
            return
          }
        } catch {
          // weiter versuchen
        }
      }

      // Final authoritative fallback: query Stripe directly for the active subscription
      try {
        const token = await getToken()
        if (token && !cancelled) {
          const syncResult = await syncPlanFromStripe(token, user.email)
          if (!cancelled && (syncResult.plan === 'premium' || syncResult.plan === 'pro')) {
            const syncedPlan = syncResult.plan as 'premium' | 'pro'
            markUpgradePending(syncedPlan, 120)
            await refreshUsage({ retries: 1, retryDelayMs: 800 })
            if (!cancelled) setUpgradeSyncNotice(null)
            return
          }
        }
      } catch {
        // ignore — show notice below
      }

      if (!cancelled) {
        setUpgradeSyncNotice('Server-Bestätigung ausstehend. Klicke auf "Plan synchronisieren" um es erneut zu versuchen.')
      }
    }

    void syncAfterUpgrade()
    return () => { cancelled = true }
  }, [justUpgraded, checkoutSessionId, getToken, markUpgradePending, refreshUsage])

  if (!user.isLoaded) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-transparent">
        <Loader2 size={22} className="animate-spin text-stone-500" />
      </div>
    )
  }

  return (
    <div className="relative min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-amber-600/12 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-amber-500/18" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-stone-600/35 bg-stone-900/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl space-y-6 px-6 py-12">
        <div className="mb-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-400">Mein Konto</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-50">Profil und Nutzung</h1>
        </div>

        {justUpgraded && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/35 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-100">
            <IconHubIcon name="winner" className="h-5 w-5 shrink-0" />
            <span>Willkommen bei Premium! Dein Plan wurde aktualisiert.</span>
          </div>
        )}

        {isUpgradePending && !upgradeSyncNotice && (
          <div className="rounded-xl border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-sm text-amber-100">
            Temporärer {pendingUpgradePlan === 'pro' ? 'Pro' : 'Premium'}-Zugriff aktiv, während Backend-Bestätigung aussteht.
          </div>
        )}

        {upgradeSyncNotice && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/35 bg-amber-950/35 px-4 py-3 text-sm text-amber-50">
            <span>{upgradeSyncNotice}</span>
            <button
              onClick={() => void handleRetryUsageSync()}
              disabled={isSyncingUsage}
              className="rounded-lg border border-amber-500/40 bg-amber-950/50 px-3 py-1.5 text-xs font-semibold text-amber-100 disabled:opacity-60"
            >
              {isSyncingUsage ? 'Synchronisiert…' : 'Jetzt synchronisieren'}
            </button>
          </div>
        )}

        {syncError && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/35 bg-rose-950/40 px-4 py-3 text-sm text-rose-100">
            <span>Synchronisierungsfehler: {syncError}</span>
            <button
              onClick={() => void handleRetryUsageSync()}
              disabled={isSyncingUsage}
              className="rounded-lg border border-rose-500/40 bg-rose-950/50 px-3 py-1.5 text-xs font-semibold text-rose-100 disabled:opacity-60"
            >
              {isSyncingUsage ? 'Wird wiederholt…' : 'Erneut versuchen'}
            </button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-600/45 bg-app-raised/90 px-4 py-2 text-sm font-semibold text-stone-200 transition-colors hover:border-stone-500/55"
          >
            Zum Chat
          </button>
        </div>

        {/* Benutzerinfo */}
        <div className="relative overflow-hidden rounded-3xl border border-stone-600/40 bg-app-surface/90 p-5 shadow-landing backdrop-blur">
          <div
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{ backgroundImage: 'radial-gradient(circle at 88% 0%, rgba(245,158,11,0.1), transparent 50%)' }}
          />
          <div className="relative flex items-center gap-4">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-amber-500/35 bg-amber-950/40 text-xl font-bold text-amber-200">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-semibold text-stone-100">
                  {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email ?? 'Gast'}
                </p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${planColors.badge}`}>
                  <PlanIcon size={10} />
                  {planLabel}
                </span>
              </div>
              {user.email && <p className="mt-0.5 truncate text-xs text-stone-400">{user.email}</p>}
              {user.isSignedIn && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-500">
                  <Calendar size={11} />
                  Angemeldet
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Verbrauch */}
        <div className="space-y-5 rounded-3xl border border-stone-600/40 bg-app-surface/90 p-5 shadow-landing backdrop-blur">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-stone-500">Dein heutiger Verbrauch</h2>
          <UsageBar used={user.usageToday} limit={user.dailyLimit} />

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <BarChart2 size={14} className="text-sky-500" />, label: 'Antworten gesamt', value: user.totalResponses },
              { icon: <Calendar size={14} className="text-amber-500" />, label: 'Aktive Tage', value: user.daysActive || 1 },
              { icon: <Star size={14} className="text-amber-500" />, label: 'Lieblingstool', value: user.favoriteTool ?? '—' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border border-stone-600/30 bg-app-muted/80 px-3 py-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-stone-500">
                  {stat.icon}
                  {stat.label}
                </div>
                <p className="text-base font-bold text-stone-100">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Aktueller Plan */}
        <div className="space-y-4 rounded-3xl border border-stone-600/40 bg-app-surface/90 p-5 shadow-landing backdrop-blur">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-stone-500">Aktueller Plan</h2>

          <div className={`rounded-2xl border-2 p-4 ${planColors.border} bg-app-muted/70`}>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-600/35 bg-app-raised/90">
                <PlanIcon size={16} className={user.plan === 'pro' ? 'text-amber-500' : user.plan === 'premium' ? 'text-amber-600' : 'text-stone-400'} />
              </div>
              <div>
                <p className="font-bold text-stone-100">{planLabel}</p>
                <p className="text-xs text-stone-400">
                  {user.plan === 'free'
                    ? '20 Nachrichten pro Tag (nach Anmeldung)'
                    : user.plan === 'premium'
                      ? '200 Nachrichten pro Tag'
                      : 'Unbegrenzte Nachrichten'}
                </p>
              </div>
            </div>

            {(user.plan === 'premium' || user.plan === 'pro') && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="mt-3 rounded-lg border border-amber-500/45 px-4 py-2 text-xs font-semibold text-amber-200 transition-colors hover:bg-amber-500/15 disabled:opacity-60"
              >
                {portalLoading ? 'Wird geöffnet…' : 'Abonnement verwalten →'}
              </button>
            )}

            {portalError && <p className="mt-3 text-sm text-rose-600">{portalError}</p>}
          </div>

          {user.plan !== 'pro' && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                {user.plan === 'free' ? 'Premium werden' : 'Pro werden'}
                <ArrowRight size={14} />
              </button>
              {user.plan === 'free' && (
                <button
                  onClick={() => void handleSyncPlan()}
                  disabled={isSyncingPlan}
                  title="Bereits bezahlt? Plan mit Stripe abgleichen"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-stone-600/45 bg-app-raised/90 px-3 py-2 text-xs font-semibold text-stone-300 transition-colors hover:border-stone-500/55 disabled:opacity-60"
                >
                  {isSyncingPlan ? <Loader2 size={12} className="animate-spin" /> : null}
                  {isSyncingPlan ? 'Synchronisiert…' : 'Plan synchronisieren'}
                </button>
              )}
            </div>
          )}
          {syncPlanError && (
            <p className="mt-1 text-xs text-rose-600">{syncPlanError}</p>
          )}
        </div>

        {/* Verlauf letzte 7 Tage */}
        <div className="rounded-3xl border border-stone-600/40 bg-app-surface/90 p-5 shadow-landing backdrop-blur">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-stone-500">
            Verlauf — letzte 7 Tage
          </h2>

          {weekHistory.every(d => d.count === 0) ? (
            <p className="py-4 text-center text-xs text-stone-500">
              Noch keine Aktivität aufgezeichnet. Starte ein Gespräch!
            </p>
          ) : (
            <div className="flex h-28 items-end gap-2">
              {weekHistory.map(day => {
                const heightPct = Math.max(4, (day.count / maxCount) * 100)
                const isToday = day.date === todayDate
                return (
                  <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
                    <span className="text-[9px] font-semibold text-stone-500">{day.count > 0 ? day.count : ''}</span>
                    <div className="w-full overflow-hidden rounded-t-lg" style={{ height: '72px' }}>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${isToday ? 'bg-primary' : 'bg-stone-700/80'}`}
                        style={{ height: `${heightPct}%`, marginTop: `${100 - heightPct}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-medium ${isToday ? 'text-primary font-bold' : 'text-stone-500'}`}>
                      {day.day}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
