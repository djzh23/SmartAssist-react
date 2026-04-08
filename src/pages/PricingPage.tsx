import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SignInButton, SignUpButton, useAuth, useClerk, useUser } from '@clerk/clerk-react'
import { Check, ChevronDown, ChevronUp, Clock, Crown, LayoutGrid, Sparkles, X, Zap } from 'lucide-react'
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
    price: '0 â‚¬',
    period: '/forever',
    icon: <Zap size={18} className="text-slate-500" />,
    accentBorder: 'border-slate-200',
    accentHeader: 'bg-slate-50',
    features: [
      { text: '2 responses without login', included: true },
      { text: '20 responses/day after login', included: true },
      { text: 'All tools (Weather, Jokes, Language)', included: true },
      { text: 'Browser session memory', included: true },
      { text: 'Job Analyzer', included: false },
      { text: 'ElevenLabs Audio', included: false },
      { text: 'Conversation history', included: false },
    ],
    buttonLabel: 'Get Started',
    buttonStyle: 'border border-slate-300 text-slate-600 hover:border-slate-400 bg-white',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '4,99 â‚¬',
    period: '/month',
    icon: <Sparkles size={18} className="text-cyan-600" />,
    accentBorder: 'border-cyan-400',
    accentHeader: 'bg-cyan-50',
    badgeText: 'MOST POPULAR',
    badgeStyle: 'bg-primary text-white',
    scale: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: '200 responses/day', included: true },
      { text: 'Job Analyzer tool', included: true },
      { text: 'ElevenLabs Audio', included: true },
      { text: 'Conversation history (30 days)', included: true },
      { text: 'Priority responses', included: true },
    ],
    buttonLabel: 'Start Premium',
    buttonStyle: 'bg-primary hover:bg-primary-hover text-white',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,99 â‚¬',
    period: '/month',
    icon: <Crown size={18} className="text-amber-600" />,
    accentBorder: 'border-amber-400',
    accentHeader: 'bg-amber-50',
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Unlimited responses', included: true },
      { text: 'Full conversation history', included: true },
      { text: 'API access (coming soon)', included: true },
      { text: 'Early access to new tools', included: true },
    ],
    buttonLabel: 'Go Pro',
    buttonStyle: 'bg-amber-500 hover:bg-amber-600 text-white',
  },
]

const FAQ = [
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, cancel with one click. No questions asked, no hidden fees.',
  },
  {
    q: 'Is my data safe?',
    a: 'All data stays in your browser. We never store personal chat history on our servers.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'Credit card and debit card via Stripe. More methods coming soon.',
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

function PricingNav() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
      <div className="flex h-full max-w-[1200px] items-center justify-between mx-auto px-6">
        <a href="/" className="flex items-center gap-2">
          <span className="text-xl">⚡</span>
          <span className="text-lg font-bold text-slate-800">SmartAssist</span>
        </a>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block"
          >
            Startseite
          </a>
          {isLoaded && isSignedIn ? (
            <button
              onClick={() => navigate('/tools')}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              <LayoutGrid size={15} />
              Alle Werkzeuge
            </button>
          ) : (
            <>
              <SignInButton mode="modal" fallbackRedirectUrl="/tools">
                <button className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-slate-400">
                  Anmelden
                </button>
              </SignInButton>
              <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                <button className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover">
                  Jetzt starten
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </div>
    </nav>
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
    setToast('Free plan selected. You can start directly in the chat.')
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
      className="relative min-h-screen overflow-y-auto"
      style={{
        backgroundColor: '#f5f6fb',
        backgroundImage:
          'linear-gradient(to right, rgba(100,116,139,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.09) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      <PricingNav />

      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-cyan-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up rounded-2xl border border-cyan-200 bg-white px-5 py-3 shadow-xl">
          <p className="text-sm font-medium text-slate-700">{toast}</p>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12 pt-28">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-500">Preise & PlÃ¤ne</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
            Einfach. Transparent. Fair.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Starte kostenlos und upgrade wenn du bereit bist. Kein Abo-Trick, keine versteckten Kosten.
          </p>
        </div>

        {checkoutCancelled && (
          <div className="mx-auto mb-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Checkout was cancelled.
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
                  {plan.id === 'premium' && (loadingPlan === 'premium' ? 'Redirecting...' : 'Start Premium')}
                  {plan.id === 'pro' && (loadingPlan === 'pro' ? 'Redirecting...' : 'Go Pro')}
                  {plan.id === 'free' && plan.buttonLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">
            HÃ¤ufige Fragen
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

