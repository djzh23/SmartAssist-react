import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { Check, Loader2, Play, RotateCcw, Send } from 'lucide-react'
import { askAgentDemo, fetchDemoTtsAudio } from '../api/client'
import LearningResponse from '../components/chat/LearningResponse'
import { parseLearningResponse } from '../utils/parseLearningResponse'
import '../styles/landing.css'

// ── Section Divider ──────────────────────────────────────────────────────────

function SectionDivider({
  from,
  to,
  dark = false,
}: {
  from: string
  to: string
  dark?: boolean
}) {
  const rgb = dark ? '255,255,255' : '124,58,237'
  const stroke = `rgba(${rgb},0.18)`
  const dot = `rgba(${rgb},0.28)`
  return (
    <div
      className="relative h-12 w-full overflow-hidden"
      style={{ background: `linear-gradient(to bottom, ${from}, ${to})` }}
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 48"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Top fine rule */}
        <line x1="0" y1="14" x2="1440" y2="14" stroke={stroke} strokeWidth="0.5" />
        {/* Center dashed rule */}
        <line x1="0" y1="24" x2="1440" y2="24" stroke={stroke} strokeWidth="0.75" strokeDasharray="6 6" />
        {/* Bottom fine rule */}
        <line x1="0" y1="34" x2="1440" y2="34" stroke={stroke} strokeWidth="0.5" />
        {/* Repeating diamonds on center line */}
        {Array.from({ length: 36 }).map((_, i) => (
          <polygon
            key={i}
            points={`${i * 40 + 20},17 ${i * 40 + 27},24 ${i * 40 + 20},31 ${i * 40 + 13},24`}
            fill="none"
            stroke={dot}
            strokeWidth="0.75"
          />
        ))}
        {/* Dots between diamonds */}
        {Array.from({ length: 35 }).map((_, i) => (
          <circle key={`c${i}`} cx={i * 40 + 40} cy={24} r={1.2} fill={dot} />
        ))}
      </svg>
    </div>
  )
}

// ── Navbar ───────────────────────────────────────────────────────────────────

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const navH = window.innerWidth >= 640 ? 64 : 56
  const top = el.getBoundingClientRect().top + window.scrollY - navH
  window.scrollTo({ top, behavior: 'smooth' })
}

function LandingNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] h-14 border-b border-violet-100/50 bg-white/95 shadow-sm backdrop-blur-md sm:h-16">
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/favicon.png" alt="SmartAssist" className="h-7 w-7 flex-shrink-0 rounded-xl sm:h-8 sm:w-8" />
          <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-base font-bold text-transparent sm:text-lg">SmartAssist</span>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={() => scrollTo('pricing')}
            className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-primary sm:block"
          >
            Preise
          </button>
          <SignInButton mode="modal" fallbackRedirectUrl="/tools">
            <button className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-all hover:border-violet-200 hover:text-primary sm:px-4 sm:py-2 sm:text-sm">
              Anmelden
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
            <button className="rounded-xl bg-gradient-to-r from-primary to-violet-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-200 transition-all hover:shadow-lg sm:px-4 sm:py-2 sm:text-sm">
              Jetzt starten
            </button>
          </SignUpButton>
        </div>
      </div>
    </nav>
  )
}

// ── Chat Mockup (decorative) ──────────────────────────────────────────────────

function ChatMockup() {
  const [showTyping, setShowTyping] = useState(true)

  useEffect(() => {
    const id = window.setInterval(() => setShowTyping(v => !v), 3000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="relative mx-auto max-w-[340px]">
      <div className="-rotate-2 overflow-hidden rounded-[22px] bg-white shadow-[0_24px_80px_rgba(124,58,237,0.22)]">
        <div className="flex items-center justify-between bg-gradient-to-r from-primary to-violet-500 px-4 py-3">
          <span className="text-sm font-bold text-white">⚡ SmartAssist</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            <span className="text-xs text-white/80">Online</span>
          </div>
        </div>
        <div className="space-y-3 bg-slate-50 p-4">
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs text-white">⚡</div>
            <div className="max-w-[200px] rounded-[12px_12px_12px_4px] bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
              ¡Hola! Ich sehe du lernst Spanisch 🌍
            </div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[200px] rounded-[12px_12px_4px_12px] bg-gradient-to-r from-primary to-violet-500 px-3 py-2 text-xs text-white">
              Ja! Wie sagt man "Guten Morgen"?
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs text-white">⚡</div>
            <div className="max-w-[200px] rounded-[12px_12px_12px_4px] border-l-[3px] border-l-primary bg-white px-3 py-2 text-xs shadow-sm">
              <p className="font-semibold text-slate-800">🌍 Buenos días</p>
              <p className="text-slate-600">🇩🇪 Guten Morgen</p>
              <p className="mt-1 text-[10px] text-amber-600">💡 "buenos" = gut, "días" = Tage</p>
            </div>
          </div>
          {showTyping && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-violet-500 text-xs text-white">⚡</div>
              <div className="rounded-[12px_12px_12px_4px] bg-white px-3 py-3 shadow-sm">
                <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
          <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">Schreib eine Nachricht…</div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <Send size={12} className="text-white" />
          </div>
        </div>
      </div>
      {/* Floating score card */}
      <div className="absolute -bottom-6 right-0 rotate-2 flex items-center gap-2.5 rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.14)]">
        <span className="text-2xl">🎯</span>
        <div>
          <p className="text-xs font-semibold text-slate-800">Interview Coach</p>
          <p className="text-[10px] text-emerald-500">3 Fragen vorbereitet</p>
        </div>
      </div>
    </div>
  )
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      id="hero"
      className="relative flex flex-col justify-center overflow-hidden pt-14 scroll-mt-14 sm:pt-16 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #FFFDF5 0%, #F7F0FF 55%, #EDE9FE 100%)', minHeight: '100svh' }}
    >
      {/* Tile dot pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.1) 1.5px, transparent 1.5px)', backgroundSize: '36px 36px' }}
      />

      {/* Geometric decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Soft blobs */}
        <div className="absolute -right-32 -top-16 h-[520px] w-[520px] rounded-full bg-violet-300/25 blur-[100px]" />
        <div className="absolute -bottom-24 -left-24 h-[380px] w-[380px] rounded-full bg-amber-200/30 blur-[80px]" />
        <div className="absolute right-1/3 top-1/2 h-[220px] w-[220px] rounded-full bg-cyan-200/20 blur-[60px]" />
        {/* Sharp triangle */}
        <div className="absolute left-[7%] top-[28%] h-14 w-14 bg-amber-400/18" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        {/* Diamond */}
        <div className="absolute bottom-[28%] right-[10%] h-10 w-10 rotate-45 rounded-sm bg-violet-400/22" />
        {/* Ring */}
        <div className="absolute right-[18%] top-[20%] h-8 w-8 rounded-full border-2 border-violet-400/30" />
        <div className="absolute left-[12%] bottom-[35%] h-16 w-16 rounded-full border border-amber-400/20" />
        {/* Hexagon */}
        <div className="absolute left-[18%] bottom-[18%] h-11 w-11 bg-cyan-400/15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        {/* Small diamond ring */}
        <div className="absolute right-[30%] top-[35%] h-6 w-6 rotate-45 border border-amber-300/30" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pb-16 pt-16 md:grid-cols-2 md:min-h-[calc(100vh-64px)]">
        {/* Left: copy */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-700">
            ✨ Angetrieben von Claude KI
          </div>

          <h1 className="mb-5 text-[clamp(36px,5vw,60px)] font-bold leading-[1.1] text-slate-900">
            Dein intelligenter
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-500 to-violet-400 bg-clip-text text-transparent">
              KI Assistent
            </span>
          </h1>

          <p className="mb-8 max-w-[480px] text-lg leading-relaxed text-slate-500">
            Fünf spezialisierte KI Werkzeuge für Karriere, Lernen und Alltag, vereint in einer einzigen übersichtlichen Oberfläche.
          </p>

          <div className="mb-7 flex flex-wrap items-center gap-3">
            <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
              <button className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-primary to-violet-500 px-7 text-base font-semibold text-white shadow-lg shadow-violet-300/50 transition-all hover:scale-[1.02] hover:shadow-xl">
                Kostenlos starten
                <span className="opacity-80">→</span>
              </button>
            </SignUpButton>
            <button
              type="button"
              onClick={() => scrollTo('demo')}
              className="flex h-12 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white/80 px-6 text-base font-medium text-slate-600 backdrop-blur-sm transition-all hover:border-violet-200 hover:bg-violet-50 hover:text-primary"
            >
              <Play size={15} className="text-primary" />
              Demo ansehen
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-400">
            <span>✅ Kostenlos starten</span>
            <span className="hidden sm:inline">·</span>
            <span>✅ Keine Kreditkarte</span>
            <span className="hidden sm:inline">·</span>
            <span>✅ Sofort loslegen</span>
          </div>
        </div>

        {/* Right: chat mockup */}
        <div className="hidden items-center justify-center py-16 md:flex">
          <ChatMockup />
        </div>
      </div>
    </section>
  )
}

// ── Features Section ──────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: '💬',
    color: '#64748B',
    iconBg: 'bg-slate-100',
    title: 'General Chat',
    desc: 'Frei chatten, Texte schärfen, Fragen klären. Dein offener KI-Assistent für alles, was keine feste Kategorie braucht.',
    chip: 'Wie formuliere ich das professioneller?',
    highlight: false,
  },
  {
    icon: '💼',
    color: '#10B981',
    iconBg: 'bg-emerald-50',
    title: 'Job Analyzer',
    desc: 'Stellenanzeige einfügen und sofort sehen, worauf es ankommt: Muss-Kriterien, wichtige Keywords und klarer Lebenslauf-Fokus.',
    chip: 'Analysiere diese Stelle: [Text einfügen]',
    highlight: false,
  },
  {
    icon: '🎯',
    color: '#06B6D4',
    iconBg: 'bg-cyan-50',
    title: 'Interview Coach',
    desc: 'Gezielt auf Vorstellungsgespräche vorbereiten. Mit realistischen Fragen, Antwortstrategien und konkretem Feedback.',
    chip: 'Gib mir 5 Fragen für diese Stelle',
    highlight: true,
    badge: 'Karriere',
  },
  {
    icon: '💻',
    color: '#3B82F6',
    iconBg: 'bg-sky-50',
    title: 'Programmierung',
    desc: 'Code reviewen, Bugs finden, Algorithmen verstehen. Für alle Sprachen, von JavaScript bis Python, von Anfänger bis Senior.',
    chip: 'Was ist falsch in meinem Code?',
    highlight: false,
  },
  {
    icon: '🌍',
    color: '#F59E0B',
    iconBg: 'bg-amber-50',
    title: 'Sprachen lernen',
    desc: 'Lerne mit natürlichen Gesprächen. Übersetzung, Grammatik und echte Audio-Aussprache mit neutralen KI-Stimmen.',
    chip: '🔊 Aussprache hören + Grammatiktipp',
    highlight: false,
    badge: 'Audio',
  },
] as const

function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #EDE9FE 0%, #F5F0FF 40%, #FFFFFF 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.08) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
      />

      {/* Geometric decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-0 h-[300px] w-[300px] rounded-full bg-violet-200/20 blur-[80px]" />
        <div className="absolute -left-10 bottom-0 h-[250px] w-[250px] rounded-full bg-amber-200/20 blur-[60px]" />
        <div className="absolute right-[7%] top-[18%] h-14 w-14 bg-violet-400/10" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute left-[5%] top-[55%] h-9 w-9 bg-amber-400/15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute right-[14%] bottom-[18%] h-16 w-16 rounded-full border-2 border-violet-300/20" />
        <div className="absolute left-[9%] top-[28%] h-8 w-8 rounded-full border-2 border-amber-400/18" />
        <div className="absolute left-[20%] bottom-[10%] h-8 w-8 rotate-45 border border-violet-400/20" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1100px]">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-violet-600">
            Werkzeuge
          </div>
          <h2 className="mb-3 text-[clamp(28px,4vw,44px)] font-bold text-slate-900">
            Alles was du brauchst
          </h2>
          <p className="text-lg text-slate-500">Fünf spezialisierte Werkzeuge, eine klare Oberfläche</p>
        </div>

        {/* Mobile: horizontal snap-scroll  |  sm+: 2-col  |  lg+: 3-col */}
        <div className={[
          'flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide',
          '-mx-6 px-6',
          'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-x-visible sm:pb-0 sm:snap-none',
          'lg:grid-cols-3',
        ].join(' ')}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className={[
                'w-[78vw] max-w-[300px] flex-shrink-0 snap-center',
                'sm:w-auto sm:max-w-none',
                'group relative cursor-default overflow-hidden rounded-2xl border bg-white/90 p-6 backdrop-blur-sm transition-all duration-200 hover:-translate-y-1.5',
                f.highlight ? 'border-primary/40 shadow-lg shadow-violet-100' : 'border-white shadow-sm',
              ].join(' ')}
            >
              {/* Warm glow on hover */}
              <div
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: `${f.color}30` }}
              />
              {'badge' in f && f.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {f.badge}
                </span>
              )}
              <div className={`relative z-10 mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${f.iconBg}`}>
                {f.icon}
              </div>
              <h3 className="relative z-10 mb-2 text-base font-bold text-slate-800">{f.title}</h3>
              <p className="relative z-10 mb-4 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              <span className="relative z-10 inline-flex items-center rounded-xl bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-500">
                {f.chip}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Live Demo Section ─────────────────────────────────────────────────────────

interface DemoMessage {
  role: 'user' | 'assistant'
  text: string
  ts?: string
}

type DemoTool = 'language' | 'job' | 'interview' | 'programming' | 'general'

interface DemoToolConfig {
  emoji: string
  label: string
  placeholder: string
  chip: string
}

const DEMO_TOOL_CONFIG: Record<DemoTool, DemoToolConfig> = {
  language: {
    emoji: '🌍',
    label: 'Sprachen',
    placeholder: 'Schreib auf Deutsch…',
    chip: 'Wie sage ich "Ich suche einen neuen Job" auf Spanisch?',
  },
  job: {
    emoji: '💼',
    label: 'Job',
    placeholder: 'Stellenanforderung eingeben…',
    chip: 'Analysiere: Senior Developer, TypeScript, 5+ Jahre Erfahrung',
  },
  interview: {
    emoji: '🎯',
    label: 'Interview',
    placeholder: 'Zielposition eingeben…',
    chip: 'Welche Fragen bekomme ich als Frontend-Entwickler?',
  },
  programming: {
    emoji: '💻',
    label: 'Code',
    placeholder: 'Code oder Frage eingeben…',
    chip: 'Was ist der Unterschied zwischen async/await und Promises?',
  },
  general: {
    emoji: '💬',
    label: 'Chat',
    placeholder: 'Stell eine Frage…',
    chip: 'Erkläre mir künstliche Intelligenz in 2 einfachen Sätzen',
  },
}

const TOOL_ORDER: DemoTool[] = ['language', 'job', 'interview', 'programming', 'general']
const PER_TOOL_LIMIT = 2 // each tool gets 2 independent messages

function buildAskParams(tool: DemoTool, msg: string, sessionId: string) {
  const base = { message: msg, sessionId }
  switch (tool) {
    case 'language':
      return {
        ...base,
        toolType: 'language' as const,
        languageLearningMode: true,
        nativeLanguage: 'Deutsch',
        targetLanguage: 'Spanisch',
        nativeLanguageCode: 'de',
        targetLanguageCode: 'es',
        level: 'adaptive',
        learningGoal: 'Kurze Sätze, Zielsprache und Übersetzung',
      }
    case 'job':
      return { ...base, toolType: 'jobanalyzer' as const }
    case 'interview':
      return { ...base, toolType: 'interviewprep' as const }
    case 'programming':
      return { ...base, toolType: 'programming' as const }
    default:
      return { ...base, toolType: undefined }
  }
}

// ── Markdown helpers ──────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : <span key={i}>{p}</span>
  )
}

interface RichLineProps { line: string; dotColor: string; numColor: string }
function RichLine({ line, dotColor, numColor }: RichLineProps) {
  if (!line.trim()) return <div className="h-1" />
  if (/^#{1,3}\s/.test(line)) {
    return <p className="mt-1.5 font-semibold text-slate-800">{renderInline(line.replace(/^#{1,3}\s/, ''))}</p>
  }
  if (/^[-•*]\s/.test(line)) {
    return (
      <p className="flex items-start gap-2">
        <span className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${dotColor}`} />
        <span className="leading-relaxed">{renderInline(line.replace(/^[-•*]\s/, ''))}</span>
      </p>
    )
  }
  const nm = line.match(/^(\d+)\.\s(.+)/)
  if (nm) {
    return (
      <p className="flex items-start gap-2">
        <span className={`flex-shrink-0 font-bold ${numColor}`}>{nm[1]}.</span>
        <span className="leading-relaxed">{renderInline(nm[2])}</span>
      </p>
    )
  }
  return <p className="leading-relaxed">{renderInline(line)}</p>
}

interface RichTextProps { text: string; dotColor: string; numColor: string }
function RichText({ text, dotColor, numColor }: RichTextProps) {
  return (
    <div className="space-y-0.5 text-sm text-slate-700">
      {text.split('\n').map((line, i) => (
        <RichLine key={i} line={line} dotColor={dotColor} numColor={numColor} />
      ))}
    </div>
  )
}

function parseCodeBlocks(text: string): Array<{ type: 'text' | 'code'; content: string }> {
  const parts: Array<{ type: 'text' | 'code'; content: string }> = []
  const regex = /```(?:\w+)?\n?([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  // eslint-disable-next-line no-cond-assign
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) parts.push({ type: 'text', content: text.slice(last, m.index) })
    parts.push({ type: 'code', content: m[1].trim() })
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push({ type: 'text', content: text.slice(last) })
  return parts
}

// ── Tool-specific response cards ──────────────────────────────────────────────

function JobResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-emerald-100 px-4 py-2">
        <span className="text-sm">💼</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">Job-Analyse</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-emerald-400" numColor="text-emerald-600" />
      </div>
    </div>
  )
}

function InterviewResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-cyan-100 bg-gradient-to-br from-cyan-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-cyan-100 px-4 py-2">
        <span className="text-sm">🎯</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-700">Interview-Vorbereitung</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-cyan-400" numColor="text-cyan-600" />
      </div>
    </div>
  )
}

function CodeResponseBubble({ text }: { text: string }) {
  const parts = parseCodeBlocks(text)
  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-4 py-2">
        <span className="text-sm">💻</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-600">Code-Assistent</span>
      </div>
      <div className="space-y-2 px-4 py-3">
        {parts.map((p, i) =>
          p.type === 'code'
            ? (
              <pre key={i} className="overflow-x-auto rounded-lg bg-slate-900 px-3 py-2.5 text-xs leading-relaxed text-emerald-400">
                <code>{p.content}</code>
              </pre>
            )
            : p.content.trim()
              ? <RichText key={i} text={p.content.trim()} dotColor="bg-slate-400" numColor="text-slate-600" />
              : null
        )}
      </div>
    </div>
  )
}

function GeneralResponseBubble({ text }: { text: string }) {
  return (
    <div className="w-full max-w-[520px] overflow-hidden rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white">
      <div className="flex items-center gap-1.5 border-b border-violet-100 px-4 py-2">
        <span className="text-sm">💬</span>
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-600">SmartAssist</span>
      </div>
      <div className="px-4 py-3">
        <RichText text={text} dotColor="bg-violet-400" numColor="text-violet-600" />
      </div>
    </div>
  )
}

function DemoAssistantBubble({ text, tool }: { text: string; tool: DemoTool }) {
  if (tool === 'language') {
    const parsed = parseLearningResponse(text)
    if (parsed?.isStructured) {
      return (
        <LearningResponse
          data={{
            targetLanguageText: parsed.targetText,
            nativeLanguageText: parsed.translationText,
            learnTip: parsed.tipText ?? undefined,
          }}
          targetLang="Spanisch"
          nativeLang="Deutsch"
          targetLangCode="es"
          timestamp={new Date().toISOString()}
          fetchAudio={fetchDemoTtsAudio}
        />
      )
    }
  }
  if (tool === 'job')         return <JobResponseBubble text={text} />
  if (tool === 'interview')   return <InterviewResponseBubble text={text} />
  if (tool === 'programming') return <CodeResponseBubble text={text} />
  return <GeneralResponseBubble text={text} />
}

function LiveDemoSection() {
  const [activeTool, setActiveTool] = useState<DemoTool>('language')
  const [msgByTool, setMsgByTool] = useState<Record<DemoTool, DemoMessage[]>>({
    language: [], job: [], interview: [], programming: [], general: [],
  })
  // per-tool independent message count (each tool has PER_TOOL_LIMIT messages)
  const [countByTool, setCountByTool] = useState<Record<DemoTool, number>>({
    language: 0, job: 0, interview: 0, programming: 0, general: 0,
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sessionIds = useRef<Record<DemoTool, string>>({
    language:    `demo_${Math.random().toString(36).slice(2, 9)}`,
    job:         `demo_${Math.random().toString(36).slice(2, 9)}`,
    interview:   `demo_${Math.random().toString(36).slice(2, 9)}`,
    programming: `demo_${Math.random().toString(36).slice(2, 9)}`,
    general:     `demo_${Math.random().toString(36).slice(2, 9)}`,
  })
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgByTool, loading])

  const currentMsgs  = msgByTool[activeTool]
  const cfg          = DEMO_TOOL_CONFIG[activeTool]
  const toolCount    = countByTool[activeTool]
  const atToolLimit  = toolCount >= PER_TOOL_LIMIT
  const allExhausted = TOOL_ORDER.every(t => countByTool[t] >= PER_TOOL_LIMIT)
  const unusedTools  = TOOL_ORDER.filter(t => countByTool[t] < PER_TOOL_LIMIT && t !== activeTool)

  const handleToolSwitch = (tool: DemoTool) => {
    setActiveTool(tool)
    setInput('')
  }

  const handleReset = () => {
    setMsgByTool(prev => ({ ...prev, [activeTool]: [] }))
    setCountByTool(prev => ({ ...prev, [activeTool]: 0 }))
    sessionIds.current[activeTool] = `demo_${Math.random().toString(36).slice(2, 9)}`
    setInput('')
  }

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || atToolLimit || loading) return
    setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'user', text: msg }] }))
    setInput('')
    setLoading(true)
    try {
      const res = await askAgentDemo(buildAskParams(activeTool, msg, sessionIds.current[activeTool]))
      const ts = new Date().toISOString()
      setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'assistant', text: res.reply, ts }] }))
      setCountByTool(prev => ({ ...prev, [activeTool]: prev[activeTool] + 1 }))
    } catch (err: unknown) {
      const isDemoLimit = err instanceof Error && (err.message === 'demo_limit' || err.name === 'UsageLimitError')
      const errText = isDemoLimit
        ? 'Demo-Limit erreicht. Registriere dich für unbegrenzten Zugang.'
        : 'Etwas ist schiefgelaufen. Bitte versuche es erneut.'
      setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'assistant', text: errText }] }))
      if (isDemoLimit) setCountByTool(prev => ({ ...prev, [activeTool]: PER_TOOL_LIMIT }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      id="demo"
      className="relative flex flex-col justify-center overflow-hidden px-4 py-16 scroll-mt-14 sm:px-6 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #F5F0FF 30%, #EEF2FF 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(124,58,237,0.06) 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      />
      {/* Decorative shapes */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-16 top-1/4 h-[220px] w-[220px] rounded-full bg-violet-200/15 blur-[70px]" />
        <div className="absolute -right-16 bottom-1/4 h-[200px] w-[200px] rounded-full bg-indigo-200/15 blur-[60px]" />
        <div className="absolute right-[5%] top-[15%] h-10 w-10 rotate-45 border border-violet-300/20" />
        <div className="absolute left-[4%] bottom-[20%] h-8 w-8 bg-violet-300/15" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      </div>
      <div className="relative z-10 mx-auto max-w-[640px]">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Live Demo</p>
          <h2 className="mb-3 text-3xl font-bold text-slate-800">Probiere es jetzt aus</h2>
          <p className="text-slate-500">
            Je 2 kostenlose Nachrichten pro Werkzeug — kein Konto nötig.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* ── Tool tabs with progress badges ── */}
          <div className="flex border-b border-slate-100">
            {TOOL_ORDER.map(tool => {
              const t = DEMO_TOOL_CONFIG[tool]
              const isActive   = activeTool === tool
              const count      = countByTool[tool]
              const exhausted  = count >= PER_TOOL_LIMIT
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleToolSwitch(tool)}
                  className={[
                    'relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-all duration-150',
                    isActive && !exhausted  ? 'border-b-2 border-primary bg-white text-primary'
                      : isActive && exhausted ? 'border-b-2 border-emerald-400 bg-white text-emerald-600'
                        : exhausted           ? 'border-b-2 border-transparent text-slate-300 hover:text-slate-400'
                          : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600',
                  ].join(' ')}
                  title={t.label}
                >
                  <span className="relative text-[17px]">
                    {t.emoji}
                    {/* ✓ badge when exhausted */}
                    {exhausted && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 text-[7px] font-bold leading-none text-white">
                        ✓
                      </span>
                    )}
                    {/* count badge when partially used */}
                    {!exhausted && count > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold leading-none text-white">
                        {count}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:block">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Messages ── */}
          <div className="max-h-[360px] min-h-[180px] space-y-4 overflow-y-auto p-5">
            {currentMsgs.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-4xl">{cfg.emoji}</span>
                <p className="text-sm text-slate-400">
                  {atToolLimit && !allExhausted
                    ? `${cfg.label} ausprobiert! Wähle ein anderes Werkzeug.`
                    : allExhausted
                      ? 'Alle Werkzeuge ausprobiert. Registriere dich für unbegrenzten Zugang.'
                      : 'Tippe eine Frage oder nutze den Vorschlag unten.'}
                </p>
              </div>
            )}

            {currentMsgs.map((m, i) => (
              <div
                key={`${activeTool}-${m.role}-${i}`}
                className={m.role === 'user' ? 'flex justify-end' : 'flex'}
              >
                {m.role === 'user' ? (
                  <div className="max-w-[85%] break-words rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-white">
                    <span className="whitespace-pre-wrap">{m.text}</span>
                  </div>
                ) : (
                  <DemoAssistantBubble text={m.text} tool={activeTool} />
                )}
              </div>
            ))}

            {loading && (
              <div className="flex">
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* ── Chip (only when no messages yet for this tool) ── */}
          {!atToolLimit && currentMsgs.length === 0 && (
            <div className="px-5 pb-3">
              <button
                type="button"
                onClick={() => void send(cfg.chip)}
                className="flex w-full items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-left text-xs text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary"
              >
                <span className="flex-shrink-0">{cfg.emoji}</span>
                <span className="truncate">{cfg.chip}</span>
                <span className="ml-auto flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                  Ausprobieren →
                </span>
              </button>
            </div>
          )}

          {/* ── Bottom area: tool exhausted / all exhausted / input ── */}
          {allExhausted ? (
            <div className="border-t border-slate-100 px-5 py-6 text-center">
              <p className="mb-1 text-sm font-semibold text-slate-800">
                Du hast alle 5 Werkzeuge ausprobiert 🎉
              </p>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Kostenlos registrieren: täglich 20 Nachrichten, alle Werkzeuge, Verlauf im Browser.
              </p>
              <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                <button className="mb-3 w-full rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover sm:w-auto">
                  Kostenlos registrieren — 20 Nachrichten/Tag
                </button>
              </SignUpButton>
              <p className="text-xs text-slate-400">
                Bereits Konto?{' '}
                <SignInButton mode="modal" fallbackRedirectUrl="/tools">
                  <button type="button" className="font-medium text-primary hover:underline">
                    Anmelden
                  </button>
                </SignInButton>
              </p>
            </div>
          ) : atToolLimit ? (
            /* Current tool exhausted — nudge to other tools */
            <div className="border-t border-slate-100 px-5 py-4">
              <p className="mb-3 text-center text-xs font-medium text-slate-500">
                ✅ <strong>{cfg.label}</strong> ausprobiert! Noch {unusedTools.length} Werkzeug{unusedTools.length !== 1 ? 'e' : ''} übrig:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {unusedTools.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToolSwitch(t)}
                    className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary"
                  >
                    <span>{DEMO_TOOL_CONFIG[t].emoji}</span>
                    {DEMO_TOOL_CONFIG[t].label}
                  </button>
                ))}
              </div>
              <div className="mt-3 text-center">
                <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                  <button className="text-xs font-medium text-primary hover:underline">
                    Oder direkt registrieren →
                  </button>
                </SignUpButton>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-t border-slate-100 px-4 py-3">
              {currentMsgs.length > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-600"
                  title="Gespräch zurücksetzen"
                >
                  <RotateCcw size={14} />
                </button>
              )}
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(input) }
                }}
                placeholder={cfg.placeholder}
                disabled={loading}
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
                style={{ fontSize: 'max(16px, 0.875rem)' }}
              />
              <button
                type="button"
                onClick={() => void send(input)}
                disabled={loading || !input.trim()}
                className="flex h-10 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-hover disabled:opacity-40"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          )}

          {/* ── Per-tool message counter ── */}
          {!atToolLimit && !allExhausted && (
            <div className="flex items-center justify-between border-t border-slate-50 px-5 py-2">
              <span className="text-[10px] text-slate-300">
                {PER_TOOL_LIMIT - toolCount} von {PER_TOOL_LIMIT} Nachrichten für {cfg.label}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: PER_TOOL_LIMIT }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-4 rounded-full transition-colors ${i < toolCount ? 'bg-primary' : 'bg-slate-100'}`}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── How It Works Section ──────────────────────────────────────────────────────

const STEPS = [
  {
    num: '1',
    icon: '🔑',
    title: 'Kostenloses Konto erstellen',
    text: 'Melde dich mit einem Klick über Google an. Keine Kreditkarte nötig.',
    color: 'from-violet-600 to-violet-500',
    glow: 'bg-violet-500/40',
  },
  {
    num: '2',
    icon: '🎯',
    title: 'Werkzeug wählen',
    text: 'Chat, Job Analyse, Interview Vorbereitung, Programmierung oder Sprachenlernen.',
    color: 'from-cyan-600 to-cyan-500',
    glow: 'bg-cyan-500/40',
  },
  {
    num: '3',
    icon: '✨',
    title: 'Smarte Antworten erhalten',
    text: 'Die KI versteht dein Anliegen und gibt präzise, hilfreiche Antworten.',
    color: 'from-amber-500 to-amber-400',
    glow: 'bg-amber-500/40',
  },
] as const

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #1E1B2E 0%, #150F25 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
      />

      {/* Geometric decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-1/4 h-[320px] w-[320px] rounded-full bg-violet-700/20 blur-[100px]" />
        <div className="absolute -right-24 bottom-1/4 h-[280px] w-[280px] rounded-full bg-cyan-600/10 blur-[80px]" />
        <div className="absolute right-[9%] top-[22%] h-12 w-12 bg-violet-400/18" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute left-[7%] bottom-[22%] h-8 w-8 bg-cyan-400/15" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
        <div className="absolute left-[18%] top-[28%] h-20 w-20 rounded-full border border-violet-500/15" />
        <div className="absolute right-[22%] bottom-[18%] h-12 w-12 rounded-full border border-cyan-400/10" />
        <div className="absolute right-[5%] bottom-[38%] h-8 w-8 rotate-45 border-2 border-amber-400/18" />
        <div className="absolute left-[28%] top-[15%] h-6 w-6 rotate-45 bg-amber-400/12 rounded-sm" />
      </div>

      <div className="relative z-10 mx-auto max-w-[900px]">
        <div className="mb-14 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/50">
            So funktioniert es
          </div>
          <h2 className="text-[clamp(28px,4vw,44px)] font-bold text-white">
            In 30 Sekunden startklar
          </h2>
        </div>

        <div className="relative grid grid-cols-1 gap-12 md:grid-cols-3">
          <div className="absolute left-[calc(50%/3+52px)] right-[calc(50%/3+52px)] top-7 hidden h-px border-t border-dashed border-white/10 md:block" />

          {STEPS.map((s) => (
            <div key={s.num} className="relative z-10 text-center">
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-xl ${s.glow}`} />
                <div className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${s.color} text-lg font-bold text-white shadow-lg`}>
                  {s.num}
                </div>
              </div>
              <div className="mb-3 text-4xl">{s.icon}</div>
              <h3 className="mb-2 text-base font-bold text-white">{s.title}</h3>
              <p className="text-sm leading-relaxed text-white/45">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Pricing Preview Section ───────────────────────────────────────────────────

const PREVIEW_PLANS = [
  {
    id: 'free',
    name: 'Kostenlos',
    price: '0 €',
    period: '/für immer',
    icon: '⚡',
    borderClass: 'border-slate-200',
    headerBg: 'bg-white',
    features: [
      '2 Antworten ohne Anmeldung',
      '20 Antworten pro Tag nach Login',
      'Alle 5 Werkzeuge',
      'Sitzungsspeicher im Browser',
    ],
    cta: 'Kostenlos starten',
    ctaClass: 'border border-slate-300 bg-white text-slate-600 hover:border-violet-300 hover:text-primary',
    useSignUp: true,
    scale: false,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '4,99 €',
    period: '/pro Monat',
    icon: '✨',
    borderClass: 'border-primary border-2',
    headerBg: 'bg-gradient-to-br from-violet-50 to-indigo-50',
    badge: 'Am beliebtesten',
    features: [
      'Alles aus Kostenlos',
      '200 Antworten pro Tag',
      'Alle 5 Werkzeuge',
      'Azure Neural Audio',
      'Gesprächsverlauf (30 Tage)',
    ],
    cta: 'Premium starten',
    ctaClass: 'bg-gradient-to-r from-primary to-violet-500 text-white shadow-md shadow-violet-200 hover:shadow-lg',
    useSignUp: false,
    href: '/pricing',
    scale: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9,99 €',
    period: '/pro Monat',
    icon: '👑',
    borderClass: 'border-amber-300',
    headerBg: 'bg-gradient-to-br from-amber-50 to-orange-50',
    features: [
      'Alles aus Premium',
      'Unbegrenzte Antworten',
      'Voller Gesprächsverlauf',
      'API Zugang (demnächst)',
    ],
    cta: 'Pro werden',
    ctaClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 hover:shadow-lg',
    useSignUp: false,
    href: '/pricing',
    scale: false,
  },
] as const

function PricingPreviewSection() {
  return (
    <section
      id="pricing"
      className="relative flex flex-col justify-center overflow-hidden px-6 py-16 scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #FFFBEB 0%, #FEF3C7 50%, #FFF7ED 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(245,158,11,0.14) 1.5px, transparent 1.5px)', backgroundSize: '30px 30px' }}
      />

      {/* Geometric decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 -top-10 h-[320px] w-[320px] rounded-full bg-amber-300/25 blur-[80px]" />
        <div className="absolute -left-20 bottom-0 h-[260px] w-[260px] rounded-full bg-orange-300/18 blur-[70px]" />
        <div className="absolute right-[11%] top-[22%] h-10 w-10 rotate-45 rounded-sm bg-amber-400/22" />
        <div className="absolute left-[8%] top-[38%] h-7 w-7 rotate-45 rounded-sm bg-orange-400/18" />
        <div className="absolute right-[18%] bottom-[22%] h-8 w-8 rotate-45 rounded-sm border-2 border-amber-400/28" />
        <div className="absolute left-[14%] top-[14%] h-12 w-12 bg-amber-300/22" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
        <div className="absolute right-[7%] bottom-[28%] h-16 w-16 rounded-full border-2 border-amber-400/22" />
        <div className="absolute left-[30%] bottom-[12%] h-10 w-10 bg-amber-400/12" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[1000px]">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
            Preise
          </div>
          <h2 className="mb-3 text-[clamp(28px,4vw,44px)] font-bold text-slate-900">
            Einfache, transparente Preise
          </h2>
          <p className="text-lg text-slate-500">Kostenlos starten. Upgrade, wenn du soweit bist.</p>
        </div>

        {/* Mobile: horizontal snap-scroll  |  md+: 3-column grid */}
        <div className={[
          'flex items-stretch gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide',
          '-mx-6 px-6',
          'md:mx-0 md:grid md:grid-cols-3 md:items-center md:gap-6 md:overflow-x-visible md:pb-0 md:snap-none',
        ].join(' ')}>
          {PREVIEW_PLANS.map(plan => (
            <div
              key={plan.id}
              className={[
                'w-[78vw] max-w-[300px] flex-shrink-0 snap-center',
                'md:w-auto md:max-w-none',
                'overflow-hidden rounded-3xl border bg-white shadow-sm',
                plan.borderClass,
                plan.scale ? 'md:scale-[1.04] shadow-xl shadow-violet-100/60' : '',
              ].join(' ')}
            >
              <div className={`px-5 pb-4 pt-5 ${plan.headerBg}`}>
                {'badge' in plan && plan.badge && (
                  <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-primary to-violet-500 px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
                    {plan.badge}
                  </span>
                )}
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">{plan.icon}</span>
                  <h3 className="text-lg font-bold text-slate-800">{plan.name}</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-slate-800">{plan.price}</span>
                  <span className="text-xs text-slate-400">{plan.period}</span>
                </div>
              </div>
              <div className="space-y-2.5 px-5 py-4">
                {plan.features.map(f => (
                  <div key={f} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-emerald-500" />
                    <span className="text-xs text-slate-700">{f}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                {plan.useSignUp ? (
                  <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
                    <button className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${plan.ctaClass}`}>{plan.cta}</button>
                  </SignUpButton>
                ) : (
                  <a href={'href' in plan ? plan.href : '/pricing'}>
                    <button className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all ${plan.ctaClass}`}>{plan.cta}</button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Alle Pläne enthalten alle Werkzeuge. Jederzeit kündbar.
        </p>
      </div>
    </section>
  )
}

// ── Final CTA Section ─────────────────────────────────────────────────────────

function FinalCtaSection() {
  return (
    <section
      id="cta"
      className="relative flex flex-col items-center justify-center overflow-hidden px-6 py-20 text-center text-white scroll-mt-14 sm:scroll-mt-16"
      style={{ background: 'linear-gradient(160deg, #5B21B6 0%, #7C3AED 50%, #6D28D9 100%)', minHeight: '100svh' }}
    >
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1.5px, transparent 1.5px)', backgroundSize: '28px 28px' }}
      />

      {/* Geometric decorations */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-white/5 blur-[80px]" />
        <div className="absolute -right-20 top-1/2 h-[380px] w-[380px] -translate-y-1/2 rounded-full bg-violet-300/10 blur-[80px]" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/5" />
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8" />
        {/* Sparkles */}
        {[
          'top-[18%] left-[14%]', 'top-[32%] right-[11%]',
          'bottom-[22%] left-[19%]', 'top-[14%] right-[24%]',
          'bottom-[30%] right-[16%]', 'top-[50%] left-[8%]',
        ].map((pos, i) => (
          <span key={i} className={`absolute ${pos} text-white/15 text-xl`}>✦</span>
        ))}
        <div className="absolute left-[9%] bottom-[28%] h-8 w-8 rotate-45 border border-white/15" />
        <div className="absolute right-[9%] top-[28%] h-6 w-6 rotate-45 rounded-sm bg-white/8" />
        <div className="absolute right-[14%] bottom-[18%] h-16 w-16 bg-white/5" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-[600px]">
        <div className="mb-6 text-6xl">⚡</div>
        <h2 className="mb-4 text-[clamp(28px,4vw,44px)] font-bold">Starte noch heute smarter</h2>
        <p className="mb-10 text-lg text-white/70">
          Schließ dich Nutzern an, die täglich Zeit mit SmartAssist sparen.
        </p>
        <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
          <button className="rounded-2xl bg-white px-10 py-4 text-base font-bold text-primary shadow-2xl shadow-violet-900/50 transition-all hover:scale-[1.02] hover:shadow-3xl">
            Kostenlos starten, für immer
          </button>
        </SignUpButton>
        <p className="mt-4 text-sm text-white/35">Keine Kreditkarte erforderlich</p>
      </div>
    </section>
  )
}

// ── Footer Section ────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer className="relative overflow-hidden px-6 py-12" style={{ background: '#111827' }}>
      {/* Tile pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.025) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }}
      />
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <img src="/favicon.png" alt="SmartAssist" className="h-7 w-7 rounded-lg" />
              <span className="bg-gradient-to-r from-violet-400 to-violet-300 bg-clip-text text-lg font-bold text-transparent">SmartAssist</span>
            </div>
            <p className="text-sm text-slate-500">KI Werkzeuge für alle</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#" className="transition-colors hover:text-white">Datenschutz</a>
            <a href="#" className="transition-colors hover:text-white">Nutzungsbedingungen</a>
            <a href="#" className="transition-colors hover:text-white">Kontakt</a>
          </div>
        </div>
        <div className="border-t border-white/5 pt-6 text-center">
          <p className="mb-1 text-xs text-slate-600">Entwickelt mit ♥ · .NET 9 · React · Claude KI</p>
          <p className="text-xs text-slate-700">© 2026 SmartAssist. Alle Rechte vorbehalten.</p>
        </div>
      </div>
    </footer>
  )
}

// ── Landing Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const { isSignedIn, isLoaded } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      navigate('/tools', { replace: true })
    }
  }, [isLoaded, isSignedIn, navigate])

  return (
    <div className="min-h-screen">
      <LandingNav />
      <HeroSection />
      <SectionDivider from="#EDE9FE" to="#EDE9FE" />
      <FeaturesSection />
      <SectionDivider from="#FFFFFF" to="#FFFFFF" />
      <LiveDemoSection />
      <SectionDivider from="#EEF2FF" to="#1E1B2E" dark />
      <HowItWorksSection />
      <SectionDivider from="#150F25" to="#FFFBEB" />
      <PricingPreviewSection />
      <SectionDivider from="#FFF7ED" to="#5B21B6" />
      <FinalCtaSection />
      <SectionDivider from="#6D28D9" to="#111827" dark />
      <FooterSection />
    </div>
  )
}

