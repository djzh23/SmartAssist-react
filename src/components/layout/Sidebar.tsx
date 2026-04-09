import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Code2,
  Globe,
  MessageCircle,
  Sparkles,
  Tag,
  Target,
  User,
  Wrench,
} from 'lucide-react'
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
  { label: 'Startseite', icon: <Wrench size={15} />, to: '/tools' },
]

const chatLinks: NavItem[] = [
  { label: 'Allgemeiner Chat', icon: <MessageCircle size={15} />, to: '/chat' },
  { label: 'Stellenanalyse', icon: <Briefcase size={15} />, to: '/chat?tool=jobanalyzer' },
  { label: 'Vorstellungsgespräch', icon: <Target size={15} />, to: '/chat?tool=interviewprep' },
  { label: 'Programmieren', icon: <Code2 size={15} />, to: '/chat?tool=programming' },
  { label: 'Sprachen lernen', icon: <Globe size={15} />, to: '/chat?tool=language' },
]

function SidebarLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const toolFromUrl = location.pathname === '/chat' ? (searchParams.get('tool') ?? 'general') : null

  const isGeneralChat = item.to === '/chat'
  const isChatLink = item.to.includes('?') || isGeneralChat
  const targetTool = item.to.includes('?')
    ? new URLSearchParams(item.to.split('?')[1]).get('tool')
    : null

  const isActive = isGeneralChat
    ? location.pathname === '/chat' && toolFromUrl === 'general'
    : isChatLink && targetTool
      ? location.pathname === '/chat' && toolFromUrl === targetTool
      : item.exact
        ? location.pathname === '/'
        : location.pathname.startsWith(item.to) && item.to !== '/'

  const base = 'mb-0.5 flex items-center gap-2.5 rounded-lg border-l-[3px] px-4 py-2.5 text-sm font-medium no-underline transition-all duration-150'
  const active = 'border-primary bg-sidebar-active text-white'
  const inactive = 'border-transparent text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-text'

  const handleClick = (event: React.MouseEvent) => {
    if (isChatLink) {
      event.preventDefault()
      navigate(isGeneralChat ? '/chat' : item.to)
    }
    onClick?.()
  }

  if (isChatLink) {
    return (
      <a href={isGeneralChat ? '/chat' : item.to} onClick={handleClick} className={`${base} ${isActive ? active : inactive}`}>
        <span className="flex w-4 flex-shrink-0 items-center justify-center">{item.icon}</span>
        <span>{item.label}</span>
      </a>
    )
  }

  return (
    <NavLink
      to={item.to}
      end={item.exact}
      onClick={onClick}
      className={({ isActive: navIsActive }) => `${base} ${navIsActive ? active : inactive}`}
    >
      <span className="flex w-4 flex-shrink-0 items-center justify-center">{item.icon}</span>
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
    <div className="border-t border-white/8 px-3 py-2">
      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-500">
        <span>Tagesverbrauch</span>
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
    <div className="flex h-full flex-col overflow-x-hidden overflow-y-auto">
      <div className="flex flex-shrink-0 items-center gap-2.5 px-4 py-5">
        <img src="/favicon.png" alt="PrivatePrep" className="h-7 w-7 rounded-lg" />
        <span className="text-[15px] font-bold tracking-wide text-white">PrivatePrep</span>
      </div>

      <div className="mx-0 mb-2 h-px flex-shrink-0 bg-sidebar-border" />
      {plan !== 'pro' && <UsageBanner />}

      <nav className="flex flex-1 flex-col px-2">
        <p className="px-3 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">Hauptmenü</p>
        {mainLinks.map(link => (
          <SidebarLink key={link.to} item={link} onClick={onNavClick} />
        ))}

        <p className="px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">Chat und Karriere</p>
        {chatLinks.map(link => (
          <SidebarLink key={link.to} item={link} onClick={onNavClick} />
        ))}

        <p className="px-3 pb-1.5 pt-5 text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500">Konto</p>
        <SidebarLink item={{ label: 'Mein Profil', icon: <User size={15} />, to: '/profile' }} onClick={onNavClick} />
        <SidebarLink item={{ label: 'Preise', icon: <Tag size={15} />, to: '/pricing' }} onClick={onNavClick} />
      </nav>

      <div className="flex-shrink-0">
        <UsageBar />
        <div className="mx-0 my-1 h-px bg-sidebar-border" />
        <AuthButton variant="full" />
      </div>
    </div>
  )
}
