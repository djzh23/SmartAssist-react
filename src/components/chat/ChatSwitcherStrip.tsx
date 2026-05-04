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
  const order = ['career', 'productivity', 'learning'] as const
  const map = new Map<string, SkillSummary[]>()
  for (const s of skills) {
    const list = map.get(s.category) ?? []
    list.push(s)
    map.set(s.category, list)
  }
  return order.flatMap(c => map.get(c) ?? [])
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
        className="flex h-11 flex-shrink-0 items-center justify-center border-b border-stone-600/35 bg-app-muted/90 px-3 backdrop-blur-sm min-[769px]:hidden"
        aria-hidden
      >
        <Loader2 size={16} className="animate-spin text-stone-500" />
      </div>
    )
  }

  if (!orderedSkills.length) return null

  return (
    <nav
      className="h-11 min-h-[44px] flex-shrink-0 overflow-x-auto overflow-y-hidden border-b border-stone-600/35 bg-app-muted/90 px-3 py-1 backdrop-blur-sm [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] snap-x snap-mandatory min-[769px]:hidden [&::-webkit-scrollbar]:hidden"
      aria-label="Chat-Werkzeuge wechseln"
    >
      <div className="flex w-max items-center gap-2 py-0.5">
        {orderedSkills.map(skill => {
          const locked = !skill.isEnabled || !skill.isAccessible
          const active = isSkillActive(skill, toolFromUrl)
          const href = skillHref(skill)
          const Icon = iconForSkill(skill.icon)

          const basePill =
            'relative flex shrink-0 snap-start items-center gap-1.5 rounded-2xl border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors'

          const activeClasses =
            'border-amber-400/40 bg-amber-500 font-medium text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
          const idleClasses =
            'border border-white/15 bg-transparent text-white/75 hover:border-white/25 hover:bg-white/6 hover:text-white/90'
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
              <Icon size={14} className="shrink-0 opacity-90" aria-hidden />
              <span>{stripLabel(skill)}</span>
              {locked ? <Lock size={12} className="shrink-0 opacity-80" aria-hidden /> : null}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default memo(ChatSwitcherStripInner)
