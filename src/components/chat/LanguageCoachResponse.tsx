import {
  AlertTriangle,
  BookOpenText,
  CheckCircle2,
  Languages,
  Lightbulb,
  ListChecks,
  Volume2,
} from 'lucide-react'
import { speak } from '../../api/client'

interface Props {
  text: string
  targetLang: string
  nativeLang: string
  targetLangCode: string
  timestamp: string
}

type SectionKey = 'target' | 'correction' | 'explanation' | 'tips' | 'exercise' | 'vocab'

interface ParsedLanguageResponse {
  target: string
  correction: string
  explanation: string
  tips: string[]
  exercise: string[]
  vocab: string[]
  warnings: string[]
}

function normalizeHeading(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sectionFromHeading(value: string): SectionKey | null {
  const heading = normalizeHeading(value)

  if (heading.includes('zielsprache') || heading.includes('antwort') || heading.includes('target')) {
    return 'target'
  }
  if (heading.includes('korrektur') || heading.includes('correction')) {
    return 'correction'
  }
  if (heading.includes('erklarung') || heading.includes('explanation')) {
    return 'explanation'
  }
  if (heading.includes('lern tipps') || heading.includes('tipps') || heading.includes('learning tips')) {
    return 'tips'
  }
  if (heading.includes('mini ubung') || heading.includes('uebung') || heading.includes('exercise')) {
    return 'exercise'
  }
  if (heading.includes('vokabeln') || heading.includes('wortschatz') || heading.includes('vocabulary')) {
    return 'vocab'
  }

  return null
}

function cleanLines(lines: string[]): string[] {
  return lines
    .map(line => line.trim())
    .map(line => line.replace(/^[-*•]\s*/, ''))
    .filter(Boolean)
}

function parseLanguageText(text: string): ParsedLanguageResponse {
  const sections: Record<SectionKey, string[]> = {
    target: [],
    correction: [],
    explanation: [],
    tips: [],
    exercise: [],
    vocab: [],
  }

  const warnings: string[] = []
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let activeSection: SectionKey | null = null

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/)
    if (headingMatch) {
      activeSection = sectionFromHeading(headingMatch[1] ?? '')
      continue
    }

    if (!line.trim()) continue

    if (!activeSection) {
      sections.target.push(line)
      continue
    }

    sections[activeSection].push(line)
  }

  const target = cleanLines(sections.target).join('\n')
  const correction = cleanLines(sections.correction).join('\n')
  const explanation = cleanLines(sections.explanation).join('\n')
  const tips = cleanLines(sections.tips)
  const exercise = cleanLines(sections.exercise)
  const vocab = cleanLines(sections.vocab)

  if (!correction || !explanation || tips.length === 0) {
    warnings.push('Die Antwort kam nicht vollständig im Lernformat zurück. Inhalte wurden bestmöglich aufbereitet.')
  }

  return {
    target: target || 'Keine Angaben',
    correction: correction || 'Keine Angaben',
    explanation: explanation || 'Keine Angaben',
    tips: tips.length > 0 ? tips : ['Keine Angaben'],
    exercise: exercise.length > 0 ? exercise : ['Keine Angaben'],
    vocab: vocab.length > 0 ? vocab : ['Keine Angaben'],
    warnings,
  }
}

export default function LanguageCoachResponse({
  text,
  targetLang,
  nativeLang,
  targetLangCode,
  timestamp,
}: Props) {
  const parsed = parseLanguageText(text)
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex animate-slide-up flex-col gap-2">
      {parsed.warnings.map((warning, index) => (
        <div key={`${warning}-${index}`} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
          <span className="inline-flex items-center gap-1 font-semibold">
            <AlertTriangle size={12} />
            Hinweis
          </span>
          <p className="mt-1">{warning}</p>
        </div>
      ))}

      <div className="overflow-hidden rounded-xl border border-cyan-200">
        <div className="flex items-center justify-between border-b border-cyan-200 bg-cyan-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800">
            <Languages size={12} />
            <span>Antwort in {targetLang}</span>
          </span>
          <button
            onClick={() => speak(parsed.target.slice(0, 900), targetLangCode)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-200 text-cyan-700 transition-colors hover:bg-cyan-600 hover:text-white"
            title="Aussprache anhören"
          >
            <Volume2 size={13} />
          </button>
        </div>
        <div className="bg-cyan-50 px-3 py-2.5 font-serif text-[15px] font-medium leading-relaxed text-slate-900">
          <span className="whitespace-pre-wrap">{parsed.target}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-200">
        <div className="flex items-center justify-between border-b border-emerald-200 bg-emerald-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            <CheckCircle2 size={12} />
            <span>Korrektur</span>
          </span>
          <button
            onClick={() => speak(parsed.correction.slice(0, 900), targetLangCode)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-200 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white"
            title="Korrektur anhören"
          >
            <Volume2 size={13} />
          </button>
        </div>
        <div className="bg-emerald-50 px-3 py-2.5 text-sm leading-relaxed text-emerald-900">
          <span className="whitespace-pre-wrap">{parsed.correction}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200">
        <div className="border-b border-slate-200 bg-slate-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-700">
            <BookOpenText size={12} />
            <span>Erklärung in {nativeLang}</span>
          </span>
        </div>
        <div className="bg-white px-3 py-2.5 text-sm leading-relaxed text-slate-700">
          <span className="whitespace-pre-wrap">{parsed.explanation}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-sky-200">
        <div className="border-b border-sky-200 bg-sky-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-800">
            <Lightbulb size={12} />
            <span>Lern-Tipps</span>
          </span>
        </div>
        <ul className="space-y-1 bg-sky-50 px-3 py-2.5 text-sm text-sky-900">
          {parsed.tips.map((tip, index) => (
            <li key={`${tip}-${index}`} className="leading-relaxed">
              • {tip}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-orange-200">
        <div className="border-b border-orange-200 bg-orange-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-orange-800">
            <ListChecks size={12} />
            <span>Mini-Übung</span>
          </span>
        </div>
        <ul className="space-y-1 bg-orange-50 px-3 py-2.5 text-sm text-orange-900">
          {parsed.exercise.map((item, index) => (
            <li key={`${item}-${index}`} className="leading-relaxed">
              • {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="overflow-hidden rounded-xl border border-teal-200">
        <div className="border-b border-teal-200 bg-teal-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-800">
            <BookOpenText size={12} />
            <span>Vokabeln</span>
          </span>
        </div>
        <ul className="space-y-1 bg-teal-50 px-3 py-2.5 font-mono text-[12.5px] text-teal-900">
          {parsed.vocab.map((entry, index) => (
            <li key={`${entry}-${index}`} className="leading-relaxed">
              {entry}
            </li>
          ))}
        </ul>
      </div>

      <span className="pl-1 text-[11px] text-slate-400">{time}</span>
    </div>
  )
}
