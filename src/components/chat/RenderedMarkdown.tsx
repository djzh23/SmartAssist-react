import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'
import CodeBlock from './CodeBlock'

interface Props {
  content: string
}

const components: Components = {
  h1: ({ children }) => (
    <h2 className="text-base font-semibold mt-5 mb-2 pb-1 border-b border-slate-200 first:mt-0">
      {children}
    </h2>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold mt-5 mb-2 pb-1 border-b border-slate-200 first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold mt-4 mb-1.5">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="mb-2.5 leading-relaxed last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 pl-4 space-y-1 list-disc marker:text-slate-400">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 pl-4 space-y-1 list-decimal marker:text-slate-400">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="text-sm leading-relaxed">{children}</li>
  ),
  table: ({ children }) => (
    <div className="my-3 overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-slate-50">{children}</thead>,
  th: ({ children }) => (
    <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 border-b border-slate-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-sm border-b border-slate-100 align-top">{children}</td>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-teal-600 bg-slate-50 rounded-r-lg px-4 py-2.5 my-3 text-sm italic text-slate-600">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  hr: () => <hr className="my-4 border-slate-200" />,
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-primary underline underline-offset-2 break-all"
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
          className="bg-slate-200/80 text-slate-800 px-1.5 py-0.5 rounded text-[13px] font-mono"
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

export function RenderedMarkdown({ content }: Props) {
  return (
    <div className="rendered-md text-left">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
