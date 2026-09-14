import type { CareerToolSetup, ToolType } from '../types'
import { sanitizeTechnicalContext } from './cvTechnicalContext'
import { mergeSessionCvForApi, type SessionContextData } from './chatContextStorage'

export const INTERVIEW_PROMPT_LIMIT = 3900
export const JOB_ANALYZER_PROMPT_LIMIT = 3900

export interface InterviewPromptContext {
  language: 'de' | 'en'
  alias: string
  cvText: string
  jobUrl: string
  jobText: string
}

export interface JobAnalyzerPromptContext {
  jobTitle: string
  companyName: string
  jobText: string
  cvText: string
}

export function compactLines(text: string, maxLines: number, maxChars: number): string {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split(/\n+/)
    .map(line => line.replace(/^[-*•\s]+/, '').trim())
    .filter(Boolean)

  const out: string[] = []
  let length = 0

  for (const line of lines) {
    if (out.length >= maxLines || length >= maxChars) break
    const remaining = maxChars - length
    const next = line.length > remaining ? `${line.slice(0, Math.max(0, remaining - 1)).trim()}…` : line
    if (!next) break
    out.push(next)
    length += next.length + 1
  }

  return out.join('\n')
}

export function defaultInterviewContext(): InterviewPromptContext {
  return { language: 'de', alias: '', cvText: '', jobUrl: '', jobText: '' }
}

export function toInterviewContext(
  context: SessionContextData | null,
  profileCvRaw: string | null,
): InterviewPromptContext {
  if (!context || context.toolType !== 'interview') return defaultInterviewContext()

  const titleLine = context.jobTitle
    ? `ROLE: ${context.jobTitle}${context.companyName ? ` at ${context.companyName}` : ''}`
    : (context.companyName ? `COMPANY: ${context.companyName}` : '')

  const mergedJobText = [titleLine, context.jobText].filter(Boolean).join('\n').slice(0, 3000)

  return {
    language: 'de',
    alias: '',
    cvText: mergeSessionCvForApi(context, profileCvRaw),
    jobUrl: '',
    jobText: mergedJobText,
  }
}

export function defaultJobAnalyzerContext(): JobAnalyzerPromptContext {
  return { jobTitle: '', companyName: '', jobText: '', cvText: '' }
}

export function toJobAnalyzerContext(
  context: SessionContextData | null,
  profileCvRaw: string | null,
): JobAnalyzerPromptContext {
  if (!context || context.toolType !== 'jobanalyzer') return defaultJobAnalyzerContext()

  return {
    jobTitle: context.jobTitle.trim().slice(0, 180),
    companyName: context.companyName.trim().slice(0, 180),
    jobText: context.jobText.trim(),
    cvText: mergeSessionCvForApi(context, profileCvRaw),
  }
}

export function sessionHasCareerSetupForStructuredApi(
  tool: ToolType,
  ctx: SessionContextData | null,
  profileCvRaw: string | null,
): ctx is SessionContextData {
  if (!ctx) return false
  if (ctx.generalCoaching) return true
  const mergedCv = mergeSessionCvForApi(ctx, profileCvRaw).trim()
  const job = ctx.jobText?.trim() ?? ''
  if (tool === 'jobanalyzer') {
    return Boolean(mergedCv.length > 0 || job.length > 0 || ctx.jobTitle.trim() || ctx.companyName.trim())
  }
  if (tool === 'interview') {
    return Boolean(mergedCv.length > 0 || job.length > 0 || ctx.jobTitle.trim() || ctx.companyName.trim())
  }
  return false
}

export function buildCareerToolSetupForApi(
  tool: ToolType,
  priorUserMessageCount: number,
  jobCtx: JobAnalyzerPromptContext,
  invCtx: InterviewPromptContext,
  ctx: SessionContextData,
): CareerToolSetup | undefined {
  if (tool === 'jobanalyzer' && ctx.generalCoaching) {
    const cv = compactLines(sanitizeTechnicalContext(jobCtx.cvText), 22, 2600).trim()
    return { cvText: cv || undefined, generalCoaching: true, jobAnalyzerFollowUp: priorUserMessageCount > 0 }
  }
  if (tool === 'interview' && ctx.generalCoaching) {
    const cv = compactLines(sanitizeTechnicalContext(invCtx.cvText), 22, 2600).trim()
    return {
      cvText: cv || undefined,
      generalCoaching: true,
      interviewLanguageCode: invCtx.language,
      interviewAlias: invCtx.alias.trim().slice(0, 80) || undefined,
    }
  }
  if (tool === 'jobanalyzer') {
    const cv = compactLines(sanitizeTechnicalContext(jobCtx.cvText), 22, 2600).trim()
    const job = compactLines(jobCtx.jobText, 40, 3600).trim()
    const title = jobCtx.jobTitle.trim().slice(0, 200)
    const company = jobCtx.companyName.trim().slice(0, 200)
    if (!cv && !job && !title && !company) return undefined
    return {
      cvText: cv || undefined,
      jobText: job || undefined,
      jobTitle: title || undefined,
      companyName: company || undefined,
      jobAnalyzerFollowUp: priorUserMessageCount > 0,
    }
  }
  if (tool === 'interview') {
    const cv = compactLines(sanitizeTechnicalContext(invCtx.cvText), 22, 2600).trim()
    const job = compactLines(invCtx.jobText, 14, 3600).trim()
    const url = invCtx.jobUrl.trim().slice(0, 400)
    const title = ctx.jobTitle.trim().slice(0, 200)
    const company = ctx.companyName.trim().slice(0, 200)
    if (!cv && !job && !url && !title && !company) return undefined
    return {
      cvText: cv || undefined,
      jobText: job || undefined,
      jobUrl: url || undefined,
      jobTitle: title || undefined,
      companyName: company || undefined,
      interviewLanguageCode: invCtx.language,
      interviewAlias: invCtx.alias.trim().slice(0, 80) || undefined,
    }
  }
  return undefined
}

function interviewBaseInstruction(language: string, hasCv: boolean, alias: string): string {
  const name = alias || 'the candidate'
  return [
    `[SYSTEM - INTERVIEW COACH] Respond ONLY in ${language}. Never call tools.`,
    `Candidate name: "${name}".`,
    hasCv
      ? 'Use candidate profile evidence and be explicit about gaps.'
      : 'If profile data is missing, make assumptions explicit.',
    'If a target role exists, use exactly these sections:',
    '## Anforderungen / Key Requirements',
    '## Top 3 Interviewfragen',
    '## Vorbereitung / Prep Tips',
    '## Dein Pitch',
    'Keep answers concise, practical, and job-specific.',
  ].join('\n')
}

export function buildInterviewPrompt(
  userMessage: string,
  language: string,
  setup: InterviewPromptContext,
): string {
  const jobUrl = setup.jobUrl.trim().slice(0, 220)
  let safeUser = userMessage.trim().slice(0, 1400)

  const fixedReserve = 850
  let remaining = INTERVIEW_PROMPT_LIMIT - safeUser.length - jobUrl.length - fixedReserve
  if (remaining < 900) {
    safeUser = safeUser.slice(0, Math.max(280, safeUser.length - (900 - remaining)))
    remaining = INTERVIEW_PROMPT_LIMIT - safeUser.length - jobUrl.length - fixedReserve
  }

  const cvMax = Math.max(280, Math.floor(remaining * 0.52))
  const jobMax = Math.max(220, remaining - cvMax)

  const modalCv = compactLines(sanitizeTechnicalContext(setup.cvText), 20, cvMax)
  const cvMerged = modalCv ? `From setup modal:\n${modalCv}` : ''

  const base = interviewBaseInstruction(language, Boolean(cvMerged.trim()), setup.alias.trim())
  const jobText = compactLines(setup.jobText, 12, jobMax)

  const cvBlock = cvMerged ? `\nCANDIDATE PROFILE:\n${cvMerged}` : ''
  const roleBlock = (jobText || jobUrl)
    ? `\nTARGET ROLE CONTEXT:\n${jobUrl ? `URL: ${jobUrl}\n` : ''}${jobText ? `JOB DETAILS:\n${jobText}\n` : ''}`
    : ''

  let prompt = `${base}${cvBlock}${roleBlock}\nUser: ${safeUser}`
  if (prompt.length > INTERVIEW_PROMPT_LIMIT) {
    const over = prompt.length - INTERVIEW_PROMPT_LIMIT + 1
    safeUser = safeUser.slice(0, Math.max(80, safeUser.length - over))
    prompt = `${base}${cvBlock}${roleBlock}\nUser: ${safeUser}`
  }
  return prompt.length <= INTERVIEW_PROMPT_LIMIT ? prompt : prompt.slice(0, INTERVIEW_PROMPT_LIMIT - 1)
}

export function buildJobAnalyzerPrompt(
  userMessage: string,
  setup: JobAnalyzerPromptContext,
  /** User messages already in this session before the current send (0 = erste Nachricht). */
  priorUserMessageCount: number,
): string {
  const title = setup.jobTitle
    ? `${setup.jobTitle}${setup.companyName ? ` bei ${setup.companyName}` : ''}`
    : (setup.companyName ? `Rolle bei ${setup.companyName}` : '')

  const isFollowUp = priorUserMessageCount > 0

  const toneAndGrounding = [
    'Ton: menschlich, sachlich, moderat - weder Marketing-Sprech noch übertriebene Begeisterung.',
    'Nur Aussagen, die sich aus STELLENKONTEXT und BEWERBERPROFIL begründen lassen; fehlende Infos ehrlich als Lücke benennen - nichts erfinden oder raten.',
  ].join('\n')

  const baseInstructionInitial = [
    '[SYSTEM - JOB ANALYZER] Antworte nur auf Deutsch.',
    toneAndGrounding,
    'Erste Analyse in dieser Unterhaltung - nutze eine klare Struktur mit genau diesen Sektionen:',
    '## Match Score',
    '## Stärken des Profils',
    '## Lücken / Risiken',
    '## Wichtigste Keywords',
    '## Konkrete nächste Schritte',
    'Regeln:',
    '- Maximal 5 Stichpunkte pro Sektion.',
    '- Keine Wiederholung des gesamten Stellentexts.',
    '- Kurz und präzise; vermeide generische Floskeln, die bei jeder Analyse gleich klingen.',
    '- Begründe den Match Score mit 2 bis 4 klaren Gründen.',
  ].join('\n')

  const baseInstructionFollowUp = [
    '[SYSTEM - JOB ANALYZER] Antworte nur auf Deutsch.',
    toneAndGrounding,
    `Kontext: Die aktuelle Eingabe ist User-Nachricht #${priorUserMessageCount + 1} in dieser Session (Folgefrage).`,
    'Du führst ein **laufendes** Gespräch zur Stellenanalyse; es gibt bereits frühere Nachrichten in dieser Session.',
    'Priorität: Beantworte **zuerst** die konkrete Frage oder den Wunsch in der letzten User-Nachricht - nicht mit einer Standard-Gesamt-Analyse „von vorn", es sei denn, der User verlangt ausdrücklich eine komplette Neu-Analyse.',
    'Struktur: 2–5 kurze Abschnitte mit ##-Überschriften, **passend zur Frage**. Du musst **nicht** erneut alle fünf Standard-Sektionen (Match Score, Stärken, Lücken, Keywords, Schritte) füllen.',
    'Anti-Wiederholung: Nutze den bisherigen Chat. Wiederhole **keine** Sätze oder Stichpunkte wörtlich aus deiner letzten Antwort; formuliere neu, vertiefe oder fokussiere schmaler - je nachdem, was der User will.',
    'Wenn der User nur einen Aspekt will (z. B. Erfahrung, eine Sektion kürzer, Risiken vertiefen), liefere genau das.',
  ].join('\n')

  const baseInstruction = isFollowUp ? baseInstructionFollowUp : baseInstructionInitial

  let safeUser = userMessage.trim().slice(0, 700)
  if (!safeUser) safeUser = 'Bitte starte jetzt die Erstanalyse.'

  const titleLine = title ? `\nZielrolle: ${title}` : ''
  let remaining = JOB_ANALYZER_PROMPT_LIMIT - (baseInstruction.length + safeUser.length + titleLine.length + 120)

  if (remaining < 1100) {
    safeUser = safeUser.slice(0, Math.max(220, safeUser.length - (1100 - remaining)))
    remaining = JOB_ANALYZER_PROMPT_LIMIT - (baseInstruction.length + safeUser.length + titleLine.length + 120)
  }

  const jobMax = Math.max(700, Math.floor(remaining * 0.62))
  const cvMax = Math.max(360, remaining - jobMax)

  const compactJob = compactLines(setup.jobText, 36, jobMax)
  const modalCv = compactLines(setup.cvText, 20, cvMax)
  const cvMerged = modalCv ? `Aus Stellenanalyse-Setup:\n${modalCv}` : ''

  const jobBlock = compactJob ? `\nSTELLENKONTEXT:\n${compactJob}` : ''
  const cvBlock = cvMerged ? `\nBEWERBERPROFIL:\n${cvMerged}` : ''

  let prompt = `${baseInstruction}${titleLine}${jobBlock}${cvBlock}\nUser: ${safeUser}`
  if (prompt.length > JOB_ANALYZER_PROMPT_LIMIT) {
    const over = prompt.length - JOB_ANALYZER_PROMPT_LIMIT + 1
    safeUser = safeUser.slice(0, Math.max(80, safeUser.length - over))
    prompt = `${baseInstruction}${titleLine}${jobBlock}${cvBlock}\nUser: ${safeUser}`
  }
  return prompt.length <= JOB_ANALYZER_PROMPT_LIMIT ? prompt : prompt.slice(0, JOB_ANALYZER_PROMPT_LIMIT - 1)
}
