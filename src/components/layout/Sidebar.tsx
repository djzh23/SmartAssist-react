import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Wrench, MessageCircle, Briefcase, Globe, Code2, Target, Tag, User } from 'lucide-react'
import { useUserPlan } from '../../hooks/useUserPlan'
import AuthButton from '../ui/AuthButton'

interface Props {
  onNavClick?: () => void
}

interface NavItem {
  label: string
  icon: React.ReactNode
  to: string
  exact?: boolean
}

const mainLinks: NavItem[] = [
  { label: 'Home',    icon: <Home   size={15} />, to: '/',       exact: true },
  { label: 'Tools',   icon: <Wrench size={15} />, to: '/tools' },
  { label: 'Pricing', icon: <Tag    size={15} />, to: '/pricing' },
]

const chatLinks: NavItem[] = [
  { label: 'General Chat',    icon: <MessageCircle size={15} />, to: '/chat' },
  { label: 'Job Analyzer',    icon: <Briefcase     size={15} />, to: '/chat?tool=jobanalyzer' },
  { label: 'Interview Coach', icon: <Target        size={15} />, to: '/chat?tool=interviewprep' },
  { label: 'Programming',     icon: <Code2         size={15} />, to: '/chat?tool=programming' },
  { label: 'Language',        icon: <Globe         size={15} />, to: '/chat?tool=language' },
]

function SidebarLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const isChatLink = item.to.includes('?')
  const targetTool = isChatLink ? new URLSearchParams(item.to.split('?')[1]).get('tool') : null
  const currentTool = location.pathname === '/chat'
    ? new URLSearchParams(location.search).get('tool') ?? 'general'
    : null

  const isActive   = isChatLink
    ? location.pathname === '/chat' && (
      location.search === `?tool=${targetTool}` ||
      (targetTool === 'interviewprep' && currentTool === 'interview') ||
      (targetTool === 'interview' && currentTool === 'interviewprep')
    )
    : item.exact
      ? location.pathname === '/'
      : location.pathname.startsWith(item.to) && item.to !== '/'

  const base     = 'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-[3px] no-underline mb-0.5'
  const active   = 'bg-sidebar-active text-white border-primary'
  const inactive = 'text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text border-transparent'

  const handleClick = (e: React.MouseEvent) => {
    if (isChatLink) {
      e.preventDefault()
      navigate(item.to)
    }
    onClick?.()
  }

  if (isChatLink) {
    return (
      <a href={item.to} onClick={handleClick} className={`${base} ${isActive ? active : inactive}`}>
        <span className="w-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>
        <span>{item.label}</span>
      </a>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={onClick}
      className={({ isActive: a }) => `${base} ${a ? active : inactive}`}
    >
      <span className="w-4 flex-shrink-0 flex items-center justify-center">{item.icon}</span>
      <span>{item.label}</span>
    </NavLink>
  )
}

function UsageBanner() {
  const navigate = useNavigate()
  const { plan, responsesLeft } = useUserPlan()

  if (plan === 'pro') return null

  return (
    <button
      onClick={() => navigate('/pricing')}
      className="mx-2 mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left transition-colors hover:bg-amber-500/20"
    >
      <span className="text-[11px] font-medium text-amber-300">
        âš¡ {responsesLeft === Infinity ? 'âˆž' : responsesLeft} responses left Â· Upgrade
      </span>
      <span className="text-[10px] text-amber-400">â†’</span>
    </button>
  )
}

function UsageBar() {
  const { plan, usageToday, dailyLimit } = useUserPlan()

  if (plan === 'pro') return null

  const pct = dailyLimit === Infinity ? 0 : Math.min(100, (usageToday / dailyLimit) * 100)
  const barColor = pct > 90 ? '#EF4444' : pct > 70 ? '#F59E0B' : '#06B6D4'
  const limitLabel = dailyLimit === Infinity ? 'âˆž' : String(dailyLimit)

  return (
    <div className="border-t border-white/8 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>Daily usage</span>
        <span>{usageToday}/{limitLabel}</span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, pct)}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  )
}

export default function Sidebar({ onNavClick }: Props) {
  const { plan } = useUserPlan()

  return (
    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 flex-shrink-0">
        <span className="text-xl leading-none">ðŸŽ¯</span>
        <span className="text-white font-bold text-[15px] tracking-wide">SmartAssist</span>
      </div>

      <div className="h-px bg-sidebar-border mx-0 mb-2 flex-shrink-0" />

      {/* Usage banner */}
      {plan !== 'pro' && <UsageBanner />}

      <nav className="flex flex-col px-2 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-3 pb-1.5">
          Main
        </p>
        {mainLinks.map(l => (
          <SidebarLink key={l.to} item={l} onClick={onNavClick} />
        ))}

        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-5 pb-1.5">
          Career Tools
        </p>
        {chatLinks.map(l => (
          <SidebarLink key={l.to} item={l} onClick={onNavClick} />
        ))}

        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-5 pb-1.5">
          Account
        </p>
        <SidebarLink
          item={{ label: 'Profile', icon: <User size={15} />, to: '/profile' }}
          onClick={onNavClick}
        />
      </nav>

      {/* Bottom: usage bar + auth */}
      <div className="flex-shrink-0">
        <UsageBar />
        <div className="h-px bg-sidebar-border mx-0 my-1" />
        <AuthButton variant="full" />
      </div>
    </div>
  )
}

