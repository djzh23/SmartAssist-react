import { matchPath } from 'react-router-dom'

/** Appended to generic page titles for browser tabs */
export const SITE_TITLE_SUFFIX = 'PrivatePrep'

const DEFAULT_TITLE
  = `${SITE_TITLE_SUFFIX} | Stellenanalyse: Match-Score, Skill-Lücken, Formulierungen`

const DEFAULT_DESCRIPTION
  = 'Stellenanzeige analysieren: Match-Score, Skill-Lücken und konkrete Formulierungen. 1 Analyse pro Tag kostenlos.'

export interface RouteDocumentMeta {
  title: string
  description: string
}

export const DEFAULT_DOCUMENT_META: RouteDocumentMeta = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
}

type MetaEntry = RouteDocumentMeta & { pattern: string; end?: boolean }

const ROUTE_META: MetaEntry[] = [
  {
    pattern: '/analyze',
    end: true,
    title: `Stellenanalyse | ${SITE_TITLE_SUFFIX}`,
    description: 'Stellenanzeige einfügen und Match-Score, Skill-Lücken und Formulierungen erhalten.',
  },
  {
    pattern: '/profile',
    end: true,
    title: `Konto & Plan | ${SITE_TITLE_SUFFIX}`,
    description: 'Konto, Abo und Nutzungsübersicht für PrivatePrep.',
  },
  {
    pattern: '/career-profile',
    end: true,
    title: `Karriereprofil | ${SITE_TITLE_SUFFIX}`,
    description: 'Beruf, Story und Lebenslauf für die Stellenanalyse.',
  },
  {
    pattern: '/pricing',
    end: true,
    title: `Preise | ${SITE_TITLE_SUFFIX}`,
    description: 'Free: 1 Analyse pro Tag. Premium: unbegrenzt.',
  },
  {
    pattern: '/onboarding',
    end: true,
    title: `Onboarding | ${SITE_TITLE_SUFFIX}`,
    description: 'Profil, Story und Lebenslauf einrichten.',
  },
]

export function getRouteDocumentMeta(pathname: string): RouteDocumentMeta {
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  for (const entry of ROUTE_META) {
    const m = matchPath({ path: entry.pattern, end: entry.end ?? false }, path)
    if (m) {
      return { title: entry.title, description: entry.description }
    }
  }

  if (path === '/' || path === '')
    return DEFAULT_DOCUMENT_META

  return {
    title: `${SITE_TITLE_SUFFIX}`,
    description: DEFAULT_DOCUMENT_META.description,
  }
}
