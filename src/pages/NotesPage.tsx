import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { NotebookPen, Pencil, Search, Tag, Trash2, X } from 'lucide-react'
import { useChatNotes } from '../hooks/useChatNotes'
import type { ChatSavedNote } from '../types'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
  }
  catch {
    return iso
  }
}

export default function NotesPage() {
  const {
    isSignedIn,
    notes,
    filteredNotes,
    searchQuery,
    setSearchQuery,
    selectedTags,
    toggleTagFilter,
    clearTagFilters,
    allTags,
    updateNote,
    deleteNote,
  } = useChatNotes()

  const [editing, setEditing] = useState<ChatSavedNote | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')

  const openEdit = (n: ChatSavedNote) => {
    setEditing(n)
    setEditTitle(n.title)
    setEditBody(n.body)
    setEditTags([...n.tags])
    setEditTagInput('')
  }

  const closeEdit = () => {
    setEditing(null)
  }

  const saveEdit = () => {
    if (!editing) return
    const t = editTitle.trim()
    if (!t || !editBody.trim()) return
    updateNote(editing.id, { title: t, body: editBody, tags: editTags })
    closeEdit()
  }

  const addEditTag = () => {
    const t = editTagInput.trim().toLowerCase()
    if (!t || editTags.includes(t)) {
      setEditTagInput('')
      return
    }
    setEditTags(prev => [...prev, t])
    setEditTagInput('')
  }

  const emptyHint = useMemo(
    () => (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-12 text-center">
        <NotebookPen className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
        <p className="text-sm font-medium text-slate-700">Noch keine Notizen</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Öffne einen Chat und speichere Assistant-Antworten über „Speichern“ unter der Nachricht.
        </p>
        <Link
          to="/chat"
          className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
        >
          Zum Chat
        </Link>
      </div>
    ),
    [],
  )

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-slate-600">Melde dich an, um Notizen zu speichern und zu verwalten.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Zur Startseite
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
          <NotebookPen className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Notizen</h1>
          <p className="mt-1 text-sm text-slate-600">
            Gespeicherte Antworten aus dem Chat — bearbeiten, taggen und filtern. Daten liegen in diesem Browser
            (localStorage).
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="In Titel oder Inhalt suchen …"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary"
            aria-label="Suche"
          />
        </div>
        {selectedTags.length > 0 ? (
          <button
            type="button"
            onClick={clearTagFilters}
            className="flex-shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Filter zurücksetzen
          </button>
        ) : null}
      </div>

      {allTags.length > 0 ? (
        <div className="mb-6">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Tag className="h-3.5 w-3.5" aria-hidden />
            Tags filtern (einer reicht)
          </p>
          <div className="flex flex-wrap gap-2">
            {allTags.map(t => {
              const on = selectedTags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTagFilter(t)}
                  className={[
                    'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                    on ? 'border-primary bg-primary-light text-primary' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {notes.length === 0
        ? emptyHint
        : filteredNotes.length === 0
          ? (
              <p className="py-8 text-center text-sm text-slate-500">Keine Treffer für die aktuelle Suche oder Filter.</p>
            )
          : (
              <ul className="flex flex-col gap-3">
                {filteredNotes.map(n => (
                  <li
                    key={n.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h2 className="min-w-0 flex-1 text-base font-semibold text-slate-900">{n.title}</h2>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(n)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-primary-light hover:text-primary"
                          aria-label="Bearbeiten"
                          title="Bearbeiten"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Notiz wirklich löschen?')) deleteNote(n.id)
                          }}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          aria-label="Löschen"
                          title="Löschen"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{n.body}</p>
                    {n.tags.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {n.tags.map(t => (
                          <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <p className="mt-2 text-[11px] text-slate-400">{formatDate(n.updatedAt)}</p>
                  </li>
                ))}
              </ul>
            )}

      {editing ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={e => {
            if (e.target === e.currentTarget) closeEdit()
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Notiz bearbeiten</h2>
              <button type="button" onClick={closeEdit} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Titel</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="mb-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Inhalt</label>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={12}
              className="mb-3 w-full resize-y rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">Tags</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {editTags.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditTags(prev => prev.filter(x => x !== t))}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-700 hover:border-red-200 hover:bg-red-50"
                >
                  {t} ×
                </button>
              ))}
            </div>
            <div className="mb-4 flex gap-2">
              <input
                value={editTagInput}
                onChange={e => setEditTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addEditTag()
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                placeholder="Tag, Enter"
              />
              <button type="button" onClick={addEditTag} className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">
                Hinzufügen
              </button>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50">
                Abbrechen
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={!editTitle.trim() || !editBody.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
