import type {
  ChatMessage,
  ChatSavedNote,
  ChatSavedNoteSource,
  LearningInsight,
  SkillSummary,
  ToolType,
} from '../types'
import { BASE, authHeaders, readApiError } from './apiBase'

// ── Re-exports from domain-specific clients ────────────────────────────────
export * from './agentClient'
export * from './applicationsClient'

// ── TTS via backend ────────────────────────────────────────────────────────

/**
 * Fetch synthesized speech from the backend (/api/speech/tts).
 *
 * Returns null on any failure (no token, 4xx/5xx, network error). Callers MUST
 * surface a user-visible notice when this happens before falling back to
 * browser TTS — silently swapping voices violates the "fail loud, never fake"
 * rule (see CLAUDE.md). See {@link LearningResponse} for the canonical handling.
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
 * Public demo TTS - calls /api/speech/demo-tts (no auth required).
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
  messages: ChatMessage[]
}

/**
 * Runtime guard for the transcript array: the backend is supposed to send rows shaped like
 * ChatMessage but it has historically returned `unknown` and we have no schema validator.
 * Anything that fails the shape check is dropped (and we synthesise an id/timestamp) so
 * downstream code can safely assume ChatMessage[] without any casts.
 */
function parseTranscriptMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return []
  const out: ChatMessage[] = []
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue
    const o = row as Record<string, unknown>
    const id = typeof o.id === 'string' && o.id.length > 0
      ? o.id
      : (typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2, 10))
    const text = typeof o.text === 'string' ? o.text : ''
    const isUser = Boolean(o.isUser)
    const timestamp = typeof o.timestamp === 'string' ? o.timestamp : new Date().toISOString()
    const toolUsed = typeof o.toolUsed === 'string' ? o.toolUsed : undefined
    const learningData = o.learningData && typeof o.learningData === 'object'
      ? (o.learningData as ChatMessage['learningData'])
      : undefined
    out.push({ id, text, isUser, timestamp, toolUsed, learningData })
  }
  return out
}

export async function fetchSessionTranscript(token: string, sessionId: string): Promise<SessionTranscriptResponse> {
  const res = await fetch(`${BASE}/api/sessions/${encodeURIComponent(sessionId)}/transcript`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok)
    throw new Error(await readApiError(res, `Verlauf laden fehlgeschlagen (${res.status})`))
  const payload = await res.json() as { toolType?: unknown; messages?: unknown }
  return {
    toolType: typeof payload.toolType === 'string' ? payload.toolType : 'general',
    messages: parseTranscriptMessages(payload.messages),
  }
}

/** Batch-load transcripts in one API call (avoids N parallel GETs on sync). */
export async function fetchSessionTranscriptsBulk(
  token: string,
  sessionIds: string[],
): Promise<Record<string, SessionTranscriptResponse>> {
  const unique = [...new Set(sessionIds.filter(id => id.trim().length > 0))]
  if (unique.length === 0)
    return {}

  const res = await fetch(`${BASE}/api/sessions/transcripts`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ sessionIds: unique }),
  })

  // Older deployments without the bulk endpoint — fall back to per-session GETs.
  if (res.status === 404 || res.status === 405) {
    const entries = await Promise.all(
      unique.map(async (id) => [id, await fetchSessionTranscript(token, id)] as const),
    )
    return Object.fromEntries(entries)
  }

  if (!res.ok)
    throw new Error(await readApiError(res, `Verläufe laden fehlgeschlagen (${res.status})`))
  const payload = await res.json() as {
    transcripts?: Record<string, { toolType?: unknown; messages?: unknown }>
  }
  const raw = payload.transcripts ?? {}
  const out: Record<string, SessionTranscriptResponse> = {}
  for (const [id, row] of Object.entries(raw)) {
    out[id] = {
      toolType: typeof row.toolType === 'string' ? row.toolType : 'general',
      messages: parseTranscriptMessages(row.messages),
    }
  }
  return out
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

/** Chat-notes routes need a current API build; 404 usually means an old deploy or wrong proxy target. */
async function throwIfChatNotesHttpError(res: Response, fallbackLabel: string): Promise<void> {
  if (res.ok) return
  if (res.status === 404) {
    throw new Error(
      'Die Notizen-API ist auf diesem Server nicht verfügbar (404). Bitte PrivatePrep mit Chat-Notizen deployen oder lokal neu starten; in der Entwicklung `VITE_PROXY_TARGET` bzw. den Port in `vite.config.ts` prüfen.',
    )
  }
  throw new Error(await readApiError(res, `${fallbackLabel} (${res.status})`))
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
