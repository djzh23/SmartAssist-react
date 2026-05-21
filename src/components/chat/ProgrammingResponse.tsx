import type { ReactNode } from 'react'
import CodeBlock from './CodeBlock'
import { PROGRAMMING_LANGUAGES } from '../../types'
import { parseBlocks, parseSegments } from '../../utils/markdownRenderer'
import type { Block } from '../../utils/markdownRenderer'
import StreamingTextCursor from './StreamingTextCursor'

// ── Inline markdown renderer ───────────────────────────────
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let last = 0
  let m: RegExpExecArray | null
  let k = 0

  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**')) {
      nodes.push(<strong key={k++} className="font-semibold text-stone-100">{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('*')) {
      nodes.push(<em key={k++} className="italic text-stone-400">{tok.slice(1, -1)}</em>)
    } else {
      nodes.push(
        <code key={k++} className="border border-stone-600/70 bg-stone-900/90 text-amber-100/90 text-[0.78em] font-mono rounded px-1 py-0.5">
          {tok.slice(1, -1)}
        </code>
      )
    }
    last = regex.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// ── Block renderer ─────────────────────────────────────────
function renderBlocks(blocks: Block[]): ReactNode[] {
  return blocks.map((b, i) => {
    switch (b.type) {
      case 'h1':
        return <h2 key={i} className="text-base font-bold text-amber-200/95 mt-3 mb-1 first:mt-0">{renderInline(b.content)}</h2>
      case 'h2':
        return <h3 key={i} className="text-sm font-bold text-stone-200 mt-3 mb-1 first:mt-0 border-b border-stone-600/60 pb-0.5">{renderInline(b.content)}</h3>
      case 'h3':
        return <h4 key={i} className="text-sm font-semibold text-amber-100/90 mt-2 mb-0.5 first:mt-0">{renderInline(b.content)}</h4>
      case 'ul':
        return (
          <ul key={i} className="mt-1.5 mb-1.5 flex flex-col gap-0.5 pl-0">
            {b.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-stone-200">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500/80 flex-shrink-0" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        )
      case 'ol':
        return (
          <ol key={i} className="mt-1.5 mb-1.5 flex flex-col gap-0.5 pl-0">
            {b.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-stone-200">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-stone-800 text-[10px] font-bold text-amber-100 mt-0.5">{j + 1}</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        )
      case 'blockquote':
        return (
          <div key={i} className="my-2 rounded-r-lg border-l-4 border-amber-700/55 bg-amber-950/28 py-2 pl-3 pr-3 text-sm italic text-stone-400">
            {b.content.split('\n').map((ln, j) => <p key={j}>{renderInline(ln)}</p>)}
          </div>
        )
      case 'hr':
        return <hr key={i} className="my-2 border-stone-600/60" />
      default:
        return <p key={i} className="text-sm leading-relaxed text-stone-200">{renderInline((b as { content: string }).content)}</p>
    }
  })
}

// ── Main component ─────────────────────────────────────────
interface Props {
  text: string
  progLang: string
  timestamp: string
  showStreamCursor?: boolean
}

export default function ProgrammingResponse({ text, progLang, timestamp, showStreamCursor = false }: Props) {
  const meta = PROGRAMMING_LANGUAGES.find(l => l.id === progLang)
  const syntaxLang = meta?.syntaxLang ?? progLang
  const segments = parseSegments(text, syntaxLang)
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="self-start w-full animate-slide-up flex flex-col gap-1">
      <div className="break-words rounded-[4px_18px_18px_18px] border border-stone-600/45 bg-app-raised px-3.5 py-2.5 text-sm leading-relaxed text-stone-200 shadow-[inset_0_1px_0_0_rgba(255,251,235,0.05),0_10px_28px_-12px_rgba(0,0,0,0.55)]">
        {segments.map((seg, i) =>
          seg.type === 'code' ? (
            <CodeBlock key={i} code={seg.content} language={seg.language} />
          ) : (
            <div key={i} className="flex flex-col gap-0.5">
              {renderBlocks(parseBlocks(seg.content))}
            </div>
          )
        )}
        {showStreamCursor ? (
          <div className="mt-1">
            <StreamingTextCursor />
          </div>
        ) : null}
      </div>
      <span className="pl-1 text-[11px] text-stone-500">{time}</span>
    </div>
  )
}

