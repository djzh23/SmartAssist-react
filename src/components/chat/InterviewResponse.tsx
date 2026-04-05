import type { ReactNode } from 'react'
import CodeBlock from './CodeBlock'
import { parseBlocks, parseSegments } from '../../utils/markdownRenderer'
import type { Block } from '../../utils/markdownRenderer'

// ── Inline markdown ────────────────────────────────────────
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const re = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*|`[^`\n]+`)/g
  let last = 0; let m: RegExpExecArray | null; let k = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    const tok = m[0]
    if (tok.startsWith('**'))
      nodes.push(<strong key={k++} className="font-semibold text-slate-900">{tok.slice(2, -2)}</strong>)
    else if (tok.startsWith('*'))
      nodes.push(<em key={k++} className="italic text-slate-700">{tok.slice(1, -1)}</em>)
    else
      nodes.push(<code key={k++} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[0.78em] font-mono rounded px-1 py-0.5">{tok.slice(1, -1)}</code>)
    last = re.lastIndex
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

// ── Section detection ──────────────────────────────────────
type SectionKind = 'tip' | 'question' | 'warning' | 'star' | 'job' | 'default'

function detectKind(h: string): SectionKind {
  const l = h.toLowerCase()
  if (l.includes('tipp') || l.includes('vorber') || l.includes('trick') || l.includes('💡') || l.includes('advice') || l.includes('prep')) return 'tip'
  if (l.includes('frage') || l.includes('question') || l.includes('❓') || l.includes('typisch')) return 'question'
  if (l.includes('fehler') || l.includes('mistake') || l.includes('⚠️') || l.includes('vermeiden') || l.includes('avoid')) return 'warning'
  if (l.includes('star') || l.includes('präsent') || l.includes('pitch') || l.includes('⭐')) return 'star'
  if (l.includes('stelle') || l.includes('job') || l.includes('role') || l.includes('🏢') || l.includes('über') || l.includes('about') || l.includes('anford') || l.includes('skill') || l.includes('🎯')) return 'job'
  return 'default'
}

const S: Record<SectionKind, { wrap: string; h2: string; h3: string; dot: string; nb: string; nt: string; q: string }> = {
  tip:     { wrap: 'bg-amber-50 border border-amber-200 rounded-xl px-4 py-3',   h2: 'text-amber-800 font-bold text-sm',   h3: 'text-amber-700 font-semibold text-sm',   dot: 'bg-amber-400',   nb: 'bg-amber-100',  nt: 'text-amber-700',  q: 'border-l-4 border-amber-300 bg-amber-50/60 pl-3 italic text-amber-900' },
  question:{ wrap: 'bg-blue-50 border border-blue-200 rounded-xl px-4 py-3',     h2: 'text-blue-800 font-bold text-sm',    h3: 'text-blue-700 font-semibold text-sm',    dot: 'bg-blue-400',    nb: 'bg-blue-100',   nt: 'text-blue-700',   q: 'border-l-4 border-blue-300 bg-blue-50/60 pl-3 italic text-blue-900' },
  warning: { wrap: 'bg-red-50 border border-red-200 rounded-xl px-4 py-3',       h2: 'text-red-800 font-bold text-sm',     h3: 'text-red-700 font-semibold text-sm',     dot: 'bg-red-400',     nb: 'bg-red-100',    nt: 'text-red-700',    q: 'border-l-4 border-red-300 bg-red-50/60 pl-3 italic text-red-900' },
  star:    { wrap: 'bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3',h2: 'text-emerald-800 font-bold text-sm', h3: 'text-emerald-700 font-semibold text-sm', dot: 'bg-emerald-400', nb: 'bg-emerald-100',nt: 'text-emerald-700',q: 'border-l-4 border-emerald-300 bg-emerald-50/60 pl-3 italic text-emerald-900' },
  job:     { wrap: 'bg-violet-50 border border-violet-200 rounded-xl px-4 py-3', h2: 'text-violet-800 font-bold text-sm',  h3: 'text-violet-700 font-semibold text-sm',  dot: 'bg-violet-400',  nb: 'bg-violet-100', nt: 'text-violet-700', q: 'border-l-4 border-violet-300 bg-violet-50/60 pl-3 italic text-violet-900' },
  default: { wrap: '',                                                             h2: 'text-indigo-700 font-bold text-sm border-b border-indigo-100 pb-1', h3: 'text-slate-700 font-semibold text-sm', dot: 'bg-indigo-400', nb: 'bg-indigo-100', nt: 'text-indigo-700', q: 'border-l-4 border-indigo-300 bg-indigo-50/60 pl-3 italic text-indigo-900' },
}

// ── Section grouping ───────────────────────────────────────
interface Section { heading: (Block & { type: 'h2' | 'h1' }) | null; kind: SectionKind; blocks: Block[] }

function groupSections(blocks: Block[]): Section[] {
  const secs: Section[] = []
  let cur: Section = { heading: null, kind: 'default', blocks: [] }
  for (const b of blocks) {
    if (b.type === 'h2' || b.type === 'h1') {
      if (cur.blocks.length || cur.heading) secs.push(cur)
      cur = { heading: b as Block & { type: 'h2' | 'h1' }, kind: detectKind(b.content), blocks: [] }
    } else {
      cur.blocks.push(b)
    }
  }
  if (cur.blocks.length || cur.heading) secs.push(cur)
  return secs
}

// ── Block renderer ─────────────────────────────────────────
function renderBlock(b: Block, s: typeof S[SectionKind], i: number): ReactNode {
  switch (b.type) {
    case 'h3': return <h4 key={i} className={`mt-2 mb-1 ${s.h3}`}>{renderInline(b.content)}</h4>
    case 'ul': return (
      <ul key={i} className="mt-1.5 mb-1.5 flex flex-col gap-1">
        {b.items.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
            <span className="leading-relaxed">{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    )
    case 'ol': return (
      <ol key={i} className="mt-1.5 mb-1.5 flex flex-col gap-1.5">
        {b.items.map((item, j) => (
          <li key={j} className="flex items-start gap-2 text-sm text-slate-700">
            <span className={`flex-shrink-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center mt-0.5 ${s.nb} ${s.nt}`}>{j + 1}</span>
            <span className="leading-relaxed">{renderInline(item)}</span>
          </li>
        ))}
      </ol>
    )
    case 'blockquote': return (
      <div key={i} className={`my-2 rounded-r-lg py-2 pr-3 text-sm ${s.q}`}>
        {b.content.split('\n').map((ln, j) => <p key={j}>{renderInline(ln)}</p>)}
      </div>
    )
    case 'hr': return <hr key={i} className="border-slate-200 my-2" />
    default:   return <p key={i} className="text-sm text-slate-700 leading-relaxed">{renderInline((b as { content: string }).content)}</p>
  }
}

// ── Main component ─────────────────────────────────────────
interface Props { text: string; timestamp: string }

export default function InterviewResponse({ text, timestamp }: Props) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const segs = parseSegments(text)
  const hasStructure = segs.some(s => s.type === 'text' && s.content.includes('## '))

  return (
    <div className="self-start w-full animate-slide-up flex flex-col gap-1">
      <div className="bg-white border border-slate-200 rounded-[4px_18px_18px_18px] overflow-hidden shadow-sm">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-300" />
        <div className={`px-4 pt-3 pb-4 flex flex-col ${hasStructure ? 'gap-3' : 'gap-1'}`}>
          {segs.map((seg, si) =>
            seg.type === 'code' ? (
              <CodeBlock key={si} code={seg.content} language={seg.language} />
            ) : (
              groupSections(parseBlocks(seg.content)).map((sec, gi) => {
                const style = S[sec.kind]
                const content = <div className="flex flex-col gap-1">{sec.blocks.map((b, bi) => renderBlock(b, style, bi))}</div>
                if (!sec.heading) return <div key={`${si}-${gi}`}>{content}</div>
                return (
                  <div key={`${si}-${gi}`} className={sec.kind !== 'default' ? style.wrap : ''}>
                    <h3 className={`mb-2 ${style.h2}`}>{sec.heading.content}</h3>
                    {content}
                  </div>
                )
              })
            )
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 pl-1">
        <span className="text-[10px] bg-indigo-50 text-indigo-500 border border-indigo-200 rounded-full px-2 py-0.5 font-medium">🎯 Interview Coach</span>
        <span className="text-[11px] text-slate-400">{time}</span>
      </div>
    </div>
  )
}
