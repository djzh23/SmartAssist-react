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
    setMetaByProperty('og:title', meta.title)
    setMetaByProperty('og:description', meta.description)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (origin)
      setMetaByProperty('og:url', `${origin}${pathname}`)
  }, [pathname])

  return null
}
