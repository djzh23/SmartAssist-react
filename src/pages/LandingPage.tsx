import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignInButton, SignUpButton, useUser } from '@clerk/clerk-react'
import { Check, Loader2, Play, RotateCcw, Send } from 'lucide-react'
import { askAgent } from '../api/client'
import LearningResponse from '../components/chat/LearningResponse'
import { parseLearningResponse } from '../utils/parseLearningResponse'
import '../styles/landing.css'

// ── Navbar ───────────────────────────────────────────────────────────────────

function LandingNav() {
  return (
    <nav className="fixed left-0 right-0 top-0 z-[100] h-14 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm sm:h-16">
      <div className="flex h-full max-w-[1200px] items-center justify-between mx-auto px-4 sm:px-6">
        {/* Logo */}
        <div className="flex min-w-0 items-center gap-2">
          <img src="/favicon.png" alt="SmartAssist" className="h-7 w-7 flex-shrink-0 rounded-xl sm:h-8 sm:w-8" />
          <span className="text-base font-bold text-slate-800 sm:text-lg">SmartAssist</span>
        </div>

        {/* Actions — tighter on mobile, full size on sm+ */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <a
            href="/pricing"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:block"
          >
            Preise
          </a>
          <SignInButton mode="modal" fallbackRedirectUrl="/tools">
            <button className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:border-slate-400 sm:px-4 sm:py-2 sm:text-sm">
              Anmelden
            </button>
          </SignInButton>
          <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
            <button className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover sm:px-4 sm:py-2 sm:text-sm">
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
      {/* Main chat window */}
      <div
        className="-rotate-2 overflow-hidden rounded-[20px] bg-white shadow-[0_20px_60px_rgba(124,58,237,0.15)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-3">
          <span className="text-sm font-bold text-white">⚡ SmartAssist</span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="text-xs text-white/80">Online</span>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-3 bg-slate-50 p-4">
          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
              ⚡
            </div>
            <div className="max-w-[200px] rounded-[12px_12px_12px_4px] bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
              ¡Hola! Ich sehe du lernst Spanisch 🌍
            </div>
          </div>

          <div className="flex justify-end">
            <div className="max-w-[200px] rounded-[12px_12px_4px_12px] bg-primary px-3 py-2 text-xs text-white">
              Ja! Wie sagt man "Guten Morgen"?
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
              ⚡
            </div>
            <div className="max-w-[200px] rounded-[12px_12px_12px_4px] border-l-[3px] border-l-primary bg-white px-3 py-2 text-xs shadow-sm">
              <p className="font-semibold text-slate-800">🌍 Buenos días</p>
              <p className="text-slate-600">🇩🇪 Guten Morgen</p>
              <p className="mt-1 text-[10px] text-cyan-600">
                💡 "buenos" = gut, "días" = Tage
              </p>
            </div>
          </div>

          {showTyping && (
            <div className="flex gap-2">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs text-white">
                ⚡
              </div>
              <div className="rounded-[12px_12px_12px_4px] bg-white px-3 py-3 shadow-sm">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
          <div className="flex-1 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-400">
            Schreib eine Nachricht…
          </div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary">
            <Send size={12} className="text-white" />
          </div>
        </div>
      </div>

      {/* Floating weather card */}
      <div className="absolute -bottom-8 right-0 rotate-2 rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.12)] flex items-center gap-2.5">
        <span className="text-2xl">🌤️</span>
        <div>
          <p className="text-xs font-semibold text-slate-800">Hamburg</p>
          <p className="text-[10px] text-slate-500">14°C · Regnerisch</p>
        </div>
      </div>
    </div>
  )
}

// ── Hero Section ──────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative overflow-hidden pt-14 sm:pt-16"
      style={{ background: 'linear-gradient(135deg, #FAFAFA 0%, #F5F0FF 100%)', minHeight: '100vh' }}
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-20 h-[500px] w-[500px] rounded-full bg-cyan-300/10 blur-[80px]" />
        <div className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-teal-300/10 blur-[60px]" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-[60px] px-6 pb-[60px] pt-[60px] md:grid-cols-2 md:min-h-[calc(100vh-64px)]">
        {/* Left: copy */}
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700">
            ✨ Angetrieben von Claude KI
          </div>

          <h1 className="mb-4 text-[clamp(36px,5vw,56px)] font-bold leading-[1.1] text-slate-800">
            Dein intelligenter
            <br />
            <span className="text-primary">KI Assistent
            </span>
          </h1>

          <p className="mb-8 max-w-[480px] text-lg leading-relaxed text-slate-500">
            SmartAssist vereint leistungsstarke KI Werkzeuge —
            Wetter, Sprachenlernen, Stellenanalyse und vieles mehr —
            in einer einzigen übersichtlichen Oberfläche.
          </p>

          <div className="mb-6 flex flex-wrap items-center gap-4">
            <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
              <button className="flex h-12 items-center gap-2 rounded-xl bg-primary px-7 text-base font-semibold text-white shadow-lg shadow-cyan-200/60 transition-colors hover:bg-primary-hover">
                Jetzt kostenlos starten →
              </button>
            </SignUpButton>
            <a
              href="#demo"
              className="flex h-12 items-center gap-2 rounded-xl border border-slate-300 px-6 text-base font-medium text-slate-700 transition-colors hover:border-slate-400"
            >
              <Play size={16} className="text-slate-500" />
              Demo ansehen
            </a>
          </div>

          <p className="text-sm text-slate-400">
            ★★★★★&nbsp;&nbsp;Von Entwicklern geschätzt · Kostenlos starten · Keine Kreditkarte
          </p>
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
    iconBg: 'bg-slate-100',
    title: 'General Chat',
    desc: 'Frei chatten, Texte schärfen, Fragen klären — dein offener KI-Assistent für alles, was keine feste Kategorie braucht.',
    chip: 'Wie formuliere ich das professioneller?',
    highlight: false,
  },
  {
    icon: '💼',
    iconBg: 'bg-emerald-50',
    title: 'Job Analyzer',
    desc: 'Stellenanzeige einfügen und sofort sehen, worauf es ankommt: Muss-Kriterien, wichtige Keywords und klarer Lebenslauf-Fokus.',
    chip: 'Analysiere diese Stelle: [Text einfügen]',
    highlight: false,
  },
  {
    icon: '🎯',
    iconBg: 'bg-cyan-50',
    title: 'Interview Coach',
    desc: 'Gezielt auf Vorstellungsgespräche vorbereiten — mit realistischen Fragen, Antwortstrategien und konkretem Feedback.',
    chip: 'Gib mir 5 Fragen für diese Stelle',
    highlight: true,
    badge: 'Karriere',
  },
  {
    icon: '💻',
    iconBg: 'bg-sky-50',
    title: 'Programmierung',
    desc: 'Code reviewen, Bugs finden, Algorithmen verstehen. Für alle Sprachen — von JavaScript bis Python, von Anfänger bis Senior.',
    chip: 'Was ist falsch in meinem Code?',
    highlight: false,
  },
  {
    icon: '🌍',
    iconBg: 'bg-amber-50',
    title: 'Sprachen lernen',
    desc: 'Lerne mit natürlichen Gesprächen. Übersetzung, Grammatik und echte Audio-Aussprache zum Anhören — powered by KI.',
    chip: '🔊 Aussprache hören + Grammatiktipp',
    highlight: false,
    badge: 'Audio',
  },
] as const

function FeaturesSection() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-slate-800">
            Alles was du brauchst, nichts was du nicht brauchst
          </h2>
          <p className="text-slate-500">Fünf spezialisierte Werkzeuge, eine klare Oberfläche</p>
        </div>

        {/* Mobile: horizontal snap-scroll  |  sm+: 2-column grid */}
        <div className={[
          'flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-hide',
          '-mx-6 px-6',
          'sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-x-visible sm:pb-0 sm:snap-none',
        ].join(' ')}>
          {FEATURES.map(f => (
            <div
              key={f.title}
              className={[
                'w-[78vw] max-w-[300px] flex-shrink-0 snap-center',
                'sm:w-auto sm:max-w-none',
                'relative cursor-default rounded-2xl border bg-white p-7 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
                f.highlight
                  ? 'border-2 border-primary bg-cyan-50/30'
                  : 'border-slate-200',
              ].join(' ')}
            >
              {'badge' in f && f.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold text-white">
                  {f.badge}
                </span>
              )}
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl text-2xl ${f.iconBg}`}
              >
                {f.icon}
              </div>
              <h3 className="mb-2 text-base font-bold text-slate-800">{f.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 font-mono text-xs text-slate-600">
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
  isLanguage?: boolean
}

const DEMO_TOOL_CONFIG: Record<DemoTool, DemoToolConfig> = {
  language: {
    emoji: '🌍',
    label: 'Sprachen',
    placeholder: 'Schreib auf Deutsch…',
    chip: 'Wie sage ich "Ich suche einen neuen Job" auf Spanisch?',
    isLanguage: true,
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
const MAX_DEMO = 3

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
        />
      )
    }
  }
  return (
    <div className="max-w-[min(100%,520px)] break-words rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2.5 text-sm text-slate-800">
      <span className="whitespace-pre-wrap">{text}</span>
    </div>
  )
}

function LiveDemoSection() {
  const [activeTool, setActiveTool] = useState<DemoTool>('language')
  const [msgByTool, setMsgByTool] = useState<Record<DemoTool, DemoMessage[]>>({
    language: [], job: [], interview: [], programming: [], general: [],
  })
  const [totalCount, setTotalCount] = useState(0)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  // each tool gets its own session ID so context doesn't mix
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

  const currentMsgs = msgByTool[activeTool]
  const cfg = DEMO_TOOL_CONFIG[activeTool]
  const atLimit = totalCount >= MAX_DEMO

  const handleToolSwitch = (tool: DemoTool) => {
    setActiveTool(tool)
    setInput('')
  }

  const handleReset = () => {
    setMsgByTool(prev => ({ ...prev, [activeTool]: [] }))
    sessionIds.current[activeTool] = `demo_${Math.random().toString(36).slice(2, 9)}`
    setInput('')
  }

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || atLimit || loading) return
    setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'user', text: msg }] }))
    setInput('')
    setLoading(true)
    try {
      const res = await askAgent(buildAskParams(activeTool, msg, sessionIds.current[activeTool]))
      const ts = new Date().toISOString()
      setMsgByTool(prev => ({ ...prev, [activeTool]: [...prev[activeTool], { role: 'assistant', text: res.reply, ts }] }))
      setTotalCount(c => c + 1)
    } catch {
      setMsgByTool(prev => ({
        ...prev,
        [activeTool]: [...prev[activeTool], { role: 'assistant', text: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.' }],
      }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className="px-4 py-20 sm:px-6" style={{ background: '#F8F7FF' }}>
      <div className="mx-auto max-w-[640px]">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Live Demo</p>
          <h2 className="mb-3 text-3xl font-bold text-slate-800">Probiere es jetzt aus</h2>
          <p className="text-slate-500">
            {MAX_DEMO} kostenlose Nachrichten — kein Konto nötig. Wähle ein Werkzeug und starte.
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* ── Tool tabs ── */}
          <div className="flex border-b border-slate-100">
            {TOOL_ORDER.map(tool => {
              const t = DEMO_TOOL_CONFIG[tool]
              const isActive = activeTool === tool
              return (
                <button
                  key={tool}
                  type="button"
                  onClick={() => handleToolSwitch(tool)}
                  className={[
                    'flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-semibold transition-all duration-150',
                    isActive
                      ? 'border-b-2 border-primary bg-white text-primary'
                      : 'border-b-2 border-transparent text-slate-400 hover:text-slate-600',
                  ].join(' ')}
                  title={t.label}
                >
                  <span className="text-[17px]">{t.emoji}</span>
                  <span className="hidden sm:block">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Messages ── */}
          <div className="max-h-[340px] min-h-[180px] space-y-4 overflow-y-auto p-5">
            {currentMsgs.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <span className="text-4xl">{cfg.emoji}</span>
                <p className="text-sm text-slate-400">
                  {atLimit
                    ? 'Registriere dich, um alle Werkzeuge unbegrenzt zu nutzen.'
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

          {/* ── One-click chip ── */}
          {!atLimit && currentMsgs.length === 0 && (
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

          {/* ── Upgrade CTA or input ── */}
          {atLimit ? (
            <div className="border-t border-slate-100 px-5 py-6 text-center">
              <p className="mb-1 text-sm font-semibold text-slate-800">
                Du hast alle {MAX_DEMO} Demo-Nachrichten genutzt 🎉
              </p>
              <p className="mb-5 text-sm leading-relaxed text-slate-500">
                Kostenlos registrieren: täglich 20 Nachrichten, alle 5 Werkzeuge, Verlauf im Browser.
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

          {/* ── Message counter ── */}
          {!atLimit && (
            <div className="flex items-center justify-between border-t border-slate-50 px-5 py-2">
              <span className="text-[10px] text-slate-300">
                {MAX_DEMO - totalCount} Nachrichten übrig
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: MAX_DEMO }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 w-4 rounded-full transition-colors ${i < totalCount ? 'bg-primary' : 'bg-slate-100'}`}
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
  },
  {
    num: '2',
    icon: '💬',
    title: 'Werkzeug auswählen',
    text: 'Wähle aus Wetter, Sprachen lernen, Stellenanalyse und mehr.',
  },
  {
    num: '3',
    icon: '✨',
    title: 'Smarte Antworten erhalten',
    text: 'Die KI wählt das passende Werkzeug automatisch aus. Einfach drauflosschreiben.',
  },
] as const

function HowItWorksSection() {
  return (
    <section className="bg-white px-6 py-20">
      <div className="mx-auto max-w-[900px]">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-800">In 30 Sekunden startklar</h2>
        </div>

        <div className="relative grid grid-cols-1 gap-10 md:grid-cols-3">
          {/* Dashed connector line (desktop only) */}
          <div className="absolute left-[calc(50%/3+48px)] right-[calc(50%/3+48px)] top-6 hidden h-px border-t-2 border-dashed border-cyan-300 md:block" />

          {STEPS.map(s => (
            <div key={s.num} className="relative z-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                {s.num}
              </div>
              <div className="mb-3 text-4xl">{s.icon}</div>
              <h3 className="mb-2 text-base font-bold text-slate-800">{s.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{s.text}</p>
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
    headerBg: 'bg-slate-50',
    features: [
      '2 Antworten ohne Anmeldung',
      '20 Antworten pro Tag nach Login',
      'Alle Werkzeuge',
      'Sitzungsspeicher im Browser',
    ],
    cta: 'Kostenlos starten',
    ctaClass: 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400',
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
    headerBg: 'bg-cyan-50',
    badge: 'Am beliebtesten',
    features: [
      'Alles aus Kostenlos',
      '200 Antworten pro Tag',
      'Stellenanalyse Werkzeug',
      'ElevenLabs Audio',
      'Gesprächsverlauf (30 Tage)',
    ],
    cta: 'Premium starten',
    ctaClass: 'bg-primary text-white hover:bg-primary-hover',
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
    borderClass: 'border-amber-400',
    headerBg: 'bg-amber-50',
    features: [
      'Alles aus Premium',
      'Unbegrenzte Antworten',
      'Voller Gesprächsverlauf',
      'API Zugang (demnächst)',
    ],
    cta: 'Pro werden',
    ctaClass: 'bg-amber-500 text-white hover:bg-amber-600',
    useSignUp: false,
    href: '/pricing',
    scale: false,
  },
] as const

function PricingPreviewSection() {
  return (
    <section className="bg-slate-50 px-6 py-20">
      <div className="mx-auto max-w-[1000px]">
        <div className="mb-10 text-center">
          <h2 className="mb-3 text-3xl font-bold text-slate-800">
            Einfache, transparente Preise
          </h2>
          <p className="text-slate-500">Kostenlos starten. Upgrade, wenn du soweit bist.</p>
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
                plan.scale ? 'md:scale-[1.03] shadow-lg shadow-cyan-100/50' : '',
              ].join(' ')}
            >
              <div className={`px-5 pb-4 pt-5 ${plan.headerBg}`}>
                {'badge' in plan && plan.badge && (
                  <span className="mb-2 inline-block rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
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
                    <button
                      className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${plan.ctaClass}`}
                    >
                      {plan.cta}
                    </button>
                  </SignUpButton>
                ) : (
                  <a href={'href' in plan ? plan.href : '/pricing'}>
                    <button
                      className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-colors ${plan.ctaClass}`}
                    >
                      {plan.cta}
                    </button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-slate-400">
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
      className="px-6 py-20 text-center text-white"
      style={{ background: 'linear-gradient(135deg, #06B6D4, #0E7490)' }}
    >
      <div className="mx-auto max-w-[600px]">
        <div className="mb-6 text-6xl">⚡</div>
        <h2 className="mb-4 text-3xl font-bold">Starte noch heute smarter</h2>
        <p className="mb-8 text-lg text-white/80">
          Schließ dich Tausenden von Nutzern an, die täglich Zeit mit SmartAssist sparen.
        </p>
        <SignUpButton mode="modal" fallbackRedirectUrl="/tools">
          <button className="rounded-xl bg-white px-8 py-3.5 text-base font-bold text-primary shadow-xl transition-colors hover:bg-slate-100">
            Kostenlos starten, für immer
          </button>
        </SignUpButton>
      </div>
    </section>
  )
}

// ── Footer Section ────────────────────────────────────────────────────────────

function FooterSection() {
  return (
    <footer className="px-6 py-10" style={{ background: '#1a1a2e' }}>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-6 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <img src="/favicon.png" alt="SmartAssist" className="h-7 w-7 rounded-lg" />
              <span className="text-lg font-bold text-white">SmartAssist</span>
            </div>
            <p className="text-sm text-slate-400">KI Werkzeuge für alle</p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#" className="transition-colors hover:text-white">Privacy</a>
            <a href="#" className="transition-colors hover:text-white">Terms</a>
            <a href="#" className="transition-colors hover:text-white">Contact</a>
          </div>
        </div>
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="mb-1 text-xs text-slate-500">
            Built with ♥ using .NET 9 · React · Claude KI
          </p>
          <p className="text-xs text-slate-600">© 2026 SmartAssist. Alle Rechte vorbehalten.</p>
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
      <FeaturesSection />
      <LiveDemoSection />
      <HowItWorksSection />
      <PricingPreviewSection />
      <FinalCtaSection />
      <FooterSection />
    </div>
  )
}

