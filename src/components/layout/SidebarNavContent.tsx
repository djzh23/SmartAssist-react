import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Loader2,
  Sparkles,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
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
import { useLayoutChrome } from '../../context/LayoutChromeContext'
import { useUserPlan } from '../../hooks/useUserPlan'
import { useSkills } from '../../hooks/useSkills'
import { useChatSessions, TOOL_TO_QUERY } from '../../hooks/useChatSessions'
import type { SkillSummary } from '../../types'
import type { ChatSession } from '../../types'
import { sessionListLabel } from '../../utils/sessionTitle'
import { formatRecentChatTime } from '../../utils/recentChatTime'
import { toolSessionDotStyle } from '../../utils/toolSessionDot'
import { getChatFeatureColor, hexToRgba } from '../../utils/chatFeatureColors'

export type SidebarDensity = 'full' | 'icons'

export interface DesktopRailState {
  wide: boolean
  labelsShown: boolean
}

interface Props {
  density?: SidebarDensity
  onNavClick?: () => void
  /** Desktop icon rail: colored dots, labels fade with parent width + delay. */
  desktopRail?: DesktopRailState
  /** Desktop: chat history column open — collapses „Weitere Werkzeuge“ accordion manual state. */
  desktopHistoryOpen?: boolean
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
      return 'bg-stone-500/20 text-stone-200'
    case 'blue':
      return 'bg-amber-900/30 text-amber-100/90'
    default:
      return 'bg-stone-500/15 text-stone-300'
  }
}

function SkillSidebarRow({
  skill,
  onNavClick,
  density,
  desktopRail,
  onActivateFeature,
}: {
  skill: SkillSummary
  onNavClick?: () => void
  density: SidebarDensity
  desktopRail?: DesktopRailState
  /** Desktop rail: open chat history column after navigating to this tool. */
  onActivateFeature?: () => void
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
    ? 'mb-1 flex items-center justify-center rounded-r-md border border-transparent border-l-[4px] border-l-transparent px-2 py-2 text-sm font-medium no-underline transition-all duration-150'
    : 'mb-1 flex items-center gap-2.5 rounded-r-md border border-transparent border-l-[4px] border-l-transparent px-3 py-2 text-sm font-medium no-underline transition-all duration-150'
  const inactive = 'text-sidebar-muted hover:border-white/10 hover:text-stone-100'
  const locked = !skill.isEnabled || !skill.isAccessible
  const featureColor = getChatFeatureColor(skill.apiToolType)
  const activeBg = hexToRgba(featureColor, 0.12)

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
    onActivateFeature?.()
  }

  if (desktopRail) {
    const dotPx = isActive && !locked ? 12 : 10
    const labelMotion = {
      opacity: desktopRail.labelsShown ? 1 : 0,
      x: desktopRail.labelsShown ? 0 : -8,
    }
    const labelTransition = {
      opacity: {
        duration: desktopRail.labelsShown ? 0.24 : 0.14,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: desktopRail.labelsShown ? 0.07 : 0,
      },
      x: {
        duration: desktopRail.labelsShown ? 0.26 : 0.15,
        ease: [0.22, 1, 0.36, 1] as const,
        delay: desktopRail.labelsShown ? 0.05 : 0,
      },
    }
    return (
      <motion.a
        href={href}
        title={skill.name}
        onClick={handleClick}
        className={[
          'mb-1 flex items-center gap-2 rounded-r-md border border-transparent border-l-[4px] border-l-transparent py-3 pl-2 pr-2 text-sm font-medium no-underline transition-colors duration-150',
          inactive,
          locked ? 'opacity-55' : '',
        ].join(' ')}
        style={{
          borderLeftColor: featureColor,
          backgroundColor: isActive && !locked ? activeBg : undefined,
        }}
        whileHover={locked ? undefined : { x: 3 }}
        whileTap={locked ? undefined : { scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 480, damping: 34, mass: 0.72 }}
        onMouseEnter={(e) => {
          if (!isActive && !locked) e.currentTarget.style.backgroundColor = hexToRgba(featureColor, 0.1)
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.backgroundColor = ''
        }}
      >
        <span className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center">
          {isActive && !locked ? (
            <span
              className="absolute rounded-full"
              style={{
                width: 24,
                height: 24,
                backgroundColor: hexToRgba(featureColor, 0.08),
              }}
              aria-hidden
            />
          ) : null}
          <span
            className="relative rounded-full"
            style={{
              width: dotPx,
              height: dotPx,
              backgroundColor: locked ? '#64748b' : featureColor,
              boxShadow: isActive && !locked
                ? `0 0 0 1px ${hexToRgba(featureColor, 0.35)}, 0 0 12px ${hexToRgba(featureColor, 0.28)}`
                : undefined,
            }}
            aria-hidden
          />
        </span>
        <motion.span
          className="min-w-0 flex-1 truncate text-[13px]"
          animate={labelMotion}
          transition={labelTransition}
        >
          {skill.name}
        </motion.span>
        {skill.badge && desktopRail.labelsShown ? (
          <motion.span
            className={[
              'flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
              badgeColorClass(skill.badgeColor),
            ].join(' ')}
            initial={false}
            animate={labelMotion}
            transition={labelTransition}
          >
            {skill.badge}
          </motion.span>
        ) : null}
        {locked ? <span className="flex-shrink-0 text-[10px] opacity-80" aria-hidden>🔒</span> : null}
      </motion.a>
    )
  }

  return (
    <a
      href={href}
      title={density === 'icons' ? skill.name : undefined}
      onClick={handleClick}
      className={[
        base,
        inactive,
        locked ? 'opacity-55' : '',
      ].join(' ')}
      style={{
        borderLeftColor: featureColor,
        backgroundColor: isActive && !locked ? activeBg : undefined,
      }}
      onMouseEnter={e => {
        if (!isActive && !locked) e.currentTarget.style.backgroundColor = hexToRgba(featureColor, 0.1)
      }}
      onMouseLeave={e => {
        if (!isActive) e.currentTarget.style.backgroundColor = ''
      }}
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
  const responsesLabel = responsesLeft === Infinity ? 'Unbegrenzt' : `${responsesLeft}`
  if (compact) {
    return (
      <button
        type="button"
        onClick={() => navigate('/pricing')}
        className="mx-1 mb-1 flex items-center justify-center rounded-lg border border-white/12 bg-white/[0.03] p-2 text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-slate-100"
        title="Upgrade"
        aria-label="Nachrichten-Limit und Upgrade"
      >
        <Sparkles size={14} />
      </button>
    )
  }

  return (
    <button
      onClick={() => navigate('/pricing')}
      className="mx-2 mb-2 flex items-center justify-between gap-2 rounded-lg border border-white/12 bg-white/[0.03] px-3 py-2 text-left transition-colors hover:border-white/20 hover:bg-white/[0.08]"
    >
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
        <Sparkles size={11} className="text-slate-400" />
        <span>{responsesLabel} Nachrichten uebrig</span>
      </span>
      <span className="inline-flex items-center gap-1 text-[10px] text-slate-300">
        Upgrade
        <ArrowRight size={12} />
      </span>
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

/** One-line usage for 48px desktop rail */
function UsageBarRail() {
  const { plan, usageToday, dailyLimit } = useUserPlan()
  if (plan === 'pro') return null
  const limitLabel = dailyLimit === Infinity ? '∞' : String(dailyLimit)
  return (
    <div className="border-t border-white/6 px-2 py-2">
      <p className="text-center text-[10px] tabular-nums leading-tight text-slate-400">
        {usageToday}/{limitLabel}
      </p>
    </div>
  )
}

const RECENT_PAGE_SIZE = 3
const PRIMARY_TOOL_ORDER = ['general', 'jobanalyzer', 'interviewprep', 'cover_letter', 'salary_coach', 'linkedin']
const SECONDARY_TOOL_ORDER = ['programming', 'language']

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

export default function SidebarNavContent({
  density = 'full',
  onNavClick,
  desktopRail,
  desktopHistoryOpen = false,
}: Props) {
  const navigate = useNavigate()
  const { plan } = useUserPlan()
  const { skills, loading: skillsLoading } = useSkills()
  const store = useChatSessions()
  const { setDesktopChatHistoryOpen } = useLayoutChrome()
  const iconsOnly = density === 'icons'
  const [recentVisible, setRecentVisible] = useState(RECENT_PAGE_SIZE)
  const [secondaryOpen, setSecondaryOpen] = useState(false)

  useEffect(() => {
    if (desktopHistoryOpen)
      setSecondaryOpen(false)
  }, [desktopHistoryOpen])

  /** Depends on wide only — parent passes a new desktopRail object each render. */
  useEffect(() => {
    if (!desktopRail)
      return
    if (!desktopRail.wide)
      setSecondaryOpen(false)
  }, [desktopRail?.wide])

  const orderedSkills = useMemo(() => {
    if (!skills?.length) return { primary: [], secondary: [], leftover: [] } as {
      primary: SkillSummary[]
      secondary: SkillSummary[]
      leftover: SkillSummary[]
    }
    const byTool = new Map<string, SkillSummary>()
    for (const s of skills) byTool.set(s.apiToolType.toLowerCase(), s)

    const pick = (tool: string): SkillSummary | null => byTool.get(tool) ?? null
    const primary = PRIMARY_TOOL_ORDER.map(pick).filter(Boolean) as SkillSummary[]
    const secondary = SECONDARY_TOOL_ORDER.map(pick).filter(Boolean) as SkillSummary[]
    const used = new Set([...PRIMARY_TOOL_ORDER, ...SECONDARY_TOOL_ORDER])
    const leftover = skills.filter(s => !used.has(s.apiToolType.toLowerCase()))
    return { primary, secondary, leftover }
  }, [skills])

  const allRecent = useMemo(
    () => recentSessionsList(store.sessions, store.sessionOrder),
    [store.sessions, store.sessionOrder],
  )
  const recent = allRecent.slice(0, recentVisible)
  const hasMore = allRecent.length > recentVisible
  const currentToolKey = store.currentToolType.toLowerCase()
  const secondaryHasActive = orderedSkills.secondary.some(skill => skill.apiToolType.toLowerCase() === currentToolKey)

  const openRecent = (s: ChatSession) => {
    const q = TOOL_TO_QUERY[s.toolType]
    navigate(`/chat?tool=${encodeURIComponent(q)}`, { state: { activateSessionId: s.id } })
    onNavClick?.()
  }

  const activateDesktopHistory = desktopRail ? () => setDesktopChatHistoryOpen(true) : undefined

  return (
    <div className="flex h-full min-h-0 flex-col overflow-x-hidden">
      {plan !== 'pro' && <UsageBanner compact={iconsOnly || Boolean(desktopRail)} />}

      <div className={`flex min-h-0 flex-1 flex-col px-2 pb-1 ${desktopRail ? 'pt-2' : 'pt-2.5'}`}>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {skillsLoading && (
            <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-500">
              <Loader2 size={14} className="animate-spin" />
              Tools laden…
            </div>
          )}
          {!skillsLoading && (
            <>
              {orderedSkills.primary.map(skill => (
                <SkillSidebarRow
                  key={skill.id}
                  skill={skill}
                  density={density}
                  desktopRail={desktopRail}
                  onActivateFeature={activateDesktopHistory}
                  onNavClick={onNavClick}
                />
              ))}
              {orderedSkills.secondary.length > 0 && (
                <div className="pt-1.5">
                  {desktopRail ? (
                    <>
                      <motion.button
                        type="button"
                        title="Weitere Werkzeuge"
                        onClick={() => setSecondaryOpen(v => !v)}
                        className={[
                          'mb-1 flex w-full items-center gap-2 rounded-r-md border border-transparent border-l-[4px] border-l-slate-500 py-3 pl-2 pr-2 text-sm font-medium text-stone-300 hover:bg-white/[0.06]',
                          desktopRail.labelsShown ? 'justify-start' : 'justify-center',
                        ].join(' ')}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 460, damping: 34 }}
                      >
                        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
                          <MoreHorizontal size={18} className="text-slate-400" aria-hidden />
                        </span>
                        <motion.span
                          className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold tracking-wide"
                          initial={false}
                          animate={{
                            opacity: desktopRail.labelsShown ? 1 : 0,
                            x: desktopRail.labelsShown ? 0 : -8,
                          }}
                          transition={{
                            opacity: {
                              duration: desktopRail.labelsShown ? 0.24 : 0.14,
                              ease: [0.22, 1, 0.36, 1],
                              delay: desktopRail.labelsShown ? 0.07 : 0,
                            },
                            x: {
                              duration: desktopRail.labelsShown ? 0.26 : 0.15,
                              ease: [0.22, 1, 0.36, 1],
                              delay: desktopRail.labelsShown ? 0.05 : 0,
                            },
                          }}
                        >
                          Weitere Werkzeuge
                        </motion.span>
                        <motion.span
                          className="flex-shrink-0"
                          initial={false}
                          animate={{
                            opacity: desktopRail.labelsShown ? 1 : 0,
                            x: desktopRail.labelsShown ? 0 : -6,
                          }}
                          transition={{
                            opacity: { duration: desktopRail.labelsShown ? 0.22 : 0.12, ease: [0.22, 1, 0.36, 1] },
                            x: { duration: desktopRail.labelsShown ? 0.22 : 0.12, ease: [0.22, 1, 0.36, 1] },
                          }}
                        >
                          {(secondaryOpen || secondaryHasActive) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </motion.span>
                      </motion.button>
                      {(secondaryOpen || secondaryHasActive) && (
                        <div className="ml-0 border-l border-stone-700/60 pl-1.5">
                          {orderedSkills.secondary.map(skill => (
                            <SkillSidebarRow
                              key={skill.id}
                              skill={skill}
                              density={density}
                              desktopRail={desktopRail}
                              onActivateFeature={activateDesktopHistory}
                              onNavClick={onNavClick}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSecondaryOpen(v => !v)}
                        className="mb-1 flex w-full items-center justify-between rounded-r-md border border-stone-600/35 border-l-4 border-l-stone-500/60 px-3 py-2 text-[11px] font-semibold tracking-wide text-stone-200 transition hover:border-stone-500/60 hover:bg-white/[0.06]"
                      >
                        <span className="inline-flex items-center gap-1.5">
                          Weitere Werkzeuge
                          <span className="rounded-full border border-stone-500/50 bg-stone-700/40 px-1.5 py-0 text-[10px] text-stone-300">
                            {orderedSkills.secondary.length}
                          </span>
                        </span>
                        {(secondaryOpen || secondaryHasActive) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                      {(secondaryOpen || secondaryHasActive) && (
                        <div className="ml-1 border-l border-stone-700/60 pl-1.5">
                          {orderedSkills.secondary.map(skill => (
                            <SkillSidebarRow
                              key={skill.id}
                              skill={skill}
                              density={density}
                              onNavClick={onNavClick}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              {orderedSkills.leftover.map(skill => (
                <SkillSidebarRow
                  key={skill.id}
                  skill={skill}
                  density={density}
                  desktopRail={desktopRail}
                  onActivateFeature={activateDesktopHistory}
                  onNavClick={onNavClick}
                />
              ))}
            </>
          )}
        </div>

        {!iconsOnly && !desktopRail && (
          <div className="mt-2 flex max-h-[min(170px,24vh)] min-h-0 flex-shrink-0 flex-col border-t border-white/6 pt-2">
            <p className="flex-shrink-0 px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500/90">
              Letzte Gespräche
            </p>
            <div className="min-h-0 flex-1 overflow-y-auto px-1 pb-0.5">
              {allRecent.length === 0 ? (
                <p className="px-3 py-1.5 text-xs text-slate-500">Noch keine Gespräche.</p>
              ) : (
                <>
                  <ul className="space-y-0.5">
                    {recent.map(s => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => openRecent(s)}
                          className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-sidebar-text transition-colors hover:bg-white/[0.07] hover:text-stone-100"
                        >
                          <span
                            className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                            style={toolSessionDotStyle(s.toolType)}
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1 truncate text-[11px] font-medium leading-tight">
                            {sessionListLabel(s, 32)}
                          </span>
                          <span className="flex-shrink-0 text-[10px] text-slate-400">
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
                      className="mt-0.5 w-full rounded-lg px-2 py-1 text-left text-[10px] font-medium text-slate-400 transition-colors hover:bg-white/[0.07] hover:text-slate-200"
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
        {desktopRail ? <UsageBarRail /> : !iconsOnly ? <UsageBar /> : null}
      </div>
    </div>
  )
}
