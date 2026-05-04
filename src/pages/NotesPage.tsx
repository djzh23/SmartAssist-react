import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  NotebookPen,
  Pencil,
  Search,
  Tag,
  Trash2,
  X,
} from 'lucide-react'
import InfoExplainerButton from '../components/ui/InfoExplainerButton'
import StandardPageContainer from '../components/layout/StandardPageContainer'
import { RenderedMarkdown } from '../components/chat/RenderedMarkdown'
import PageHeader from '../components/layout/PageHeader'
import AppCtaButton from '../components/ui/AppCtaButton'
import { useAppUi } from '../context/AppUiContext'
import { useLayoutChrome } from '../context/LayoutChromeContext'
import { useChatNotes } from '../hooks/useChatNotes'
import { useMediaQuery } from '../hooks/useMediaQuery'
import type { ChatSavedNote } from '../types'

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
  }
  catch {
    return iso
  }
}

function previewBody(text: string, max = 140): string {
  const oneLine = text.replace(/\s+/g, ' ').trim()
  if (oneLine.length <= max) return oneLine
  return `${oneLine.slice(0, max)}…`
}

export default function NotesPage() {
  const { requestConfirm, showToast } = useAppUi()
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
    notesLoading,
    notesError,
    clearNotesError,
    updateNote,
    deleteNote,
    reload,
  } = useChatNotes()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<ChatSavedNote | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editBody, setEditBody] = useState('')
  const [editTags, setEditTags] = useState<string[]>([])
  const [editTagInput, setEditTagInput] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editError, setEditError] = useState<string | null>(null)
  const isMdUp = useMediaQuery('(min-width: 768px)')
  /** Unter md: entweder Liste oder Lesen - volle Breite, besser bedienbar. */
  const [mobileStep, setMobileStep] = useState<'list' | 'reader'>('list')
  const { notesTheme } = useLayoutChrome()
  const theme = notesTheme
  const isDark = theme === 'dark'

  useEffect(() => {
    if (isMdUp)
      setMobileStep('list')
  }, [isMdUp])

  useEffect(() => {
    if (filteredNotes.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filteredNotes.some(n => n.id === selectedId))
      setSelectedId(filteredNotes[0]!.id)
  }, [filteredNotes, selectedId])

  const selected = useMemo(
    () => filteredNotes.find(n => n.id === selectedId) ?? null,
    [filteredNotes, selectedId],
  )

  useEffect(() => {
    if (!selected)
      setMobileStep('list')
  }, [selected])

  const openEdit = useCallback((n: ChatSavedNote) => {
    setEditing(n)
    setEditTitle(n.title)
    setEditBody(n.body)
    setEditTags([...n.tags])
    setEditTagInput('')
    setEditError(null)
  }, [])

  const closeEdit = useCallback(() => {
    setEditing(null)
    setEditError(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editing) return
    const t = editTitle.trim()
    if (!t || !editBody.trim()) return
    setSavingEdit(true)
    setEditError(null)
    try {
      await updateNote(editing.id, { title: t, body: editBody, tags: editTags })
      closeEdit()
    }
    catch (e) {
      setEditError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen.')
    }
    finally {
      setSavingEdit(false)
    }
  }, [editing, editTitle, editBody, editTags, updateNote, closeEdit])

  const addEditTag = () => {
    const t = editTagInput.trim().toLowerCase()
    if (!t || editTags.includes(t)) {
      setEditTagInput('')
      return
    }
    setEditTags(prev => [...prev, t])
    setEditTagInput('')
  }

  const handleDelete = useCallback(
    async (id: string) => {
      const ok = await requestConfirm({
        title: 'Notiz löschen?',
        message: 'Die Notiz wird dauerhaft entfernt.',
        confirmLabel: 'Löschen',
        cancelLabel: 'Abbrechen',
        danger: true,
      })
      if (!ok) return
      setDeletingId(id)
      try {
        await deleteNote(id)
        if (selectedId === id) setSelectedId(null)
      }
      catch (e) {
        showToast(e instanceof Error ? e.message : 'Löschen fehlgeschlagen.', 'error')
      }
      finally {
        setDeletingId(null)
      }
    },
    [deleteNote, requestConfirm, selectedId, showToast],
  )

  const emptyHint = useMemo(
    () => (
      <div
        className={[
          'relative rounded-2xl border border-dashed px-6 py-12 text-center',
          isDark
            ? 'border-white/20 bg-black/15 text-stone-100'
            : 'border-stone-500/35 bg-app-parchment/60 text-stone-900',
        ].join(' ')}
      >
        <div className="absolute right-3 top-3">
          <InfoExplainerButton
            variant={isDark ? 'onDark' : 'onLight'}
            modalTitle="Notizen aus dem Chat"
            ariaLabel="Erklärung, wie Notizen aus dem Chat gespeichert werden"
          >
            <p>
              Speichere Assistant-Antworten im Chat über das Lesezeichen-Symbol unter der Nachricht. Gespeicherte
              Notizen erscheinen hier und lassen sich mit dem Server synchronisieren.
            </p>
          </InfoExplainerButton>
        </div>
        <NotebookPen className={['mx-auto mb-3 h-10 w-10', isDark ? 'text-stone-400' : 'text-stone-500'].join(' ')} aria-hidden />
        <p className={['text-sm font-medium', isDark ? 'text-stone-100' : 'text-stone-900'].join(' ')}>Noch keine Notizen</p>
        <p className={['mx-auto mt-2 max-w-md text-sm', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>Im Chat speichern - Details über das Info-Symbol.</p>
        <Link
          to="/chat"
          className={['mt-4 inline-block text-sm font-medium hover:underline', isDark ? 'text-amber-300' : 'text-primary'].join(' ')}
        >
          Zum Chat
        </Link>
      </div>
    ),
    [isDark],
  )

  if (!isSignedIn) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-stone-400">Melde dich an, um Notizen zu speichern und zu verwalten.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
          Zur Startseite
        </Link>
      </div>
    )
  }

  return (
    <StandardPageContainer className="flex min-h-0 w-full flex-1 flex-col gap-4 overflow-hidden pt-3 pb-24 md:gap-6 md:py-8">
      <PageHeader
        pageKey="notes"
        subtitle="Aus dem Chat gespeichert."
        className="mb-0"
        hideTitleOnMobile
        infoSlot={(
          <InfoExplainerButton
            variant="onDark"
            modalTitle="Notizen"
            ariaLabel="Erklärung zu gespeicherten Chat-Notizen"
            className="shrink-0"
          >
            <p>
              Gespeicherte Antworten aus dem Chat, sobald du angemeldet bist.
            </p>
          </InfoExplainerButton>
        )}
      />

      {notesError ? (
        <div
          className={[
            'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
            isDark
              ? 'border-red-500/40 bg-red-950/35 text-red-100'
              : 'border-red-200 bg-red-50 text-red-900',
          ].join(' ')}
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="font-medium">Notizen konnten nicht geladen werden</p>
            <p className={['mt-1', isDark ? 'text-red-200/90' : 'text-red-800/90'].join(' ')}>{notesError}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              clearNotesError()
              void reload()
            }}
            className={[
              'shrink-0 rounded-lg border px-2 py-1 text-xs font-medium',
              isDark
                ? 'border-red-400/40 text-red-100 hover:bg-red-900/30'
                : 'border-red-300 text-red-900 hover:bg-red-100',
            ].join(' ')}
          >
            Erneut versuchen
          </button>
          <button
            type="button"
            onClick={clearNotesError}
            className={['shrink-0 rounded-lg p-1', isDark ? 'text-red-200 hover:bg-red-900/30' : 'text-red-700 hover:bg-red-100'].join(' ')}
            aria-label="Hinweis schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      <div
        className={[
          'flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border shadow-landing md:min-h-0 md:flex-row md:gap-0',
          isDark
            ? 'border-white/15 bg-[#14100c]'
            : 'border-stone-400/40 bg-app-parchment',
        ].join(' ')}
      >
        {/* Liste */}
        <aside
          className={[
            isDark
              ? 'flex min-h-0 w-full min-w-0 flex-shrink-0 flex-col border-white/10 md:w-[min(100%,320px)] md:max-h-none md:border-r md:bg-[#18120d]/85'
              : 'flex min-h-0 w-full min-w-0 flex-shrink-0 flex-col border-stone-400/35 md:w-[min(100%,320px)] md:max-h-none md:border-r md:bg-app-parchmentDeep/70',
            !isMdUp && mobileStep === 'reader' ? 'hidden' : '',
            !isMdUp ? 'max-md:max-h-[55vh] max-md:flex-1' : '',
          ].filter(Boolean).join(' ')}
        >
          <div className={['flex flex-shrink-0 flex-col gap-3 border-b p-3 md:p-4', isDark ? 'border-white/10' : 'border-stone-400/30'].join(' ')}>
            <div className="relative">
              <Search className={['pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2', isDark ? 'text-stone-400' : 'text-stone-500'].join(' ')} aria-hidden />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Suche in Titel und Text …"
                className={[
                  'w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary',
                  isDark
                    ? 'border-white/20 bg-black/25 text-stone-100 placeholder:text-stone-500'
                    : 'border-stone-400/50 bg-white text-stone-900',
                ].join(' ')}
                aria-label="Suche"
              />
            </div>
            {selectedTags.length > 0 ? (
              <button
                type="button"
                onClick={clearTagFilters}
                className={[
                  'self-start rounded-lg border px-2.5 py-1 text-xs font-medium',
                  isDark
                    ? 'border-white/20 bg-black/25 text-stone-200 hover:bg-white/10'
                    : 'border-stone-400/45 bg-white text-stone-700 hover:bg-stone-100',
                ].join(' ')}
              >
                Filter zurücksetzen
              </button>
            ) : null}
            {allTags.length > 0 ? (
              <div>
                <p className={['mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>
                  <Tag className="h-3 w-3" aria-hidden />
                  Tags (einer reicht)
                </p>
                <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto">
                  {allTags.map(t => {
                    const on = selectedTags.includes(t)
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => toggleTagFilter(t)}
                        className={[
                          'rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                          on
                            ? isDark
                              ? 'border-amber-300/70 bg-amber-500/15 text-amber-200'
                              : 'border-primary bg-primary-light text-primary'
                            : isDark
                              ? 'border-white/20 bg-black/25 text-stone-200 hover:border-white/35'
                              : 'border-stone-400/45 bg-white text-stone-700 hover:border-stone-500/50',
                        ].join(' ')}
                      >
                        {t}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2 md:p-3">
            {notesLoading && notes.length === 0 ? (
              <div className={['flex flex-col items-center justify-center gap-2 py-12 text-sm', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                Notizen werden geladen …
              </div>
            ) : notes.length === 0
              ? emptyHint
              : filteredNotes.length === 0
                ? (
                    <p className={['py-8 text-center text-sm', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>Keine Treffer für Suche oder Filter.</p>
                  )
                : (
                    <ul className="flex flex-col gap-1">
                      {filteredNotes.map(n => {
                        const active = n.id === selectedId
                        return (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedId(n.id)
                                if (!isMdUp) setMobileStep('reader')
                              }}
                              className={[
                                isDark
                                  ? 'flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition active:bg-white/5'
                                  : 'flex w-full flex-col rounded-xl border px-3 py-2.5 text-left transition active:bg-stone-200/50',
                                active
                                  ? isDark
                                    ? 'border-amber-300/40 bg-amber-500/10 shadow-sm'
                                    : 'border-primary/50 bg-primary-light/70 shadow-sm'
                                  : isDark
                                    ? 'border-transparent bg-black/10 hover:border-white/20 hover:bg-black/20 md:bg-transparent'
                                    : 'border-transparent bg-white hover:border-stone-400/45 hover:bg-white md:bg-transparent',
                              ].join(' ')}
                            >
                              <span className="flex items-start justify-between gap-2">
                                <span className={['line-clamp-2 min-w-0 flex-1 text-sm font-semibold', isDark ? 'text-stone-100' : 'text-stone-900'].join(' ')}>{n.title}</span>
                                <ChevronRight className={['mt-0.5 h-4 w-4 shrink-0 md:hidden', isDark ? 'text-stone-500' : 'text-stone-400'].join(' ')} aria-hidden />
                              </span>
                              <span className={['mt-1 line-clamp-2 text-xs leading-snug', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>{previewBody(n.body)}</span>
                              <span className={['mt-1.5 text-[10px] font-medium uppercase tracking-wide', isDark ? 'text-stone-500' : 'text-stone-500'].join(' ')}>
                                {formatDate(n.updatedAt)}
                              </span>
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
          </div>
        </aside>

        {/* Lesepanel */}
        <section
          className={[
            'flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden',
            !isMdUp && mobileStep === 'list' ? 'hidden' : '',
            !isMdUp ? 'max-md:flex-1' : '',
          ].filter(Boolean).join(' ')}
        >
          {selected ? (
            <>
              <div className={['flex flex-shrink-0 flex-wrap items-start justify-between gap-2 border-b px-3 py-3 sm:px-4 md:px-6', isDark ? 'border-white/10' : 'border-stone-400/30'].join(' ')}>
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  {!isMdUp ? (
                    <button
                      type="button"
                      onClick={() => setMobileStep('list')}
                      className={[
                        'mt-0.5 shrink-0 rounded-xl border p-2 shadow-sm transition',
                        isDark
                          ? 'border-white/20 bg-black/25 text-stone-200 hover:border-amber-300/40 hover:bg-amber-500/10 hover:text-amber-200'
                          : 'border-stone-400/45 bg-white text-stone-700 hover:border-primary/40 hover:bg-primary-light/40 hover:text-primary',
                      ].join(' ')}
                      aria-label="Zurück zur Liste"
                    >
                      <ArrowLeft className="h-5 w-5" aria-hidden />
                    </button>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <h2 className={['text-base font-bold leading-snug sm:text-lg md:text-xl', isDark ? 'text-stone-100' : 'text-stone-900'].join(' ')}>{selected.title}</h2>
                    <p className={['mt-1 text-xs', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>
                      Zuletzt
                      {' '}
                      {formatDate(selected.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-shrink-0 flex-wrap justify-end gap-1 sm:w-auto">
                  {selected.source ? (
                    <Link
                      to={`/chat?tool=${encodeURIComponent(selected.source.toolType)}`}
                      className={[
                        'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium',
                        isDark
                          ? 'border-white/20 bg-black/25 text-stone-200 hover:border-amber-300/40 hover:text-amber-200'
                          : 'border-stone-400/45 bg-white text-stone-700 hover:border-primary/40 hover:text-primary',
                      ].join(' ')}
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      Zum Chat
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => openEdit(selected)}
                    className={[
                      'rounded-lg border p-2',
                      isDark
                        ? 'border-white/20 bg-black/25 text-stone-200 hover:border-amber-300/40 hover:text-amber-200'
                        : 'border-stone-400/45 bg-white text-stone-700 hover:border-primary/40 hover:text-primary',
                    ].join(' ')}
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(selected.id)}
                    disabled={deletingId === selected.id}
                    className={[
                      'rounded-lg border p-2 disabled:opacity-50',
                      isDark
                        ? 'border-white/20 bg-black/25 text-stone-200 hover:border-red-400/50 hover:bg-red-900/20 hover:text-red-200'
                        : 'border-stone-400/45 bg-white text-stone-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600',
                    ].join(' ')}
                    aria-label="Löschen"
                  >
                    {deletingId === selected.id
                      ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              {selected.tags.length > 0 ? (
                <div className={['flex flex-shrink-0 flex-wrap gap-1.5 border-b px-3 py-2 sm:px-4 md:px-6', isDark ? 'border-white/10' : 'border-stone-400/25'].join(' ')}>
                  {selected.tags.map(t => (
                    <span
                      key={t}
                      className={[
                        'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                        isDark
                          ? 'border-amber-300/40 bg-amber-500/15 text-amber-200'
                          : 'border-amber-200/80 bg-amber-50 text-amber-900/90',
                      ].join(' ')}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4 sm:px-4 md:px-6 md:py-6">
                <div
                  className={[
                    'mx-auto max-w-3xl rounded-2xl border px-3 py-5 shadow-inner max-md:rounded-xl max-md:px-2.5 max-md:py-4 sm:px-6 sm:py-7',
                    isDark
                      ? 'border-white/15 bg-gradient-to-b from-[#1d1611] via-[#16110d] to-[#1b130c] [&_.reader-markdown_h2]:!text-amber-100 [&_.reader-markdown_h2]:!border-amber-300/70 [&_.reader-markdown_h2]:!from-amber-500/20 [&_.reader-markdown_h2]:!via-amber-400/10 [&_.reader-markdown_h3]:!text-stone-100 [&_.reader-markdown_h4]:!text-amber-200 [&_.reader-markdown_p]:!text-stone-200 [&_.reader-markdown_li]:!text-stone-200 [&_.reader-markdown_em]:!text-stone-100 [&_.reader-markdown_strong]:!text-amber-100 [&_.reader-markdown_blockquote]:!bg-amber-500/10 [&_.reader-markdown_blockquote]:!text-stone-100'
                      : 'border-stone-400/35 bg-gradient-to-b from-app-parchment via-white to-amber-50/30',
                  ].join(' ')}
                >
                  <RenderedMarkdown content={selected.body} variant="reader" />
                </div>
              </div>
            </>
          ) : notes.length > 0 && !notesLoading ? (
            <div className={['flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm', isDark ? 'text-stone-300' : 'text-stone-600'].join(' ')}>
              <NotebookPen className={['h-10 w-10', isDark ? 'text-stone-500' : 'text-stone-400'].join(' ')} aria-hidden />
              Wähle eine Notiz aus der Liste.
            </div>
          ) : null}
        </section>
      </div>

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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/15 bg-[#1a1510] p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Notiz bearbeiten</h2>
              <button type="button" onClick={closeEdit} className="rounded-lg p-1 text-stone-500 hover:bg-white/10 hover:text-stone-300" aria-label="Schließen">
                <X className="h-5 w-5" />
              </button>
            </div>
            {editError ? (
              <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">{editError}</p>
            ) : null}
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-400">Titel</label>
            <input
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="mb-3 w-full rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-primary"
            />
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-400">Inhalt</label>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={12}
              className="mb-3 w-full resize-y rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-primary"
            />
            <label className="mb-1 block text-xs font-semibold uppercase text-stone-400">Tags</label>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {editTags.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditTags(prev => prev.filter(x => x !== t))}
                  className="rounded-full border border-stone-600/50 bg-stone-800/50 px-2 py-0.5 text-xs text-stone-300 hover:border-rose-500/40 hover:bg-rose-950/30 hover:text-rose-300"
                >
                  {t}
                  {' '}
                  ×
                </button>
              ))}
            </div>
            <div className="mb-5 flex gap-2">
              <input
                value={editTagInput}
                onChange={e => setEditTagInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addEditTag()
                  }
                }}
                className="min-w-0 flex-1 rounded-lg border border-white/15 bg-black/25 px-3 py-2 text-sm text-stone-100 placeholder:text-stone-600 outline-none focus:border-primary"
                placeholder="Tag, Enter"
              />
              <button type="button" onClick={addEditTag} className="rounded-lg border border-stone-600/60 bg-stone-700 px-3 py-2 text-sm font-medium text-stone-100 transition-colors hover:bg-stone-600">
                Hinzufügen
              </button>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 pt-4">
              <button type="button" onClick={closeEdit} className="rounded-lg px-4 py-2 text-sm text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-200">
                Abbrechen
              </button>
              <AppCtaButton
                type="button"
                onClick={() => void saveEdit()}
                disabled={!editTitle.trim() || !editBody.trim() || savingEdit}
              >
                {savingEdit ? 'Speichern …' : 'Speichern'}
              </AppCtaButton>
            </div>
          </div>
        </div>
      ) : null}
    </StandardPageContainer>
  )
}
