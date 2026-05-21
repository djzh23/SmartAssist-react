import type { ApplicationStatusApi, JobApplicationApi } from '../api/client'
import { ARCHIVE_STATUSES, PIPELINE_STATUSES } from '../components/applications/pipelineConfig'

export type ApplicationSort = 'updatedDesc' | 'updatedAsc' | 'titleAsc'

export const APPLICATIONS_PAGE_SIZE = 6

export function matchesApplicationSearch(app: JobApplicationApi, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    (app.jobTitle ?? '').toLowerCase().includes(q)
    || (app.company ?? '').toLowerCase().includes(q)
  )
}

export function filterPipelineApplications(
  apps: JobApplicationApi[],
  opts: {
    search: string
    statusFilter: ApplicationStatusApi | null
  },
): JobApplicationApi[] {
  return apps.filter(app => {
    if (!PIPELINE_STATUSES.includes(app.status)) return false
    if (opts.statusFilter && app.status !== opts.statusFilter) return false
    return matchesApplicationSearch(app, opts.search)
  })
}

export function filterArchiveApplications(
  apps: JobApplicationApi[],
  search: string,
): JobApplicationApi[] {
  return apps.filter(app => (
    ARCHIVE_STATUSES.includes(app.status)
    && matchesApplicationSearch(app, search)
  ))
}

export function sortApplications(apps: JobApplicationApi[], sort: ApplicationSort): JobApplicationApi[] {
  const copy = [...apps]
  switch (sort) {
    case 'updatedAsc':
      copy.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
      break
    case 'titleAsc':
      copy.sort((a, b) => (a.jobTitle || '').localeCompare(b.jobTitle || '', 'de'))
      break
    default:
      copy.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }
  return copy
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const total = items.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), pageCount)
  const start = (safePage - 1) * pageSize
  return {
    items: items.slice(start, start + pageSize),
    total,
    page: safePage,
    pageCount,
    rangeStart: total === 0 ? 0 : start + 1,
    rangeEnd: Math.min(start + pageSize, total),
  }
}
