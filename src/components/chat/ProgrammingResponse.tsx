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
      nodes.push(<strong key={k++} className="font-semibold text-slate-900">{tok.slice(2, -2)}</strong>)
    } else if (tok.startsWith('*')) {
      nodes.push(<em key={k++} className="italic text-slate-700">{tok.slice(1, -1)}</em>)
    } else {
      nodes.push(
        <code key={k++} className="bg-amber-50 text-amber-700 border border-amber-200 text-[0.78em] font-mono rounded px-1 py-0.5">
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
        return <h2 key={i} className="text-base font-bold text-amber-700 mt-3 mb-1 first:mt-0">{renderInline(b.content)}</h2>
      case 'h2':
        return <h3 key={i} className="text-sm font-bold text-slate-800 mt-3 mb-1 first:mt-0 border-b border-slate-200 pb-0.5">{renderInline(b.content)}</h3>
      case 'h3':
        return <h4 key={i} className="text-sm font-semibold text-emerald-700 mt-2 mb-0.5 first:mt-0">{renderInline(b.content)}</h4>
      case 'ul':
        return (
          <ul key={i} className="mt-1.5 mb-1.5 flex flex-col gap-0.5 pl-0">
            {b.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        )
      case 'ol':
        return (
          <ol key={i} className="mt-1.5 mb-1.5 flex flex-col gap-0.5 pl-0">
            {b.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center mt-0.5">{j + 1}</span>
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        )
      case 'blockquote':
        return (
          <div key={i} className="my-2 border-l-4 border-amber-300 bg-amber-50/60 pl-3 rounded-r-lg py-2 pr-3 text-sm italic text-amber-900">
            {b.content.split('\n').map((ln, j) => <p key={j}>{renderInline(ln)}</p>)}
          </div>
        )
      case 'hr':
        return <hr key={i} className="border-slate-200 my-2" />
      default:
        return <p key={i} className="text-sm text-slate-700 leading-relaxed">{renderInline((b as { content: string }).content)}</p>
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
      <div className="bg-white border border-slate-200 rounded-[4px_18px_18px_18px] px-4 pt-3 pb-3 shadow-sm">
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
      <span className="text-[11px] text-slate-400 pl-1">{time}</span>
    </div>
  )
}

