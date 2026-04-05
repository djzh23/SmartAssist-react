import { useNavigate } from 'react-router-dom'
import {
  Target,
  Code2,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Lock,
  HardDrive,
  TriangleAlert,
  Heart,
} from 'lucide-react'

const HIGHLIGHTS = [
  {
    icon: <Target className="text-primary" size={22} />,
    bg: 'bg-primary-light',
    title: 'Interview Coaching',
    desc: 'Übe typische Fragen, formuliere stärkere Antworten und gehe entspannter ins Gespräch.',
  },
  {
    icon: <Briefcase className="text-amber-600" size={22} />,
    bg: 'bg-amber-50',
    title: 'Job Analyse',
    desc: 'Verstehe schnell, was in einer Stelle wirklich wichtig ist und worauf du deinen Lebenslauf ausrichten solltest.',
  },
  {
    icon: <Code2 className="text-emerald-600" size={22} />,
    bg: 'bg-emerald-50',
    title: 'Technik Training',
    desc: 'Trainiere Programmierfragen mit klaren Erklärungen und praktischen Codebeispielen.',
  },
]

const QUICK_LINKS = [
  { label: 'Interview Coach', badge: 'IC', tool: 'interview', desc: 'Vorstellungsgespräche üben' },
  { label: 'Job Analyzer', badge: 'JA', tool: 'jobanalyzer', desc: 'Stellenanzeige prüfen' },
  { label: 'Programming', badge: 'DEV', tool: 'programming', desc: 'Technische Fragen' },
  { label: 'Language', badge: 'LANG', tool: 'language', desc: 'Sprachen trainieren' },
]

const TRUST_POINTS = [
  {
    icon: <ShieldCheck size={15} className="text-emerald-600" />,
    title: 'Vertrauenswürdig und anonym',
    desc: 'Du kannst mit einem Alias arbeiten. Deine Chat-Historie bleibt in deinem Browser.',
  },
  {
    icon: <HardDrive size={15} className="text-indigo-600" />,
    title: 'Lokale Verarbeitung',
    desc: 'Die technische Analyse deines Lebenslaufs läuft lokal im Browser auf deinem Gerät.',
  },
  {
    icon: <Lock size={15} className="text-sky-600" />,
    title: 'Nur technischer Kontext',
    desc: 'Für die Auswertung wird nur reduzierter technischer Kontext genutzt.',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light text-2xl font-semibold text-primary mb-5">
            SA
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Dein KI Assistent für die Jobsuche</h1>
          <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
            Bereite dich auf Interviews vor, analysiere Stellenanzeigen und arbeite gezielt an deinen technischen Antworten.
          </p>
          <button
            onClick={() => navigate('/chat?tool=interview')}
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors"
          >
            Jetzt starten
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Schnellzugriff</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(link => (
              <button
                key={link.tool}
                onClick={() => navigate(`/chat?tool=${link.tool}`)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-primary-light/50 transition-all duration-150 group"
              >
                <span className="text-xs font-bold text-primary bg-primary-light rounded-md px-2 py-0.5">{link.badge}</span>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-primary">{link.label}</span>
                <span className="text-[11px] text-slate-400 text-center">{link.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Was SmartAssist für dich tut</h2>
          <div className="flex flex-col gap-3">
            {HIGHLIGHTS.map(card => (
              <div key={card.title} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-chat transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${card.bg}`}>
                  {card.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 text-sm mb-0.5">{card.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Vertrauen und Datenschutz</h2>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-col gap-3">
              {TRUST_POINTS.map(item => (
                <div key={item.title} className="flex items-start gap-2.5">
                  <span className="mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-700">{item.title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
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

        <div className="mt-10 text-center">
          <button onClick={() => navigate('/tools')} className="text-sm text-primary hover:underline font-medium">
            Alle Tools ansehen {'->'}
          </button>
        </div>
      </div>
    </div>
  )
}