import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Wrench, MessageCircle, Cloud, Briefcase, Laugh, Globe } from 'lucide-react'

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
  { label: 'Home',  icon: <Home  size={15} />, to: '/',      exact: true },
  { label: 'Tools', icon: <Wrench size={15} />, to: '/tools' },
]

const chatLinks: NavItem[] = [
  { label: 'General Chat',  icon: <MessageCircle size={15} />, to: '/chat' },
  { label: 'Weather',       icon: <Cloud         size={15} />, to: '/chat?tool=weather' },
  { label: 'Job Analyzer',  icon: <Briefcase     size={15} />, to: '/chat?tool=jobanalyzer' },
  { label: 'Jokes',         icon: <Laugh         size={15} />, to: '/chat?tool=jokes' },
  { label: 'Language',      icon: <Globe         size={15} />, to: '/chat?tool=language' },
]

function SidebarLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const navigate   = useNavigate()
  const location   = useLocation()

  // For chat links we need to compare full path+search
  const isChatLink = item.to.includes('?')
  const isActive   = isChatLink
    ? location.pathname === '/chat' && location.search === `?tool=${new URLSearchParams(item.to.split('?')[1]).get('tool')}`
    : item.exact
      ? location.pathname === '/'
      : location.pathname.startsWith(item.to) && item.to !== '/'

  const base = 'flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 border-l-[3px] no-underline mb-0.5'
  const active = 'bg-sidebar-active text-white border-primary'
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

export default function Sidebar({ onNavClick }: Props) {
  return (
    <div className="h-full flex flex-col overflow-y-auto overflow-x-hidden">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 py-5 flex-shrink-0">
        <span className="text-xl leading-none">⚡</span>
        <span className="text-white font-bold text-[15px] tracking-wide">SmartAssist</span>
      </div>

      <div className="h-px bg-sidebar-border mx-0 mb-2 flex-shrink-0" />

      <nav className="flex flex-col px-2 flex-1">
        {/* MAIN */}
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-3 pb-1.5">
          Main
        </p>
        {mainLinks.map(l => (
          <SidebarLink key={l.to} item={l} onClick={onNavClick} />
        ))}

        {/* MY CHATS */}
        <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-slate-500 px-3 pt-5 pb-1.5">
          My Chats
        </p>
        {chatLinks.map(l => (
          <SidebarLink key={l.to} item={l} onClick={onNavClick} />
        ))}
      </nav>
    </div>
  )
}
