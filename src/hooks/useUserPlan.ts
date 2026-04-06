import { useCallback, useEffect, useState } from 'react'
import { useUser, useAuth } from '@clerk/clerk-react'
import { getAgentUsage } from '../api/client'

const USAGE_EVENT = 'smartassist_usage_updated'

export type PlanType = 'anonymous' | 'free' | 'premium' | 'pro'

const TODAY = () => new Date().toISOString().split('T')[0]

function usageKey(userId: string | null): string {
  return `smartassist_usage_${userId ?? 'anonymous'}`
}

function planKey(userId: string): string {
  return `smartassist_plan_${userId}`
}

function readUsageToday(userId: string | null): number {
  try {
    const raw = localStorage.getItem(usageKey(userId))
    if (!raw) return 0
    const data = JSON.parse(raw) as { date: string; count: number }
    if (data.date !== TODAY()) {
      localStorage.removeItem(usageKey(userId))
      return 0
    }
    return data.count ?? 0
  } catch (error) {
    console.warn('[useUserPlan] Failed to read usage from localStorage', error)
    return 0
  }
}

function writeUsageToday(userId: string | null, count: number): void {
  try {
    localStorage.setItem(usageKey(userId), JSON.stringify({ date: TODAY(), count }))
  } catch (error) {
    console.warn('[useUserPlan] Failed to write usage to localStorage', error)
  }
}

function readPlan(userId: string | null): PlanType {
  if (!userId) return 'anonymous'
  try {
    const stored = localStorage.getItem(planKey(userId)) as PlanType | null
    return stored ?? 'free'
  } catch (error) {
    console.warn('[useUserPlan] Failed to read plan from localStorage', error)
    return 'free'
  }
}

function normalizePlan(value: string | null | undefined, signedIn: boolean): PlanType {
  if (!signedIn) return 'anonymous'
  if (value === 'premium' || value === 'pro' || value === 'free') return value
  return 'free'
}

function dailyLimitFor(plan: PlanType): number {
  switch (plan) {
    case 'anonymous': return 2
    case 'free': return 20
    case 'premium': return 200
    case 'pro': return Infinity
    default: return 2
  }
}

export function getPlanLabel(plan: PlanType): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

export function getPlanColors(plan: PlanType): { badge: string; border: string; button: string } {
  if (plan === 'premium') {
    return {
      badge: 'bg-violet-100 text-violet-700 border-violet-200',
      border: 'border-violet-400',
      button: 'bg-primary hover:bg-primary-hover text-white',
    }
  }
  if (plan === 'pro') {
    return {
      badge: 'bg-amber-100 text-amber-700 border-amber-200',
      border: 'border-amber-400',
      button: 'bg-amber-500 hover:bg-amber-600 text-white',
    }
  }
  return {
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    border: 'border-slate-300',
    button: 'border border-slate-300 text-slate-600 hover:border-slate-400',
  }
}

/** Call this with server values from X-Usage-Today/X-Usage-Limit headers */
export function dispatchServerUsage(usageToday: number): void {
  try {
    // We don't have userId here, so write to a temp key and let the hook pick it up
    localStorage.setItem('smartassist_server_usage', String(usageToday))
  } catch (error) {
    console.warn('[useUserPlan] Failed to store server usage value', error)
  }
  window.dispatchEvent(new Event(USAGE_EVENT))
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

export interface UserPlanState {
  isLoaded: boolean
  isSignedIn: boolean
  userId: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  initials: string
  plan: PlanType
  usageToday: number
  dailyLimit: number
  responsesLeft: number
  isAtLimit: boolean
  planLabel: string
  planColor: string
  // Persistent stats (stored in localStorage)
  totalResponses: number
  daysActive: number
  favoriteTool: string | null
  incrementUsage: () => void
  getToken: ReturnType<typeof useAuth>['getToken']
  syncError: string | null
  isSyncingUsage: boolean
  refreshUsage: (options?: { retries?: number; retryDelayMs?: number }) => Promise<PlanType>
}

export function useUserPlan(): UserPlanState {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()

  const userId = user?.id ?? null
  const [plan, setPlan] = useState<PlanType>(() => readPlan(isSignedIn ? userId : null))
  const dailyLimit = dailyLimitFor(plan)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSyncingUsage, setIsSyncingUsage] = useState(false)

  const storageKey = isSignedIn ? userId : null
  const [usageToday, setUsageToday] = useState(() => readUsageToday(storageKey))

  // Sync when user identity changes (sign-in / sign-out)
  useEffect(() => {
    setUsageToday(readUsageToday(isSignedIn ? userId : null))
    setPlan(readPlan(isSignedIn ? userId : null))
    setSyncError(null)
  }, [userId, isSignedIn])

  // Listen for usage increments from any component instance
  useEffect(() => {
    const sync = () => {
      // Check if server sent a real usage value
      const serverVal = localStorage.getItem('smartassist_server_usage')
      if (serverVal !== null) {
        const parsed = Number(serverVal)
        if (!Number.isNaN(parsed)) {
          const key = isSignedIn ? userId : null
          writeUsageToday(key, parsed)
          setUsageToday(parsed)
          localStorage.removeItem('smartassist_server_usage')
          return
        }
      }
      setUsageToday(readUsageToday(isSignedIn ? userId : null))
    }
    window.addEventListener(USAGE_EVENT, sync)
    return () => window.removeEventListener(USAGE_EVENT, sync)
  }, [userId, isSignedIn])

  const refreshUsage = useCallback(async (options?: { retries?: number; retryDelayMs?: number }): Promise<PlanType> => {
    if (!isLoaded) {
      throw new Error('Authentication is not loaded yet. Usage sync is not available.')
    }

    const retries = Math.max(0, options?.retries ?? 0)
    const retryDelayMs = Math.max(300, options?.retryDelayMs ?? 1200)
    setIsSyncingUsage(true)

    let lastError: Error | null = null

    try {
      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          const token = await getToken()
          if (isSignedIn && !token) {
            throw new Error('Missing auth token while signed in. Cannot sync usage.')
          }

          const status = await getAgentUsage(token ?? undefined)
          const key = isSignedIn ? userId : null

          writeUsageToday(key, status.usageToday)
          setUsageToday(status.usageToday)

          if (key) {
            const nextPlan = normalizePlan(status.plan, true)
            localStorage.setItem(planKey(key), nextPlan)
            setPlan(nextPlan)
            setSyncError(null)
            return nextPlan
          }

          setPlan('anonymous')
          setSyncError(null)
          return 'anonymous'
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Usage sync failed')
          if (attempt < retries) {
            await wait(retryDelayMs * (attempt + 1))
          }
        }
      }

      throw lastError ?? new Error('Usage sync failed')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Usage sync failed'
      setSyncError(message)
      throw error instanceof Error ? error : new Error(message)
    } finally {
      setIsSyncingUsage(false)
    }
  }, [getToken, isLoaded, isSignedIn, userId])

  // Sync real usage from server on load and when user identity changes
  useEffect(() => {
    if (!isLoaded) return
    void refreshUsage({ retries: 1, retryDelayMs: 900 }).catch(error => {
      console.warn('[useUserPlan] Initial usage sync failed', error)
    })
  }, [isLoaded, userId, refreshUsage])

  const responsesLeft = dailyLimit === Infinity ? Infinity : Math.max(0, dailyLimit - usageToday)
  const isAtLimit = usageToday >= dailyLimit

  const incrementUsage = () => {
    const key = isSignedIn ? userId : null
    const next = readUsageToday(key) + 1
    writeUsageToday(key, next)
    setUsageToday(next)
    window.dispatchEvent(new Event(USAGE_EVENT))
  }

  const planColorMap: Record<PlanType, string> = {
    anonymous: '#6B7280',
    free: '#6B7280',
    premium: '#7C3AED',
    pro: '#D97706',
  }

  const firstName = user?.firstName ?? null
  const lastName = user?.lastName ?? null
  const rawInitials = [firstName?.[0] ?? '', lastName?.[0] ?? ''].join('').toUpperCase()

  // Persistent stats from localStorage
  const statsKey = `smartassist_stats_${userId ?? 'anonymous'}`
  let totalResponses = 0
  let daysActive = 1
  let favoriteTool: string | null = null
  try {
    const raw = localStorage.getItem(statsKey)
    if (raw) {
      const s = JSON.parse(raw) as { total?: number; days?: number; fav?: string }
      totalResponses = s.total ?? 0
      daysActive = s.days ?? 1
      favoriteTool = s.fav ?? null
    }
  } catch (error) {
    console.warn('[useUserPlan] Failed to read profile stats from localStorage', error)
  }

  return {
    isLoaded,
    isSignedIn: isSignedIn ?? false,
    userId,
    email: user?.primaryEmailAddress?.emailAddress ?? null,
    firstName,
    lastName,
    avatarUrl: user?.imageUrl ?? null,
    initials: rawInitials || '?',
    plan,
    usageToday,
    dailyLimit,
    responsesLeft,
    isAtLimit,
    planLabel: getPlanLabel(plan),
    planColor: planColorMap[plan],
    totalResponses,
    daysActive,
    favoriteTool,
    incrementUsage,
    getToken,
    syncError,
    isSyncingUsage,
    refreshUsage,
  }
}
