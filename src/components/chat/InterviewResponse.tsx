import type { ReactNode } from 'react'
import {
  AlertTriangle,
  Briefcase,
  HelpCircle,
  Lightbulb,
  MessageCircleMore,
  Star,
  type LucideIcon,
} from 'lucide-react'
import CodeBlock from './CodeBlock'
import { parseBlocks, parseSegments } from '../../utils/markdownRenderer'
import type { Block } from '../../utils/markdownRenderer'
import { CHAT_FEATURE_ACTIVE_BG_ALPHA, getChatFeatureColor, hexToRgba } from '../../utils/chatFeatureColors'
import StreamingTextCursor from './StreamingTextCursor'

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
      nodes.push(<strong key={key++} className="font-semibold text-stone-100">{token.slice(2, -2)}</strong>)
    } else if (token.startsWith('*')) {
      nodes.push(<em key={key++} className="italic text-stone-400">{token.slice(1, -1)}</em>)
    } else {
      nodes.push(
        <code key={key++} className="rounded border border-stone-600/70 bg-stone-900/90 px-1 py-0.5 font-mono text-[0.78em] text-pink-100/90">
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

const SECTION_ICON: Record<SectionKind, LucideIcon> = {
  tip: Lightbulb,
  question: HelpCircle,
  warning: AlertTriangle,
  star: Star,
  job: Briefcase,
  default: MessageCircleMore,
}

interface SectionStyle {
  accent: string
  h2: string
  h3: string
  dot: string
  nb: string
  nt: string
  q: string
}

const STYLES: Record<SectionKind, SectionStyle> = {
  tip: {
    accent: '#fbbf24',
    h2: 'text-sm font-semibold text-stone-100',
    h3: 'text-sm font-semibold text-stone-300',
    dot: 'bg-amber-400',
    nb: 'bg-amber-900/85 text-amber-50',
    nt: 'text-amber-50',
    q: 'border-l-2 border-amber-500/50 pl-3 italic text-stone-400',
  },
  question: {
    accent: '#f9a8d4',
    h2: 'text-sm font-semibold text-stone-100',
    h3: 'text-sm font-semibold text-stone-300',
    dot: 'bg-pink-400',
    nb: 'bg-stone-800 text-stone-200',
    nt: 'text-stone-200',
    q: 'border-l-2 border-pink-500/45 pl-3 italic text-stone-400',
  },
  warning: {
    accent: '#f87171',
    h2: 'text-sm font-semibold text-red-200',
    h3: 'text-sm font-semibold text-red-300/95',
    dot: 'bg-red-500',
    nb: 'bg-red-950/80 text-red-100',
    nt: 'text-red-100',
    q: 'border-l-2 border-red-500/50 pl-3 italic text-red-200/90',
  },
  star: {
    accent: '#fcd34d',
    h2: 'text-sm font-semibold text-stone-100',
    h3: 'text-sm font-semibold text-stone-300',
    dot: 'bg-amber-500',
    nb: 'bg-amber-900/80 text-amber-50',
    nt: 'text-amber-50',
    q: 'border-l-2 border-amber-500/45 pl-3 italic text-stone-400',
  },
  job: {
    accent: '#a78bfa',
    h2: 'text-sm font-semibold text-stone-100',
    h3: 'text-sm font-semibold text-stone-300',
    dot: 'bg-violet-400',
    nb: 'bg-violet-900/80 text-violet-100',
    nt: 'text-violet-100',
    q: 'border-l-2 border-violet-500/45 pl-3 italic text-stone-400',
  },
  default: {
    accent: '#f9a8d4',
    h2: 'text-sm font-semibold text-stone-100',
    h3: 'text-sm font-semibold text-stone-300',
    dot: 'bg-pink-400',
    nb: 'bg-stone-800 text-stone-200',
    nt: 'text-stone-200',
    q: 'border-l-2 border-stone-600/60 pl-3 italic text-stone-400',
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

function renderBlock(block: Block, style: SectionStyle, index: number): ReactNode {
  switch (block.type) {
    case 'h3':
      return <h4 key={index} className={`mb-1 mt-2 ${style.h3}`}>{renderInline(block.content)}</h4>
    case 'ul':
      return (
        <ul key={index} className="mb-1.5 mt-1.5 flex flex-col gap-1.5">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-stone-300">
              <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${style.dot}`} />
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      )
    case 'ol':
      return (
        <ol key={index} className="mb-1.5 mt-1.5 flex flex-col gap-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-stone-300">
              <span className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${style.nb} ${style.nt}`}>{i + 1}</span>
              <span className="leading-relaxed">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      )
    case 'blockquote':
      return (
        <div key={index} className={`my-2 py-1 text-sm ${style.q}`}>
          {block.content.split('\n').map((line, i) => <p key={i}>{renderInline(line)}</p>)}
        </div>
      )
    case 'hr':
      return <hr key={index} className="my-3 border-stone-700/40" />
    default:
      return <p key={index} className="text-sm leading-relaxed text-stone-300">{renderInline((block as { content: string }).content)}</p>
  }
}

interface Props {
  text: string
  timestamp: string
  showStreamCursor?: boolean
}

type RenderItem =
  | { key: string; type: 'code'; code: string; language: string }
  | { key: string; type: 'section'; section: Section }

function buildRenderItems(segments: ReturnType<typeof parseSegments>): RenderItem[] {
  const items: RenderItem[] = []
  segments.forEach((seg, segIndex) => {
    if (seg.type === 'code') {
      items.push({ key: `code-${segIndex}`, type: 'code', code: seg.content, language: seg.language })
      return
    }
    groupSections(parseBlocks(seg.content)).forEach((section, sectionIndex) => {
      items.push({ key: `${segIndex}-${sectionIndex}`, type: 'section', section })
    })
  })
  return items
}

export default function InterviewResponse({ text, timestamp, showStreamCursor = false }: Props) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const segments = parseSegments(text)
  const featureColor = getChatFeatureColor('interview')
  const sections = buildRenderItems(segments)

  const hasStructuredSections = sections.some(
    s => s.type === 'section' && s.section.heading !== null,
  )

  return (
    <div className="self-start flex w-full animate-slide-up flex-col gap-1">
      <div
        className="w-full overflow-hidden rounded-[4px_18px_18px_18px] border border-stone-600/35 bg-app-raised shadow-[inset_0_1px_0_0_rgba(255,251,235,0.04)]"
        style={{ borderLeftWidth: 3, borderLeftColor: featureColor }}
      >
        <div
          className="px-4 py-3.5"
          style={{
            backgroundImage: `linear-gradient(135deg, ${hexToRgba(featureColor, CHAT_FEATURE_ACTIVE_BG_ALPHA)} 0%, transparent 70%)`,
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: hexToRgba(featureColor, 0.9) }}
          >
            Interview Coach
          </p>
          <p className="text-sm font-semibold text-stone-100">
            {hasStructuredSections ? 'Interview-Vorbereitung' : 'Antwort'}
          </p>
        </div>

        {sections.map(item => {
          if (item.type === 'code') {
            return (
              <div key={item.key} className="border-t border-stone-700/30 px-4 py-3.5">
                <CodeBlock code={item.code} language={item.language} />
              </div>
            )
          }

          const { section } = item
          const style = STYLES[section.kind]
          const Icon = SECTION_ICON[section.kind]
          const content = (
            <div className="flex flex-col gap-1.5">
              {section.blocks.map((b, i) => renderBlock(b, style, i))}
            </div>
          )

          return (
            <article
              key={item.key}
              className="border-t border-stone-700/30 px-4 py-3.5"
            >
              {section.heading ? (
                <header className="mb-2.5 flex items-start gap-2">
                  <Icon size={15} style={{ color: style.accent }} className="mt-0.5 shrink-0" aria-hidden />
                  <h3 className={style.h2}>{section.heading.content}</h3>
                </header>
              ) : null}
              {content}
            </article>
          )
        })}

        {showStreamCursor ? (
          <div className="border-t border-stone-700/30 px-4 py-2">
            <StreamingTextCursor />
          </div>
        ) : null}
      </div>

      <span className="pl-1 text-[11px] text-stone-500">{time}</span>
    </div>
  )
}
