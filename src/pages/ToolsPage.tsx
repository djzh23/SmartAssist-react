import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ToolMeta } from '../types'

const TOOLS: ToolMeta[] = [
  {
    id: 'weather', name: 'Weather Assistant', chatParam: 'weather',
    shortDescription: 'Get real-time weather for any city worldwide.',
    fullDescription: 'Ask about weather in any city. SmartAssist uses live weather data to give you current conditions, temperature, wind, and helpful tips.',
    examples: ['Wie ist das Wetter in Berlin?', 'What is the weather in Tokyo?', 'Is it raining in London today?'],
    icon: '🌤️', iconBg: '#EBF5FF',
  },
  {
    id: 'jobanalyzer', name: 'Job Analyzer', chatParam: 'jobanalyzer',
    shortDescription: 'Paste a job posting — get instant CV tips.',
    fullDescription: 'Paste a job posting text or share a URL. SmartAssist analyzes the role, uncovers what they really want, and gives you personalized CV optimization tips with ATS keywords.',
    examples: ['Analyze this job: [paste job text here]', 'Analyze this job: https://jobs.example.com/123'],
    icon: '💼', iconBg: '#FFF8F0', featured: true,
  },
  {
    id: 'jokes', name: 'Joke Generator', chatParam: 'jokes',
    shortDescription: 'Get a random joke to brighten your day.',
    fullDescription: 'Need a laugh? Ask for a joke anytime — programming jokes, wordplay, puns, and more.',
    examples: ['Tell me a programming joke', 'Erzähl mir einen Witz', 'Give me a funny joke about dogs'],
    icon: '😄', iconBg: '#F5F0FF',
  },
  {
    id: 'language', name: 'Language Learning', chatParam: 'language',
    shortDescription: 'Chat and learn a new language simultaneously.',
    fullDescription: 'Activate a target language and start chatting. SmartAssist translates your messages and responds in your target language — perfect for learners at any level.',
    examples: ['Guten Morgen — practice Spanish every day', 'Hallo wie geht es dir?'],
    icon: '🌍', iconBg: '#E8FEF0', featured: true,
  },
]

export default function ToolsPage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<ToolMeta | null>(null)

  return (
    <div className="overflow-y-auto h-full">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Available Tools</h1>
        <p className="text-slate-400 text-sm mb-8">Click any card to learn more and try it in chat.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TOOLS.map(tool => (
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
                    Featured
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-slate-800 text-sm mb-1">{tool.name}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{tool.shortDescription}</p>
              <p className="text-primary text-xs font-medium mt-3 group-hover:underline">Learn more →</p>
            </button>
          ))}
        </div>
      </div>

      {/* Modal */}
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Example prompts</p>
              {selected.examples.map((ex, i) => (
                <div key={i} className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 leading-snug">
                  💬 {ex}
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={() => navigate(`/chat?tool=${selected.chatParam}`)}
                className="flex-1 bg-primary hover:bg-primary-hover text-white rounded-xl py-3 text-sm font-semibold transition-colors"
              >
                Try in Chat
              </button>
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-700 rounded-xl py-3 text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
