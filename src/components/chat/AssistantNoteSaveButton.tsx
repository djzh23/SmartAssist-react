import { useState } from 'react'
import { useUser } from '@clerk/clerk-react'
import { BookmarkPlus } from 'lucide-react'
import { useChatNotes } from '../../hooks/useChatNotes'
import type { ChatMessage, ToolType } from '../../types'
import SaveChatNoteModal from './SaveChatNoteModal'

interface Props {
  msg: ChatMessage
  toolType?: ToolType
  activeSessionId: string | null
}

function suggestTitleFromBody(text: string): string {
  const line = text.trim().split('\n').find(l => l.trim()) ?? ''
  const cleaned = line.replace(/^#+\s*/, '').trim()
  return cleaned.length > 80 ? `${cleaned.slice(0, 80)}…` : cleaned || 'Notiz'
}

export default function AssistantNoteSaveButton({ msg, toolType, activeSessionId }: Props) {
  const { isSignedIn } = useUser()
  const { addNote, hasNoteForMessage } = useChatNotes()
  const [open, setOpen] = useState(false)
  const resolvedToolType: ToolType = toolType ?? 'general'

  if (msg.isUser || !isSignedIn || !activeSessionId || !msg.text.trim()) return null

  const duplicate = hasNoteForMessage(msg.id)
  const defaultTitle = suggestTitleFromBody(msg.text)

  return (
    <div className="mt-1 flex justify-start pl-1">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Antwort als Notiz speichern"
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary-light/40 hover:text-primary"
      >
        <BookmarkPlus className="h-3.5 w-3.5" aria-hidden />
        Speichern
      </button>
      <SaveChatNoteModal
        isOpen={open}
        onClose={() => setOpen(false)}
        defaultTitle={defaultTitle}
        defaultBody={msg.text.trim()}
        duplicateForMessage={duplicate}
        onSave={(title, body, tags) => {
          addNote({
            title,
            body,
            tags,
            source: { toolType: resolvedToolType, sessionId: activeSessionId, messageId: msg.id },
          })
        }}
      />
    </div>
  )
}
