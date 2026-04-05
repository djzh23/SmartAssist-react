import { useNavigate } from 'react-router-dom'
import {
  Target,
  Code2,
  Briefcase,
  Globe2,
  ArrowRight,
  ShieldCheck,
  Lock,
  HardDrive,
  TriangleAlert,
  Heart,
} from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: Target,
    accent: { soft: 'bg-violet-50', ring: 'border-violet-200', text: 'text-violet-700' },
    title: 'Interview Coaching',
    desc: 'Übe typische Fragen, formuliere stärkere Antworten und gehe entspannter ins Gespräch.',
    line: 'bg-violet-500',
  },
  {
    icon: Briefcase,
    accent: { soft: 'bg-emerald-50', ring: 'border-emerald-200', text: 'text-emerald-700' },
    title: 'Job Analyse',
    desc: 'Verstehe schnell, was in einer Stelle wirklich wichtig ist und worauf du deinen Lebenslauf ausrichten solltest.',
    line: 'bg-emerald-500',
  },
  {
    icon: Code2,
    accent: { soft: 'bg-indigo-50', ring: 'border-indigo-200', text: 'text-indigo-700' },
    title: 'Technik Training',
    desc: 'Trainiere Programmierfragen mit klaren Erklärungen und praktischen Codebeispielen.',
    line: 'bg-indigo-500',
  },
]

const QUICK_LINKS = [
  { icon: Target, tool: 'interview', label: 'Interview Coach', desc: 'Vorstellungsgespräche üben', accent: { soft: 'bg-violet-50', ring: 'border-violet-200', text: 'text-violet-700' } },
  { icon: Briefcase, tool: 'jobanalyzer', label: 'Job Analyzer', desc: 'Stellenanzeige prüfen', accent: { soft: 'bg-emerald-50', ring: 'border-emerald-200', text: 'text-emerald-700' } },
  { icon: Code2, tool: 'programming', label: 'Programming', desc: 'Technische Fragen', accent: { soft: 'bg-indigo-50', ring: 'border-indigo-200', text: 'text-indigo-700' } },
  { icon: Globe2, tool: 'language', label: 'Language', desc: 'Sprachen trainieren', accent: { soft: 'bg-amber-50', ring: 'border-amber-200', text: 'text-amber-700' } },
]

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    color: 'text-emerald-600',
    title: 'Vertrauenswürdig und anonym',
    desc: 'Du kannst mit einem Alias arbeiten. Deine Chat-Historie bleibt in deinem Browser.',
  },
  {
    icon: HardDrive,
    color: 'text-indigo-600',
    title: 'Lokale Verarbeitung',
    desc: 'Die technische Analyse deines Lebenslaufs läuft lokal im Browser auf deinem Gerät.',
  },
  {
    icon: Lock,
    color: 'text-sky-600',
    title: 'Nur technischer Kontext',
    desc: 'Für die Auswertung wird nur reduzierter technischer Kontext genutzt.',
  },
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
      {/* Decorative blobs — fixed so they stay visible regardless of scroll depth */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-violet-200/45 blur-3xl" />
        <div className="absolute -left-28 bottom-0 h-96 w-96 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-violet-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
        <div className="absolute bottom-32 left-16 h-16 w-16 rotate-6 rounded-xl border border-cyan-200/60 bg-white/30" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 rounded-3xl border border-slate-200/80 bg-white/85 p-7 text-center shadow-[0_14px_38px_rgba(15,23,42,0.10)] backdrop-blur">
          <div className="pointer-events-none absolute inset-0 rounded-3xl opacity-70" style={{
            backgroundImage: 'radial-gradient(circle at 70% 0%, rgba(124,58,237,0.07), transparent 55%)',
          }} />

          <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 text-xl font-bold text-violet-700 mb-5 shadow-sm">
            SA
          </div>
          <h1 className="relative text-3xl font-bold tracking-tight text-slate-800 mb-3">
            Dein KI Assistent für die Jobsuche
          </h1>
          <p className="relative text-sm text-slate-500 leading-relaxed max-w-md mx-auto">
            Bereite dich auf Interviews vor, analysiere Stellenanzeigen und arbeite gezielt an deinen technischen Antworten.
          </p>
          <button
            onClick={() => navigate('/chat?tool=interview')}
            className="relative mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors shadow-sm"
          >
            Jetzt starten
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Quick links */}
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
                  <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" style={{
                    backgroundImage: 'radial-gradient(circle at 80% 0%, rgba(124,58,237,0.06), transparent 55%)',
                  }} />
                  <div className={`relative flex h-9 w-9 items-center justify-center rounded-xl border ${link.accent.soft} ${link.accent.ring} mb-3`}>
                    <Icon size={16} strokeWidth={2} className={link.accent.text} />
                  </div>
                  <p className={`relative text-xs font-semibold ${link.accent.text}`}>{link.label}</p>
                  <p className="relative mt-0.5 text-[11px] text-slate-400 leading-snug">{link.desc}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Highlights */}
        <div className="mb-8">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Was SmartAssist für dich tut</h2>
          <div className="flex flex-col gap-3">
            {HIGHLIGHTS.map(card => {
              const Icon = card.icon
              return (
                <div
                  key={card.title}
                  className="relative overflow-hidden flex items-start gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 shadow-[0_6px_18px_rgba(15,23,42,0.07)] backdrop-blur"
                >
                  <div className="pointer-events-none absolute inset-0 opacity-80" style={{
                    backgroundImage: 'radial-gradient(circle at 92% 0%, rgba(124,58,237,0.06), transparent 50%)',
                  }} />
                  <div className={`relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border ${card.accent.soft} ${card.accent.ring}`}>
                    <Icon size={17} strokeWidth={2} className={card.accent.text} />
                  </div>
                  <div className="relative min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`h-4 w-0.5 rounded-full ${card.line}`} />
                      <h3 className="font-semibold text-slate-800 text-sm">{card.title}</h3>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Trust */}
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
                      <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11px] text-amber-800 leading-relaxed">
                <span className="inline-flex items-center gap-1 font-semibold">
                  <TriangleAlert size={13} />
                  Wichtiger Hinweis:
                </span>{' '}
                Bitte teile im Chat keine vertraulichen oder persönlichen Daten. Wenn du sensible Inhalte eingibst, passiert das auf eigene Verantwortung.
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-500 text-center inline-flex items-center justify-center gap-1.5 w-full">
              <Heart size={13} className="text-rose-500" />
              Mit Liebe und viel Glück auf deinem Weg.
            </p>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/tools')}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
          >
            Alle Tools ansehen
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
