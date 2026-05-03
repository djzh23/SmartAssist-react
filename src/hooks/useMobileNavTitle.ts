import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useSkills } from './useSkills'
import type { ToolType } from '../types'
import { findMainNavMetaByPath } from '../config/mainNavigation'

function isToolType(value: string): value is ToolType {
  return value === 'general' || value === 'jobanalyzer' || value === 'language' || value === 'programming' || value === 'interview'
}

function normalizeToolParam(value: string): ToolType {
  if (value === 'interviewprep') return 'interview'
  if (isToolType(value)) return value
  return 'general'
}

const TOOL_FALLBACK: Record<ToolType, string> = {
  general: 'Karriere-Chat',
  jobanalyzer: 'Stellenanalyse',
  language: 'Sprachtraining',
  programming: 'Code-Assistent',
  interview: 'Interview Coach',
}

function routeTitle(pathname: string): string {
  if (pathname === '/') return 'PrivatePrep'
  const navMeta = findMainNavMetaByPath(pathname)
  if (navMeta) return navMeta.label
  if (pathname.startsWith('/profile')) return 'Profil'
  if (pathname.startsWith('/pricing')) return 'Preise'
  if (pathname.startsWith('/onboarding')) return 'PrivatePrep'
  return 'PrivatePrep'
}

/** Center title for mobile top bar (max-width 768px). */
export function useMobileNavTitle(): string {
  const location = useLocation()
  const { skills } = useSkills()

  return useMemo(() => {
    if (location.pathname !== '/chat') {
      return routeTitle(location.pathname)
    }
    const raw = (new URLSearchParams(location.search).get('tool') ?? 'general').toLowerCase()
    const tool = normalizeToolParam(raw)
    const skill = skills?.find(s => {
      const t = s.apiToolType.toLowerCase()
      return t === tool || (tool === 'interview' && t === 'interviewprep')
    })
    return skill?.name ?? TOOL_FALLBACK[tool]
  }, [location.pathname, location.search, skills])
}
