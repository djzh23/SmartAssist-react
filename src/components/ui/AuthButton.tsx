import { SignInButton, SignOutButton, useUser } from '@clerk/clerk-react'
import { useUserPlan } from '../../hooks/useUserPlan'
import { Loader2 } from 'lucide-react'

interface Props {
  variant?: 'full' | 'compact'
}

export default function AuthButton({ variant = 'full' }: Props) {
  const { isLoaded, isSignedIn } = useUser()
  const { email, initials, planLabel, planColor } = useUserPlan()

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center px-3 py-2 text-xs text-slate-500">
        <Loader2 size={13} className="animate-spin" />
      </div>
    )
  }

  if (isSignedIn) {
    return (
      <div className="px-3 py-2">
        {variant === 'full' && (
          <div className="mb-2 flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white"
              style={{ backgroundColor: planColor }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-slate-200">
                {email?.split('@')[0] ?? 'User'}
              </p>
              <span
                className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                style={{ backgroundColor: `${planColor}30`, color: planColor, border: `1px solid ${planColor}50` }}
              >
                {planLabel.toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <SignOutButton>
          <button className="w-full rounded-lg border border-rose-500/20 bg-rose-500/10 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:bg-rose-500/20">
            Abmelden
          </button>
        </SignOutButton>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <SignInButton mode="modal">
        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover">
          🔐 Anmelden
        </button>
      </SignInButton>
    </div>
  )
}
