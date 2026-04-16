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
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const resolvedToolType: ToolType = toolType ?? 'general'

  if (msg.isUser || !isSignedIn || !activeSessionId || !msg.text.trim()) return null

  const duplicate = hasNoteForMessage(msg.id)
  const defaultTitle = suggestTitleFromBody(msg.text)

  return (
    <div className="mt-0.5 flex justify-start">
      <button
        type="button"
        title="Als Notiz speichern"
        aria-label="Antwort als Notiz speichern"
        onClick={() => {
          setSaveErr(null)
          setOpen(true)
        }}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-200/90 bg-white/95 text-slate-500 shadow-sm transition hover:border-primary/50 hover:bg-primary-light/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 active:scale-[0.97]"
      >
        <BookmarkPlus className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </button>
      <SaveChatNoteModal
        isOpen={open}
        onClose={() => {
          setOpen(false)
          setSaveErr(null)
        }}
        defaultTitle={defaultTitle}
        defaultBody={msg.text.trim()}
        duplicateForMessage={duplicate}
        isSaving={saving}
        saveError={saveErr}
        onSave={async (title, body, tags) => {
          setSaving(true)
          setSaveErr(null)
          try {
            await addNote({
              title,
              body,
              tags,
              source: { toolType: resolvedToolType, sessionId: activeSessionId, messageId: msg.id },
            })
          }
          catch (e) {
            setSaveErr(e instanceof Error ? e.message : 'Notiz konnte nicht gespeichert werden.')
            throw e
          }
          finally {
            setSaving(false)
          }
        }}
      />
    </div>
  )
}
