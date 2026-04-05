export type PlanType = 'free' | 'premium' | 'pro'

export interface UserPlan {
  isLoggedIn: boolean
  email: string | null
  name: string | null
  plan: PlanType
  usageToday: number
  dailyLimit: number
  totalResponses: number
  daysActive: number
  favoriteTool: string | null
  memberSince: string | null
}

const DEFAULT_USER: UserPlan = {
  isLoggedIn: false,
  email: null,
  name: null,
  plan: 'free',
  usageToday: 1,
  dailyLimit: 2,
  totalResponses: 0,
  daysActive: 1,
  favoriteTool: null,
  memberSince: null,
}

export function useUserPlan(): UserPlan {
  try {
    const raw = localStorage.getItem('smartassist_user')
    if (!raw) return DEFAULT_USER
    const parsed = JSON.parse(raw) as Partial<UserPlan>
    return { ...DEFAULT_USER, ...parsed }
  } catch {
    return DEFAULT_USER
  }
}

export function getPlanLabel(plan: PlanType): string {
  if (plan === 'premium') return 'PREMIUM'
  if (plan === 'pro') return 'PRO'
  return 'FREE'
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
