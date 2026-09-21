import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  title: string
  subtitle?: string
  icon: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}

export default function AnalyzeAccordion({ title, subtitle, icon, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e8e0d0] bg-[#faf7f0]">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d97757]/50"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-[#b45539]" aria-hidden>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#1a1613]">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs text-[#8a7f70]">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown
          className={['h-4 w-4 shrink-0 text-[#8a7f70] transition-transform', open ? 'rotate-180' : ''].join(' ')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[#e8e0d0] bg-white px-4 py-3">{children}</div>
      ) : null}
    </section>
  )
}
