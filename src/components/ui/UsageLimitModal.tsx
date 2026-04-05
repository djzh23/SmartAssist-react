import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { SignInButton } from '@clerk/clerk-react'

interface Props {
  isOpen: boolean
  isLoggedIn: boolean
  onClose: () => void
}

export default function UsageLimitModal({ isOpen, isLoggedIn, onClose }: Props) {
  const navigate = useNavigate()

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
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>

        {/* Glow */}
        <div className="pointer-events-none absolute inset-0 opacity-60" style={{
          backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(124,58,237,0.09), transparent 55%)',
        }} />

        {/* Header */}
        <div className="relative px-6 pt-8 pb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-3xl">
            🚀
          </div>
          <h2 className="text-xl font-bold text-slate-800">You've reached your limit</h2>
          <p className="mt-1.5 text-sm text-slate-500">Upgrade to keep chatting</p>
        </div>

        {/* Options */}
        <div className="relative grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
          {/* Option A */}
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

          {/* Option B */}
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
                <span className="text-emerald-500">✓</span> 4,99€/month
              </li>
            </ul>
            <button
              onClick={() => { navigate('/pricing'); onClose() }}
              className="relative w-full rounded-xl bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Upgrade to Premium
            </button>
          </div>
        </div>

        {/* Dismiss */}
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
