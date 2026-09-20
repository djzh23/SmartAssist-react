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
    <section className="overflow-hidden rounded-2xl border border-stone-600/40 bg-app-surface/90">
      <button
        type="button"
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
      >
        <span className="text-stone-400" aria-hidden>{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-stone-50">{title}</span>
          {subtitle ? (
            <span className="mt-0.5 block text-xs text-stone-400">{subtitle}</span>
          ) : null}
        </span>
        <ChevronDown
          className={['h-4 w-4 shrink-0 text-stone-500 transition-transform', open ? 'rotate-180' : ''].join(' ')}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-stone-600/30 px-4 py-3">{children}</div>
      ) : null}
    </section>
  )
}
