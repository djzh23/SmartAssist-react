import type { ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * Shared “amber pill” primary action style used across the dark SaaS shell (aligned with CV.Studio guidance CTA).
 * Use {@link appCtaButtonClasses} for `<Link>` or other elements that cannot render `<button>`.
 */
export type AppCtaVariant = 'primary' | 'secondary'

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
  children?: ReactNode
}

export default function AppCtaButton({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...props
}: AppCtaButtonProps) {
  return (
    <button
      type={type}
      className={appCtaButtonClasses({ variant, size, className })}
      {...props}
    />
  )
}
