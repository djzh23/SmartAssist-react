import type { ReactNode } from 'react'
import { MessageCircleMore } from 'lucide-react'
import CodeBlock from './CodeBlock'
import { parseBlocks, parseSegments } from '../../utils/markdownRenderer'
import type { Block } from '../../utils/markdownRenderer'

function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const token = match[0]
    if (token.startsWith('**')) {
      nodes.push(<strong key={key++} className="font-semibold text-slate-900">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key++} className="italic text-slate-700">{token.slice(1, -1)}</em>)
    } else {
      nodes.push(
        <code key={key++} className="rounded border border-sky-200 bg-sky-50 px-1 py-0.5 font-mono text-[0.78em] text-sky-700">
          {token.slice(1, -1)}
        </code>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

type SectionKind = 'tip' | 'question' | 'warning' | 'star' | 'job' | 'default'

function detectKind(heading: string): SectionKind {
  const value = heading.toLowerCase()
  if (value.includes('tipp') || value.includes('vorber') || value.includes('advice') || value.includes('prep')) return 'tip'
  if (value.includes('frage') || value.includes('question') || value.includes('typisch')) return 'question'
  if (value.includes('fehler') || value.includes('mistake') || value.includes('warn') || value.includes('avoid')) return 'warning'
  if (value.includes('star') || value.includes('präsent') || value.includes('praesent') || value.includes('pitch')) return 'star'
  if (value.includes('stelle') || value.includes('job') || value.includes('role') || value.includes('über') || value.includes('ueber') || value.includes('anford') || value.includes('skill')) return 'job'
  return 'default'
}

const STYLES: Record<SectionKind, { wrap: string; h2: string; h3: string; dot: string; nb: string; nt: string; q: string }> = {
  tip: {
    wrap: 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3',
    h2: 'text-sm font-bold text-amber-800',
    h3: 'text-sm font-semibold text-amber-700',
    dot: 'bg-amber-400',
    nb: 'bg-amber-100',
    nt: 'text-amber-700',
    q: 'border-l-4 border-amber-300 bg-amber-50/60 pl-3 italic text-amber-900',
  },
  question: {
    wrap: 'rounded-xl border border-blue-200 bg-blue-50 px-4 py-3',
    h2: 'text-sm font-bold text-blue-800',
    h3: 'text-sm font-semibold text-blue-700',
    dot: 'bg-blue-400',
    nb: 'bg-blue-100',
    nt: 'text-blue-700',
    q: 'border-l-4 border-blue-300 bg-blue-50/60 pl-3 italic text-blue-900',
  },
  warning: {
    wrap: 'rounded-xl border border-red-200 bg-red-50 px-4 py-3',
    h2: 'text-sm font-bold text-red-800',
    h3: 'text-sm font-semibold text-red-700',
    dot: 'bg-red-400',
    nb: 'bg-red-100',
    nt: 'text-red-700',
    q: 'border-l-4 border-red-300 bg-red-50/60 pl-3 italic text-red-900',
  },
  star: {
    wrap: 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3',
    h2: 'text-sm font-bold text-emerald-800',
    h3: 'text-sm font-semibold text-emerald-700',
    dot: 'bg-emerald-400',
    nb: 'bg-emerald-100',
    nt: 'text-emerald-700',
    q: 'border-l-4 border-emerald-300 bg-emerald-50/60 pl-3 italic text-emerald-900',
  },
  job: {
    wrap: 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3',
    h2: 'text-sm font-bold text-amber-800',
    h3: 'text-sm font-semibold text-amber-700',
    dot: 'bg-amber-400',
    nb: 'bg-amber-100',
    nt: 'text-amber-700',
    q: 'border-l-4 border-amber-300 bg-amber-50/60 pl-3 italic text-amber-900',
  },
  default: {
    wrap: '',
    h2: 'border-b border-sky-100 pb-1 text-sm font-bold text-sky-700',
    h3: 'text-sm font-semibold text-slate-700',
    dot: 'bg-sky-400',
    nb: 'bg-sky-100',
    nt: 'text-sky-700',
    q: 'border-l-4 border-sky-300 bg-sky-50/60 pl-3 italic text-sky-900',
  },
}

interface Section {
  heading: (Block & { type: 'h2' | 'h1' }) | null
  kind: SectionKind
  blocks: Block[]
}

function groupSections(blocks: Block[]): Section[] {
  const sections: Section[] = []
  let current: Section = { heading: null, kind: 'default', blocks: [] }

  for (const block of blocks) {
    if (block.type === 'h2' || block.type === 'h1') {
      if (current.blocks.length || current.heading) sections.push(current)
      current = { heading: block as Block & { type: 'h2' | 'h1' }, kind: detectKind(block.content), blocks: [] }
    } else {
      current.blocks.push(block)
    }
  }

  if (current.blocks.length || current.heading) sections.push(current)
  return sections
}

function renderBlock(block: Block, style: typeof STYLES[SectionKind], index: number): ReactNode {
  switch (block.type) {
    case 'h3':
      return <h4 key={index} className={`mb-1 mt-2 ${style.h3}`}>{renderInline(block.content)}</h4>
    case 'ul':
      return (
        <ul key={index} className="mb-1.5 mt-1.5 flex flex-col gap-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${style.dot}`} />
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={index} className="mb-1.5 mt-1.5 flex flex-col gap-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${style.nb} ${style.nt}`}>{i + 1}</span>
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
    case 'blockquote':
      return (
        <div key={index} className={`my-2 rounded-r-lg py-2 pr-3 text-sm ${style.q}`}>
          {block.content.split('\n').map((line, i) => <p key={i}>{renderInline(line)}</p>)}
        </div>
      )
    case 'hr':
      return <hr key={index} className="my-2 border-slate-200" />
    default:
      return <p key={index} className="text-sm leading-relaxed text-slate-700">{renderInline((block as { content: string }).content)}</p>
  }
}

interface Props {
  text: string
  timestamp: string
}

export default function InterviewResponse({ text, timestamp }: Props) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const segments = parseSegments(text)
  const hasStructure = segments.some(seg => seg.type === 'text' && seg.content.includes('## '))

  return (
    <div className="self-start flex w-full animate-slide-up flex-col gap-1">
      <div className="overflow-hidden rounded-[4px_18px_18px_18px] border border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-sky-500 via-blue-400 to-sky-300" />
        <div className={`flex flex-col px-4 pb-4 pt-3 ${hasStructure ? 'gap-3' : 'gap-1'}`}>
          {segments.map((seg, segIndex) =>
            seg.type === 'code' ? (
              <CodeBlock key={segIndex} code={seg.content} language={seg.language} />
            ) : (
              groupSections(parseBlocks(seg.content)).map((section, sectionIndex) => {
                const style = STYLES[section.kind]
                const content = <div className="flex flex-col gap-1">{section.blocks.map((b, i) => renderBlock(b, style, i))}</div>
                if (!section.heading) return <div key={`${segIndex}-${sectionIndex}`}>{content}</div>

                return (
                  <div key={`${segIndex}-${sectionIndex}`} className={section.kind !== 'default' ? style.wrap : ''}>
                    <h3 className={`mb-2 ${style.h2}`}>{section.heading.content}</h3>
                    {content}
                  </div>
                )
              })
            ),
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pl-1">
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-500">
          <MessageCircleMore size={11} />
          <span>Interview Coach</span>
        </span>
        <span className="text-[11px] text-slate-400">{time}</span>
      </div>
    </div>
  )
}
