// ── Tool types ────────────────────────────────────────────
export type ToolType = 'general' | 'weather' | 'jobanalyzer' | 'jokes' | 'language'

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

// ── Chat / session types ──────────────────────────────────
export interface LearningData {
  targetLanguageText: string
  nativeLanguageText: string
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
}

// ── API types ─────────────────────────────────────────────
export interface AgentRequest {
  message: string
  sessionId?: string
  languageLearningMode?: boolean
  targetLanguage?: string
  nativeLanguage?: string
  targetLanguageCode?: string
  nativeLanguageCode?: string
  level?: string
  learningGoal?: string
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
