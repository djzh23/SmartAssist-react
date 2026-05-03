import type { ReactNode } from 'react'
import { getMainNavMeta } from '../../config/mainNavigation'
import type { MainNavPageKey } from '../../config/mainNavigation'

interface PageHeaderProps {
  pageKey: MainNavPageKey
  title?: string
  subtitle?: string
  actions?: ReactNode
  infoSlot?: ReactNode
  className?: string
  /**
   * On mobile (< sm) the top navbar already shows the page title.
   * Set this to `true` to collapse the header to actions-only on mobile.
   * - With actions  → compact action row, no card chrome
   * - Without actions → header is hidden entirely on mobile
   * Desktop (sm+) is always rendered in full.
   */
  hideTitleOnMobile?: boolean
}

export default function PageHeader({
  pageKey,
  title,
  subtitle,
  actions,
  infoSlot,
  className,
  hideTitleOnMobile = false,
}: PageHeaderProps) {
  const meta = getMainNavMeta(pageKey)
  const Icon = meta.icon

  /* ── Title block (shared between render paths) ───────────────────────────── */
  const titleBlock = (
    <div className="flex min-w-0 items-start gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-start gap-2">
          <h1 className="truncate text-2xl font-bold tracking-tight text-stone-50">
            {title ?? meta.label}
          </h1>
          {infoSlot ? <div className="shrink-0">{infoSlot}</div> : null}
        </div>
        <p className="mt-1 text-sm text-stone-400">
          {subtitle ?? meta.subtitle}
        </p>
      </div>
    </div>
  )

  /* ── hideTitleOnMobile path ──────────────────────────────────────────────── */
  if (hideTitleOnMobile) {
    if (!actions) {
      // Nothing useful to render on mobile — hide entirely
      return (
        <header
          className={[
            'hidden sm:block rounded-2xl bg-[#1b120d]/78 px-4 py-4 sm:px-5 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)]',
            className ?? '',
          ].join(' ')}
        >
          {titleBlock}
        </header>
      )
    }

    return (
      <header
        className={[
          // Mobile: no card chrome — actions sit flush at page edge
          // sm+: full card
          'sm:rounded-2xl sm:bg-[#1b120d]/78 sm:px-5 sm:py-4 sm:shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)]',
          className ?? '',
        ].join(' ')}
      >
        {/* Title — visible only sm+ */}
        <div className="hidden sm:flex sm:flex-row sm:items-start sm:justify-between sm:gap-3">
          {titleBlock}
          <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:justify-end">
            {actions}
          </div>
        </div>
        {/* Mobile — actions only, compact row */}
        <div className="flex flex-wrap items-center gap-2 sm:hidden">
          {actions}
        </div>
      </header>
    )
  }

  /* ── Default (title always visible) ─────────────────────────────────────── */
  return (
    <header
      className={[
        'rounded-2xl bg-[#1b120d]/78 px-4 py-4 sm:px-5 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)]',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {titleBlock}
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
