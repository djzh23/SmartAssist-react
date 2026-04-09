/**
 * Chat session state lives in ChatSessionsProvider (MainLayout) so it survives
 * navigation away from /chat while streams continue in the background.
 */
export { ChatSessionsProvider, useChatSessions, TOOL_TO_QUERY } from '../context/ChatSessionsProvider'
export type { SessionStore, AnswerReadyToast, StreamingPlaceholder } from '../context/ChatSessionsProvider'
