import { BASE, authHeaders, readApiError } from './apiBase'

/** Mirrors PrivatePrep/Models/AnalysisReportDtos.cs AnalysisReportResponse. */
export interface AnalysisReport {
  id: string
  inboxJobId: string | null
  /** The full AnalyzeReport JSON, parsed on demand with JSON.parse by the caller. */
  reportJson: string
  cvHash: string
  jdHash: string
  cvLength: number
  jdLength: number
  llmModel: string
  matchScore: number | null
  createdAt: string
  updatedAt: string
}

/** Mirrors PrivatePrep/Models/AnalysisReportDtos.cs AnalysisReportListItemResponse. */
export interface AnalysisReportListItem {
  id: string
  inboxJobId: string | null
  matchScore: number | null
  createdAt: string
  inboxJobTitle: string | null
  inboxJobCompany: string | null
}

export async function getReport(id: string, token: string): Promise<AnalysisReport> {
  const res = await fetch(`${BASE}/api/reports/${encodeURIComponent(id)}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await readApiError(res, 'Bericht konnte nicht geladen werden.'))
  return (await res.json()) as AnalysisReport
}

/**
 * Null when the job has no report yet (backend 404 report_not_found) - this is an expected,
 * normal state for a New job, not an error. Any other failure (network, 401, 500, ...) still
 * throws, same as every other function here, so callers can tell "not analyzed yet" apart from
 * "something actually broke" instead of both looking like a missing report.
 */
export async function getReportByInboxJob(jobId: string, token: string): Promise<AnalysisReport | null> {
  const res = await fetch(`${BASE}/api/inbox/${encodeURIComponent(jobId)}/report`, {
    headers: authHeaders(token),
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await readApiError(res, 'Bericht konnte nicht geladen werden.'))
  return (await res.json()) as AnalysisReport
}

export async function listReports(token: string, limit?: number): Promise<AnalysisReportListItem[]> {
  const query = limit ? `?limit=${encodeURIComponent(String(limit))}` : ''
  const res = await fetch(`${BASE}/api/reports${query}`, {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(await readApiError(res, 'Berichte konnten nicht geladen werden.'))
  return (await res.json()) as AnalysisReportListItem[]
}

export async function deleteReport(id: string, token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/reports/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(token),
  })
  if (res.status === 204 || res.ok) return
  throw new Error(await readApiError(res, 'Bericht konnte nicht geloescht werden.'))
}
