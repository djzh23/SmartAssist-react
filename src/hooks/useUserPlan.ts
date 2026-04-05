import { useUser, useAuth } from '@clerk/clerk-react'

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
  } catch {
    return 0
  }
}

function writeUsageToday(userId: string | null, count: number): void {
  try {
    localStorage.setItem(usageKey(userId), JSON.stringify({ date: TODAY(), count }))
  } catch {
    // ignore
  }
}

function readPlan(userId: string | null): PlanType {
  if (!userId) return 'anonymous'
  try {
    const stored = localStorage.getItem(planKey(userId)) as PlanType | null
    return stored ?? 'free'
  } catch {
    return 'free'
  }
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
}

export function useUserPlan(): UserPlanState {
  const { user, isLoaded, isSignedIn } = useUser()
  const { getToken } = useAuth()

  const userId = user?.id ?? null
  const plan = readPlan(isSignedIn ? userId : null)
  const usageToday = readUsageToday(isSignedIn ? userId : null)
  const dailyLimit = dailyLimitFor(plan)
  const responsesLeft = dailyLimit === Infinity ? Infinity : Math.max(0, dailyLimit - usageToday)
  const isAtLimit = usageToday >= dailyLimit

  const incrementUsage = () => {
    const key = isSignedIn ? userId : null
    writeUsageToday(key, readUsageToday(key) + 1)
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
  } catch { /* ignore */ }

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
  }
}
