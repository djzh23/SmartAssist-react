import { NavLink } from 'react-router-dom'
import { ClipboardList, FileSearch, Tag } from 'lucide-react'

export default function BottomTabBar() {
  const tabClass = (active: boolean) =>
    [
      'flex min-h-[44px] min-w-0 flex-1 basis-0 flex-col items-center justify-center gap-0.5 rounded-lg py-1 text-[10px] font-medium transition-transform duration-100 active:scale-95',
      active ? 'text-[#d97757]' : 'text-[#a89e91]',
    ].join(' ')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 hidden max-[768px]:flex desktop:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Hauptnavigation"
    >
      <div className="flex h-14 w-full items-stretch justify-evenly border-t border-[#3a332d] bg-[#1a1613] px-1 pt-0.5">
        <NavLink to="/analyze" className={({ isActive }) => tabClass(isActive)} end>
          {({ isActive }) => (
            <>
              <FileSearch size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span>Analyse</span>
            </>
          )}
        </NavLink>
        <NavLink to="/career-profile" className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (
            <>
              <ClipboardList size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span>Profil</span>
            </>
          )}
        </NavLink>
        <NavLink to="/pricing" className={({ isActive }) => tabClass(isActive)}>
          {({ isActive }) => (
            <>
              <Tag size={20} strokeWidth={isActive ? 2.5 : 2} aria-hidden />
              <span>Preise</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
