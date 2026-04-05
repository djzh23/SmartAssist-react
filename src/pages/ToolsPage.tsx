import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ToolMeta } from '../types'

const TOOLS: ToolMeta[] = [
  {
    id: 'interview',
    name: 'Interview Coach',
    chatParam: 'interview',
    shortDescription: 'Übe Bewerbungsgespräche mit klaren, konkreten Antworten.',
    fullDescription:
      'Du bekommst realistische Fragen, strukturierte Antwortideen und hilfreiche Formulierungen für dein nächstes Gespräch.',
    examples: [
      'Stell mir typische Fragen für eine Backend Entwickler Stelle',
      'Wie antworte ich gut auf: Was ist Ihre größte Schwäche?',
      'Gib mir ein STAR Beispiel für eine Teamkonflikt Frage',
      'Bereite mich auf ein Interview für diese Stellenanzeige vor',
    ],
    icon: '🎯',
    iconBg: '#EEF2FF',
    featured: true,
  },
  {
    id: 'jobanalyzer',
    name: 'Job Analyzer',
    chatParam: 'jobanalyzer',
    shortDescription: 'Lies zwischen den Zeilen einer Stellenanzeige.',
    fullDescription:
      'Füge den Text oder Link einer Stellenanzeige ein und erhalte eine klare Übersicht zu Anforderungen, Schlüsselbegriffen und passenden Schwerpunkten für deinen Lebenslauf.',
    examples: [
      'Analysiere diese Stelle: [Text einfügen]',
      'Analysiere diese Anzeige: https://jobs.example.com/123',
      'Welche Fähigkeiten sollte ich in meiner Bewerbung hervorheben?',
    ],
    icon: '💼',
    iconBg: '#FFF8F0',
    featured: true,
  },
  {
    id: 'general',
    name: 'General Chat',
    chatParam: 'general',
    shortDescription: 'Freier Chat für alles, was du gerade klären möchtest.',
    fullDescription:
      'Nutze den allgemeinen Chat für Fragen, die nicht in eine spezielle Kategorie fallen, zum Beispiel Karrierefragen, Formulierungen oder spontane Ideen.',
    examples: [
      'Wie kann ich mein LinkedIn Profil klarer schreiben?',
      'Welche Fragen sollte ich am Ende eines Interviews stellen?',
      'Hilf mir, eine kurze professionelle Selbstvorstellung zu schreiben',
    ],
    icon: '💬',
    iconBg: '#F8FAFC',
    featured: false,
  },
  {
    id: 'programming',
    name: 'Programming',
    chatParam: 'programming',
    shortDescription: 'Technische Fragen zu Code, Architektur und DSA.',
    fullDescription:
      'Arbeite an Algorithmen, Datenstrukturen, Clean Code und Architektur. Du erhältst verständliche Erklärungen und Beispiele, die du direkt nutzen kannst.',
    examples: [
      'Erkläre Binary Search mit einem Java Beispiel',
      'Was ist der Unterschied zwischen Stack und Queue?',
      'Zeig mir ein sauberes Beispiel für das Singleton Pattern in C#',
      'Wie funktioniert React Reconciliation?',
    ],
    icon: '💻',
    iconBg: '#F0FDF4',
    featured: false,
  },
  {
    id: 'language',
    name: 'Language',
    chatParam: 'language',
    shortDescription: 'Sprachtraining für Job, Alltag und Bewerbung.',
    fullDescription:
      'Trainiere gezielt eine Zielsprache für Bewerbungsgespräche, Mails oder berufliche Alltagssituationen. Du bekommst korrigierte und natürlichere Formulierungen.',
    examples: [
      'Wie sage ich auf Englisch: Ich habe drei Jahre Berufserfahrung?',
      'Hilf mir, eine höfliche Absage auf Deutsch zu formulieren',
      'Lass uns ein kurzes Interview auf Spanisch üben',
    ],
    icon: '🌍',
    iconBg: '#E8FEF0',
    featured: false,
  },
]

const CAREER_TOOL_ORDER: ToolMeta['id'][] = ['jobanalyzer', 'interview']
const CAREER_TOOL_IDS = new Set(CAREER_TOOL_ORDER)

export default function ToolsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<ToolMeta | null>(null)

  const careerTools = CAREER_TOOL_ORDER
    .map(id => TOOLS.find(tool => tool.id === id))
    .filter((tool): tool is ToolMeta => Boolean(tool))
  const otherTools = TOOLS.filter(tool => !CAREER_TOOL_IDS.has(tool.id))

  const renderToolGrid = (items: ToolMeta[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map(tool => (
        <button
          key={tool.id}
          onClick={() => setSelected(tool)}
          className={[
            'text-left p-5 rounded-2xl border transition-all duration-150 group',
            'hover:shadow-card hover:-translate-y-0.5',
            tool.featured
              ? 'border-primary/30 bg-primary-light'
              : 'border-slate-200 bg-white hover:border-primary/40',
          ].join(' ')}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: tool.iconBg }}>
              {tool.icon}
            </div>
            {tool.featured && (
              <span className="text-[9px] font-bold tracking-widest bg-primary text-white rounded-full px-2 py-0.5 uppercase">
                Empfohlen
              </span>
            )}
          </div>
          <h3 className="font-semibold text-slate-800 text-sm mb-1">{tool.name}</h3>
          <p className="text-slate-500 text-xs leading-relaxed">{tool.shortDescription}</p>
          <p className="text-primary text-xs font-medium mt-3 group-hover:underline">Mehr erfahren {'->'}</p>
        </button>
      ))}
    </div>
  )

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Tools für deine Vorbereitung</h1>
        <p className="text-slate-400 text-sm mb-8">Wähle das passende Tool für den nächsten sinnvollen Schritt.</p>

        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Career Tools</h2>
          {renderToolGrid(careerTools)}
        </section>

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Weitere Tools</h2>
          {renderToolGrid(otherTools)}
        </section>
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 flex flex-col gap-4 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl" style={{ background: selected.iconBg }}>
                {selected.icon}
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-slate-800">{selected.name}</h2>
            <p className="text-slate-500 text-sm text-center leading-relaxed">{selected.fullDescription}</p>

            <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Beispielfragen</p>
              {selected.examples.map((example, i) => (
                <div key={i} className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-snug">
                  💬 {example}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => navigate(`/chat?tool=${selected.chatParam}`)}
                className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                Im Chat öffnen
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-xl py-3 text-sm font-medium transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
