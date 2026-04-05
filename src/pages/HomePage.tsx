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

const WHY_CARDS = [
  {
    icon: <Target className="text-primary" size={22} />,
    bg: 'bg-primary-light',
    title: 'Interview Coaching',
    desc: 'Structured AI feedback for behavioral and technical rounds in German or English with optional CV context.',
  },
  {
    icon: <Briefcase className="text-amber-600" size={22} />,
    bg: 'bg-amber-50',
    title: 'Job Analysis',
    desc: 'Paste a job posting or URL and get key requirements, ATS signals, and practical CV tips.',
  },
  {
    icon: <Code2 className="text-emerald-600" size={22} />,
    bg: 'bg-emerald-50',
    title: 'Technical Questions',
    desc: 'Practice coding interview topics with focused answers and syntax-highlighted examples.',
  },
]

const QUICK_LINKS = [
  { label: 'Interview Coach', badge: 'IC', tool: 'interview', desc: 'Practice and prepare' },
  { label: 'Job Analyzer', badge: 'JA', tool: 'jobanalyzer', desc: 'Analyze a posting' },
  { label: 'Programming', badge: 'DEV', tool: 'programming', desc: 'Technical questions' },
  { label: 'Language', badge: 'LANG', tool: 'language', desc: 'Learn a language' },
]

const TRUST_POINTS = [
  {
    icon: <ShieldCheck size={15} className="text-emerald-600" />,
    title: 'Vertrauenswuerdig und anonym',
    desc: 'Du kannst mit Alias arbeiten. Chat-Verlauf bleibt lokal im Browser deines Geraets.',
  },
  {
    icon: <HardDrive size={15} className="text-indigo-600" />,
    title: 'Lokale CV-Verarbeitung',
    desc: 'PDF-Auslesen und Profilbildung passieren lokal im Browser und auf deinem Geraet.',
  },
  {
    icon: <Lock size={15} className="text-sky-600" />,
    title: 'Nur technischer Kontext',
    desc: 'Fuer die Interview-Hilfe wird nur reduzierter technischer Kontext verwendet.',
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
          <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">Your AI Career Assistant</h1>
          <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
            Prepare for interviews, analyze postings, and improve your technical confidence.
          </p>
          <button
            onClick={() => navigate('/chat?tool=interview')}
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors"
          >
            Start preparing
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Access</h2>
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">What SmartAssist does</h2>
          <div className="flex flex-col gap-3">
            {WHY_CARDS.map(card => (
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
                Bitte teile im Chat keine vertraulichen oder persoenlichen Daten. Das erfolgt immer auf eigene Verantwortung.
              </p>
            </div>

            <p className="mt-3 text-xs text-slate-500 text-center inline-flex items-center justify-center gap-1.5 w-full">
              <Heart size={13} className="text-rose-500" />
              Mit Liebe und viel Glueck in deiner Journey.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <button onClick={() => navigate('/tools')} className="text-sm text-primary hover:underline font-medium">
            Explore all tools {'->'}
          </button>
        </div>
      </div>
    </div>
  )
}
