import { useEffect } from 'react'

/**
 * Privacy-friendly Pirsch analytics. Loads only when VITE_PIRSCH_CODE is set.
 * Identification code: Pirsch dashboard → Settings → Integration.
 */
export default function AnalyticsScript() {
  const code = (import.meta.env.VITE_PIRSCH_CODE ?? '').trim()
  const domain = (import.meta.env.VITE_ANALYTICS_DOMAIN ?? 'betweenatna.de').trim()

  useEffect(() => {
    if (!code) return
    if (document.getElementById('pirschjs')) return

    const script = document.createElement('script')
    script.defer = true
    script.src = 'https://api.pirsch.io/pirsch.js'
    script.id = 'pirschjs'
    script.setAttribute('data-code', code)
    script.setAttribute('data-domain', domain)
    document.head.appendChild(script)
  }, [code, domain])

  return null
}
