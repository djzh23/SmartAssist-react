import { memo, useLayoutEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  Code2,
  FileText,
  Globe,
  Linkedin,
  Loader2,
  Lock,
  MessageCircle,
  Mic,
  Smile,
  Sparkles,
  TrendingUp,
  Cloud,
  type LucideIcon,
} from 'lucide-react'
import { useAppUi } from '../../context/AppUiContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useSkills } from '../../hooks/useSkills'
import type { SkillSummary } from '../../types'

function iconForSkill(icon: string): LucideIcon {
  const map: Record<string, LucideIcon> = {
    briefcase: Briefcase,
    mic: Mic,
    'message-circle': MessageCircle,
    code: Code2,
    globe: Globe,
    cloud: Cloud,
    smile: Smile,
    'file-text': FileText,
    'trending-up': TrendingUp,
    linkedin: Linkedin,
  }
  return map[icon] ?? Sparkles
}

/** Short labels for pills; falls back to API name. */
function stripLabel(skill: SkillSummary): string {
  const t = skill.apiToolType.toLowerCase()
  if (t === 'general') return 'Karriere'
  if (t === 'jobanalyzer') return 'Analyse'
  if (t === 'interview' || t === 'interviewprep') return 'Interview'
  if (t === 'language') return 'Sprache'
  if (t === 'programming') return 'Code'
  const n = skill.name.trim()
  return n.length > 14 ? `${n.slice(0, 13)}…` : n
}

function skillHref(skill: SkillSummary): string {
  return skill.apiToolType === 'general'
    ? '/chat'
    : `/chat?tool=${encodeURIComponent(skill.apiToolType)}`
}

function isSkillActive(skill: SkillSummary, toolFromUrl: string): boolean {
  return skill.apiToolType === 'general'
    ? toolFromUrl === 'general'
    : toolFromUrl === skill.apiToolType
}

function flattenSkillsInNavOrder(skills: SkillSummary[]): SkillSummary[] {
  const normalizedTool = (skill: SkillSummary): string => {
    const t = skill.apiToolType.toLowerCase()
    if (t === 'interview') return 'interviewprep'
    return t
  }
  const order: string[] = [
    'jobanalyzer',
    'interviewprep',
    'general',
    'programming',
    'language',
    'linkedin',
    'salary',
    'salarycoach',
    'gehalt',
  ]
  const rank = (skill: SkillSummary): number => {
    const t = normalizedTool(skill)
    const idx = order.indexOf(t)
    if (idx >= 0) return idx
    const n = skill.name.toLowerCase()
    if (n.includes('linkedin')) return 5
    if (n.includes('gehalt') || n.includes('salary')) return 6
    return 99
  }
  return [...skills].sort((a, b) => rank(a) - rank(b))
}

function activeAccentClasses(skill: SkillSummary): string {
  const t = skill.apiToolType.toLowerCase()
  if (t === 'jobanalyzer') return 'border-amber-300/55 bg-amber-500/90 text-amber-50'
  if (t === 'interview' || t === 'interviewprep') return 'border-sky-300/55 bg-sky-500/85 text-sky-50'
  if (t === 'general') return 'border-violet-300/55 bg-violet-500/85 text-violet-50'
  if (t === 'programming') return 'border-emerald-300/55 bg-emerald-500/85 text-emerald-50'
  if (t === 'language') return 'border-fuchsia-300/55 bg-fuchsia-500/85 text-fuchsia-50'
  if (t === 'linkedin') return 'border-cyan-300/55 bg-cyan-500/85 text-cyan-50'
  if (t.includes('salary') || t.includes('gehalt')) return 'border-lime-300/55 bg-lime-500/85 text-lime-950'
  return 'border-amber-400/40 bg-amber-500/85 text-white'
}

function ChatSwitcherStripInner() {
  const bp = useBreakpoint()
  const location = useLocation()
  const navigate = useNavigate()
  const { showToast } = useAppUi()
  const { skills, loading } = useSkills()
  const activeBtnRef = useRef<HTMLButtonElement | null>(null)

  const toolFromUrl = useMemo(() => {
    if (location.pathname !== '/chat') return 'general'
    const q = new URLSearchParams(location.search).get('tool') ?? 'general'
    return q
  }, [location.pathname, location.search])

  const orderedSkills = useMemo(
    () => (skills?.length ? flattenSkillsInNavOrder(skills) : []),
    [skills],
  )

  useLayoutEffect(() => {
    activeBtnRef.current?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [toolFromUrl, orderedSkills])

  if (bp !== 'mobile') return null

  if (loading && !orderedSkills.length) {
    return (
      <div
        className="flex h-9 flex-shrink-0 items-center justify-center border-b border-stone-700/35 bg-app-muted/92 px-3 backdrop-blur-sm min-[391px]:h-10 min-[769px]:hidden"
        aria-hidden
      >
        <Loader2 size={16} className="animate-spin text-stone-500" />
      </div>
    )
  }

  if (!orderedSkills.length) return null

  return (
    <nav
      className="h-9 min-h-[36px] flex-shrink-0 overflow-x-auto overflow-y-hidden border-b border-stone-700/35 bg-app-muted/92 px-2 py-0.5 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] snap-x snap-mandatory min-[391px]:h-10 min-[391px]:min-h-[40px] min-[391px]:px-2.5 min-[391px]:py-1 min-[769px]:hidden [&::-webkit-scrollbar]:hidden"
      aria-label="Chat-Werkzeuge wechseln"
    >
      <div className="flex w-max items-center gap-1 py-0.5 pr-2 min-[391px]:gap-1.5">
        {orderedSkills.map(skill => {
          const locked = !skill.isEnabled || !skill.isAccessible
          const active = isSkillActive(skill, toolFromUrl)
          const href = skillHref(skill)
          const Icon = iconForSkill(skill.icon)

          const basePill =
            'relative flex h-6 shrink-0 snap-start items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium whitespace-nowrap transition-colors min-[391px]:h-7 min-[391px]:px-2.5 min-[391px]:py-1 min-[391px]:text-[11px]'

          const activeClasses = `${activeAccentClasses(skill)} shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_6px_14px_-10px_rgba(0,0,0,0.7)]`
          const idleClasses =
            'border border-white/12 bg-transparent text-white/65 hover:border-white/20 hover:bg-white/6 hover:text-white/85'
          const lockedVisual = locked ? 'opacity-40' : ''

          return (
            <button
              key={skill.id}
              type="button"
              ref={active ? activeBtnRef : undefined}
              aria-current={active ? 'true' : undefined}
              className={[basePill, active ? activeClasses : idleClasses, lockedVisual].join(' ')}
              onClick={() => {
                if (active) return
                if (!skill.isEnabled) {
                  showToast(`${skill.name} ist bald verfügbar.`, 'info')
                  return
                }
                if (!skill.isAccessible) {
                  showToast('Für dieses Werkzeug ist ein höherer Tarif nötig. Siehe Preise.', 'info')
                  return
                }
                navigate(href)
              }}
            >
              <Icon size={11} className="shrink-0 opacity-90 min-[391px]:h-3 min-[391px]:w-3" aria-hidden />
              <span className="leading-none">{stripLabel(skill)}</span>
              {locked ? <Lock size={10} className="shrink-0 opacity-80" aria-hidden /> : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default memo(ChatSwitcherStripInner)
