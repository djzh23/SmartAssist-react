import type { ProfileContextToggles } from '../types'
import { readApiError } from './apiBase'

const API_BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : ''

export type { ProfileContextToggles }

export interface CareerProfile {
  userId: string
  field: string | null
  fieldLabel: string | null
  level: string | null
  levelLabel: string | null
  currentRole: string | null
  goals: string[]
  skills: string[]
  experience: WorkExperience[]
  educationEntries: Education[]
  languages: ProfileLanguage[]
  story?: string | null
  cvRawText?: string | null
  cvContentHash: string | null
  cvContentLength: number | null
  cvSummary: string | null
  cvSummaryEn: string | null
  cvUploadedAt: string | null
  targetJobs: TargetJob[]
  onboardingCompleted: boolean
  onboardingCoachTourCompleted: boolean
  createdAt: string
  updatedAt: string
}

/** Partial form data persisted server-side between onboarding sessions. */
export interface OnboardingDraft {
  field?: string
  level?: string
  currentRole?: string
  goals?: string[]
  lastStep?: number
  updatedAt?: string
}

export interface WorkExperience {
  title: string | null
  company: string | null
  duration: string | null
  summary: string | null
}

export interface Education {
  degree: string | null
  institution: string | null
  year: string | null
}

export interface ProfileLanguage {
  name: string | null
  level: string | null
}

export interface TargetJob {
  id: string
  title: string | null
  company: string | null
  description: string | null
  addedAt: string
}

/** KI-geparste CV-Daten (Antwort von POST /api/profile/cv/upload-pdf). */
export interface ParsedCvData {
  currentRole?: string | null
  field?: string | null
  level?: string | null
  skills: string[]
  experience: WorkExperience[]
  education: Education[]
  languages: ProfileLanguage[]
}

async function readError(res: Response, fallback: string): Promise<string> {
  return readApiError(res, fallback)
}

export async function fetchProfile(token: string): Promise<CareerProfile> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, `Profile fetch failed (${res.status})`))
  return res.json() as Promise<CareerProfile>
}

export async function completeOnboarding(
  token: string,
  data: {
    field: string
    fieldLabel: string
    level: string
    levelLabel: string
    currentRole?: string
    goals: string[]
  },
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile/onboarding`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readError(res, `Onboarding failed (${res.status})`))
}

export async function skipOnboardingApi(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile/onboarding/skip`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, `Skip onboarding failed (${res.status})`))
}

export async function updateSkills(token: string, skills: string[]): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile/skills`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills }),
  })
  if (!res.ok) throw new Error(await readError(res, `Skills update failed (${res.status})`))
}

export interface CvUploadResult {
  contentHash: string
  contentLength: number
  extractedText: string
}

export async function uploadCv(token: string, text: string): Promise<CvUploadResult> {
  const res = await fetch(`${API_BASE}/api/profile/cv`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(await readError(res, `CV upload failed (${res.status})`))
  const body = (await res.json()) as Partial<CvUploadResult>
  const extractedText = body.extractedText?.trim() || text.trim()
  const contentHash = body.contentHash?.trim().toLowerCase() ?? ''
  if (!extractedText || contentHash.length !== 64) {
    throw new Error('Lebenslauf konnte nicht bestätigt werden. Bitte erneut hochladen.')
  }
  return {
    contentHash,
    contentLength: body.contentLength ?? extractedText.length,
    extractedText,
  }
}

export type AnonymousSummaryLanguage = 'de' | 'en'

/** LLM: anonymer Profil-Fließtext für KI-Kontext (keine Namen im Prompt-Auftrag). */
export async function fetchAnonymousCvSummary(
  token: string,
  options?: { language?: AnonymousSummaryLanguage; cvText?: string | null },
): Promise<string> {
  const language = options?.language ?? 'de'
  const res = await fetch(`${API_BASE}/api/profile/cv/anonymous-summary`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ language, cvText: options?.cvText ?? undefined }),
  })
  if (res.status === 429)
    throw new Error(await readError(res, 'Zu viele Anfragen. Bitte kurz warten.'))
  if (!res.ok)
    throw new Error(await readError(res, `Zusammenfassung fehlgeschlagen (${res.status})`))
  const data = await res.json() as { summary?: string }
  const s = data.summary?.trim()
  if (!s) throw new Error('Leere Antwort vom Server.')
  return s
}

export async function uploadCvPdfForParsing(
  token: string,
  base64Pdf: string,
): Promise<{ rawTextLength: number; parsed: ParsedCvData; extractedText: string; contentHash: string; contentLength: number }> {
  const res = await fetch(`${API_BASE}/api/profile/cv/upload-pdf`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ base64Pdf }),
  })
  if (!res.ok) throw new Error(await readError(res, `PDF-Analyse fehlgeschlagen (${res.status})`))
  const body = (await res.json()) as {
    rawTextLength?: number
    contentLength?: number
    contentHash?: string
    extractedText?: string
    parsed?: ParsedCvData
  }
  const extractedText = body.extractedText?.trim() ?? ''
  const contentHash = body.contentHash?.trim().toLowerCase() ?? ''
  if (!extractedText || contentHash.length !== 64) {
    throw new Error('Lebenslauf konnte nicht bestätigt werden. Bitte erneut hochladen.')
  }
  return {
    rawTextLength: body.contentLength ?? body.rawTextLength ?? extractedText.length,
    contentHash,
    contentLength: body.contentLength ?? extractedText.length,
    extractedText,
    parsed: {
      skills: [],
      experience: [],
      education: [],
      languages: [],
      ...body.parsed,
    },
  }
}

export async function addTargetJob(
  token: string,
  data: { title: string; company?: string; description?: string },
): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/profile/target-jobs`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(await readError(res, `Add target job failed (${res.status})`))
  return res.json() as Promise<{ id: string }>
}

export async function removeTargetJob(token: string, jobId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile/target-jobs/${encodeURIComponent(jobId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, `Remove target job failed (${res.status})`))
}

export async function updateFullProfile(token: string, profile: Partial<CareerProfile>): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error(await readError(res, `Profile update failed (${res.status})`))
}

export async function deleteCareerProfile(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, `Profile delete failed (${res.status})`))
}

export async function fetchOnboardingDraft(token: string): Promise<OnboardingDraft> {
  const res = await fetch(`${API_BASE}/api/profile/onboarding/draft`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, `Draft fetch failed (${res.status})`))
  return res.json() as Promise<OnboardingDraft>
}

export async function putOnboardingDraft(
  token: string,
  draft: Omit<OnboardingDraft, 'updatedAt'>,
): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile/onboarding/draft`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(draft),
  })
  if (!res.ok) throw new Error(await readError(res, `Draft save failed (${res.status})`))
}

export async function postCoachTourDone(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/api/profile/onboarding/coach-tour/done`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(await readError(res, `Coach tour flag failed (${res.status})`))
}
