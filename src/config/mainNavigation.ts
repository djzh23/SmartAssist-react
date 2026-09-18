import {
  ClipboardList,
  FileSearch,
  Tag,
  LayoutDashboard,
  FolderOpen,
  FileText,
  BookOpen,
  NotebookPen,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MainNavPageKey =
  | 'analyze'
  | 'careerProfile'
  | 'pricing'
  | 'overview'
  | 'applications'
  | 'cvStudio'
  | 'guides'
  | 'notes'

export interface MainNavItemMeta {
  key: MainNavPageKey
  route: string
  label: string
  subtitle: string
  icon: LucideIcon
  matchesPath: (pathname: string) => boolean
}

export const MAIN_NAV_ITEMS: MainNavItemMeta[] = [
  {
    key: 'analyze',
    route: '/analyze',
    label: 'Analyse',
    subtitle: 'Stellenanzeige prüfen: Match-Score, Skill-Lücken und Formulierungen. Für jede Branche.',
    icon: FileSearch,
    matchesPath: pathname => pathname === '/analyze' || pathname.startsWith('/analyze/'),
  },
  {
    key: 'careerProfile',
    route: '/career-profile',
    label: 'Profil',
    subtitle: 'Beruf, Story und Lebenslauf. Gilt für Pflege, Vertrieb, Büro, Handwerk, IT und andere Berufe.',
    icon: ClipboardList,
    matchesPath: pathname => pathname.startsWith('/career-profile'),
  },
  {
    key: 'pricing',
    route: '/pricing',
    label: 'Preise',
    subtitle: 'Free mit 1 Analyse pro Tag, Premium unbegrenzt.',
    icon: Tag,
    matchesPath: pathname => pathname.startsWith('/pricing'),
  },
]

const HIDDEN_NAV_ITEMS: MainNavItemMeta[] = [
  {
    key: 'overview',
    route: '/analyze',
    label: 'Übersicht',
    subtitle: '',
    icon: LayoutDashboard,
    matchesPath: pathname => pathname === '/overview',
  },
  {
    key: 'applications',
    route: '/analyze',
    label: 'Bewerbungen',
    subtitle: '',
    icon: FolderOpen,
    matchesPath: pathname => pathname.startsWith('/applications'),
  },
  {
    key: 'cvStudio',
    route: '/career-profile',
    label: 'CV.Studio',
    subtitle: '',
    icon: FileText,
    matchesPath: pathname => pathname.startsWith('/cv-studio'),
  },
  {
    key: 'guides',
    route: '/analyze',
    label: 'Ratgeber',
    subtitle: '',
    icon: BookOpen,
    matchesPath: pathname => pathname.startsWith('/guides'),
  },
  {
    key: 'notes',
    route: '/analyze',
    label: 'Notizen',
    subtitle: '',
    icon: NotebookPen,
    matchesPath: pathname => pathname.startsWith('/notes'),
  },
]

const MAIN_NAV_BY_KEY: Record<MainNavPageKey, MainNavItemMeta> = [...MAIN_NAV_ITEMS, ...HIDDEN_NAV_ITEMS].reduce(
  (acc, item) => {
    acc[item.key] = item
    return acc
  },
  {} as Record<MainNavPageKey, MainNavItemMeta>,
)

export function getMainNavMeta(pageKey: MainNavPageKey): MainNavItemMeta {
  return MAIN_NAV_BY_KEY[pageKey]
}

export function findMainNavMetaByPath(pathname: string): MainNavItemMeta | null {
  return MAIN_NAV_ITEMS.find(item => item.matchesPath(pathname)) ?? null
}
