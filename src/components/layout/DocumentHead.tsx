import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { getRouteDocumentMeta } from '../../config/routeDocumentMeta'

function setMetaByName(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setMetaByProperty(property: string, content: string): void {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setCanonical(href: string): void {
  let el = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Updates document title and meta tags when the route changes (SPA).
 * Crawlers that execute JavaScript (z. B. Google) können die aktualisierten Werte sehen.
 */
export default function DocumentHead() {
  const { pathname } = useLocation()

  useEffect(() => {
    const meta = getRouteDocumentMeta(pathname)
    document.title = meta.title
    setMetaByName('description', meta.description)
    setMetaByName('robots', meta.robots ?? 'index, follow')
    setMetaByProperty('og:title', meta.title)
    setMetaByProperty('og:description', meta.description)
    setMetaByProperty('og:type', meta.ogType ?? 'website')
    setMetaByProperty('og:site_name', 'PrivatePrep')
    setMetaByProperty('og:locale', 'de_DE')
    setMetaByName('twitter:title', meta.title)
    setMetaByName('twitter:description', meta.description)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (origin) {
      const url = `${origin}${pathname}`
      setMetaByProperty('og:url', url)
      setCanonical(url)
    }
  }, [pathname])

  return null
}
