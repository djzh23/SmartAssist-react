import { useEffect, useRef, useState, type Ref } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SignOutButton } from '@clerk/clerk-react'
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  FolderOpen,
  Menu,
  NotebookPen,
  Settings,
  ShieldCheck,
  Tag,
  User,
  Wrench,
  X,
} from 'lucide-react'
import { useIsAdmin } from '../../hooks/useIsAdmin'
import { useUserPlan } from '../../hooks/useUserPlan'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useMobileNavTitle } from '../../hooks/useMobileNavTitle'
import { useLayoutChrome } from '../../context/LayoutChromeContext'

interface Props {
  onMenuClick: () => void
  menuOpen: boolean
}

const navBtn =
  'rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors min-[769px]:px-3 desktop:px-3'
const navActive = 'bg-primary-light text-primary'
const navIdle = 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'

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
          className="absolute right-0 top-full z-[60] mt-1.5 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          role="menu"
        >
          <p className="truncate px-3 py-2 text-xs text-slate-500" title={email ?? undefined}>
            {email?.split('@')[0] ?? 'Account'}
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setUserMenuOpen(false)
              navigate('/profile')
            }}
          >
            <User size={16} className="text-slate-500" aria-hidden />
            Mein Profil
          </button>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setUserMenuOpen(false)
              navigate('/pricing')
            }}
          >
            <Tag size={16} className="text-slate-500" aria-hidden />
            Preise
          </button>
          {isAdmin && (
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => {
                setUserMenuOpen(false)
                navigate('/admin')
              }}
            >
              <ShieldCheck size={16} className="text-slate-500" aria-hidden />
              Admin
            </button>
          )}
          <div className="my-1 h-px bg-slate-100" />
          <SignOutButton>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50"
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
              onClick={() => navigate('/tools')}
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
        'sticky top-0 z-50 flex h-[52px] flex-shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-2 desktop:px-4',
        'min-[769px]:grid min-[769px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] min-[769px]:items-center min-[769px]:gap-2 desktop:gap-3',
      ].join(' ')}
    >
      <div className="flex min-w-0 items-center justify-start gap-2">
        <Link
          to="/tools"
          className="flex min-w-0 flex-shrink-0 items-center gap-2 rounded-lg py-1 pr-2 no-underline hover:opacity-90"
        >
          <img src="/favicon.png" alt="" className="h-8 w-8 rounded-lg" width={32} height={32} />
          <span className="hidden text-[15px] font-bold tracking-wide text-slate-900 sm:inline">PrivatePrep</span>
        </Link>
      </div>

      <nav className="hidden shrink-0 items-center justify-center gap-0.5 min-[769px]:flex desktop:gap-1">
        <NavLink to="/tools" end className={({ isActive }) => navClass(isActive)}>
          <span className="inline-flex items-center gap-1.5">
            <Wrench size={15} className="shrink-0 opacity-80" aria-hidden />
            Startseite
          </span>
        </NavLink>
        <NavLink to="/career-profile" className={({ isActive }) => navClass(isActive)}>
          <span className="inline-flex items-center gap-1.5">
            <ClipboardList size={15} className="shrink-0 opacity-80" aria-hidden />
            Karriereprofil
          </span>
        </NavLink>
        <NavLink
          to="/applications"
          className={({ isActive }) =>
            navClass(isActive || location.pathname.startsWith('/applications'))
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <FolderOpen size={15} className="shrink-0 opacity-80" aria-hidden />
            Bewerbungen
          </span>
        </NavLink>
        <NavLink
          to="/guides"
          className={({ isActive }) =>
            navClass(isActive || location.pathname.startsWith('/guides'))
          }
        >
          <span className="inline-flex items-center gap-1.5">
            <BookOpen size={15} className="shrink-0 opacity-80" aria-hidden />
            Ratgeber
          </span>
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => navClass(isActive)}>
          <span className="inline-flex items-center gap-1.5">
            <NotebookPen size={15} className="shrink-0 opacity-80" aria-hidden />
            Notizen
          </span>
        </NavLink>
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
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
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
