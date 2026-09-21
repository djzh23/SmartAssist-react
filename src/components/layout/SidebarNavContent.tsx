import { NavLink } from 'react-router-dom'
import { MAIN_NAV_ITEMS } from '../../config/mainNavigation'
import type { SidebarDensity, DesktopRailState } from './sidebarTypes'

export type { SidebarDensity, DesktopRailState }

interface Props {
  density?: SidebarDensity
  onNavClick?: () => void
  desktopRail?: DesktopRailState
  desktopHistoryOpen?: boolean
}

export default function SidebarNavContent({
  density = 'full',
  onNavClick,
  desktopRail,
}: Props) {
  const iconsOnly = density === 'icons' && !desktopRail?.wide
  const showLabels = density === 'full' || Boolean(desktopRail?.labelsShown)

  return (
    <nav className="flex h-full flex-col gap-1 px-2 py-3" aria-label="Hauptnavigation">
      {MAIN_NAV_ITEMS.map(item => {
        const Icon = item.icon
        return (
          <NavLink
            key={item.key}
            to={item.route}
            onClick={onNavClick}
            title={item.label}
            className={({ isActive }) =>
              [
                'flex min-h-[44px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[rgba(217,119,87,0.16)] text-[#f5f1eb]'
                  : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white',
                iconsOnly ? 'justify-center px-0' : '',
              ].join(' ')
            }
          >
            <Icon size={18} className="shrink-0 opacity-80" aria-hidden />
            {showLabels ? <span className="truncate">{item.label}</span> : null}
          </NavLink>
        )
      })}
    </nav>
  )
}
