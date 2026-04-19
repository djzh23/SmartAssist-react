import { useEffect, useState } from 'react'

export type Breakpoint = 'mobile' | 'tablet' | 'desktop'

function resolveBreakpoint(width: number): Breakpoint {
  if (width <= 768) return 'mobile'
  if (width <= 1024) return 'tablet'
  return 'desktop'
}

/**
 * Viewport bucket: mobile ≤768, tablet 769–1024, desktop ≥1025.
 * SSR / first paint: `desktop` to match Tailwind desktop-first shell assumptions.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(() =>
    typeof window !== 'undefined' ? resolveBreakpoint(window.innerWidth) : 'desktop',
  )

  useEffect(() => {
    const onResize = () => setBp(resolveBreakpoint(window.innerWidth))
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return bp
}
