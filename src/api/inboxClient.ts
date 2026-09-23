import { BASE, authHeaders, readApiError } from './apiBase'

/** Mirrors PrivatePrep/Models/InboxJobEnums.cs */
export const InboxSourceKind = {
  Generic: 0,
  LinkedIn: 1,
  StepStone: 2,
  Manual: 3,
} as const

export type InboxSourceKind = (typeof InboxSourceKind)[keyof typeof InboxSourceKind]

export const InboxJobStatus = {
  New: 0,
  Analyzed: 1,
  Archived: 2,
} as const

export type InboxJobStatus = (typeof InboxJobStatus)[keyof typeof InboxJobStatus]

export interface InboxJobListItem {
  id: string
  title: string
  company: string
  location: string | null
  sourceUrl: string
  sourceKind: InboxSourceKind
  status: InboxJobStatus
  extractedAt: string
  analyzedAt: string | null
  analysisReportId: string | null
  rawTextPreview: string
}

export interface InboxJob {
  id: string
  title: string
  company: string
  location: string | null
  sourceUrl: string
  sourceKind: InboxSourceKind
  rawText: string
  status: InboxJobStatus
  extractedAt: string
  analyzedAt: string | null
  analysisReportId: string | null
}

export function inboxSourceLabel(kind: InboxSourceKind): string {
  if (kind === InboxSourceKind.LinkedIn) return 'LinkedIn'
  if (kind === InboxSourceKind.StepStone) return 'StepStone'
  if (kind === InboxSourceKind.Manual) return 'Manuell'
  return 'Web'
}

export async function listInboxJobs(token: string): Promise<InboxJobListItem[]> {
  const res = await fetch(`${BASE}/api/inbox`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await readApiError(res, 'Inbox konnte nicht geladen werden.'))
  return (await res.json()) as InboxJobListItem[]
}

export async function fetchInboxJob(id: string, token: string): Promise<InboxJob> {
  const res = await fetch(`${BASE}/api/inbox/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await readApiError(res, 'Stelle konnte nicht geladen werden.'))
  return (await res.json()) as InboxJob
}

export interface UpdateInboxJobRequest {
  title?: string
  company?: string
  rawText?: string
}

export async function updateInboxJob(id: string, updates: UpdateInboxJobRequest, token: string): Promise<InboxJob> {
  const res = await fetch(`${BASE}/api/inbox/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(await readApiError(res, 'Stelle konnte nicht gespeichert werden.'))
  return (await res.json()) as InboxJob
}

export async function deleteInboxJob(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/inbox/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (res.status === 204 || res.ok) return
  throw new Error(await readApiError(res, 'Stelle konnte nicht geloescht werden.'))
}
