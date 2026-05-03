import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

/**
 * Shared "amber pill" action button used across the app.
 *
 * Variants:
 * - `primary`   — amber fill, black text (default)
 * - `secondary` — glass outline, light text
 * - `ghost`     — text-only, subtle hover
 * - `danger`    — rose fill, white text
 *
 * Use {@link appCtaButtonClasses} for `<Link>` or other non-`<button>` elements.
 */
export type AppCtaVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

export type AppCtaSize = 'sm' | 'md' | 'lg'

const sizeClasses: Record<AppCtaSize, string> = {
  sm: 'min-h-0 gap-1.5 px-3 py-1.5 text-xs',
  md: 'min-h-[2.25rem] gap-2 px-3.5 py-2 text-sm',
  lg: 'min-h-[2.75rem] gap-2 px-4 py-3 text-sm',
}

const variantClasses: Record<AppCtaVariant, string> = {
  primary:
    'rounded-full bg-amber-500/90 font-semibold text-black shadow-lg shadow-black/20 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  secondary:
    'rounded-full bg-white/[0.06] font-semibold text-stone-200 ring-1 ring-white/[0.12] shadow-sm transition hover:bg-white/[0.1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  ghost:
    'rounded-full font-medium text-stone-300 transition hover:bg-white/[0.08] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/25 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
  danger:
    'rounded-full bg-rose-600 font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-rose-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-400/50 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
}

export function appCtaButtonClasses(options?: {
  variant?: AppCtaVariant
  size?: AppCtaSize
  className?: string
}): string {
  const variant = options?.variant ?? 'primary'
  const size = options?.size ?? 'md'
  return [
    'inline-flex items-center justify-center',
    sizeClasses[size],
    variantClasses[variant],
    options?.className,
  ]
    .filter(Boolean)
    .join(' ')
}

export interface AppCtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AppCtaVariant
  size?: AppCtaSize
  loading?: boolean
  children?: ReactNode
}

export default function AppCtaButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: AppCtaButtonProps) {
  return (
    <button
      type={type}
      className={appCtaButtonClasses({ variant, size, className })}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 12 : 14} className="animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
