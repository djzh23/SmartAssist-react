import { useNavigate } from 'react-router-dom'
import { Target, Code2, Briefcase, ArrowRight } from 'lucide-react'

const WHY_CARDS = [
  {
    icon: <Target className="text-primary" size={22} />,
    bg: 'bg-primary-light',
    title: 'Interview Coaching',
    desc: 'Structured AI feedback for behavioral and technical rounds — in German or English, with optional CV upload for personalized answers.',
  },
  {
    icon: <Briefcase className="text-amber-600" size={22} />,
    bg: 'bg-amber-50',
    title: 'Job Analysis',
    desc: 'Paste any job posting or URL. Get a breakdown of key requirements, ATS keywords, and tailored CV tips in seconds.',
  },
  {
    icon: <Code2 className="text-emerald-600" size={22} />,
    bg: 'bg-emerald-50',
    title: 'Technical Questions',
    desc: 'Ace coding interviews with syntax-highlighted examples in C#, Java, React, and more — plus design patterns and system design.',
  },
]

const QUICK_LINKS = [
  { label: 'Interview Coach', emoji: '🎯', tool: 'interview',   desc: 'Practice & prepare' },
  { label: 'Job Analyzer',    emoji: '💼', tool: 'jobanalyzer', desc: 'Analyze a posting' },
  { label: 'Programming',     emoji: '💻', tool: 'programming', desc: 'Technical questions' },
  { label: 'Language',        emoji: '🌍', tool: 'language',    desc: 'Learn a language' },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-12">

        {/* Hero */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-light text-3xl mb-5">
            🎯
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-3 tracking-tight">
            Your AI Career Assistant
          </h1>
          <p className="text-slate-400 leading-relaxed max-w-md mx-auto">
            Prepare for job interviews, analyze postings, and master technical questions — powered by Claude (Anthropic).
          </p>
          <button
            onClick={() => navigate('/chat?tool=interview')}
            className="mt-6 inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white rounded-xl px-6 py-3 font-semibold text-sm transition-colors"
          >
            Start preparing
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
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">What SmartAssist does</h2>
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
