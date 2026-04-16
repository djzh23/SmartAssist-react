import { useEffect, useState } from 'react'
import { BookmarkPlus, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  defaultTitle: string
  defaultBody: string
  duplicateForMessage?: boolean
  onSave: (title: string, body: string, tags: string[]) => void
}

export default function SaveChatNoteModal({
  isOpen,
  onClose,
  defaultTitle,
  defaultBody,
  duplicateForMessage,
  onSave,
}: Props) {
  const [title, setTitle] = useState(defaultTitle)
  const [body, setBody] = useState(defaultBody)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      setTitle(defaultTitle)
      setBody(defaultBody)
      setTagInput('')
      setTags([])
    }
  }, [isOpen, defaultTitle, defaultBody])

  if (!isOpen) return null

  const addTagFromInput = () => {
    const t = tagInput.trim().toLowerCase()
    if (!t || tags.includes(t)) {
      setTagInput('')
      return
    }
    setTags(prev => [...prev, t])
    setTagInput('')
  }

  const handleSave = () => {
    const t = title.trim()
    if (!t || !body.trim()) return
    onSave(t, body, tags)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex animate-fade-in items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="save-note-title"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
              <BookmarkPlus className="h-4 w-4" aria-hidden />
            </div>
            <h2 id="save-note-title" className="text-lg font-bold text-slate-900">
              Als Notiz speichern
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Schließen"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {duplicateForMessage ? (
          <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Für diese Antwort existiert bereits eine Notiz. Du kannst trotzdem eine weitere anlegen.
          </p>
        ) : null}

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Titel</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={120}
          className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Inhalt</label>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          rows={10}
          className="mb-3 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-primary"
        />

        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tags</label>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {tags.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setTags(prev => prev.filter(x => x !== t))}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              {t}
              <span className="text-slate-400" aria-hidden>
                ×
              </span>
            </button>
          ))}
        </div>
        <div className="mb-4 flex gap-2">
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTagFromInput()
              }
            }}
            placeholder="Tag eingeben, Enter …"
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={addTagFromInput}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Hinzufügen
          </button>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!title.trim() || !body.trim()}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  )
}
