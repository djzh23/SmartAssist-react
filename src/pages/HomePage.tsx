import { useNavigate } from 'react-router-dom'
import AppCtaButton from '../components/ui/AppCtaButton'
import {
  ArrowRight,
  BrainCircuit,
  Briefcase,
  Code2,
  Compass,
  Globe2,
  HardDrive,
  Heart,
  Lock,
  MessageSquareQuote,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
} from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: Target,
    accent: { soft: 'bg-amber-50', ring: 'border-amber-200', text: 'text-amber-700' },
    title: 'Interview Coaching',
    desc: 'Übe typische Fragen, formuliere stärkere Antworten und gehe entspannter ins Gespräch.',
    line: 'bg-amber-500',
  },
  {
    icon: Briefcase,
    accent: { soft: 'bg-emerald-50', ring: 'border-emerald-200', text: 'text-emerald-700' },
    title: 'Job Analyse',
    desc: 'Erkenne sofort, was in einer Stelle wirklich zählt und worauf du deinen Lebenslauf ausrichten solltest.',
    line: 'bg-emerald-500',
  },
  {
    icon: Code2,
    accent: { soft: 'bg-sky-50', ring: 'border-sky-200', text: 'text-sky-700' },
    title: 'Technik Training',
    desc: 'Trainiere technische Fragen mit präzisen Erklärungen und direkt nutzbaren Codebeispielen.',
    line: 'bg-sky-500',
  },
]

const QUICK_LINKS = [
  { icon: Target, tool: 'interviewprep', label: 'Interview Coach', desc: 'Vorstellungsgespräche üben', accent: { soft: 'bg-amber-50', ring: 'border-amber-200', text: 'text-amber-700' } },
  { icon: Briefcase, tool: 'jobanalyzer', label: 'Job Analyzer', desc: 'Stellenanzeige prüfen', accent: { soft: 'bg-emerald-50', ring: 'border-emerald-200', text: 'text-emerald-700' } },
  { icon: Code2, tool: 'programming', label: 'Programming', desc: 'Technische Fragen', accent: { soft: 'bg-sky-50', ring: 'border-sky-200', text: 'text-sky-700' } },
  { icon: Globe2, tool: 'language', label: 'Language', desc: 'Sprachen trainieren', accent: { soft: 'bg-amber-50', ring: 'border-amber-200', text: 'text-amber-700' } },
]

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    color: 'text-emerald-600',
    title: 'Vertrauenswürdig und anonym',
    desc: 'Du kannst jederzeit mit Alias arbeiten. Deine Chat-Historie bleibt in deinem Browser.',
  },
  {
    icon: HardDrive,
    color: 'text-sky-600',
    title: 'Lokale Verarbeitung',
    desc: 'Die technische Analyse deines Lebenslaufs läuft lokal im Browser auf deinem Gerät.',
  },
  {
    icon: Lock,
    color: 'text-amber-600',
    title: 'Nur technischer Kontext',
    desc: 'Für die Auswertung wird nur reduzierter technischer Kontext verwendet.',
  },
]

const HERO_CHIPS = [
  { icon: BrainCircuit, label: 'KI Fokus' },
  { icon: Compass, label: 'Klare Roadmap' },
  { icon: MessageSquareQuote, label: 'Direktes Feedback' },
]

export default function HomePage() {
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
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-amber-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-amber-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
        <div className="absolute bottom-32 left-16 h-16 w-16 rotate-6 rounded-xl border border-amber-200/60 bg-white/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-12">
        <div className="mb-10 rounded-3xl border border-slate-200/80 bg-white/85 p-7 text-center shadow-[0_14px_38px_rgba(15,23,42,0.10)] backdrop-blur">
          <div
            className="pointer-events-none absolute inset-0 rounded-3xl opacity-70"
            style={{ backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(6,182,212,0.10), transparent 55%)' }}
          />

          <div className="relative mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 shadow-sm">
            <Sparkles size={24} strokeWidth={2.2} />
          </div>

          <h1 className="relative mb-3 text-3xl font-bold tracking-tight text-slate-800">
            Dein KI-Assistent für die Jobsuche
          </h1>
          <p className="relative mx-auto max-w-md text-sm leading-relaxed text-slate-500">
            Bereite dich auf Interviews vor, analysiere Stellenanzeigen und trainiere Antworten strukturiert und praxisnah.
          </p>

          <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2">
            {HERO_CHIPS.map(item => {
              const Icon = item.icon
              return (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50/80 px-3 py-1 text-[11px] font-semibold text-amber-700"
                >
                  <Icon size={12} />
                  {item.label}
                </span>
              )
            })}
          </div>

          <AppCtaButton
            size="lg"
            onClick={() => navigate('/chat?tool=interviewprep')}
            className="relative mt-6"
          >
            Jetzt starten
            <ArrowRight size={16} />
          </AppCtaButton>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Schnellzugriff</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_LINKS.map(link => {
              const Icon = link.icon
              return (
                <button
                  key={link.tool}
                  onClick={() => navigate(`/chat?tool=${link.tool}`)}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-4 text-left shadow-[0_6px_18px_rgba(15,23,42,0.07)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.11)]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(6,182,212,0.10), transparent 55%)' }}
                  />
                  <div className={`relative mb-3 flex h-9 w-9 items-center justify-center rounded-xl border ${link.accent.soft} ${link.accent.ring}`}>
                    <Icon size={16} strokeWidth={2} className={link.accent.text} />
                  </div>
                  <p className={`relative text-xs font-semibold ${link.accent.text}`}>{link.label}</p>
                  <p className="relative mt-0.5 text-[11px] leading-snug text-slate-400">{link.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Was PrivatePrep für dich tut</h2>
          <div className="flex flex-col gap-3">
            {HIGHLIGHTS.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="relative flex items-start gap-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_6px_18px_rgba(15,23,42,0.07)] backdrop-blur"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-80"
                    style={{ backgroundImage: 'radial-gradient(circle at 92% 0%, rgba(6,182,212,0.09), transparent 50%)' }}
                  />
                  <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${card.accent.soft} ${card.accent.ring}`}>
                    <Icon size={17} strokeWidth={2} className={card.accent.text} />
                  </div>
                  <div className="relative min-w-0">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className={`h-4 w-0.5 rounded-full ${card.line}`} />
                      <h3 className="text-sm font-semibold text-slate-800">{card.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-slate-500">{card.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Vertrauen und Datenschutz</h2>
          <div className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_6px_18px_rgba(15,23,42,0.07)] backdrop-blur">
            <div className="flex flex-col gap-3">
              {TRUST_POINTS.map(item => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="flex items-start gap-2.5">
                    <Icon size={15} className={`mt-0.5 flex-shrink-0 ${item.color}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                      <p className="text-xs leading-relaxed text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] leading-relaxed text-amber-800">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <TriangleAlert size={13} />
                  Wichtiger Hinweis:
                </span>{' '}
                Bitte teile im Chat keine vertraulichen oder persönlichen Daten. Wenn du sensible Inhalte eingibst, passiert das auf eigene Verantwortung.
              </p>
            </div>

            <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-xs text-slate-500">
              <Heart size={13} className="text-rose-500" />
              Mit Liebe und viel Glück auf deinem Weg.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
