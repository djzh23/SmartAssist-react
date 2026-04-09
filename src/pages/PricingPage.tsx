import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { Check, ChevronDown, ChevronUp, Clock, Crown, Sparkles, X, Zap } from 'lucide-react'
import { createCheckoutSession } from '../services/StripeService'

interface Feature {
  text: string
  included: boolean
}

interface Plan {
  id: 'free' | 'premium' | 'pro'
  name: string
  price: string
  period: string
  icon: React.ReactNode
  accentBorder: string
  accentHeader: string
  badgeText?: string
  badgeStyle?: string
  features: Feature[]
  buttonLabel: string
  buttonStyle: string
  scale?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0 €',
    period: '/für immer',
    icon: <Zap size={18} className="text-slate-500" />,
    accentBorder: 'border-slate-200',
    accentHeader: 'bg-slate-50',
    features: [
      { text: '2 Antworten ohne Anmeldung', included: true },
      { text: '20 Antworten pro Tag nach Anmeldung', included: true },
      { text: 'Alle Tools (Wetter, Witze, Sprachen)', included: true },
      { text: 'Browser-Sitzungsspeicher', included: true },
      { text: 'Stellenanalyse', included: false },
      { text: 'Audio Aussprache', included: false },
      { text: 'Gesprächsverlauf', included: false },
    ],
    buttonLabel: 'Kostenlos starten',
    buttonStyle: 'border border-slate-300 text-slate-600 hover:border-slate-400 bg-white',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '4,99 €',
    period: '/Monat',
    icon: <Sparkles size={18} className="text-amber-600" />,
    accentBorder: 'border-amber-400',
    accentHeader: 'bg-amber-50',
    badgeText: 'BELIEBTESTE WAHL',
    badgeStyle: 'bg-primary text-white',
    scale: true,
    features: [
      { text: 'Alles aus Free', included: true },
      { text: '200 Antworten pro Tag', included: true },
      { text: 'Stellenanalyse Tool', included: true },
      { text: 'Audio Aussprache', included: true },
      { text: 'Gesprächsverlauf (30 Tage)', included: true },
      { text: 'Bevorzugte Antwortzeiten', included: true },
    ],
    buttonLabel: 'Premium starten',
    buttonStyle: 'bg-primary hover:bg-primary-hover text-white',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,99 €',
    period: '/Monat',
    icon: <Crown size={18} className="text-amber-600" />,
    accentBorder: 'border-amber-400',
    accentHeader: 'bg-amber-50',
    features: [
      { text: 'Alles aus Premium', included: true },
      { text: 'Unbegrenzte Antworten', included: true },
      { text: 'Vollständiger Gesprächsverlauf', included: true },
      { text: 'API-Zugang (demnächst)', included: true },
      { text: 'Frühzugang zu neuen Tools', included: true },
    ],
    buttonLabel: 'Pro werden',
    buttonStyle: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
]

const FAQ = [
  {
    q: 'Kann ich jederzeit kündigen?',
    a: 'Ja, mit einem Klick kündigen. Keine Fragen, keine versteckten Gebühren.',
  },
  {
    q: 'Sind meine Daten sicher?',
    a: 'Alle Daten bleiben in deinem Browser. Wir speichern keinen persönlichen Chatverlauf auf unseren Servern.',
  },
  {
    q: 'Welche Zahlungsmethoden werden akzeptiert?',
    a: 'Kredit- und Debitkarte über Stripe. Weitere Methoden folgen bald.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <button
      onClick={() => setOpen(prev => !prev)}
      className="w-full rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-4 text-left shadow-[0_4px_12px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-200 hover:shadow-[0_8px_20px_rgba(15,23,42,0.09)]"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-slate-800">{q}</span>
        {open
          ? <ChevronUp size={16} className="flex-shrink-0 text-slate-400" />
          : <ChevronDown size={16} className="flex-shrink-0 text-slate-400" />}
      </div>
      {open && (
        <p className="mt-2 text-sm leading-relaxed text-slate-500">{a}</p>
      )}
    </button>
  )
}

export default function PricingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { openSignIn } = useClerk()
  const { getToken } = useAuth()
  const { user, isSignedIn, isLoaded } = useUser()

  const [loadingPlan, setLoadingPlan] = useState<'premium' | 'pro' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const email = useMemo(
    () => user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? null,
    [user],
  )
  const checkoutCancelled = (searchParams.get('cancelled') ?? '').toLowerCase() === 'true'

  const handleUpgrade = async (plan: 'premium' | 'pro') => {
    if (!isSignedIn) {
      try {
        await openSignIn()
      } catch {
        alert('Please sign in first to upgrade')
      }
      return
    }

    setLoadingPlan(plan)
    setError(null)

    try {
      if (!email) {
        throw new Error('Please add an email address to your Clerk profile first.')
      }

      const token = await getToken()
      if (!token) {
        throw new Error('Could not create authenticated checkout session. Please sign in again.')
      }

      if (!user?.id) {
        throw new Error('Missing user profile ID. Please reload and try again.')
      }

      const checkoutUrl = await createCheckoutSession(plan, email, {
        token,
        userId: user.id,
      })
      window.location.href = checkoutUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleFreeClick = () => {
    navigate('/chat')
    setToast('Free-Plan ausgewählt. Du kannst direkt im Chat loslegen.')
    window.setTimeout(() => setToast(null), 3000)
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f5f6fb]">
        <Clock size={22} className="animate-pulse text-slate-400" />
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
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-amber-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-2xl border border-amber-200 bg-white px-5 py-3 shadow-xl">
          <p className="text-sm font-medium text-slate-700">{toast}</p>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-500">Preise &amp; Pläne</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
            Einfach. Transparent. Fair.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Starte kostenlos und upgrade wenn du bereit bist. Kein Abo-Trick, keine versteckten Kosten.
          </p>
        </div>

        {checkoutCancelled && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Der Checkout wurde abgebrochen.
          </div>
        )}

        {error && (
          <p style={{ color: 'red', textAlign: 'center', marginTop: '16px', fontSize: '14px' }}>
            {error}
          </p>
        )}

        <div className="mb-14 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-start">
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className={[
                'relative overflow-hidden rounded-3xl border-2 bg-white/90 shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-200',
                plan.accentBorder,
                plan.scale ? 'md:scale-[1.03] md:shadow-[0_18px_44px_rgba(124,58,237,0.18)]' : '',
              ].join(' ')}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-80"
                style={{
                  backgroundImage: 'radial-gradient(circle at 88% 0%, rgba(124,58,237,0.07), transparent 50%)',
                }}
              />

              <div className={`relative px-5 pt-5 pb-4 ${plan.accentHeader}`}>
                {plan.badgeText && (
                  <span className={`mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${plan.badgeStyle}`}>
                    {plan.badgeText}
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white">
                    {plan.icon}
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">{plan.name}</h2>
                </div>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
              </div>

              <div className="relative space-y-2.5 px-5 py-4">
                {plan.features.map(f => (
                  <div key={f.text} className="flex items-start gap-2.5">
                    {f.included
                      ? <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                      : <X size={14} className="mt-0.5 flex-shrink-0 text-slate-300" />}
                    <span className={`text-xs leading-snug ${f.included ? 'text-slate-700' : 'text-slate-400'}`}>
                      {f.text}
                    </span>
                  </div>
                ))}
              </div>

              <div className="relative px-5 pb-5">
                <button
                  onClick={() => {
                    if (plan.id === 'free') {
                      handleFreeClick()
                      return
                    }
                    void handleUpgrade(plan.id)
                  }}
                  disabled={loadingPlan === plan.id}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${plan.buttonStyle}`}
                >
                  {plan.id === 'premium' && (loadingPlan === 'premium' ? 'Wird weitergeleitet…' : 'Premium starten')}
                  {plan.id === 'pro' && (loadingPlan === 'pro' ? 'Wird weitergeleitet…' : 'Pro werden')}
                  {plan.id === 'free' && plan.buttonLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            Häufige Fragen
          </h2>
          <div className="space-y-3">
            {FAQ.map(item => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

