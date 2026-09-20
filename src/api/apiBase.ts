import { throwIfBetaForbidden } from './betaAccess'

export const BASE = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}`
  : ''

export function authHeaders(token?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

export async function readApiError(response: Response, fallback: string): Promise<string> {
  let payload: { error?: string; message?: string; detail?: string } = {}
  try {
    payload = await response.json() as { error?: string; message?: string; detail?: string }
  }
  catch {
    /* body is not JSON */
  }
  throwIfBetaForbidden(response.status, payload)
  return payload.detail ?? payload.error ?? payload.message ?? fallback
}
