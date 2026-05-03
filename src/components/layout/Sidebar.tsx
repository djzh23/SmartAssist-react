import SidebarNavContent from './SidebarNavContent'

interface Props {
  onNavClick?: () => void
}

/** Desktop / full-density sidebar - see SidebarNavContent for shared nav. */
export default function Sidebar({ onNavClick }: Props) {
  return <SidebarNavContent density="full" onNavClick={onNavClick} />
}
