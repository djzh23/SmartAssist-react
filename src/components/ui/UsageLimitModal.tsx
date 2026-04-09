import { useState } from 'react'
import { SignInButton, useAuth, useUser } from '@clerk/clerk-react'
import { Check, Rocket, X } from 'lucide-react'
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
      setError('Bitte zuerst einloggen und dann auf Premium upgraden.')
      return
    }

    try {
      setIsUpgrading(true)
      setError(null)
      const token = await getToken()
      if (!token) throw new Error('Authentifizierte Checkout-Session konnte nicht erstellt werden. Bitte erneut einloggen.')
      if (!user?.id) throw new Error('User-ID fehlt. Bitte Seite neu laden und erneut versuchen.')

      const url = await createCheckoutSession('premium', userEmail ?? user?.primaryEmailAddress?.emailAddress, {
        token,
        userId: user.id,
      })
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout konnte nicht erstellt werden.')
    } finally {
      setIsUpgrading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-md animate-slide-up overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          aria-label="Schließen"
        >
          <X size={16} />
        </button>

        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(6,182,212,0.12), transparent 55%)' }}
        />

        <div className="relative px-6 pb-4 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700">
            <Rocket size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Du hast dein Limit erreicht</h2>
          <p className="mt-1.5 text-sm text-slate-500">Melde dich an für mehr Möglichkeiten</p>
        </div>

        <div className="relative grid grid-cols-1 gap-3 px-6 pb-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="mb-1 text-sm font-semibold text-slate-800">
              {isLoggedIn ? 'Du bist angemeldet' : 'Kostenlos anmelden'}
            </p>
            <ul className="mb-3 space-y-1">
              {!isLoggedIn && (
                <li className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Check size={12} className="text-emerald-500" /> 20 Nachrichten am Tag, für immer kostenlos
                </li>
              )}
              <li className="flex items-center gap-1.5 text-xs text-slate-600">
                <Check size={12} className="text-emerald-500" /> Alle Basis-Tools
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-600">
                <Check size={12} className="text-emerald-500" /> Kostenlos nutzbar
              </li>
            </ul>
            {!isLoggedIn && (
              <SignInButton mode="modal" fallbackRedirectUrl="/chat">
                <button className="w-full rounded-xl border border-slate-300 bg-white py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-slate-400">
                  Mit Google anmelden
                </button>
              </SignInButton>
            )}
          </div>

          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(6,182,212,0.18), transparent 55%)' }}
            />
            <p className="relative mb-1 text-sm font-semibold text-slate-800">Premium werden</p>
            <ul className="relative mb-3 space-y-1">
              <li className="flex items-center gap-1.5 text-xs text-slate-700">
                <Check size={12} className="text-emerald-500" /> 200 Nachrichten am Tag, alle Werkzeuge
              </li>
              <li className="flex items-center gap-1.5 text-xs text-slate-700">
                <Check size={12} className="text-emerald-500" /> 4,99 € pro Monat
              </li>
            </ul>
            <button
              onClick={handleUpgrade}
              className="relative w-full rounded-xl bg-primary py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              disabled={isUpgrading}
            >
              {isUpgrading ? 'Weiterleitung…' : 'Jetzt upgraden'}
            </button>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-2 text-center text-sm text-red-600">{error}</div>
        )}

        <div className="border-t border-slate-100 px-6 py-3 text-center">
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600 hover:underline">
            Vielleicht später
          </button>
        </div>
      </div>
    </div>
  )
}
