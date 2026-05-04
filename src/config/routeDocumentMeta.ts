import { matchPath } from 'react-router-dom'

/** Appended to generic page titles for browser tabs */
export const SITE_TITLE_SUFFIX = 'PrivatePrep'

const DEFAULT_TITLE
  = `${SITE_TITLE_SUFFIX} | KI-gestützte Bewerbungshilfe: Stellenanalyse, Interview-Vorbereitung, Sprachtraining`

const DEFAULT_DESCRIPTION
  = 'Stellenanzeige analysieren, Interview-Fragen üben, Anschreiben optimieren, mit KI in Sekunden statt Stunden. Kostenlos starten, keine Kreditkarte nötig.'

export interface RouteDocumentMeta {
  title: string
  description: string
}

export const DEFAULT_DOCUMENT_META: RouteDocumentMeta = {
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
}

type MetaEntry = RouteDocumentMeta & { pattern: string; end?: boolean }

/** First match wins (order: specific paths before general). */
const ROUTE_META: MetaEntry[] = [
  {
    pattern: '/applications/new',
    end: true,
    title: `Neue Bewerbung | ${SITE_TITLE_SUFFIX}`,
    description: 'Neue Bewerbung anlegen: Stelle, Firma und optional Stellentext erfassen.',
  },
  {
    pattern: '/applications/:id',
    title: `Bewerbung | ${SITE_TITLE_SUFFIX}`,
    description: 'Bewerbung bearbeiten: Status, Anschreiben, CV-Hinweise und Interview-Vorbereitung.',
  },
  {
    pattern: '/applications',
    end: true,
    title: `Bewerbungen | ${SITE_TITLE_SUFFIX}`,
    description: 'Deine Bewerbungen in der Pipeline: Entwurf bis Angebot, per Drag-and-drop sortieren.',
  },
  {
    pattern: '/guides/:slug',
    title: `Ratgeber | ${SITE_TITLE_SUFFIX}`,
    description: 'Tipps zu Lebenslauf, Bewerbung und Karriere, strukturiert nach Themen.',
  },
  {
    pattern: '/guides',
    end: true,
    title: `Ratgeber | ${SITE_TITLE_SUFFIX}`,
    description: 'Ratgeber-Themen: Lebenslauf, Bewerbung, Vorstellungsgespräch und mehr.',
  },
  {
    pattern: '/cv-studio/edit/:resumeId',
    title: `Lebenslauf bearbeiten | ${SITE_TITLE_SUFFIX}`,
    description: 'CV.Studio: Lebenslauf bearbeiten, Versionen und PDF-Export verwalten.',
  },
  {
    pattern: '/cv-studio/basis/:applicationId',
    title: `CV zur Bewerbung | ${SITE_TITLE_SUFFIX}`,
    description: 'CV.Studio: Lebenslauf mit einer Bewerbung verknüpfen oder starten.',
  },
  {
    pattern: '/cv-studio',
    end: true,
    title: `CV.Studio | ${SITE_TITLE_SUFFIX}`,
    description: 'CV.Studio: Kategorien, Lebensläufe und PDF-Exporte an einem Ort verwalten.',
  },
  {
    pattern: '/chat',
    end: true,
    title: `Chat | ${SITE_TITLE_SUFFIX}`,
    description: 'KI-Chat: Stellenanalyse, Interview-Training und Tools mit Karriere-Kontext.',
  },
  {
    pattern: '/tools',
    end: true,
    title: `Tools | ${SITE_TITLE_SUFFIX}`,
    description: 'Job-Analyse, Interview-Coach und mehr, direkt mit dem Assistenten starten.',
  },
  {
    pattern: '/overview',
    end: true,
    title: `Übersicht | ${SITE_TITLE_SUFFIX}`,
    description: 'Dashboard: Bewerbungen, Pipeline, Lebensläufe und nächste Schritte auf einen Blick.',
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
    description: 'Karriereprofil vervollständigen für bessere KI-Antworten und Empfehlungen.',
  },
  {
    pattern: '/pricing',
    end: true,
    title: `Preise | ${SITE_TITLE_SUFFIX}`,
    description: 'Pläne und Leistungen: kostenlos testen, Premium und Pro.',
  },
  {
    pattern: '/notes',
    end: true,
    title: `Notizen | ${SITE_TITLE_SUFFIX}`,
    description: 'Gespeicherte Chat-Notizen durchsuchen, bearbeiten und synchronisieren.',
  },
  {
    pattern: '/onboarding',
    end: true,
    title: `Onboarding | ${SITE_TITLE_SUFFIX}`,
    description: 'Profil einrichten: Berufsfeld, Level und Ziele für die beste KI-Unterstützung.',
  },
  {
    pattern: '/admin',
    end: true,
    title: `Admin | ${SITE_TITLE_SUFFIX}`,
    description: 'Interne Admin-Ansicht (Zugriff nur für Berechtigte).',
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
