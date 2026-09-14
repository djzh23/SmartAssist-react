import type {
  CvCategoriesResponse,
  CvStudioPdfExportRow,
  CvStudioResumeSummary,
} from '../types'
import type {
  CreateResumeRequest,
  CreateVersionRequest,
  LinkJobApplicationRequest,
  ResumeDto,
  ResumeTemplateDto,
  ResumeVersionDto,
  ResumeVersionSummaryDto,
  UpdateResumeRequest,
  UpdateVersionRequest,
} from '../cv-studio/cvTypes'
import { BASE, authHeaders, readApiError } from './apiBase'

// ── CV.Studio (integrated resume API) ───────────────────────────────────────

async function parseCvStudioJson<T>(res: Response, fallbackLabel: string): Promise<T> {
  if (res.status === 401)
    throw new Error('Bitte anmelden, um CV.Studio zu nutzen.')
  if (!res.ok)
    throw new Error(await readApiError(res, `${fallbackLabel} (${res.status})`))
  return (await res.json()) as T
}

/** Ensures `id` is present (camelCase or PascalCase from older APIs). */
function normalizeResumeDto(dto: ResumeDto): ResumeDto {
  const loose = dto as unknown as Record<string, unknown>
  const rawId = dto.id ?? loose.Id
  const id = typeof rawId === 'string' ? rawId.trim() : ''
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/i.test(id)) {
    throw new Error('CV.Studio: Antwort ohne gültige Lebenslauf-ID - bitte API aktualisieren oder Support kontaktieren.')
  }
  return { ...dto, id }
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
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const dto = await parseCvStudioJson<ResumeDto>(res, 'CV.Studio: Lebenslauf anlegen')
  return normalizeResumeDto(dto)
}

/** Optional `link` is applied in the same request on the server (avoids a second PATCH that could 404). */
export async function createCvStudioResumeFromTemplate(
  token: string,
  templateKey: string,
  link?: LinkJobApplicationRequest | null,
): Promise<ResumeDto> {
  const hasLink =
    !!link
    && (
      (link.jobApplicationId != null && String(link.jobApplicationId).trim() !== '')
      || (link.targetCompany != null && String(link.targetCompany).trim() !== '')
      || (link.targetRole != null && String(link.targetRole).trim() !== '')
    )
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/templates/${encodeURIComponent(templateKey)}`,
    {
      method: 'POST',
      headers: hasLink
        ? { ...authHeaders(token), 'Content-Type': 'application/json' }
        : authHeaders(token),
      body: hasLink ? JSON.stringify({ link }) : undefined,
    },
  )
  const dto = await parseCvStudioJson<ResumeDto>(res, 'CV.Studio: aus Vorlage')
  return normalizeResumeDto(dto)
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

export async function deleteCvStudioResume(token: string, id: string): Promise<void> {
  const res = await fetch(`${BASE}/api/cv-studio/resumes/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Lebenslauf löschen (${res.status})`))
}

export async function listCvStudioVersions(token: string, resumeId: string): Promise<ResumeVersionSummaryDto[]> {
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

export async function updateCvStudioVersion(
  token: string,
  resumeId: string,
  versionId: string,
  body: UpdateVersionRequest,
): Promise<ResumeVersionDto> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/versions/${encodeURIComponent(versionId)}`,
    {
      method: 'PUT',
      headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
  return parseCvStudioJson<ResumeVersionDto>(res, 'CV.Studio: Snapshot umbenennen')
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

export async function restoreCvStudioVersion(token: string, resumeId: string, versionId: string): Promise<ResumeDto> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/versions/${encodeURIComponent(versionId)}/restore`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` } },
  )
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Version wiederherstellen (${res.status})`))
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: Version wiederherstellen')
}

export async function linkCvStudioJobApplication(
  token: string,
  resumeId: string,
  body: LinkJobApplicationRequest,
): Promise<ResumeDto> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/link-application`,
    { method: 'PATCH', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Bewerbung verknüpfen (${res.status})`))
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: Bewerbung verknüpfen')
}

export async function patchCvStudioNotes(token: string, resumeId: string, notes: string | null): Promise<ResumeDto> {
  const res = await fetch(
    `${BASE}/api/cv-studio/resumes/${encodeURIComponent(resumeId)}/notes`,
    { method: 'PATCH', headers: { ...authHeaders(token), 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }) },
  )
  if (res.status === 401)
    throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Notizen speichern (${res.status})`))
  return parseCvStudioJson<ResumeDto>(res, 'CV.Studio: Notizen speichern')
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

// ── CV.Studio Categories ──────────────────────────────────────────────────────

export async function getCvStudioCategories(token: string): Promise<CvCategoriesResponse> {
  const res = await fetch(`${BASE}/api/cv-studio/categories`, { headers: authHeaders(token) })
  return parseCvStudioJson<CvCategoriesResponse>(res, 'CV.Studio: Kategorien laden')
}

export async function createCvStudioCategory(token: string, name: string): Promise<{ id: string; name: string; sortOrder: number }> {
  const res = await fetch(`${BASE}/api/cv-studio/categories`, {
    method: 'POST',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return parseCvStudioJson<{ id: string; name: string; sortOrder: number }>(res, 'CV.Studio: Kategorie anlegen')
}

export async function deleteCvStudioCategory(token: string, categoryId: string): Promise<void> {
  const res = await fetch(`${BASE}/api/cv-studio/categories/${encodeURIComponent(categoryId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 401) throw new Error('Bitte anmelden.')
  if (!res.ok && res.status !== 404)
    throw new Error(await readApiError(res, `CV.Studio: Kategorie löschen (${res.status})`))
}

export async function assignCvStudioCategory(token: string, resumeId: string, categoryId: string | null): Promise<void> {
  const res = await fetch(`${BASE}/api/cv-studio/categories/assignments/${encodeURIComponent(resumeId)}`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId }),
  })
  if (res.status === 401) throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Kategorie zuweisen (${res.status})`))
}

export async function renameCvStudioCategory(
  token: string,
  categoryId: string,
  name: string,
): Promise<{ id: string; name: string; sortOrder: number }> {
  const res = await fetch(`${BASE}/api/cv-studio/categories/${encodeURIComponent(categoryId)}`, {
    method: 'PATCH',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  })
  return parseCvStudioJson<{ id: string; name: string; sortOrder: number }>(res, 'CV.Studio: Kategorie umbenennen')
}

export async function reorderCvStudioCategories(
  token: string,
  orders: { id: string; sortOrder: number }[],
): Promise<void> {
  const res = await fetch(`${BASE}/api/cv-studio/categories/order`, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ orders }),
  })
  if (res.status === 401) throw new Error('Bitte anmelden.')
  if (!res.ok)
    throw new Error(await readApiError(res, `CV.Studio: Kategoriereihenfolge (${res.status})`))
}
