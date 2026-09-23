import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { SignOutButton } from '@clerk/clerk-react'
import { User } from 'lucide-react'
import { MAIN_NAV_ITEMS } from '../../config/mainNavigation'
import { useUserPlan } from '../../hooks/useUserPlan'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useInboxNewCount } from '../../hooks/useInboxNewCount'

// onMenuClick/menuOpen kept in Props so MainLayout can still pass them without type error
interface Props {
  onMenuClick?: () => void
  menuOpen?: boolean
}

function UserAvatarMenu({
  isMobile,
  planColor,
  planLabel,
  initials,
  email,
}: {
  isMobile: boolean
  planColor: string
  planLabel: string
  initials: string
  email: string | null
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
          className="absolute right-0 top-full z-[60] mt-1.5 min-w-[220px] rounded-lg border border-[#3a332d] bg-[#232019] py-1 shadow-landing-md"
          role="menu"
        >
          <span
            className="absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
            style={{
              backgroundColor: `${planColor}22`,
              color: planColor,
              border: `1px solid ${planColor}44`,
            }}
          >
            {planLabel}
          </span>
          <p className="truncate px-3 py-2 text-xs text-stone-400" title={email ?? undefined}>
            {email?.split('@')[0] ?? 'Account'}
          </p>
          <div className="my-1 border-t border-stone-600/40" role="presentation" />
          <p className="px-3 pb-1 pt-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-500">
            Konto & Plan
          </p>
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-stone-200 hover:bg-white/6"
            onClick={() => {
              setUserMenuOpen(false)
              navigate('/profile')
            }}
          >
            <User size={16} className="text-stone-400" aria-hidden />
            Konto
          </button>
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

export default function TopNavBar(_props: Props) {
  const bp = useBreakpoint()
  const { planLabel, planColor, initials, email } = useUserPlan()
  const inboxNewCount = useInboxNewCount()

  if (bp === 'mobile') {
    return (
      <header className="sticky top-0 z-50 flex h-12 flex-shrink-0 items-center justify-between border-b border-[#3a332d] bg-[#1a1613] px-3">
        <Link
          to="/analyze"
          aria-label="PrivatePrep"
          className="flex min-w-0 flex-1 items-end gap-2 no-underline hover:opacity-90"
        >
          <img
            src="/logo-mark.svg"
            alt=""
            className="pp-brand-mark h-7 w-7 translate-y-[2px]"
            width={28}
            height={28}
            decoding="async"
          />
          <span className="pp-wordmark truncate text-sm">Private<span>Prep</span></span>
        </Link>
        <UserAvatarMenu
          isMobile
          planColor={planColor}
          planLabel={planLabel}
          initials={initials}
          email={email}
        />
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 flex-shrink-0 items-center justify-between gap-4 border-b border-[#3a332d] bg-[#1a1613] px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-6">
        <Link
          to="/analyze"
          aria-label="PrivatePrep"
          className="flex flex-shrink-0 items-end gap-2 rounded-lg py-1 pr-2 no-underline hover:opacity-90"
        >
          <img
            src="/logo-mark.svg"
            alt=""
            className="pp-brand-mark h-7 w-7 translate-y-[2px]"
            width={28}
            height={28}
            decoding="async"
          />
          <span className="pp-wordmark text-[15px]">Private<span>Prep</span></span>
        </Link>

        <nav aria-label="Hauptnavigation" className="flex items-center gap-1">
          {MAIN_NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.key}
                to={item.route}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium no-underline transition-colors',
                    isActive
                      ? 'bg-[rgba(217,119,87,0.16)] text-[#f5f1eb]'
                      : 'text-[#a89e91] hover:bg-white/5 hover:text-[#f5f1eb]',
                  ].join(' ')
                }
              >
                <Icon size={16} aria-hidden />
                {item.label}
                {item.key === 'inbox' && inboxNewCount > 0 ? (
                  <span
                    className="ml-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#d97757] px-1 text-[10px] font-bold leading-none text-[#1a1613]"
                    aria-label={`${inboxNewCount} neue Stellen in der Inbox`}
                  >
                    {inboxNewCount > 99 ? '99+' : inboxNewCount}
                  </span>
                ) : null}
              </NavLink>
            )
          })}
        </nav>
      </div>

      <UserAvatarMenu
        isMobile={false}
        planColor={planColor}
        planLabel={planLabel}
        initials={initials}
        email={email}
      />
    </header>
  )
}
