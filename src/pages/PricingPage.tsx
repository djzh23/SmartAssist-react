import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, ChevronDown, ChevronUp, Zap, Crown, Sparkles } from 'lucide-react'

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
    price: '0€',
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
    price: '4,99€',
    period: '/month',
    icon: <Sparkles size={18} className="text-violet-600" />,
    accentBorder: 'border-violet-400',
    accentHeader: 'bg-violet-50',
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
    price: '9,99€',
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
      className="w-full text-left rounded-2xl border border-slate-200/90 bg-white/90 px-5 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] backdrop-blur transition-all duration-200 hover:shadow-[0_8px_20px_rgba(15,23,42,0.09)]"
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
      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-violet-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-violet-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-500">Preise & Pläne</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-800 md:text-4xl">
            Einfach. Transparent. Fair.
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
            Starte kostenlos und upgrade wenn du bereit bist. Kein Abo-Trick, keine versteckten Kosten.
          </p>
        </div>

        {/* Plan cards */}
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
              {/* Radial glow */}
              <div className="pointer-events-none absolute inset-0 opacity-80" style={{
                backgroundImage: 'radial-gradient(circle at 88% 0%, rgba(124,58,237,0.07), transparent 50%)',
              }} />

              {/* Header */}
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

              {/* Features */}
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

              {/* CTA */}
              <div className="relative px-5 pb-5">
                <button
                  onClick={() => navigate('/')}
                  className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${plan.buttonStyle}`}
                >
                  {plan.buttonLabel}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
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
