import type { JobApplicationApi } from '../api/client'
import type { CvStudioResumeSummary } from '../types'

export function applicationIdKey(appId: string): string {
  return appId.trim()
}

export function hasCoverLetter(app: JobApplicationApi): boolean {
  return (app.coverLetterText?.trim().length ?? 0) > 0
}

export function hasLinkedCv(appId: string, summaries: CvStudioResumeSummary[]): boolean {
  const key = applicationIdKey(appId)
  if (!key) return false
  return summaries.some(s => applicationIdKey(s.linkedJobApplicationId ?? '') === key)
}

export function getLinkedCvForApplication(
  appId: string,
  summaries: CvStudioResumeSummary[],
): CvStudioResumeSummary | null {
  const key = applicationIdKey(appId)
  if (!key) return null
  return summaries.find(s => applicationIdKey(s.linkedJobApplicationId ?? '') === key) ?? null
}

/** True once the application left the pure „Entwurf“ status. */
export function hasLeftDraft(app: JobApplicationApi): boolean {
  return app.status !== 'draft'
}

export function nextApplicationStep(app: JobApplicationApi, summaries: CvStudioResumeSummary[]): string {
  const linked = getLinkedCvForApplication(app.id, summaries)
  if (!linked)
    return 'Lege in CV.Studio einen Lebenslauf an und verknüpfe ihn mit dieser Bewerbung (Button unten oder Basis-Assistent). Danach erscheint die Ampel hier als erledigt.'
  if (!hasCoverLetter(app))
    return 'Schreibe oder füge dein Anschreiben im Abschnitt „Anschreiben“ auf dieser Seite ein und speichere.'
  if (!hasLeftDraft(app))
    return 'Wenn du dich beworben hast, setze den Status von „Entwurf“ auf „Beworben“ oder den passenden nächsten Schritt.'
  return 'Kernpaket steht - pflege Timeline und Notizen oder passe den Status an.'
}
