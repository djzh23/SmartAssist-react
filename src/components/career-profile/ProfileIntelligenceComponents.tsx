import { CheckCircle2, ChevronRight, Circle, Dot, Sparkles } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import AppCtaButton from '../ui/AppCtaButton'
import type { CareerSectionKey } from '../../utils/careerProfileIntelligence'

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return 'Keine Daten'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Keine Daten'
  return date.toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
}

export function ProfileCompletenessRing({ value }: { value: number }) {
  const r = 34
  const c = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(100, value))
  const offset = c - (pct / 100) * c
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} stroke="rgba(120,113,108,0.3)" strokeWidth="8" fill="none" />
        <circle
          cx="40"
          cy="40"
          r={r}
          stroke="rgb(245, 158, 11)"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-amber-100">{pct}%</div>
    </div>
  )
}

export function SectionCompletionIndicator({ state }: { state: 'complete' | 'attention' | 'incomplete' }) {
  if (state === 'complete') return <CheckCircle2 size={15} className="text-emerald-400" aria-hidden />
  if (state === 'attention') return <Dot size={18} className="text-amber-400" aria-hidden />
  return <Circle size={13} className="text-stone-500" aria-hidden />
}

export function ProfileEmptyState({ title, actionLabel, onAction }: { title: string; actionLabel: string; onAction: () => void }) {
  return (
    <div className="rounded-xl bg-[#231811]/45 p-3 text-sm text-stone-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <p>{title}</p>
      <button type="button" onClick={onAction} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-300 hover:text-amber-200">
        {actionLabel}
        <ChevronRight size={12} />
      </button>
    </div>
  )
}

export function ProfileSummaryCard({
  title,
  value,
  details,
  icon: Icon,
}: {
  title: string
  value: string
  details: string
  icon: LucideIcon
}) {
  return (
    <div className="rounded-xl bg-[#231811]/45 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        <Icon size={14} className="text-amber-300" />
        {title}
      </div>
      <p className="text-sm font-semibold text-stone-100">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{details}</p>
    </div>
  )
}

export function ProfileAreaCard({
  title,
  value,
  status,
  icon: Icon,
  onClick,
}: {
  title: string
  value: string
  status: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-xl bg-[#231811]/45 p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition hover:bg-[#2a1d15]/55"
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-stone-300">
          <Icon size={14} className="text-amber-300" />
          {title}
        </span>
        <ChevronRight size={14} className="text-stone-500 transition group-hover:translate-x-0.5 group-hover:text-stone-300" />
      </div>
      <p className="text-sm font-semibold text-stone-100">{value}</p>
      <p className="text-xs text-stone-400">{status}</p>
    </button>
  )
}

export function ProfileRecommendationCard({
  title,
  description,
  onAction,
}: {
  title: string
  description: string
  onAction: () => void
}) {
  return (
    <div className="rounded-xl bg-amber-500/12 px-4 py-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.28)]">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 text-amber-300" size={16} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-amber-100">{title}</p>
          <p className="mt-1 text-xs text-amber-200/85">{description}</p>
        </div>
      </div>
      <AppCtaButton size="sm" onClick={onAction} className="mt-3">
        Weiter zum nächsten Schritt
        <ChevronRight size={12} />
      </AppCtaButton>
    </div>
  )
}

export function ProfileStatusCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-[#1b120d]/82 p-4 shadow-[0_14px_38px_-26px_rgba(0,0,0,0.7)] sm:p-5">
      {children}
    </section>
  )
}

export function ProfileSectionNav({
  items,
  activeSection,
  onSelect,
}: {
  items: Array<{ key: CareerSectionKey; label: string; state: 'complete' | 'attention' | 'incomplete' }>
  activeSection: CareerSectionKey
  onSelect: (key: CareerSectionKey) => void
}) {
  return (
    <nav className="space-y-1.5">
      {items.map(item => (
        <button
          key={item.key}
          type="button"
          onClick={() => onSelect(item.key)}
          className={[
            'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition',
            activeSection === item.key
              ? 'bg-amber-500/14 text-amber-100 shadow-[inset_2px_0_0_rgb(245,158,11)]'
              : 'text-stone-300 hover:bg-white/5',
          ].join(' ')}
        >
          <span>{item.label}</span>
          <SectionCompletionIndicator state={item.state} />
        </button>
      ))}
    </nav>
  )
}

export function MobileCareerProfileOverview({ children }: { children: ReactNode }) {
  return <div className="space-y-4 lg:hidden">{children}</div>
}
