import { useState } from 'react'
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react'
import { X } from 'lucide-react'
import { createCheckoutSession } from '../../services/StripeService'

interface Props {
  isOpen: boolean
  isLoggedIn: boolean
  userEmail?: string | null
  onClose: () => void
}

export default function UsageLimitModal({ isOpen, isLoggedIn, userEmail, onClose }: Props) {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [isUpgrading, setIsUpgrading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUpgrade = async () => {
    if (!isLoggedIn) {
      setError('Please sign in first, then upgrade to Premium.')
      return
    }

    try {
      setIsUpgrading(true)
      setError(null)
      const token = await getToken()
      if (!token) {
        throw new Error('Could not create authenticated checkout session. Please sign in again.')
      }
      if (!user?.id) {
        throw new Error('Missing user profile ID. Please reload and try again.')
      }

      const url = await createCheckoutSession('premium', userEmail ?? user?.primaryEmailAddress?.emailAddress, {
        token,
        userId: user.id,
      })
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout')
    } finally {
      setIsUpgrading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>

        <div className="pointer-events-none absolute inset-0 opacity-60" style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.09), transparent 55%)',
        }} />

        <div className="relative px-6 pt-8 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-3xl">
            🚀
          </div>
          <h2 className="text-xl font-bold text-slate-800">You've reached your limit</h2>
          <p className="mt-1.5 text-sm text-slate-500">Upgrade to keep chatting</p>
        </div>

        <div className="relative grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-sm font-semibold text-slate-800">
              {isLoggedIn ? 'You are logged in' : 'Sign in for free'}
            </p>
            <ul className="mb-3 space-y-1">
              {!isLoggedIn && (
                <li className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="text-emerald-500">✓</span> 20 responses/day
                </li>
              )}
              <li className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-emerald-500">✓</span> All basic tools
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-600">
                <span className="text-emerald-500">✓</span> Free forever
              </li>
            </ul>
            {!isLoggedIn && (
              <SignInButton mode="modal" fallbackRedirectUrl="/chat">
                <button className="w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400">
                  Sign in with Google
                </button>
              </SignInButton>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-violet-400 bg-violet-50 p-4">
            <div className="pointer-events-none absolute inset-0 opacity-40" style={{
              backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(124,58,237,0.15), transparent 55%)',
            }} />
            <p className="relative mb-1 text-sm font-semibold text-slate-800">Go Premium</p>
            <ul className="relative mb-3 space-y-1">
              <li className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="text-emerald-500">✓</span> 200 responses/day
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="text-emerald-500">✓</span> All tools unlocked
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="text-emerald-500">✓</span> 4,99 €/month
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              className="relative w-full rounded-xl bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              disabled={isUpgrading}
            >
              {isUpgrading ? 'Redirecting...' : 'Upgrade to Premium — 4,99€/month'}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="border-t border-slate-100 px-6 py-3 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 hover:underline"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  )
}
