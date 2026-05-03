import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  code: string
  language: string
}

export default function CodeBlock({ code, language }: Props) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code).catch(() => {/* ignore */})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg overflow-hidden my-2 border border-slate-700 text-left">
      <div className="flex items-center justify-between px-4 py-1.5 bg-[#1e1e2e]">
        <span className="text-[11px] text-slate-400 font-mono">{language}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto bg-[#0f172a] px-4 py-3 text-[12px] leading-relaxed text-slate-100">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  )
}
