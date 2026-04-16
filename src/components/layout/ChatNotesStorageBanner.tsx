import { AlertTriangle, X } from 'lucide-react'
import { useChatNotes } from '../../hooks/useChatNotes'

/** Visible when the API stores chat notes on Redis while Postgres was configured (e.g. missing Supabase connection). */
export default function ChatNotesStorageBanner() {
  const { chatNotesStorageWarning, clearChatNotesStorageWarning } = useChatNotes()
  if (!chatNotesStorageWarning)
    return null

  return (
    <div
      className="flex flex-shrink-0 items-start gap-2 border-b border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 md:px-4"
      role="status"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" aria-hidden />
      <p className="min-w-0 flex-1 leading-snug">{chatNotesStorageWarning}</p>
      <button
        type="button"
        onClick={clearChatNotesStorageWarning}
        className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-amber-800 transition-colors hover:bg-amber-200/80"
        aria-label="Hinweis schließen"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
