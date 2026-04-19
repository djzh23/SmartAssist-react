import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import CodeBlock from './CodeBlock'

export type MarkdownVariant = 'compact' | 'reader' | 'assistant'

interface Props {
  content: string
  /** `reader`: Notizen / lange Texte. `assistant`: helle Blase auf dunklem Sepia-Chat. */
  variant?: MarkdownVariant
}

function makeMarkdownComponents(variant: MarkdownVariant): Components {
  const reader = variant === 'reader'
  const assistant = variant === 'assistant'

  return {
    h1: ({ children }) => (
      reader
        ? (
            <h2 className="mt-8 scroll-mt-4 border-b-2 border-amber-400/80 bg-gradient-to-r from-amber-100 via-amber-50/90 to-transparent px-3 py-2.5 text-lg font-bold text-amber-950 first:mt-0 sm:text-xl">
              {children}
            </h2>
          )
        : (
            <h2
              className={
                assistant
                  ? 'mt-5 border-b border-stone-300 pb-1 text-base font-semibold text-stone-900 first:mt-0'
                  : 'mt-5 border-b border-slate-200 pb-1 text-base font-semibold first:mt-0'
              }
            >
              {children}
            </h2>
          )
    ),
    h2: ({ children }) => (
      reader
        ? (
            <h2 className="mt-8 scroll-mt-4 border-b-2 border-amber-400/80 bg-gradient-to-r from-amber-100 via-amber-50/90 to-transparent px-3 py-2.5 text-lg font-bold text-amber-950 first:mt-0 sm:text-xl">
              {children}
            </h2>
          )
        : (
            <h2
              className={
                assistant
                  ? 'mt-5 border-b border-stone-300 pb-1 text-base font-semibold text-stone-900 first:mt-0'
                  : 'mt-5 border-b border-slate-200 pb-1 text-base font-semibold first:mt-0'
              }
            >
              {children}
            </h2>
          )
    ),
    h3: ({ children }) => (
      reader
        ? (
            <h3 className="mt-6 flex items-start gap-2.5 text-base font-semibold text-slate-900 sm:text-[1.05rem]">
              <span className="mt-1.5 h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="min-w-0">{children}</span>
            </h3>
          )
        : (
            <h3 className={`mt-4 text-sm font-semibold ${assistant ? 'text-stone-900' : ''}`}>{children}</h3>
          )
    ),
    h4: ({ children }) => (
      reader
        ? <h4 className="mt-4 text-sm font-semibold uppercase tracking-wide text-primary">{children}</h4>
        : <h4 className={`mt-3 text-sm font-semibold ${assistant ? 'text-stone-900' : ''}`}>{children}</h4>
    ),
    p: ({ children }) => (
      reader
        ? <p className="mb-3 text-[15px] leading-relaxed text-slate-700 last:mb-0 sm:text-base">{children}</p>
        : (
            <p className={assistant ? 'mb-2.5 leading-relaxed text-stone-800 last:mb-0' : 'mb-2.5 leading-relaxed last:mb-0'}>
              {children}
            </p>
          )
    ),
    ul: ({ children }) => (
      reader
        ? <ul className="mb-4 list-disc space-y-2 pl-5 marker:text-primary sm:pl-6">{children}</ul>
        : (
            <ul
              className={
                assistant
                  ? 'mb-3 list-disc space-y-1 pl-4 marker:text-stone-500'
                  : 'mb-3 list-disc space-y-1 pl-4 marker:text-slate-400'
              }
            >
              {children}
            </ul>
          )
    ),
    ol: ({ children }) => (
      reader
        ? <ol className="mb-4 list-decimal space-y-2 pl-5 marker:font-semibold marker:text-primary sm:pl-6">{children}</ol>
        : (
            <ol
              className={
                assistant
                  ? 'mb-3 list-decimal space-y-1 pl-4 marker:font-semibold marker:text-stone-500'
                  : 'mb-3 list-decimal space-y-1 pl-4 marker:text-slate-400'
              }
            >
              {children}
            </ol>
          )
    ),
    li: ({ children }) => (
      reader
        ? <li className="text-[15px] leading-relaxed text-slate-700 sm:text-base [&>p]:mb-1">{children}</li>
        : <li className={assistant ? 'text-sm leading-relaxed text-stone-800' : 'text-sm leading-relaxed'}>{children}</li>
    ),
    table: ({ children }) => (
      <div
        className={
          assistant
            ? 'my-4 overflow-x-auto rounded-xl border border-stone-300/90 bg-white/95 shadow-sm'
            : 'my-4 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm'
        }
      >
        <table className="w-full min-w-[280px] border-collapse text-sm">{children}</table>
      </div>
    ),
    thead: ({ children }) => (
      reader
        ? <thead className="bg-gradient-to-r from-slate-100 to-amber-50/50">{children}</thead>
        : <thead className={assistant ? 'bg-stone-100' : 'bg-slate-50'}>{children}</thead>
    ),
    th: ({ children }) => (
      reader
        ? (
            <th className="border-b border-amber-200/80 px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-amber-950/90">
              {children}
            </th>
          )
        : (
            <th
              className={
                assistant
                  ? 'border-b border-stone-300 px-3 py-2 text-left text-xs font-medium text-stone-700'
                  : 'border-b border-slate-200 px-3 py-2 text-left text-xs font-medium text-slate-500'
              }
            >
              {children}
            </th>
          )
    ),
    td: ({ children }) => (
      <td
        className={
          assistant
            ? 'border-b border-stone-200 px-3 py-2 align-top text-sm text-stone-800'
            : 'border-b border-slate-100 px-3 py-2 align-top text-sm text-slate-700'
        }
      >
        {children}
      </td>
    ),
    blockquote: ({ children }) => (
      reader
        ? (
            <blockquote className="my-4 rounded-r-xl border-l-4 border-violet-500 bg-violet-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
              {children}
            </blockquote>
          )
        : (
            <blockquote
              className={
                assistant
                  ? 'my-3 rounded-r-lg border-l-4 border-amber-600/80 bg-amber-50/90 px-4 py-2.5 text-sm italic text-stone-800'
                  : 'my-3 rounded-r-lg border-l-4 border-teal-600 bg-slate-50 px-4 py-2.5 text-sm italic text-slate-600'
              }
            >
              {children}
            </blockquote>
          )
    ),
    strong: ({ children }) => (
      reader
        ? <strong className="font-semibold text-amber-950">{children}</strong>
        : <strong className={assistant ? 'font-semibold text-stone-950' : 'font-semibold text-slate-900'}>{children}</strong>
    ),
    em: ({ children }) => (
      reader
        ? <em className="italic text-slate-800">{children}</em>
        : <em className={assistant ? 'italic text-stone-800' : 'italic text-slate-700'}>{children}</em>
    ),
    hr: () => (
      reader
        ? <hr className="my-8 h-px border-0 bg-gradient-to-r from-transparent via-amber-300/70 to-transparent" />
        : <hr className={assistant ? 'my-4 border-stone-300' : 'my-4 border-slate-200'} />
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="break-words font-medium text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
        target="_blank"
        rel="noopener noreferrer"
      >
        {children}
      </a>
    ),
    pre: ({ children }) => <>{children}</>,
    code: ({ className, children, ...props }) => {
      const isInline = !className
      if (isInline) {
        return (
          <code
            className={
              reader
                ? 'rounded-md border border-amber-200/90 bg-amber-100/90 px-1.5 py-0.5 font-mono text-[13px] text-amber-950'
                : assistant
                  ? 'rounded border border-stone-300/80 bg-stone-200/70 px-1.5 py-0.5 font-mono text-[13px] text-stone-900'
                  : 'rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[13px] text-slate-800'
            }
            {...props}
          >
            {children}
          </code>
        )
      }
      const language = className?.replace(/^language-/, '').trim() || 'text'
      const code = String(children).replace(/\n$/, '')
      return <CodeBlock language={language} code={code} />
    },
  }
}

export function RenderedMarkdown({ content, variant = 'compact' }: Props) {
  const components = useMemo(() => makeMarkdownComponents(variant), [variant])
  const wrapClass = variant === 'reader'
    ? 'reader-markdown max-w-none text-left'
    : variant === 'assistant'
      ? 'rendered-md text-left text-stone-900'
      : 'rendered-md text-left'

  return (
    <div className={wrapClass}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
