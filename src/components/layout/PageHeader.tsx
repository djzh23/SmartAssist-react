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
}

export default function PageHeader({
  pageKey,
  title,
  subtitle,
  actions,
  infoSlot,
  className,
}: PageHeaderProps) {
  const meta = getMainNavMeta(pageKey)
  const Icon = meta.icon

  return (
    <header
      className={[
        'rounded-2xl bg-[#1b120d]/78 px-4 py-4 shadow-[0_10px_28px_-18px_rgba(0,0,0,0.62)] sm:px-5',
        className ?? '',
      ].join(' ')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
        {actions ? (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  )
}
