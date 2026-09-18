import type { CvStudioResumeSummary } from '../types'
import { BASE, authHeaders, readApiError } from './apiBase'

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
