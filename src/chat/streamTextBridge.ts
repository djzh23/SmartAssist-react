/**
 * Bridges streaming chunks to ChatSessionsProvider without relying on a stale
 * `store` object captured when handleSend started. The provider registers the
 * real setState path on mount.
 */
export type StreamTextApplier = (sessionId: string, messageId: string, text: string) => void

let applier: StreamTextApplier | null = null

export function setStreamTextApplier(fn: StreamTextApplier | null): void {
  applier = fn
}

export function applyStreamText(sessionId: string, messageId: string, text: string): void {
  applier?.(sessionId, messageId, text)
}
