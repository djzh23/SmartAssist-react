import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Code2,
  Globe2,
  MessageCircle,
  Target,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ToolType } from '../types'

type ToolCategory = 'career' | 'general'

interface ToolCardMeta {
  id: ToolType
  chatParam: string
  category: ToolCategory
  name: string
  shortDescription: string
  fullDescription: string
  examples: string[]
  icon: LucideIcon
  badge: string
  accent: {
    soft: string
    ring: string
    text: string
    chip: string
  }
  preview: Array<{
    title: string
    subtitle: string
    line: string
  }>
}

const TOOLS: ToolCardMeta[] = [
  {
    id: 'jobanalyzer',
    chatParam: 'jobanalyzer',
    category: 'career',
    name: 'Job Analyser',
    shortDescription: 'Analysiert Stellenanzeigen präzise und zeigt dir, worauf es im Lebenslauf wirklich ankommt.',
    fullDescription: 'Füge den Stellentext oder einen Link ein. Du bekommst eine klare Struktur zu Muss-Kriterien, Soft Skills und den besten Schwerpunkten für deine Bewerbung.',
    examples: [
      'Analysiere diese Stelle und markiere die Muss-Anforderungen.',
      'Welche Begriffe sollte ich im Lebenslauf stärker zeigen?',
      'Wo fehlen mir noch sichtbare Nachweise für diese Position?',
    ],
    icon: Briefcase,
    badge: 'Career',
    accent: {
      soft: 'bg-emerald-50',
      ring: 'border-emerald-200 text-emerald-700',
      text: 'text-emerald-700',
      chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    preview: [
      { title: 'Muss-Kriterien', subtitle: 'Kompetenz-Match sofort sichtbar', line: 'bg-emerald-500' },
      { title: 'Lebenslauf-Fokus', subtitle: 'Stärken und Lücken klar sortiert', line: 'bg-cyan-500' },
    ],
  },
  {
    id: 'interview',
    chatParam: 'interviewprep',
    category: 'career',
    name: 'Interview Coach',
    shortDescription: 'Trainiere Antworten mit Struktur, Tiefgang und passender Sprache für dein Zielprofil.',
    fullDescription: 'Der Interview Coach erstellt realistische Fragen, gibt Antwortleitfäden und hilft dir, starke Beispiele aus deiner eigenen Erfahrung zu nutzen.',
    examples: [
      'Gib mir 5 typische Fragen für diese Rolle.',
      'Baue mit mir eine starke Antwort auf die Frage nach meinen Schwächen.',
      'Lass uns mein persönliches Pitch-Statement verbessern.',
    ],
    icon: Target,
    badge: 'Career',
    accent: {
      soft: 'bg-cyan-50',
      ring: 'border-cyan-200 text-cyan-700',
      text: 'text-cyan-700',
      chip: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    },
    preview: [
      { title: 'Fragenkatalog', subtitle: 'Fachlich und verhaltensorientiert', line: 'bg-cyan-500' },
      { title: 'Antwortstruktur', subtitle: 'STAR, Klarheit, rote Linie', line: 'bg-fuchsia-500' },
    ],
  },
  {
    id: 'general',
    chatParam: 'general',
    category: 'general',
    name: 'General Chat',
    shortDescription: 'Freier Arbeitsraum für Karrierefragen, Formulierungen und schnelle Entscheidungen.',
    fullDescription: 'Nutze den allgemeinen Chat für alles, was nicht in eine spezielle Kategorie fällt. Von Lebenslauf-Formulierungen bis zu Strategiefragen.',
    examples: [
      'Hilf mir bei einer kurzen, professionellen Selbstvorstellung.',
      'Welche Fragen sollte ich am Ende eines Gesprächs stellen?',
      'Formuliere diese Passage klarer und natürlicher.',
    ],
    icon: MessageCircle,
    badge: 'Flex',
    accent: {
      soft: 'bg-slate-100',
      ring: 'border-slate-200 text-slate-700',
      text: 'text-slate-700',
      chip: 'border-slate-200 bg-slate-100 text-slate-700',
    },
    preview: [
      { title: 'Schnelle Klärung', subtitle: 'Direkt zur nächsten Entscheidung', line: 'bg-slate-500' },
      { title: 'Textoptimierung', subtitle: 'Klar, präzise, professionell', line: 'bg-zinc-500' },
    ],
  },
  {
    id: 'programming',
    chatParam: 'programming',
    category: 'general',
    name: 'Programming',
    shortDescription: 'Technisches Training mit Fokus auf Architektur, Codequalität und Interviewfragen.',
    fullDescription: 'Lerne und übe mit konkreten Beispielen zu Algorithmen, Datenstrukturen, Systemdesign und sauberem Code für reale Interviewsituationen.',
    examples: [
      'Erkläre Binary Search mit einem C# Beispiel.',
      'Wann nutze ich Queue statt Stack?',
      'Zeig mir ein sauberes Pattern für modulare API-Services.',
    ],
    icon: Code2,
    badge: 'Tech',
    accent: {
      soft: 'bg-sky-50',
      ring: 'border-sky-200 text-sky-700',
      text: 'text-sky-700',
      chip: 'border-sky-200 bg-sky-50 text-sky-700',
    },
    preview: [
      { title: 'Code & DSA', subtitle: 'Verständlich und praxisnah', line: 'bg-sky-500' },
      { title: 'Architektur', subtitle: 'Klarer Aufbau, starke Argumentation', line: 'bg-blue-500' },
    ],
  },
  {
    id: 'language',
    chatParam: 'language',
    category: 'general',
    name: 'Language',
    shortDescription: 'Sprachtraining für Bewerbung, Alltag und professionelle Kommunikation.',
    fullDescription: 'Trainiere aktiv in deiner Zielsprache. Du bekommst Korrekturen, Alternativen und natürlichere Formulierungen für berufliche Situationen.',
    examples: [
      'Korrigiere meinen Satz auf Englisch und erkläre den Unterschied.',
      'Hilf mir bei einer höflichen Antwort auf Deutsch.',
      'Übe mit mir eine kurze Vorstellungsrunde auf Spanisch.',
    ],
    icon: Globe2,
    badge: 'Language',
    accent: {
      soft: 'bg-amber-50',
      ring: 'border-amber-200 text-amber-700',
      text: 'text-amber-700',
      chip: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    preview: [
      { title: 'Korrektur in Kontext', subtitle: 'Nicht nur Grammatik, auch Wirkung', line: 'bg-amber-500' },
      { title: 'Sprechpraxis', subtitle: 'Natürlichere Formulierungen', line: 'bg-orange-500' },
    ],
  },
]

export default function ToolsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<ToolCardMeta | null>(null)

  const careerTools = useMemo(
    () => TOOLS.filter(tool => tool.category === 'career'),
    [],
  )

  const otherTools = useMemo(
    () => TOOLS.filter(tool => tool.category === 'general'),
    [],
  )

  const renderCards = (items: ToolCardMeta[]) => (
    <div className="grid grid-cols-1 gap-3.5 sm:gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map(tool => {
        const Icon = tool.icon

        return (
          <button
            key={tool.id}
            onClick={() => setSelected(tool)}
            className="group relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white/90 p-5 text-left shadow-[0_10px_34px_rgba(15,23,42,0.08)] backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,23,42,0.12)]"
          >
            <div className="pointer-events-none absolute inset-0 opacity-80" style={{
              backgroundImage: 'radial-gradient(circle at 88% 0%, rgba(124,58,237,0.08), transparent 48%)',
            }} />

            <div className="relative flex items-start justify-between gap-3">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border ${tool.accent.soft} ${tool.accent.ring}`}>
                <Icon size={18} strokeWidth={2} />
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${tool.accent.chip}`}>
                {tool.badge}
              </span>
            </div>

            <h3 className="relative mt-4 text-base font-semibold text-slate-800">{tool.name}</h3>
            <p className="relative mt-1 text-sm leading-relaxed text-slate-500">{tool.shortDescription}</p>

            <div className="relative mt-4 space-y-2 rounded-2xl border border-slate-100 bg-white/85 p-3">
              {tool.preview.map(item => (
                <div key={item.title} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/85 px-3 py-2">
                  <span className={`h-7 w-1 rounded-full ${item.line}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-700">{item.title}</p>
                    <p className="truncate text-[11px] text-slate-500">{item.subtitle}</p>
                  </div>
                  <ArrowUpRight size={14} className="text-slate-300 transition-colors group-hover:text-slate-500" />
                </div>
              ))}
            </div>

            <p className={`relative mt-3 inline-flex items-center gap-1 text-xs font-semibold ${tool.accent.text}`}>
              Details öffnen
              <ArrowRight size={13} />
            </p>
          </button>
        )
      })}
    </div>
  )

  return (
    <div
      className="relative h-full overflow-y-auto"
      style={{
        backgroundColor: '#f5f6fb',
        backgroundImage: 'linear-gradient(to right, rgba(100,116,139,0.09) 1px, transparent 1px), linear-gradient(to bottom, rgba(100,116,139,0.09) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Decorative blobs — spread across the full scrollable content via relative positioning */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute -right-28 top-0 h-80 w-80 rounded-full bg-cyan-200/45 blur-3xl" />
        <div className="absolute -left-28 top-1/3 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl" />
        <div className="absolute right-0 top-2/3 h-80 w-80 rounded-full bg-cyan-100/50 blur-3xl" />
        <div className="absolute left-1/2 top-14 h-44 w-44 -translate-x-1/2 rotate-45 rounded-[34px] border border-cyan-200/45" />
        <div className="absolute right-10 top-52 h-28 w-28 rotate-12 rounded-2xl border border-slate-300/70 bg-white/40" />
        <div className="absolute left-16 top-[55%] h-20 w-20 rotate-6 rounded-2xl border border-cyan-200/50" />
        <div className="absolute right-24 top-[70%] h-14 w-14 -rotate-12 rounded-xl border border-slate-300/60 bg-white/30" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-10 md:py-12" style={{ zIndex: 1 }}>
        <div className="mb-8 rounded-2xl border border-slate-200/80 bg-white/85 p-4 shadow-[0_14px_38px_rgba(15,23,42,0.10)] backdrop-blur sm:mb-10 sm:rounded-3xl sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-500">SmartAssist Workspace</p>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-slate-800 sm:text-2xl md:text-3xl">Tools für deine Vorbereitung</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">
            Wähle das passende Tool für deinen nächsten Schritt. Alle Bereiche sind auf Fokus, Übersicht und schnelle Umsetzung ausgerichtet.
          </p>
        </div>

        <section className="mb-8 sm:mb-10">
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Karriere Tools</h2>
          {renderCards(careerTools)}
        </section>

        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-slate-400">Weitere Tools</h2>
          {renderCards(otherTools)}
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="flex w-full max-h-[92svh] max-h-[92vh] flex-col overflow-hidden rounded-t-3xl border border-slate-200/80 bg-white shadow-2xl animate-slide-up sm:max-w-2xl sm:rounded-3xl"
            onClick={event => event.stopPropagation()}
          >
            {/* Drag handle (mobile only) */}
            <div className="flex flex-shrink-0 justify-center pt-3 pb-1 sm:hidden">
              <div className="h-1 w-9 rounded-full bg-slate-200" />
            </div>

            {/* Sticky header */}
            <div className="flex flex-shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-4">
              <div className="flex items-center gap-2.5">
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl border ${selected.accent.soft} ${selected.accent.ring}`}>
                  <selected.icon size={15} />
                </div>
                <p className="text-sm font-semibold text-slate-800">{selected.name}</p>
                <span className={`hidden rounded-full border px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${selected.accent.chip}`}>
                  {selected.badge}
                </span>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Schließen"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="grid grid-cols-1 gap-4 p-4 sm:gap-5 sm:p-6 md:grid-cols-[1.1fr_0.9fr]">
                {/* Left column: description + examples */}
                <div>
                  <p className="text-sm leading-relaxed text-slate-600">{selected.fullDescription}</p>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-400">Beispielprompts</p>
                    <div className="mt-2.5 space-y-2">
                      {selected.examples.map(example => (
                        <div key={example} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-snug text-slate-700">
                          "{example}"
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column: preview + CTA */}
                <div className="flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">Direkt starten</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    Öffne das Tool im Chat und arbeite mit deinem eigenen Kontext.
                  </p>

                  <div className="mt-3.5 space-y-2">
                    {selected.preview.map(row => (
                      <div key={row.title} className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2">
                        <span className={`h-6 w-1 flex-shrink-0 rounded-full ${row.line}`} />
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-slate-700">{row.title}</p>
                          <p className="truncate text-[11px] text-slate-500">{row.subtitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-4 flex flex-col gap-2">
                    <button
                      onClick={() => navigate(`/chat?tool=${selected.chatParam}`)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover active:scale-[0.98]"
                    >
                      Im Chat öffnen
                      <ArrowRight size={15} />
                    </button>
                    <button
                      onClick={() => setSelected(null)}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
                    >
                      Schließen
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

