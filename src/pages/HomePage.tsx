import { useNavigate } from 'react-router-dom'
import { Zap, Briefcase, Globe, ArrowRight } from 'lucide-react'

const WHY_CARDS = [
  {
    icon: <Zap className="text-primary" size={22} />,
    bg: 'bg-primary-light',
    title: 'AI-Powered',
    desc: 'Claude (Anthropic) handles all conversations — fast, accurate, context-aware.',
  },
  {
    icon: <Briefcase className="text-amber-600" size={22} />,
    bg: 'bg-amber-50',
    title: 'Specialized Tools',
    desc: 'Weather, Job Analyzer, Jokes, Language Learning — each with its own focused mode.',
  },
  {
    icon: <Globe className="text-emerald-600" size={22} />,
    bg: 'bg-emerald-50',
    title: 'Learn While You Chat',
    desc: 'The Language Learning mode translates messages live and teaches vocabulary as you go.',
  },
]

const QUICK_LINKS = [
  { label: 'Job Analyzer', emoji: '💼', tool: 'jobanalyzer', desc: 'Analyze a job posting' },
  { label: 'Weather',      emoji: '🌤️', tool: 'weather',     desc: 'Check any city' },
  { label: 'Language',     emoji: '🌍', tool: 'language',    desc: 'Learn a new language' },
  { label: 'Jokes',        emoji: '😄', tool: 'jokes',       desc: 'Get a laugh' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light text-3xl mb-5">
            ⚡
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
            Welcome to SmartAssist
          </h1>
          <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
            Your AI-powered assistant for weather, job analysis, language learning, and more.
          </p>
          <button
            onClick={() => navigate('/chat')}
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors"
          >
            Start chatting
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Quick access */}
        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Quick Access</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {QUICK_LINKS.map(l => (
              <button
                key={l.tool}
                onClick={() => navigate(`/chat?tool=${l.tool}`)}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-200 hover:border-primary/40 hover:bg-primary-light/50 transition-all duration-150 group"
              >
                <span className="text-2xl">{l.emoji}</span>
                <span className="text-xs font-semibold text-slate-700 group-hover:text-primary">{l.label}</span>
                <span className="text-[11px] text-slate-400">{l.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Why SmartAssist */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Why SmartAssist?</h2>
          <div className="flex flex-col gap-3">
            {WHY_CARDS.map(c => (
              <div key={c.title} className="flex items-start gap-4 p-4 rounded-xl border border-slate-100 bg-white hover:shadow-chat transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${c.bg}`}>
                  {c.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-700 text-sm mb-0.5">{c.title}</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => navigate('/tools')}
            className="text-sm text-primary hover:underline font-medium"
          >
            Explore all tools →
          </button>
        </div>
      </div>
    </div>
  )
}
