import {
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
  target?: string
  correction: string
  explanation?: string
  tips: string[]
  exercise: string[]
  vocab: string[]
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
  if (heading.includes('lern tipps') || heading.includes('tips') || heading.includes('tipps')) {
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

  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  let activeSection: SectionKey | null = null
  let hasStructuredSections = false

  for (const line of lines) {
    const headingMatch = line.match(/^#{2,3}\s+(.+)$/)
    if (headingMatch) {
      activeSection = sectionFromHeading(headingMatch[1] ?? '')
      hasStructuredSections = hasStructuredSections || Boolean(activeSection)
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

  if (!hasStructuredSections) {
    return {
      target: target || text.trim(),
      correction: 'Satz ist bereits korrekt oder keine Korrektur nötig.',
      explanation: undefined,
      tips: [],
      exercise: [],
      vocab: [],
    }
  }

  return {
    target: target || undefined,
    correction: correction || 'Satz ist bereits korrekt oder keine Korrektur nötig.',
    explanation: explanation || undefined,
    tips,
    exercise,
    vocab,
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
      {parsed.target && (
        <div className="overflow-hidden rounded-xl border border-cyan-200">
          <div className="flex items-center justify-between border-b border-cyan-200 bg-cyan-100 px-3 py-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-cyan-800">
              <Languages size={12} />
              <span>Antwort in {targetLang}</span>
            </span>
            <button
              onClick={() => speak(parsed.target!.slice(0, 900), targetLangCode)}
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
      )}

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

      {parsed.explanation && (
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
      )}

      {parsed.tips.length > 0 && (
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
      )}

      {parsed.exercise.length > 0 && (
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
      )}

      {parsed.vocab.length > 0 && (
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
      )}

      <span className="pl-1 text-[11px] text-slate-400">{time}</span>
    </div>
  )
}
