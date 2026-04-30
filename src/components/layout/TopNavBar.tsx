import { useEffect, useRef, useState, type Ref } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SignOutButton } from '@clerk/clerk-react'
import {
  ArrowLeft,
  LayoutDashboard,
  Menu,
  Settings,
  ShieldCheck,
  Tag,
  User,
  X,
} from 'lucide-react'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useUserPlan } from '../../hooks/useUserPlan'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useMobileNavTitle } from '../../hooks/useMobileNavTitle'
import { useLayoutChrome } from '../../context/LayoutChromeContext'
import { MAIN_NAV_ITEMS } from '../../config/mainNavigation'

interface Props {
  onMenuClick: () => void
  menuOpen: boolean
}

const navBtn =
  'rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors min-[769px]:px-3 desktop:px-3'
const navActive = 'bg-amber-500/15 text-amber-100'
const navIdle = 'text-stone-300 hover:bg-white/8 hover:text-white'

function navClass(isActive: boolean): string {
  return `${navBtn} ${isActive ? navActive : navIdle}`
}

function UserAvatarMenu({
  isMobile,
  planColor,
  initials,
  email,
  isAdmin,
}: {
  isMobile: boolean
  planColor: string
  initials: string
  email: string | null
  isAdmin: boolean
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUserMenuOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    if (!userMenuOpen) return
    const onDoc = (e: MouseEvent) => {
      const el = userMenuRef.current
      if (!el?.contains(e.target as Node)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [userMenuOpen])

  return (
    <div className="relative" ref={userMenuRef}>
      <button
        type="button"
        onClick={() => setUserMenuOpen(v => !v)}
        className={[
          'flex items-center justify-center rounded-xl font-bold text-white shadow-sm transition hover:opacity-95',
          isMobile ? 'h-8 w-8 min-h-[32px] min-w-[32px] text-[11px]' : 'h-9 w-9 text-xs',
        ].join(' ')}
        style={{ backgroundColor: planColor }}
        aria-expanded={userMenuOpen}
        aria-haspopup="menu"
        aria-label="Benutzermenü"
      >
        {initials}
      </button>
      {userMenuOpen && (
        <div
          className="absolute right-0 top-full z-[60] mt-1.5 min-w-[200px] rounded-lg border border-stone-600/50 bg-[#1f1812] py-1 shadow-landing-md"
          role="menu"
        >
          <p className="truncate px-3 py-2 text-xs text-stone-400" title={email ?? undefined}>
            {email?.split('@')[0] ?? 'Account'}
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 hover:bg-white/6"
            onClick={() => {
              setUserMenuOpen(false)
              navigate('/overview')
            }}
          >
            <LayoutDashboard size={16} className="text-stone-400" aria-hidden />
            Übersicht
          </button>
          <div className="my-1.5 border-t border-stone-600/40" role="presentation" />
          <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Konto & Plan
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 pl-5 text-left text-sm text-stone-200 hover:bg-white/6"
            onClick={() => {
              setUserMenuOpen(false)
              navigate('/profile')
            }}
          >
            <User size={16} className="text-stone-400" aria-hidden />
            Profil
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 hover:bg-white/6"
            onClick={() => {
              setUserMenuOpen(false)
              navigate('/pricing')
            }}
          >
            <Tag size={16} className="text-stone-400" aria-hidden />
            Preise
          </button>
          {isAdmin && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 hover:bg-white/6"
              onClick={() => {
                setUserMenuOpen(false)
                navigate('/admin')
              }}
            >
              <ShieldCheck size={16} className="text-stone-400" aria-hidden />
              Admin
            </button>
          )}
          <div className="my-1 h-px bg-stone-600/40" />
          <SignOutButton>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm font-medium text-rose-400 hover:bg-rose-950/50"
            >
              Abmelden
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  )
}

export default function TopNavBar({ onMenuClick, menuOpen }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const bp = useBreakpoint()
  const mobileTitle = useMobileNavTitle()
  const { drawerTriggerRef } = useLayoutChrome()
  const { isAdmin } = useIsAdmin()
  const { plan, planLabel, planColor, initials, email } = useUserPlan()

  const showPlanBadge = plan === 'premium' || plan === 'pro'
  const isChatRoute = location.pathname === '/chat'

  if (bp === 'mobile') {
    return (
      <header className="sticky top-0 z-50 flex h-12 flex-shrink-0 items-center gap-2 border-b border-sidebar-border bg-sidebar px-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {isChatRoute ? (
            <button
              type="button"
              onClick={() => navigate('/overview')}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-sidebar-hover"
              aria-label="Zurück"
            >
              <ArrowLeft size={22} />
            </button>
          ) : (
            <button
              ref={drawerTriggerRef as Ref<HTMLButtonElement>}
              type="button"
              onClick={onMenuClick}
              className="flex h-11 w-11 min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center rounded-lg text-white/90 hover:bg-sidebar-hover"
              aria-label={menuOpen ? 'Navigation schließen' : 'Navigation öffnen'}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          )}
          <p className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-wide text-white">
            {mobileTitle}
          </p>
        </div>
        <UserAvatarMenu
          isMobile
          planColor={planColor}
          initials={initials}
          email={email}
          isAdmin={isAdmin}
        />
      </header>
    )
  }

  return (
    <header
      className={[
        'sticky top-0 z-50 flex h-[52px] flex-shrink-0 items-center gap-2 border-b border-stone-600/40 bg-[#1a1208]/92 px-2 backdrop-blur-xl desktop:px-4',
        'min-[769px]:grid min-[769px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[769px]:items-center min-[769px]:gap-2 desktop:gap-3',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center justify-start gap-2">
        <Link
          to="/overview"
          className="flex min-w-0 flex-shrink-0 items-center gap-2 rounded-lg py-1 pr-2 no-underline hover:opacity-90"
        >
          <img src="/favicon.png" alt="" className="h-8 w-8 rounded-lg" width={32} height={32} />
          <span className="hidden text-[15px] font-bold tracking-wide text-stone-50 sm:inline">PrivatePrep</span>
        </Link>
      </div>

      <nav className="hidden shrink-0 items-center justify-center gap-0.5 min-[769px]:flex desktop:gap-1">
        {MAIN_NAV_ITEMS.map(item => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.key}
              to={item.route}
              end={item.route === '/overview' || item.route === '/tools'}
              className={() => navClass(item.matchesPath(location.pathname))}
            >
              <span className="inline-flex items-center gap-1.5">
                <Icon size={15} className="shrink-0 opacity-80" aria-hidden />
                {item.label}
              </span>
            </NavLink>
          )
        })}
      </nav>

      <div className="ml-auto flex min-w-0 flex-shrink-0 items-center justify-end gap-1.5 min-[769px]:ml-0 sm:gap-2">
        {showPlanBadge && (
          <span
            className="hidden rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide sm:inline"
            style={{
              backgroundColor: `${planColor}22`,
              color: planColor,
              border: `1px solid ${planColor}44`,
            }}
          >
            {planLabel}
          </span>
        )}

        <button
          type="button"
          onClick={() => navigate('/pricing')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/10 hover:text-stone-100"
          aria-label="Preise und Einstellungen"
          title="Preise"
        >
          <Settings size={20} />
        </button>

        <UserAvatarMenu
          isMobile={false}
          planColor={planColor}
          initials={initials}
          email={email}
          isAdmin={isAdmin}
        />
      </div>
    </header>
  )
}
