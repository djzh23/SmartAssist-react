import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Plus,
  Sparkles,
  ArrowRight,
  Briefcase,
  Mic,
  MessageCircle,
  Code2,
  Globe,
  Cloud,
  Smile,
  FileText,
  TrendingUp,
  Linkedin,
  type LucideIcon,
} from 'lucide-react'
import { useAppUi } from '../../context/AppUiContext'
import { useUserPlan } from '../../hooks/useUserPlan'
import { useSkills } from '../../hooks/useSkills'
import { useChatSessions, TOOL_TO_QUERY } from '../../hooks/useChatSessions'
import type { SkillSummary } from '../../types'
import type { ChatSession } from '../../types'
import { sessionListLabel } from '../../utils/sessionTitle'
import { formatRecentChatTime } from '../../utils/recentChatTime'
import { toolSessionDotClass } from '../../utils/toolSessionDot'

export type SidebarDensity = 'full' | 'icons'

interface Props {
  density?: SidebarDensity
  onNavClick?: () => void
}

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

function badgeColorClass(color: string): string {
  switch (color) {
    case 'orange':
      return 'bg-amber-500/18 text-amber-200'
    case 'teal':
      return 'bg-teal-500/18 text-teal-200'
    case 'blue':
      return 'bg-sky-500/18 text-sky-200'
    default:
      return 'bg-stone-500/15 text-stone-300'
  }
}

function SkillSidebarRow({
  skill,
  onNavClick,
  density,
}: {
  skill: SkillSummary
  onNavClick?: () => void
  density: SidebarDensity
}) {
  const { showToast } = useAppUi()
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const toolFromUrl = location.pathname === '/chat' ? (searchParams.get('tool') ?? 'general') : null

  const href =
    skill.apiToolType === 'general'
      ? '/chat'
      : `/chat?tool=${encodeURIComponent(skill.apiToolType)}`

  const isActive =
    location.pathname === '/chat'
    && (skill.apiToolType === 'general'
      ? toolFromUrl === 'general'
      : toolFromUrl === skill.apiToolType)

  const base = density === 'icons'
    ? 'mb-1 flex items-center justify-center rounded-lg border border-transparent px-2 py-2.5 text-sm font-medium no-underline transition-all duration-150'
    : 'mb-1 flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium no-underline transition-all duration-150'
  const active = 'border-amber-300/25 bg-amber-500/15 text-sidebar-text shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]'
  const inactive = 'text-sidebar-muted hover:border-white/5 hover:bg-white/[0.035] hover:text-sidebar-text'
  const locked = !skill.isEnabled || !skill.isAccessible

  const Icon = iconForSkill(skill.icon)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (!skill.isEnabled) {
      showToast(`${skill.name} ist bald verfügbar.`, 'info')
      onNavClick?.()
      return
    }
    if (!skill.isAccessible) {
      showToast('Für dieses Werkzeug ist ein höherer Tarif nötig. Siehe Preise.', 'info')
      onNavClick?.()
      return
    }
    navigate(href)
    onNavClick?.()
  }

  return (
    <a
      href={href}
      title={density === 'icons' ? skill.name : undefined}
      onClick={handleClick}
      className={[
        base,
        isActive && !locked ? active : inactive,
        locked ? 'opacity-55' : '',
      ].join(' ')}
    >
      <span className="flex w-4 flex-shrink-0 items-center justify-center">
        <Icon size={density === 'icons' ? 18 : 15} />
      </span>
      {density === 'full' && (
        <>
          <span className="min-w-0 flex-1 truncate">{skill.name}</span>
          {skill.badge ? (
            <span
              className={[
                'flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                badgeColorClass(skill.badgeColor),
              ].join(' ')}
            >
              {skill.badge}
            </span>
          ) : null}
          {locked ? <span className="flex-shrink-0 text-[10px] opacity-80" aria-hidden>🔒</span> : null}
        </>
      )}
    </a>
  )
}

function UsageBanner({ compact }: { compact?: boolean }) {
  const navigate = useNavigate()
  const { plan, responsesLeft } = useUserPlan()
  if (plan === 'pro') return null
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="mx-1 mb-1 flex items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 transition-colors hover:bg-amber-500/20"
        title="Upgrade"
        aria-label="Nachrichten-Limit und Upgrade"
      >
        <Sparkles size={14} className="text-amber-300" />
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate('/pricing')}
      className="mx-2 mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/8 px-3 py-2 text-left transition-colors hover:bg-amber-500/14"
    >
      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300">
        <Sparkles size={11} />
        <span>{responsesLeft === Infinity ? 'Unbegrenzt' : responsesLeft} Nachrichten übrig · Upgrade</span>
      </span>
      <span className="text-[10px] text-amber-400"><ArrowRight size={12} /></span>
    </button>
  )
}

function UsageBar() {
  const { plan, usageToday, dailyLimit } = useUserPlan()
  if (plan === 'pro') return null

  const pct = dailyLimit === Infinity ? 0 : Math.min(100, (usageToday / dailyLimit) * 100)
  const barColor = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#D97706'
  const limitLabel = dailyLimit === Infinity ? 'Unbegrenzt' : String(dailyLimit)

  return (
    <div className="border-t border-white/6 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-400">
        <span>Tagesverbrauch</span>
        <span>{usageToday}/{limitLabel}</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, pct)}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

function groupLabel(category: string): string {
  switch (category) {
    case 'career':
      return 'Coaching'
    case 'productivity':
      return 'Tools'
    case 'learning':
      return 'Lernen'
    default:
      return category
  }
}

const RECENT_PAGE_SIZE = 3

function recentSessionsList(
  sessions: Record<string, ChatSession>,
  sessionOrder: string[],
): ChatSession[] {
  return sessionOrder
    .map(id => sessions[id])
    .filter(Boolean)
    .map(s => ({
      s,
      t: new Date(s.messages[s.messages.length - 1]?.timestamp ?? s.createdAt).getTime(),
    }))
    .sort((a, b) => b.t - a.t)
    .map(r => r.s)
}

export default function SidebarNavContent({ density = 'full', onNavClick }: Props) {
  const { showToast } = useAppUi()
  const navigate = useNavigate()
  const { plan } = useUserPlan()
  const { skills, loading: skillsLoading } = useSkills()
  const store = useChatSessions()
  const iconsOnly = density === 'icons'
  const [recentVisible, setRecentVisible] = useState(RECENT_PAGE_SIZE)

  const grouped = useMemo(() => {
    if (!skills?.length) return []
    const order = ['career', 'productivity', 'learning']
    const map = new Map<string, SkillSummary[]>()
    for (const s of skills) {
      const list = map.get(s.category) ?? []
      list.push(s)
      map.set(s.category, list)
    }
    return order.filter(c => map.has(c)).map(c => ({ category: c, items: map.get(c)! }))
  }, [skills])

  const allRecent = useMemo(
    () => recentSessionsList(store.sessions, store.sessionOrder),
    [store.sessions, store.sessionOrder],
  )
  const recent = allRecent.slice(0, recentVisible)
  const hasMore = allRecent.length > recentVisible

  const handleNewChat = () => {
    void (async () => {
      try {
        const tool = store.currentToolType
        await store.newSession(tool)
        const q = TOOL_TO_QUERY[tool]
        navigate(`/chat?tool=${encodeURIComponent(q)}`)
        onNavClick?.()
      }
      catch (e) {
        console.warn('[SidebarNavContent] Neues Gespräch', e)
        showToast(
          e instanceof Error ? e.message : 'Neues Gespräch konnte nicht gestartet werden.',
          'error',
        )
      }
    })()
  }

  const openRecent = (s: ChatSession) => {
    const q = TOOL_TO_QUERY[s.toolType]
    navigate(`/chat?tool=${encodeURIComponent(q)}`, { state: { activateSessionId: s.id } })
    onNavClick?.()
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden">
      {plan !== 'pro' && <UsageBanner compact={iconsOnly} />}

      <div className="flex min-h-0 flex-1 flex-col px-2 pt-3">
        <button
          type="button"
          onClick={handleNewChat}
          className={[
            'mb-2 flex flex-shrink-0 items-center justify-center gap-2 rounded-lg bg-primary font-semibold text-white shadow-sm transition-all hover:brightness-110',
            iconsOnly ? 'h-11 w-11 min-h-[44px] min-w-[44px] self-center p-0' : 'px-3 py-2.5 text-sm',
          ].join(' ')}
          title="Neues Gespräch"
          aria-label="Neues Gespräch"
        >
          <Plus size={iconsOnly ? 22 : 18} strokeWidth={2.5} aria-hidden />
          {!iconsOnly && 'Neues Gespräch'}
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {skillsLoading && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Tools laden…
            </div>
          )}
          {!skillsLoading && grouped.map(({ category, items }) => (
            <div key={category}>
              {!iconsOnly && (
                <p className="px-3 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-500/90">
                  {groupLabel(category)}
                </p>
              )}
              {items.map(skill => (
                <SkillSidebarRow
                  key={skill.id}
                  skill={skill}
                  density={density}
                  onNavClick={onNavClick}
                />
              ))}
            </div>
          ))}
        </div>

        {!iconsOnly && (
          <div className="mt-2 flex max-h-[min(160px,22vh)] min-h-0 flex-shrink-0 flex-col border-t border-white/6 pt-2">
            <p className="flex-shrink-0 px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500/90">
              Letzte Gespräche
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-0.5">
              {allRecent.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-slate-500">Noch keine Gespräche.</p>
              ) : (
                <>
                  <ul className="space-y-px">
                    {recent.map(s => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => openRecent(s)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs text-sidebar-text transition-colors hover:bg-white/[0.045]"
                        >
                          <span
                            className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${toolSessionDotClass(s.toolType)}`}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate font-medium leading-tight">
                            {sessionListLabel(s, 32)}
                          </span>
                          <span className="flex-shrink-0 text-[10px] text-slate-500">
                            {formatRecentChatTime(
                              s.messages[s.messages.length - 1]?.timestamp ?? s.createdAt,
                            )}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {hasMore && (
                    <button
                      type="button"
                      onClick={() => setRecentVisible(v => v + RECENT_PAGE_SIZE)}
                      className="mt-0.5 w-full rounded-lg px-2 py-1 text-left text-[10px] font-medium text-slate-500 transition-colors hover:bg-white/[0.045] hover:text-slate-300"
                    >
                      + {Math.min(RECENT_PAGE_SIZE, allRecent.length - recentVisible)} weitere laden
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex-shrink-0">
        {!iconsOnly && <UsageBar />}
      </div>
    </div>
  )
}
