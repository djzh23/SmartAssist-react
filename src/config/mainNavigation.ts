import {
  BookOpen,
  ClipboardList,
  FileText,
  FolderOpen,
  LayoutDashboard,
  NotebookPen,
  Wrench,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type MainNavPageKey =
  | 'overview'
  | 'tools'
  | 'careerProfile'
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
    key: 'overview',
    route: '/overview',
    label: 'Übersicht',
    subtitle: 'Zentrale Kennzahlen und Fokus für deinen nächsten Schritt.',
    icon: LayoutDashboard,
    matchesPath: pathname => pathname === '/overview',
  },
  {
    key: 'tools',
    route: '/tools',
    label: 'Tools',
    subtitle: 'Spezialisierte Assistenten für Analyse, Coaching und Praxis.',
    icon: Wrench,
    matchesPath: pathname => pathname === '/tools',
  },
  {
    key: 'careerProfile',
    route: '/career-profile',
    label: 'Karriereprofil',
    subtitle: 'Profildaten pflegen für präzisere Antworten und Bewerbungen.',
    icon: ClipboardList,
    matchesPath: pathname => pathname.startsWith('/career-profile'),
  },
  {
    key: 'applications',
    route: '/applications',
    label: 'Bewerbungen',
    subtitle: 'Pipeline und Archiv mit klaren Status pro Bewerbung.',
    icon: FolderOpen,
    matchesPath: pathname => pathname.startsWith('/applications'),
  },
  {
    key: 'cvStudio',
    route: '/cv-studio',
    label: 'CV.Studio',
    subtitle: 'Lebensläufe strukturiert erstellen, versionieren und zuordnen.',
    icon: FileText,
    matchesPath: pathname => pathname.startsWith('/cv-studio'),
  },
  {
    key: 'guides',
    route: '/guides',
    label: 'Ratgeber',
    subtitle: 'Kurze Anleitungen für klare Abläufe in der gesamten App.',
    icon: BookOpen,
    matchesPath: pathname => pathname.startsWith('/guides'),
  },
  {
    key: 'notes',
    route: '/notes',
    label: 'Notizen',
    subtitle: 'Gespeicherte Chat-Ergebnisse suchen, filtern und weiterverarbeiten.',
    icon: NotebookPen,
    matchesPath: pathname => pathname.startsWith('/notes'),
  },
]

const MAIN_NAV_BY_KEY: Record<MainNavPageKey, MainNavItemMeta> = MAIN_NAV_ITEMS.reduce(
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
