import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { findMainNavMetaByPath } from '../config/mainNavigation'

function routeTitle(pathname: string): string {
  if (pathname === '/') return 'PrivatePrep'
  const navMeta = findMainNavMetaByPath(pathname)
  if (navMeta) return navMeta.label
  if (pathname.startsWith('/profile')) return 'Profil'
  if (pathname.startsWith('/onboarding')) return 'PrivatePrep'
  return 'PrivatePrep'
}

export function useMobileNavTitle(): string {
  const location = useLocation()
  return useMemo(() => routeTitle(location.pathname), [location.pathname])
}
