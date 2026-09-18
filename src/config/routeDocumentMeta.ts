import { matchPath } from 'react-router-dom'
import { getBlogPost } from '../content/blog/posts'

export const SITE_TITLE_SUFFIX = 'PrivatePrep'

const DEFAULT_TITLE
  = `${SITE_TITLE_SUFFIX} | KI-Bewerbungshilfe und Stellenanalyse`

const DEFAULT_DESCRIPTION
  = 'Stellenanzeige gegen den Lebenslauf prüfen: Match-Score, Skill-Lücken und konkrete CV-Formulierungen. Für jede Branche. 1 Analyse pro Tag kostenlos.'

export interface RouteDocumentMeta {
  title: string
  description: string
  robots?: string
  ogType?: 'website' | 'article'
}

export const DEFAULT_DOCUMENT_META: RouteDocumentMeta = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  robots: 'index, follow',
  ogType: 'website',
}

type MetaEntry = RouteDocumentMeta & { pattern: string; end?: boolean }

const ROUTE_META: MetaEntry[] = [
  {
    pattern: '/blog',
    end: true,
    title: `Ratgeber | ${SITE_TITLE_SUFFIX}`,
    description: 'Kurze Texte zur Stellenanalyse und zum Lebenslauf. Für Bewerbungen in Pflege, Vertrieb, Büro, Handwerk, Bildung und IT.',
  },
  {
    pattern: '/impressum',
    end: true,
    title: `Impressum | ${SITE_TITLE_SUFFIX}`,
    description: 'Impressum von PrivatePrep auf betweenatna.de.',
  },
  {
    pattern: '/datenschutz',
    end: true,
    title: `Datenschutz | ${SITE_TITLE_SUFFIX}`,
    description: 'Datenschutzhinweise zu Konto, Lebenslauf und Stellenanalyse bei PrivatePrep.',
  },
  {
    pattern: '/analyze',
    end: true,
    title: `Stellenanalyse | ${SITE_TITLE_SUFFIX}`,
    description: 'Stellenanzeige einfügen und Match-Score, Skill-Lücken und Formulierungen erhalten.',
    robots: 'noindex, nofollow',
  },
  {
    pattern: '/profile',
    end: true,
    title: `Konto & Plan | ${SITE_TITLE_SUFFIX}`,
    description: 'Konto, Abo und Nutzungsübersicht für PrivatePrep.',
    robots: 'noindex, nofollow',
  },
  {
    pattern: '/career-profile',
    end: true,
    title: `Karriereprofil | ${SITE_TITLE_SUFFIX}`,
    description: 'Beruf, Story und Lebenslauf für die Stellenanalyse. Für jede Branche.',
    robots: 'noindex, nofollow',
  },
  {
    pattern: '/pricing',
    end: true,
    title: `Preise | ${SITE_TITLE_SUFFIX}`,
    description: 'Free: 1 Analyse pro Tag. Premium: unbegrenzt für 6,99 Euro im Monat.',
    robots: 'noindex, nofollow',
  },
  {
    pattern: '/onboarding',
    end: true,
    title: `Onboarding | ${SITE_TITLE_SUFFIX}`,
    description: 'Profil, Story und Lebenslauf einrichten.',
    robots: 'noindex, nofollow',
  },
]

export function getRouteDocumentMeta(pathname: string): RouteDocumentMeta {
  const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  const blogMatch = matchPath({ path: '/blog/:slug', end: true }, path)
  if (blogMatch?.params.slug) {
    const post = getBlogPost(blogMatch.params.slug)
    if (post) {
      return {
        title: `${post.title} | ${SITE_TITLE_SUFFIX}`,
        description: post.description,
        ogType: 'article',
      }
    }
    return {
      title: `Artikel | ${SITE_TITLE_SUFFIX}`,
      description: DEFAULT_DESCRIPTION,
    }
  }

  for (const entry of ROUTE_META) {
    const m = matchPath({ path: entry.pattern, end: entry.end ?? false }, path)
    if (m) {
      return {
        title: entry.title,
        description: entry.description,
        robots: entry.robots ?? 'index, follow',
        ogType: entry.ogType ?? 'website',
      }
    }
  }

  if (path === '/' || path === '')
    return DEFAULT_DOCUMENT_META

  return {
    title: `${SITE_TITLE_SUFFIX}`,
    description: DEFAULT_DOCUMENT_META.description,
    robots: 'noindex, follow',
  }
}
