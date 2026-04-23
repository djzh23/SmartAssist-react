import type {
  AgentRequest,
  AgentResponse,
  ChatMessage,
  ChatSavedNote,
  ChatSavedNoteSource,
  CvStudioPdfExportRow,
  CvStudioResumeSummary,
  LearningInsight,
  SkillSummary,
  ToolType,
} from '../types'
import type {
  CreateResumeRequest,
  CreateVersionRequest,
  ResumeDto,
  ResumeTemplateDto,
  ResumeVersionDto,
  UpdateResumeRequest,
} from '../cv-studio/cvTypes'

const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : ''

// ── Custom error for 429 usage-limit responses ─────────────────────────────
export class UsageLimitError extends Error {
  constructor(
    public readonly reason: string,
    public readonly status: number = 429,
  ) {
    super(reason)
    this.name = 'UsageLimitError'
  }
}

// ── Extended response with optional server-side usage metadata ─────────────
export interface AgentResponseWithUsage extends AgentResponse {
  /** Real usage count from X-Usage-Today header, if provided by backend */
  serverUsageToday?: number
  /** Real daily limit from X-Usage-Limit header, if provided by backend */
  serverUsageLimit?: number
}

function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

// ── Agent streaming ────────────────────────────────────────────────────────
export interface StreamChunk {
  type: 'chunk' | 'done' | 'error'
  text?: string
  toolUsed?: string
  message?: string
}

/** Stream a chat response as SSE tokens. Calls onChunk for each text piece. */
export async function askAgentStream(
  request: AgentRequest,
  token: string | null | undefined,
  onChunk: (text: string) => void,
): Promise<{ toolUsed: string; serverUsageToday?: number }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}/api/agent/stream`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (res.status === 429) {
    let reason = 'usage_limit'
    try { const err = await res.json() as Record<string, string>; reason = err?.reason ?? err?.error ?? reason } catch { /**/ }
    throw new UsageLimitError(reason, 429)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try { const err = await res.json() as Record<string, string>; if (err?.error) message = err.error } catch { /**/ }
    throw new Error(message)
  }

  const rawUsage = res.headers.get('X-Usage-Today')
  const serverUsageToday = rawUsage !== null ? Number(rawUsage) : undefined

  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let toolUsed = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const raw = line.slice(6).trim()
      if (!raw) continue
      try {
        const chunk = JSON.parse(raw) as StreamChunk
        if (chunk.type === 'chunk' && chunk.text)  onChunk(chunk.text)
        else if (chunk.type === 'done')             toolUsed = chunk.toolUsed ?? ''
        else if (chunk.type === 'error')            throw new Error(chunk.message ?? 'Stream error')
      } catch (e) {
        if (e instanceof SyntaxError) continue // incomplete JSON line — skip
        throw e
      }
    }
  }

  return { toolUsed, serverUsageToday }
}

// ── Agent ask ──────────────────────────────────────────────────────────────
// ── Job posting preview (URL or pasted text) ───────────────────────────────

export interface JobPreviewResponse {
  success: boolean
  jobTitle: string | null
  companyName: string | null
  location: string | null
  rawJobText: string | null
  keyRequirements: string[] | null
  keywords: string[] | null
  error: string | null
}

export async function fetchJobPreview(token: string, input: string): Promise<JobPreviewResponse> {
  const res = await fetch(`${BASE}/api/jobs/preview`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ input }),
  })
  if (res.status === 401)
    throw new Error('Anmeldung erforderlich für die Stellen-Vorschau.')
  if (res.status === 429) {
    let reason = 'Zu viele Anfragen. Bitte kurz warten.'
    try {
      const err = await res.json() as Record<string, string>
      reason = err?.reason ?? err?.error ?? reason
    } catch { /* ignore */ }
    throw new UsageLimitError(reason, 429)
  }
  if (!res.ok)
    throw new Error(await readApiError(res, `Stellen-Vorschau fehlgeschlagen (${res.status})`))
  return (await res.json()) as JobPreviewResponse
}

export async function askAgent(
  request: AgentRequest,
  token?: string,
): Promise<AgentResponseWithUsage> {
  const res = await fetch(`${BASE}/api/agent/ask`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(request),
  })

  if (res.status === 429) {
    let reason = 'usage_limit'
    try {
      const err = await res.json() as Record<string, string>
      reason = err?.reason ?? err?.error ?? 'usage_limit'
    } catch { /* ignore */ }
    throw new UsageLimitError(reason, 429)
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const err = await res.json() as Record<string, string>
      if (err?.error) message = err.error
    } catch { /* ignore */ }
    throw new Error(message)
  }

  const data = await res.json() as AgentResponse

  const rawToday = res.headers.get('X-Usage-Today')
  const rawLimit = res.headers.get('X-Usage-Limit')

  return {
    ...data,
    serverUsageToday: rawToday !== null ? Number(rawToday) : undefined,
    serverUsageLimit: rawLimit !== null ? Number(rawLimit) : undefined,
  }
}

// ── Usage sync — fetches real usage from backend on load ───────────────────
export interface UsageStatus {
  usageToday: number
  dailyLimit: number
  plan: string
}

async function readApiError(response: Response, fallback: string): Promise<string> {
  try {
    const payload = await response.json() as { error?: string; message?: string; detail?: string }
    return payload.detail ?? payload.error ?? payload.message ?? fallback
  } catch {
    return fallback
  }
}

/** Chat-notes routes need a current API build; 404 usually means an old deploy or wrong proxy target. */
async function throwIfChatNotesHttpError(res: Response, fallbackLabel: string): Promise<void> {
  if (res.ok) return
  if (res.status === 404) {
    throw new Error(
      'Die Notizen-API ist auf diesem Server nicht verfügbar (404). Bitte SmartAssistApi mit Chat-Notizen deployen oder lokal neu starten; in der Entwicklung `VITE_PROXY_TARGET` bzw. den Port in `vite.config.ts` prüfen.',
    )
  }
  throw new Error(await readApiError(res, `${fallbackLabel} (${res.status})`))
}

export async function getAgentUsage(token?: string): Promise<UsageStatus> {
  const res = await fetch(`${BASE}/api/agent/usage`, {
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  })

  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to fetch usage (${res.status})`))
  }

  const data = await res.json() as Partial<UsageStatus>
  if (typeof data.usageToday !== 'number' || typeof data.dailyLimit !== 'number' || typeof data.plan !== 'string') {
    throw new Error('Invalid usage payload from backend')
  }

  return {
    usageToday: data.usageToday,
    dailyLimit: data.dailyLimit,
    plan: data.plan,
  }
}

export async function fetchSkills(token?: string | null): Promise<SkillSummary[]> {
  const res = await fetch(`${BASE}/api/skills`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to fetch skills (${res.status})`))
  }
  const data = await res.json() as SkillSummary[]
  return Array.isArray(data) ? data : []
}

export interface FetchLearningInsightsParams {
  applicationId?: string
  includeResolved?: boolean
}

export async function fetchLearningInsights(
  token: string,
  params?: FetchLearningInsightsParams,
): Promise<LearningInsight[]> {
  const q = new URLSearchParams()
  if (params?.applicationId?.trim())
    q.set('applicationId', params.applicationId.trim())
  if (params?.includeResolved)
    q.set('includeResolved', 'true')
  const qs = q.toString()
  const res = await fetch(`${BASE}/api/learning/insights${qs ? `?${qs}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Failed to fetch insights (${res.status})`))
  }
  const data = await res.json() as LearningInsight[]
  return Array.isArray(data) ? data : []
}

export async function patchLearningInsight(
  token: string,
  insightId: string,
  body: { title?: string; content?: string; resolved?: boolean },
): Promise<void> {
  const res = await fetch(`${BASE}/api/learning/insights/${encodeURIComponent(insightId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Insight update failed (${res.status})`))
  }
}

export async function resolveLearningInsight(token: string, insightId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/learning/insights/${encodeURIComponent(insightId)}/resolve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error(await readApiError(res, `Resolve insight failed (${res.status})`))
  }
}

export async function createLearningInsight(
  token: string,
  data: { category: string; content: string; title?: string },
): Promise<LearningInsight> {
  const res = await fetch(`${BASE}/api/learning/insights`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readApiError(res, `Create insight failed (${res.status})`))
  return res.json() as Promise<LearningInsight>
}

// ── TTS via backend ────────────────────────────────────────────────────────

/**
 * Fetch synthesized speech from the backend (/api/speech/tts).
 * Requires an auth token. Returns null on any failure — callers should fall
 * back to browser TTS rather than showing an error.
 */
export async function fetchTtsAudio(
  text: string,
  languageCode: string,
  token: string | null,
): Promise<Blob | null> {
  if (!token) return null
  try {
    const res = await fetch(`${BASE}/api/speech/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, languageCode }),
    })
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

/**
 * Public demo TTS — calls /api/speech/demo-tts (no auth required).
 * Limited to 8 calls per IP per day. Used by the landing-page live demo.
 * Returns null if the limit is exceeded or on any error.
 */
export async function fetchDemoTtsAudio(
  text: string,
  languageCode: string,
): Promise<Blob | null> {
  try {
    const res = await fetch(`${BASE}/api/speech/demo-tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, languageCode }),
    })
    if (!res.ok) return null
    return await res.blob()
  } catch {
    return null
  }
}

/**
 * Public demo agent — calls /api/agent/demo (no auth required).
 * Limited to 5 calls per IP per day. Used by the landing-page live demo.
 * Throws UsageLimitError on 429, generic Error on other failures.
 */
export async function askAgentDemo(request: AgentRequest): Promise<AgentResponse> {
  const res = await fetch(`${BASE}/api/agent/demo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })

  if (res.status === 429) {
    let reason = 'demo_limit'
    try {
      const err = await res.json() as Record<string, string>
      reason = err?.reason ?? err?.error ?? 'demo_limit'
    } catch { /* ignore */ }
    throw new UsageLimitError(reason, 429)
  }

  if (!res.ok) {
    let message = `Demo request failed (${res.status})`
    try {
      const err = await res.json() as Record<string, string>
      if (err?.message) message = err.message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  return await res.json() as AgentResponse
}

// ── Chat sessions (API: Redis or Postgres per backend) ─────────────────────

export interface ApiChatSessionRecord {
  id: string
  title: string
  toolType: string
  createdAt: string
  lastMessageAt: string
  messageCount: number
}

export async function fetchChatSessions(token: string): Promise<ApiChatSessionRecord[]> {
  const res = await fetch(`${BASE}/api/sessions`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok)
    throw new Error(await readApiError(res, `Sessions laden fehlgeschlagen (${res.status})`))
  const data = await res.json() as unknown
  return Array.isArray(data) ? data as ApiChatSessionRecord[] : []
}

export async function createChatSessionRemote(
  token: string,
  body: { toolType: string; title?: string },
): Promise<ApiChatSessionRecord> {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Session anlegen fehlgeschlagen (${res.status})`))
  return await res.json() as ApiChatSessionRecord
}

export async function deleteChatSessionRemote(token: string, sessionId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Session löschen fehlgeschlagen (${res.status})`))
}

export async function patchChatSessionTitle(token: string, sessionId: string, title: string): Promise<ApiChatSessionRecord> {
  const res = await fetch(`${BASE}/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ title }),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Titel konnte nicht gespeichert werden (${res.status})`))
  return await res.json() as ApiChatSessionRecord
}

export async function putChatSessionOrder(token: string, orderedSessionIds: string[]): Promise<void> {
  const res = await fetch(`${BASE}/api/sessions/order`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify({ orderedSessionIds }),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Tab-Reihenfolge speichern fehlgeschlagen (${res.status})`))
}

export interface SessionTranscriptResponse {
  toolType: string
  messages: unknown
}

export async function fetchSessionTranscript(token: string, sessionId: string): Promise<SessionTranscriptResponse> {
  const res = await fetch(`${BASE}/api/sessions/${encodeURIComponent(sessionId)}/transcript`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Verlauf laden fehlgeschlagen (${res.status})`))
  return await res.json() as SessionTranscriptResponse
}

export async function putSessionTranscript(
  token: string,
  sessionId: string,
  body: { toolType: ToolType; messages: ChatMessage[] },
): Promise<void> {
  const res = await fetch(`${BASE}/api/sessions/${encodeURIComponent(sessionId)}/transcript`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Verlauf speichern fehlgeschlagen (${res.status})`))
}

// ── Chat notes (Redis / Postgres via API) ────────────────────────────────

export interface CreateChatNoteBody {
  title: string
  body: string
  tags: string[]
  source?: ChatSavedNoteSource
}

/** Parsed from API response headers when the server exposes storage disclosure. */
export interface ChatNotesStorageMeta {
  effective: 'redis' | 'postgres'
  configured: string
  degraded: boolean
  degradedReason: string | null
}

export function parseChatNotesStorageMeta(res: Response): ChatNotesStorageMeta | null {
  const raw = res.headers.get('X-Chat-Notes-Effective-Storage')?.trim().toLowerCase()
  if (raw !== 'redis' && raw !== 'postgres')
    return null
  const effective = raw as 'redis' | 'postgres'
  const configured = res.headers.get('X-Chat-Notes-Configured-Storage')?.trim() ?? 'redis'
  const degraded = res.headers.get('X-Chat-Notes-Degraded') === 'true'
  const degradedReason = res.headers.get('X-Chat-Notes-Degraded-Reason')?.trim() ?? null
  return { effective, configured, degraded, degradedReason }
}

export interface FetchChatNotesResult {
  notes: ChatSavedNote[]
  storageMeta: ChatNotesStorageMeta | null
}

export async function fetchChatNotes(token: string): Promise<FetchChatNotesResult> {
  const res = await fetch(`${BASE}/api/chat-notes`, { headers: { Authorization: `Bearer ${token}` } })
  await throwIfChatNotesHttpError(res, 'Notizen laden fehlgeschlagen')
  const storageMeta = parseChatNotesStorageMeta(res)
  const data = await res.json() as unknown
  const notes = Array.isArray(data) ? (data as ChatSavedNote[]) : []
  return { notes, storageMeta }
}

export async function createChatNoteRemote(
  token: string,
  body: CreateChatNoteBody,
): Promise<{ note: ChatSavedNote; storageMeta: ChatNotesStorageMeta | null }> {
  const res = await fetch(`${BASE}/api/chat-notes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({
      title: body.title,
      body: body.body,
      tags: body.tags,
      source: body.source ?? null,
    }),
  })
  await throwIfChatNotesHttpError(res, 'Notiz anlegen fehlgeschlagen')
  const storageMeta = parseChatNotesStorageMeta(res)
  const note = await res.json() as ChatSavedNote
  return { note, storageMeta }
}

export async function updateChatNoteRemote(
  token: string,
  noteId: string,
  patch: { title?: string; body?: string; tags?: string[] },
): Promise<{ note: ChatSavedNote; storageMeta: ChatNotesStorageMeta | null }> {
  const res = await fetch(`${BASE}/api/chat-notes/${encodeURIComponent(noteId)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(patch),
  })
  await throwIfChatNotesHttpError(res, 'Notiz speichern fehlgeschlagen')
  const storageMeta = parseChatNotesStorageMeta(res)
  const note = await res.json() as ChatSavedNote
  return { note, storageMeta }
}

/** Returns storage disclosure headers when present (including on 204). */
export async function deleteChatNoteRemote(
  token: string,
  noteId: string,
): Promise<ChatNotesStorageMeta | null> {
  const res = await fetch(`${BASE}/api/chat-notes/${encodeURIComponent(noteId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404)
    return null
  await throwIfChatNotesHttpError(res, 'Notiz löschen fehlgeschlagen')
  return parseChatNotesStorageMeta(res)
}

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

// ── CV.Studio (integrated resume API) ───────────────────────────────────────

async function parseCvStudioJson<T>(res: Response, fallbackLabel: string): Promise<T> {
  if (res.status === 401)
    throw new Error('Bitte anmelden, um CV.Studio zu nutzen.')
  if (!res.ok)
    throw new Error(await readApiError(res, `${fallbackLabel} (${res.status})`))
  return (await res.json()) as T
}

export async function listCvStudioResumes(token: string): Promise<CvStudioResumeSummary[]> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes`, { headers: authHeaders(token) })
  return parseCvStudioJson<CvStudioResumeSummary[]>(res, 'CV.Studio: Lebensläufe laden')
}

export async function getCvStudioResumeTemplates(token: string): Promise<ResumeTemplateDto[]> {
  const res = await fetch(`${BASE}/api/cv-studio/resume-templates`, { headers: authHeaders(token) })
  return parseCvStudioJson<ResumeTemplateDto[]>(res, 'CV.Studio: Vorlagen')
}

export async function getCvStudioResume(token: string, id: string): Promise<ResumeDto> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes/${encodeURIComponent(id)}`, { headers: authHeaders(token) })
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: Lebenslauf laden')
}

export async function createCvStudioResume(token: string, body: CreateResumeRequest): Promise<ResumeDto> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: Lebenslauf anlegen')
}

export async function createCvStudioResumeFromTemplate(token: string, templateKey: string): Promise<ResumeDto> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/templates/${encodeURIComponent(templateKey)}`,
    { method: 'POST', headers: authHeaders(token) },
  )
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: aus Vorlage')
}

export async function updateCvStudioResume(token: string, id: string, body: UpdateResumeRequest): Promise<ResumeDto> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: speichern')
}

export async function deleteAllCvStudioResumes(token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: alles löschen (${res.status})`))
}

export async function listCvStudioVersions(token: string, resumeId: string): Promise<ResumeVersionDto[]> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/versions`, {
    headers: authHeaders(token),
  })
  return parseCvStudioJson<ResumeVersionDto[]>(res, 'CV.Studio: Varianten')
}

export async function getCvStudioVersion(token: string, resumeId: string, versionId: string): Promise<ResumeVersionDto> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/versions/${encodeURIComponent(versionId)}`,
    { headers: authHeaders(token) },
  )
  return parseCvStudioJson<ResumeVersionDto>(res, 'CV.Studio: Variante')
}

export async function createCvStudioVersion(token: string, resumeId: string, body: CreateVersionRequest): Promise<ResumeVersionDto> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/versions`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  })
  return parseCvStudioJson<ResumeVersionDto>(res, 'CV.Studio: Variante speichern')
}

export async function deleteCvStudioVersion(token: string, resumeId: string, versionId: string): Promise<void> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/versions/${encodeURIComponent(versionId)}`,
    { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } },
  )
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Variante löschen (${res.status})`))
}

export async function downloadCvStudioPdf(
  token: string,
  resumeId: string,
  opts?: { versionId?: string | null; design?: 'A' | 'B' | 'C'; fileName?: string | null },
): Promise<{ blob: Blob; exportId: string | null; limit: number; used: number }> {
  const params = new URLSearchParams()
  params.set('design', opts?.design ?? 'A')
  if (opts?.versionId)
    params.set('versionId', opts.versionId)
  if (opts?.fileName?.trim())
    params.set('fileName', opts.fileName.trim())
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/pdf?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (res.status === 429)
    throw new Error(await readApiError(res, 'PDF-Export-Limit'))
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: PDF (${res.status})`))
  const blob = await res.blob()
  return {
    blob,
    exportId: res.headers.get('X-Cv-Pdf-Export-Id'),
    limit: Number(res.headers.get('X-Cv-Pdf-Quota-Limit') ?? '0'),
    used: Number(res.headers.get('X-Cv-Pdf-Quota-Used') ?? '0'),
  }
}

export async function downloadCvStudioDocx(token: string, resumeId: string, versionId?: string | null): Promise<Blob> {
  const params = new URLSearchParams()
  if (versionId)
    params.set('versionId', versionId)
  const qs = params.toString()
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/docx${qs ? `?${qs}` : ''}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: DOCX (${res.status})`))
  return res.blob()
}

export async function listCvStudioPdfExports(token: string): Promise<{ rows: CvStudioPdfExportRow[]; limit: number; used: number }> {
  const res = await fetch(`${BASE}/api/cv-studio/pdf-exports`, { headers: authHeaders(token) })
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: PDF-Liste (${res.status})`))
  const rows = (await res.json()) as CvStudioPdfExportRow[]
  return {
    rows,
    limit: Number(res.headers.get('X-Cv-Pdf-Quota-Limit') ?? '0'),
    used: Number(res.headers.get('X-Cv-Pdf-Quota-Used') ?? '0'),
  }
}

export async function deleteCvStudioPdfExport(token: string, exportId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/cv-studio/pdf-exports/${encodeURIComponent(exportId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok && res.status !== 404)
    throw new Error(await readApiError(res, `CV.Studio: PDF-Eintrag löschen (${res.status})`))
}
