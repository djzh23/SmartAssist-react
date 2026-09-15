import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { SignOutButton } from '@clerk/clerk-react'
import { User } from 'lucide-react'
import { useUserPlan } from '../../hooks/useUserPlan'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { useMobileNavTitle } from '../../hooks/useMobileNavTitle'

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
          className="absolute right-0 top-full z-[60] mt-1.5 min-w-[220px] rounded-lg border border-stone-600/50 bg-[#1f1812] py-1 shadow-landing-md"
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
  const mobileTitle = useMobileNavTitle()
  const { planLabel, planColor, initials, email } = useUserPlan()

  if (bp === 'mobile') {
    return (
      <header className="sticky top-0 z-50 flex h-12 flex-shrink-0 items-center justify-between border-b border-sidebar-border bg-sidebar px-3">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-wide text-white">
          {mobileTitle}
        </p>
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
    <header className="sticky top-0 z-50 flex h-[52px] flex-shrink-0 items-center justify-between gap-2 border-b border-stone-600/40 bg-[#1a1208]/92 px-4 backdrop-blur-xl">
      <Link
        to="/analyze"
        aria-label="PrivatePrep"
        className="flex flex-shrink-0 items-center gap-2 rounded-lg py-1 pr-2 no-underline hover:opacity-90"
      >
        <img
          src="/logo-nav.webp"
          alt=""
          className="h-8 w-8 rounded-lg"
          width={32}
          height={32}
          decoding="async"
        />
        <span className="text-[15px] font-bold tracking-wide text-stone-50">PrivatePrep</span>
      </Link>

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
