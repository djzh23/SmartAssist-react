import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import {
  ArrowRight,
  BarChart2,
  Calendar,
  Crown,
  Loader2,
  Sparkles,
  Star,
  User,
  Zap,
} from 'lucide-react'
import { IconHubIcon } from '../components/ui/IconHubIcon'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import { useUserPlan, getPlanColors, getPlanLabel } from '../hooks/useUserPlan'
import { confirmPlanFromSession, createPortalSession, syncPlanFromStripe } from '../services/StripeService'

const ANCHOR_IDS = {
  konto: 'profil-konto',
  nutzung: 'profil-nutzung',
  plan: 'profil-plan',
} as const

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const pct = Math.min(100, limit > 0 && limit !== Infinity ? (used / limit) * 100 : 0)
  const barColor = pct >= 90 ? 'bg-rose-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-600'
  const limitLabel = limit === Infinity ? '∞' : String(limit)
  const remainingLabel = limit === Infinity ? '∞' : String(Math.max(0, limit - used))

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs text-stone-700">
        <span className="font-semibold">Tägliche KI-Antworten</span>
        <span className="tabular-nums text-stone-800">{used} / {limitLabel}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${limit === Infinity ? 100 : Math.max(2, pct)}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
        <span className="tabular-nums">Heute genutzt: {used}</span>
        <span className="tabular-nums">Verbleibend: {remainingLabel}</span>
        <span>Zähler setzt um Mitternacht (lokale Zeit) zurück</span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const location = useLocation()
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

  useEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    requestAnimationFrame(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }, [location.hash, location.pathname])

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
        // ignore
      }

      if (!cancelled) {
        setUpgradeSyncNotice('Server-Bestätigung ausstehend. Klicke auf "Plan synchronisieren" um es erneut zu versuchen.')
      }
    }

    void syncAfterUpgrade()
    return () => { cancelled = true }
  }, [justUpgraded, checkoutSessionId, getToken, markUpgradePending, refreshUsage])

  const badgeClass =
    user.plan === 'free'
      ? 'border border-stone-300 bg-stone-200/95 text-stone-900'
      : planColors.badge

  if (!user.isLoaded) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center bg-transparent">
        <Loader2 size={22} className="animate-spin text-stone-500" />
      </div>
    )
  }

  const limitLabel = user.dailyLimit === Infinity ? '∞' : String(user.dailyLimit)
  const remainingLabel = user.dailyLimit === Infinity ? '∞' : String(Math.max(0, user.dailyLimit - user.usageToday))

  return (
    <div id="app-profil-start" className="relative min-h-0 flex-1 overflow-y-auto bg-transparent">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-amber-600/12 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <header className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary shadow-sm">
                <User className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-500">Konto</p>
                    <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">Profil</h1>
                  </div>
                  <InfoExplainerButton
                    variant="onLight"
                    modalTitle="Was du hier siehst"
                    ariaLabel="Erklärung zur Profil-Seite"
                    className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
                  >
                    <p>
                      Auf dieser Seite stehen nur Angaben zu deinem Konto, deiner heutigen KI-Nutzung und deinem Plan.
                      Zahlen zu Bewerbungen, Lebensläufen und Schnellzugriffen findest du unter Übersicht.
                    </p>
                    <p className="mt-3 text-stone-600">
                      Direktsprung: <span className="font-mono text-stone-800">/profile#profil-nutzung</span>
                    </p>
                  </InfoExplainerButton>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-stone-700">
                  Limits, Plan und Abo — getrennt von der Arbeitsübersicht.
                </p>
                <Link
                  to="/overview"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Zur Übersicht (Bewerbungen, CVs, Graph)
                  <ArrowRight size={14} aria-hidden />
                </Link>
              </div>
            </div>
          </div>

          <nav
            className="mt-5 border-t border-stone-400/35 pt-4"
            aria-label="Abschnitte auf dieser Seite"
          >
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-stone-500">Springe zu</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['profil-konto', 'Konto'],
                  ['profil-nutzung', 'Nutzung'],
                  ['profil-plan', 'Plan'],
                ] as const
              ).map(([id, label]) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="inline-flex items-center rounded-full border border-stone-400/45 bg-white/90 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm transition hover:border-primary/45 hover:bg-primary-light/50"
                >
                  {label}
                </a>
              ))}
            </div>
          </nav>
        </header>

        {justUpgraded && (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-200/80 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <IconHubIcon name="winner" className="h-5 w-5 shrink-0" />
            <span>Willkommen bei Premium! Dein Plan wurde aktualisiert.</span>
          </div>
        )}

        {isUpgradePending && !upgradeSyncNotice && (
          <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Temporärer {pendingUpgradePlan === 'pro' ? 'Pro' : 'Premium'}-Zugriff aktiv, während Backend-Bestätigung aussteht.
          </div>
        )}

        {upgradeSyncNotice && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <span className="min-w-0 flex-1">{upgradeSyncNotice}</span>
            <button
              type="button"
              onClick={() => void handleRetryUsageSync()}
              disabled={isSyncingUsage}
              className="shrink-0 rounded-lg border border-amber-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-60"
            >
              {isSyncingUsage ? 'Synchronisiert…' : 'Jetzt synchronisieren'}
            </button>
          </div>
        )}

        {syncError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200/90 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <span className="min-w-0 flex-1">Synchronisierungsfehler: {syncError}</span>
            <button
              type="button"
              onClick={() => void handleRetryUsageSync()}
              disabled={isSyncingUsage}
              className="shrink-0 rounded-lg border border-rose-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-rose-900 disabled:opacity-60"
            >
              {isSyncingUsage ? 'Wird wiederholt…' : 'Erneut versuchen'}
            </button>
          </div>
        )}

        {/* Konto */}
        <section
          id={ANCHOR_IDS.konto}
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Konto</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Konto"
              ariaLabel="Erklärung zum Konto-Abschnitt"
              className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
            >
              <p>
                Name und E-Mail kommen von deiner Anmeldung (Clerk). Der Plan-Badge zeigt, welches Kontingent für
                KI-Antworten gilt.
              </p>
            </InfoExplainerButton>
          </div>
          <div className="flex flex-col gap-4 rounded-xl border border-stone-400/35 bg-white/95 p-4 shadow-card sm:flex-row sm:items-center sm:gap-5 sm:p-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-stone-400/40 bg-primary-light/60 text-xl font-bold text-stone-900">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold text-stone-900">
                  {user.firstName ? `${user.firstName} ${user.lastName ?? ''}`.trim() : user.email ?? 'Gast'}
                </p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeClass}`}>
                  <PlanIcon size={10} />
                  {planLabel}
                </span>
              </div>
              {user.email && <p className="mt-1 truncate text-sm text-stone-600">{user.email}</p>}
              {user.isSignedIn && (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-stone-500">
                  <Calendar size={12} aria-hidden />
                  Angemeldet
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Nutzung */}
        <section
          id={ANCHOR_IDS.nutzung}
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Heutige Nutzung</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Tägliche KI-Antworten"
              ariaLabel="Erklärung zu Limits und Zählung"
              className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
            >
              <p>
                Jede vollständige Assistenten-Antwort im Chat zählt gegen dein Tageslimit (je nach Plan). Der Zähler
                lebt im Browser und wird mit dem Server abgeglichen, sobald Antworten zurückkommen.
              </p>
              <p className="mt-3">
                „Antworten gesamt“ und „Aktive Tage“ werden aus deiner lokalen Nutzungshistorie zusammengerechnet — gut
                als Motivation, nicht als offizielle Abrechnung.
              </p>
              <p className="mt-3 text-stone-600">
                Lieblingstool leitet sich aus der Häufigkeit der genutzten Chat-Tools ab.
              </p>
            </InfoExplainerButton>
          </div>
          <div className="space-y-5 rounded-xl border border-stone-400/35 bg-white/95 p-4 shadow-card sm:p-5">
            <UsageBar used={user.usageToday} limit={user.dailyLimit} />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {
                  icon: <BarChart2 size={15} className="text-primary" aria-hidden />,
                  label: 'Heute übrig',
                  value: remainingLabel,
                  sub: `von ${limitLabel} / Tag`,
                },
                {
                  icon: <BarChart2 size={15} className="text-teal-600" aria-hidden />,
                  label: 'Antworten gesamt',
                  value: user.totalResponses,
                  sub: 'geschätzt, lokal',
                },
                {
                  icon: <Calendar size={15} className="text-orange-600" aria-hidden />,
                  label: 'Aktive Tage',
                  value: user.daysActive || 1,
                  sub: 'mit Chat-Nutzung',
                },
                {
                  icon: <Star size={15} className="text-amber-600" aria-hidden />,
                  label: 'Lieblingstool',
                  value: user.favoriteTool ?? '—',
                  sub: 'häufigstes Tool',
                },
              ].map(stat => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-stone-400/35 bg-app-parchment/50 px-3 py-3 sm:px-3.5"
                >
                  <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
                    {stat.icon}
                    {stat.label}
                  </div>
                  <p className="text-lg font-bold tabular-nums tracking-tight text-stone-900 sm:text-xl">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] text-stone-600">{stat.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Plan */}
        <section
          id={ANCHOR_IDS.plan}
          className="scroll-mt-24 rounded-2xl border border-stone-400/40 bg-app-parchment/95 p-5 shadow-landing sm:p-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">Plan & Abo</h2>
            <InfoExplainerButton
              variant="onLight"
              modalTitle="Plan & Abo"
              ariaLabel="Erklärung zu Plänen und Stripe"
              className="text-stone-500 hover:bg-stone-200/90 hover:text-stone-900"
            >
              <p>
                Free, Premium und Pro unterscheiden sich im Tageslimit für KI-Antworten. Premium- und Pro-Nutzer können
                das Abonnement über Stripe verwalten.
              </p>
              <p className="mt-3">
                Wenn du gerade bezahlt hast, der Badge aber noch nicht stimmt: „Plan synchronisieren“ holt den Stand
                direkt bei Stripe — ohne die Seite endlos neu zu laden.
              </p>
            </InfoExplainerButton>
          </div>
          <div className="space-y-4 rounded-xl border border-stone-400/35 bg-white/95 p-4 shadow-card sm:p-5">
            <div className={`rounded-xl border-2 p-4 ${planColors.border} bg-app-parchment/60`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-400/40 bg-white">
                  <PlanIcon size={18} className={user.plan === 'pro' ? 'text-amber-600' : user.plan === 'premium' ? 'text-amber-600' : 'text-stone-500'} />
                </div>
                <div>
                  <p className="font-bold text-stone-900">{planLabel}</p>
                  <p className="text-sm text-stone-600">
                    {user.plan === 'free'
                      ? '20 KI-Antworten pro Tag (nach Anmeldung)'
                      : user.plan === 'premium'
                        ? '200 KI-Antworten pro Tag'
                        : 'Unbegrenzte KI-Antworten'}
                  </p>
                </div>
              </div>

              {(user.plan === 'premium' || user.plan === 'pro') && (
                <button
                  type="button"
                  onClick={() => void handleManageSubscription()}
                  disabled={portalLoading}
                  className="mt-4 w-full rounded-xl border border-stone-400/45 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-app-parchmentDeep/80 disabled:opacity-60 sm:w-auto"
                >
                  {portalLoading ? 'Wird geöffnet…' : 'Abonnement verwalten'}
                </button>
              )}

              {portalError && <p className="mt-3 text-sm text-rose-700">{portalError}</p>}
            </div>

            {user.plan !== 'pro' && (
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to="/pricing"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-primary-hover"
                >
                  {user.plan === 'free' ? 'Premium werden' : 'Pro werden'}
                  <ArrowRight size={14} aria-hidden />
                </Link>
                {user.plan === 'free' && (
                  <button
                    type="button"
                    onClick={() => void handleSyncPlan()}
                    disabled={isSyncingPlan}
                    title="Bereits bezahlt? Plan mit Stripe abgleichen"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-stone-400/45 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:bg-app-parchmentDeep/80 disabled:opacity-60"
                  >
                    {isSyncingPlan ? <Loader2 size={12} className="animate-spin" aria-hidden /> : null}
                    {isSyncingPlan ? 'Synchronisiert…' : 'Plan synchronisieren'}
                  </button>
                )}
              </div>
            )}
            {syncPlanError && (
              <p className="text-xs text-rose-700">{syncPlanError}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
