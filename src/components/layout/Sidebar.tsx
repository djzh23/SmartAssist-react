import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Wrench, MessageCircle, Briefcase, Globe, Code2, Target, Tag, User, Zap, Sparkles, Crown, LogIn } from 'lucide-react'
import { useUserPlan, getPlanLabel, getPlanColors } from '../../hooks/useUserPlan'

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
  { label: 'Home',    icon: <Home   size={15} />, to: '/',      exact: true },
  { label: 'Tools',   icon: <Wrench size={15} />, to: '/tools' },
  { label: 'Pricing', icon: <Tag    size={15} />, to: '/pricing' },
]

const chatLinks: NavItem[] = [
  { label: 'General Chat',    icon: <MessageCircle size={15} />, to: '/chat' },
  { label: 'Job Analyzer',    icon: <Briefcase     size={15} />, to: '/chat?tool=jobanalyzer' },
  { label: 'Interview Coach', icon: <Target        size={15} />, to: '/chat?tool=interview' },
  { label: 'Programming',     icon: <Code2         size={15} />, to: '/chat?tool=programming' },
  { label: 'Language',        icon: <Globe         size={15} />, to: '/chat?tool=language' },
]

function SidebarLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const navigate  = useNavigate()
  const location  = useLocation()

  const isChatLink = item.to.includes('?')
  const isActive   = isChatLink
    ? location.pathname === '/chat' && location.search === `?tool=${new URLSearchParams(item.to.split('?')[1]).get('tool')}`
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
  const user = useUserPlan()

  if (user.plan !== 'free') return null

  const remaining = Math.max(0, user.dailyLimit - user.usageToday)

  return (
    <button
      onClick={() => navigate('/pricing')}
      className="mx-2 mb-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-left transition-colors hover:bg-amber-500/20"
    >
      <span className="text-[11px] font-medium text-amber-300">
        ⚡ {remaining} responses left · Upgrade
      </span>
      <span className="text-[10px] text-amber-400">→</span>
    </button>
  )
}

function ProfileSection({ onNavClick }: { onNavClick?: () => void }) {
  const navigate = useNavigate()
  const user = useUserPlan()
  const planColors = getPlanColors(user.plan)
  const planLabel = getPlanLabel(user.plan)

  const initials = user.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : user.email
      ? user.email.slice(0, 2).toUpperCase()
      : '?'

  const PlanIcon = user.plan === 'pro' ? Crown : user.plan === 'premium' ? Sparkles : Zap

  return (
    <div className="mx-2 mb-2 rounded-xl border border-white/10 bg-white/5 p-3">
      <button
        onClick={() => { navigate('/profile'); onNavClick?.() }}
        className="flex w-full items-center gap-3 text-left"
      >
        {/* Avatar */}
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-700 text-xs font-bold text-slate-200">
          {user.isLoggedIn ? initials : <User size={15} className="text-slate-400" />}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-slate-200">
            {user.isLoggedIn ? (user.email ?? user.name ?? 'User') : 'Guest User'}
          </p>
          {user.isLoggedIn ? (
            <span className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${planColors.badge}`}>
              <PlanIcon size={8} />
              {planLabel}
            </span>
          ) : (
            <p className="text-[10px] text-slate-500">
              {Math.max(0, user.dailyLimit - user.usageToday)} free responses left
            </p>
          )}
        </div>
      </button>

      {!user.isLoggedIn && (
        <button className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-600 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:border-slate-400 hover:text-white">
          <LogIn size={12} />
          Sign in
        </button>
      )}
    </div>
  )
}

export default function Sidebar({ onNavClick }: Props) {
  const user = useUserPlan()

  return (
    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 flex-shrink-0">
        <span className="text-xl leading-none">🎯</span>
        <span className="text-white font-bold text-[15px] tracking-wide">SmartAssist</span>
      </div>

      <div className="h-px bg-sidebar-border mx-0 mb-2 flex-shrink-0" />

      {/* Usage banner — only for free plan */}
      {user.plan === 'free' && <UsageBanner />}

      <nav className="flex flex-col px-2 flex-1">
        {/* MAIN */}
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-3 pb-1.5">
          Main
        </p>
        {mainLinks.map(l => (
          <SidebarLink key={l.to} item={l} onClick={onNavClick} />
        ))}

        {/* CAREER TOOLS */}
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-5 pb-1.5">
          Career Tools
        </p>
        {chatLinks.map(l => (
          <SidebarLink key={l.to} item={l} onClick={onNavClick} />
        ))}

        {/* Profile link */}
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-5 pb-1.5">
          Account
        </p>
        <SidebarLink
          item={{ label: 'Profile', icon: <User size={15} />, to: '/profile' }}
          onClick={onNavClick}
        />
      </nav>

      <div className="h-px bg-sidebar-border mx-0 mt-2 mb-2 flex-shrink-0" />

      {/* Profile section */}
      <ProfileSection onNavClick={onNavClick} />
    </div>
  )
}
