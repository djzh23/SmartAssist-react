// ── Tool types ────────────────────────────────────────────
export type ToolType = 'general' | 'jobanalyzer' | 'language' | 'programming' | 'interview'

export interface ToolMeta {
  id: ToolType
  name: string
  icon: string
  shortDescription: string
  fullDescription: string
  examples: string[]
  iconBg: string
  chatParam: string
  featured?: boolean
}

// ── Programming languages ─────────────────────────────────
export type ProgrammingLanguage = 'csharp' | 'java' | 'html' | 'react' | 'design-patterns' | 'architecture'

export interface ProgrammingLanguageMeta {
  id: ProgrammingLanguage
  label: string
  syntaxLang: string  // language id for react-syntax-highlighter
}

export const PROGRAMMING_LANGUAGES: ProgrammingLanguageMeta[] = [
  { id: 'csharp',           label: 'C#',               syntaxLang: 'csharp' },
  { id: 'java',             label: 'Java',              syntaxLang: 'java' },
  { id: 'html',             label: 'HTML / CSS',        syntaxLang: 'markup' },
  { id: 'react',            label: 'React / TSX',       syntaxLang: 'tsx' },
  { id: 'design-patterns',  label: 'Design Patterns',   syntaxLang: 'typescript' },
  { id: 'architecture',     label: 'Architecture',      syntaxLang: 'typescript' },
]

// ── Language options ──────────────────────────────────────
export interface LangOption { code: string; label: string }

export const NATIVE_LANGS: LangOption[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'Englisch' },
  { code: 'fr', label: 'Französisch' },
  { code: 'ar', label: 'Arabisch' },
]

export const TARGET_LANGS: LangOption[] = [
  { code: 'es', label: 'Spanisch' },
  { code: 'fr', label: 'Französisch' },
  { code: 'en', label: 'Englisch' },
  { code: 'it', label: 'Italienisch' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ar', label: 'Arabisch' },
  { code: 'pt', label: 'Portugiesisch' },
]

export const INTERVIEW_LANGS: LangOption[] = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'Englisch' },
]

// ── Chat / session types ──────────────────────────────────
export interface LearningData {
  targetLanguageText: string
  nativeLanguageText: string
  learnContext?: string
  learnVariants?: string
  learnTip?: string
}

export interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  toolUsed?: string
  learningData?: LearningData
  timestamp: string // ISO string
}

export interface ChatSession {
  id: string
  toolType: ToolType
  messages: ChatMessage[]
  createdAt: string
  /** Short list title (set from first user message). */
  title?: string
}

/** Saved assistant reply from chat (localStorage until a future API exists). */
export interface ChatSavedNoteSource {
  toolType: ToolType
  sessionId: string
  messageId: string
}

export interface ChatSavedNote {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  body: string
  tags: string[]
  source?: ChatSavedNoteSource
}

// ── API types ─────────────────────────────────────────────
/** Karriereprofil-Kontext für /api/agent (camelCase wie Backend JSON). */
export interface ProfileContextToggles {
  includeBasicProfile: boolean
  includeSkills: boolean
  includeExperience: boolean
  includeCv: boolean
  activeTargetJobId: string | null
}

/** Strukturierter Kontext für Job-Analyzer / Interview — Backend baut daraus die Nutzerrolle. */
export interface CareerToolSetup {
  cvText?: string
  jobText?: string
  jobUrl?: string
  jobTitle?: string
  companyName?: string
  interviewLanguageCode?: string
  jobAnalyzerFollowUp?: boolean
  interviewAlias?: string
  /** Keine feste Stellenanzeige — allgemeines Job-/Interview-Coaching (Backend + Assembler). */
  generalCoaching?: boolean
}

export interface AgentRequest {
  message: string
  sessionId?: string
  /** Backend tool: general, language, jobanalyzer, programming, interviewprep */
  toolType?: string
  languageLearningMode?: boolean
  targetLanguage?: string
  nativeLanguage?: string
  targetLanguageCode?: string
  nativeLanguageCode?: string
  level?: string
  learningGoal?: string
  programmingMode?: boolean
  programmingLanguage?: string
  interviewMode?: boolean
  interviewLanguage?: string
  profileToggles?: ProfileContextToggles
  /** When set, backend loads Bewerbungskontext for this application id. */
  jobApplicationId?: string
  careerToolSetup?: CareerToolSetup
}

export interface AgentResponse {
  reply: string
  toolUsed?: string
  learningData?: LearningData
}

export interface SpeechRequest {
  text: string
  languageCode: string
  voiceId?: string
  modelId?: string
}

/** /api/skills — dynamic career modules */
export interface SkillSummary {
  id: string
  name: string
  description: string
  icon: string
  category: string
  badge: string
  badgeColor: string
  isEnabled: boolean
  isBeta: boolean
  minPlan: string
  apiToolType: string
  isAccessible: boolean
}

/** /api/cv-studio/resumes — Lebenslauf-Übersicht (camelCase vom Backend) */
export interface CvStudioResumeSummary {
  id: string
  title: string
  templateKey: string | null
  updatedAtUtc: string
}

/** /api/cv-studio/pdf-exports — getrackte PDF-Downloads (Kontingent) */
export interface CvStudioPdfExportRow {
  id: string
  resumeId: string
  versionId: string | null
  design: string
  fileLabel: string
  createdAtUtc: string
  hasStoredFile: boolean
}

/** /api/learning/insights */
export interface LearningInsight {
  id: string
  category: string
  content: string
  title?: string
  sourceTool?: string
  sourceContext?: string
  jobApplicationId?: string
  targetJobId?: string
  sortOrder?: number
  createdAt: string
  updatedAt?: string
  resolved: boolean
  resolvedAt?: string
}
