import { BASE, authHeaders, readApiError } from './apiBase'

// ── Job applications hub ───────────────────────────────────────────────────

export type ApplicationStatusApi =
  | 'draft'
  | 'applied'
  | 'phoneScreen'
  | 'interview'
  | 'assessment'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn'

export interface ApplicationEventApi {
  date: string
  description: string
  note?: string
}

export interface JobApplicationApi {
  id: string
  jobTitle: string
  company: string
  jobUrl?: string
  jobDescription?: string
  status: ApplicationStatusApi
  statusUpdatedAt: string
  tailoredCvNotes?: string
  coverLetterText?: string
  interviewNotes?: string
  timeline: ApplicationEventApi[]
  createdAt: string
  updatedAt: string
  analysisSessionId?: string
  interviewSessionId?: string
}

/** Same order as C# enum ApplicationStatus (Draft = 0, …). */
const APPLICATION_STATUS_ORDER: ApplicationStatusApi[] = [
  'draft',
  'applied',
  'phoneScreen',
  'interview',
  'assessment',
  'offer',
  'accepted',
  'rejected',
  'withdrawn',
]

function readJsonProp(o: Record<string, unknown>, camel: string, pascal: string): unknown {
  if (Object.prototype.hasOwnProperty.call(o, camel)) return o[camel]
  if (Object.prototype.hasOwnProperty.call(o, pascal)) return o[pascal]
  return undefined
}

/** Backend / legacy strings that are not exact enum names (before defaulting to draft). */
const APPLICATION_STATUS_ALIASES: Record<string, ApplicationStatusApi> = {
  declined: 'rejected',
  decline: 'rejected',
  denied: 'rejected',
  unsuccessful: 'rejected',
  notselected: 'rejected',
  nothired: 'rejected',
  nooffer: 'rejected',
  lost: 'rejected',
  abgelehnt: 'rejected',
  absage: 'rejected',
  abgesagt: 'rejected',
  canceled: 'withdrawn',
  cancelled: 'withdrawn',
  withdrawnbycandidate: 'withdrawn',
  zuruckgezogen: 'withdrawn',
  acceptedoffer: 'accepted',
  hired: 'accepted',
  won: 'accepted',
}

/** Maps API status (int enum, PascalCase, or camelCase string) to our union. */
export function normalizeApplicationStatus(raw: unknown): ApplicationStatusApi {
  if (typeof raw === 'number' && Number.isInteger(raw) && raw >= 0 && raw < APPLICATION_STATUS_ORDER.length)
    return APPLICATION_STATUS_ORDER[raw]
  if (typeof raw === 'string') {
    const t = raw.trim()
    if ((APPLICATION_STATUS_ORDER as readonly string[]).includes(t))
      return t as ApplicationStatusApi
    const byCi = APPLICATION_STATUS_ORDER.find(s => s.toLowerCase() === t.toLowerCase())
    if (byCi) return byCi
    const asCamel = t.charAt(0).toLowerCase() + t.slice(1)
    if ((APPLICATION_STATUS_ORDER as readonly string[]).includes(asCamel))
      return asCamel as ApplicationStatusApi
    const compact = t.toLowerCase().replace(/[\s_-]+/g, '')
    const alias = APPLICATION_STATUS_ALIASES[compact]
    if (alias) return alias
  }
  return 'draft'
}

function parseTimeline(raw: unknown): ApplicationEventApi[] {
  if (!Array.isArray(raw)) return []
  return raw.map((row): ApplicationEventApi => {
    const e = row as Record<string, unknown>
    const dateVal = readJsonProp(e, 'date', 'Date')
    const description = String(readJsonProp(e, 'description', 'Description') ?? '')
    const note = readJsonProp(e, 'note', 'Note')
    return {
      date: typeof dateVal === 'string' ? dateVal : new Date().toISOString(),
      description,
      note: note === undefined || note === null ? undefined : String(note),
    }
  })
}

/** Normalizes PascalCase/camelCase/int status from ASP.NET JSON. */
export function parseJobApplication(raw: unknown): JobApplicationApi {
  if (!raw || typeof raw !== 'object') {
    const now = new Date().toISOString()
    return {
      id: '',
      jobTitle: '',
      company: '',
      status: 'draft',
      statusUpdatedAt: now,
      timeline: [],
      createdAt: now,
      updatedAt: now,
    }
  }
  const o = raw as Record<string, unknown>
  const jobUrl = readJsonProp(o, 'jobUrl', 'JobUrl')
  const jd = readJsonProp(o, 'jobDescription', 'JobDescription')
  const now = new Date().toISOString()
  return {
    id: String(readJsonProp(o, 'id', 'Id') ?? ''),
    jobTitle: String(readJsonProp(o, 'jobTitle', 'JobTitle') ?? ''),
    company: String(readJsonProp(o, 'company', 'Company') ?? ''),
    jobUrl: jobUrl === undefined || jobUrl === null ? undefined : String(jobUrl),
    jobDescription: jd === undefined || jd === null ? undefined : String(jd),
    status: normalizeApplicationStatus(readJsonProp(o, 'status', 'Status')),
    statusUpdatedAt: String(readJsonProp(o, 'statusUpdatedAt', 'StatusUpdatedAt') ?? now),
    tailoredCvNotes: readJsonProp(o, 'tailoredCvNotes', 'TailoredCvNotes') as string | undefined,
    coverLetterText: readJsonProp(o, 'coverLetterText', 'CoverLetterText') as string | undefined,
    interviewNotes: readJsonProp(o, 'interviewNotes', 'InterviewNotes') as string | undefined,
    timeline: parseTimeline(readJsonProp(o, 'timeline', 'Timeline')),
    createdAt: String(readJsonProp(o, 'createdAt', 'CreatedAt') ?? now),
    updatedAt: String(readJsonProp(o, 'updatedAt', 'UpdatedAt') ?? now),
    analysisSessionId: readJsonProp(o, 'analysisSessionId', 'AnalysisSessionId') as string | undefined,
    interviewSessionId: readJsonProp(o, 'interviewSessionId', 'InterviewSessionId') as string | undefined,
  }
}

export async function fetchJobApplications(token: string): Promise<JobApplicationApi[]> {
  const res = await fetch(`${BASE}/api/applications`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok)
    throw new Error(await readApiError(res, `Bewerbungen laden fehlgeschlagen (${res.status})`))
  const data = await res.json() as unknown
  if (!Array.isArray(data)) return []
  return data.map(row => parseJobApplication(row))
}

export async function fetchJobApplication(token: string, id: string): Promise<JobApplicationApi> {
  const res = await fetch(`${BASE}/api/applications/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Bewerbung laden fehlgeschlagen (${res.status})`))
  return parseJobApplication(await res.json())
}

export async function createJobApplication(
  token: string,
  body: { jobTitle: string; company: string; jobUrl?: string; jobDescription?: string },
): Promise<JobApplicationApi> {
  const res = await fetch(`${BASE}/api/applications`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Bewerbung anlegen fehlgeschlagen (${res.status})`))
  return parseJobApplication(await res.json())
}

export async function updateJobApplicationStatus(
  token: string,
  id: string,
  body: { status: ApplicationStatusApi; note?: string },
): Promise<void> {
  const res = await fetch(`${BASE}/api/applications/${encodeURIComponent(id)}/status`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Status speichern fehlgeschlagen (${res.status})`))
}

export async function saveJobApplicationCoverLetter(token: string, id: string, text: string): Promise<void> {
  const res = await fetch(`${BASE}/api/applications/${encodeURIComponent(id)}/cover-letter`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Anschreiben speichern fehlgeschlagen (${res.status})`))
}

export async function saveJobApplicationInterviewNotes(token: string, id: string, text: string): Promise<void> {
  const res = await fetch(`${BASE}/api/applications/${encodeURIComponent(id)}/interview-notes`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ text }),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Interview-Notizen speichern fehlgeschlagen (${res.status})`))
}

export async function linkJobApplicationSession(
  token: string,
  id: string,
  body: { sessionType: 'analysis' | 'interview'; sessionId: string },
): Promise<void> {
  const res = await fetch(`${BASE}/api/applications/${encodeURIComponent(id)}/link-session`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Chat-Verknüpfung fehlgeschlagen (${res.status})`))
}

export async function deleteJobApplication(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Bewerbung löschen fehlgeschlagen (${res.status})`))
}
