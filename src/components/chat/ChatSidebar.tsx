import { useEffect, useRef, useState } from 'react'
import { Briefcase, Check, Code2, Globe2, GripVertical, Loader2, MessageCircle, Pencil, Plus, Target, Trash2, X } from 'lucide-react'
import AppCtaButton from '../ui/AppCtaButton'
import type { LucideIcon } from 'lucide-react'
import type { ChatSession, ToolType } from '../../types'
import { NATIVE_LANGS, PROGRAMMING_LANGUAGES, TARGET_LANGS } from '../../types'
import { sessionListLabel } from '../../utils/sessionTitle'
import { getChatFeatureColor, hexToRgba } from '../../utils/chatFeatureColors'

const TOOL_ICON: Record<ToolType, LucideIcon> = {
  general:     MessageCircle,
  jobanalyzer: Briefcase,
  language:    Globe2,
  programming: Code2,
  interview:   Target,
}


// Geometric shape variants - cycles through for visual variety
const SHAPES = [
  { type: 'circle',  cls: 'rounded-full' },
  { type: 'square',  cls: 'rounded-md rotate-12' },
  { type: 'diamond', cls: 'rounded-md rotate-45' },
  { type: 'squircle',cls: 'rounded-2xl -rotate-6' },
] as const

function getTheme(tool: ToolType) {
  const color = getChatFeatureColor(tool)
  return {
    color,
    activeBg: hexToRgba(color, 0.14),
    iconBg: hexToRgba(color, 0.1),
    shape1: hexToRgba(color, 0.12),
    shape2: hexToRgba(color, 0.35),
  }
}
function getShape(index: number) {
  return SHAPES[index % SHAPES.length]
}

interface Props {
  sessions: ChatSession[]
  activeSessionId: string | null
  currentToolType: ToolType
  isOpen: boolean
  onOpen?: () => void
  onClose: () => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClear: () => void
  /** Persist new tab title (signed-in: server). */
  onRenameSession?: (id: string, title: string) => void | Promise<void>
  /** Drag-reorder visible sessions (indices in this list). */
  onReorderSessions?: (fromIndex: number, toIndex: number) => void
  /** Per-session streaming (background generation) */
  sessionIsStreaming?: (sessionId: string) => boolean
  showLLPanel: boolean
  languageLearningMode: boolean
  nativeLangCode: string
  targetLangCode: string
  onNativeLangChange: (v: string) => void
  onTargetLangChange: (v: string) => void
  showProgPanel: boolean
  progLang: string
  onProgLangChange: (v: string) => void
  showInterviewPanel: boolean
}

export default function ChatSidebar({
  sessions,
  activeSessionId,
  currentToolType,
  isOpen,
  onClose,
  onSelect,
  onNew,
  onDelete,
  onClear,
  onRenameSession,
  onReorderSessions,
  sessionIsStreaming,
  showLLPanel,
  languageLearningMode,
  nativeLangCode,
  targetLangCode,
  onNativeLangChange,
  onTargetLangChange,
  showProgPanel,
  progLang,
  onProgLangChange,
  showInterviewPanel,
}: Props) {
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [touchDragFrom, setTouchDragFrom] = useState<number | null>(null)
  const [touchDragOver, setTouchDragOver] = useState<number | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)
  const touchPointerIdRef = useRef<number | null>(null)
  const touchMovedRef = useRef(false)
  const suppressNextClickRef = useRef(false)
  const canReorder = Boolean(onReorderSessions) && sessions.length > 1

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingId])

  const beginRename = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onRenameSession) return
    setRenamingId(session.id)
    setRenameDraft(session.title?.trim() || sessionListLabel(session, 200))
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameDraft('')
  }

  const commitRename = async () => {
    if (!renamingId || !onRenameSession) return
    const next = renameDraft.trim()
    if (!next) {
      cancelRename()
      return
    }
    await onRenameSession(renamingId, next)
    cancelRename()
  }

  const resetTouchDrag = () => {
    touchPointerIdRef.current = null
    touchMovedRef.current = false
    setTouchDragFrom(null)
    setTouchDragOver(null)
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-x-0 top-11 bottom-0 z-10 bg-black/30 animate-fade-in md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'flex flex-col overflow-hidden border-r border-stone-600/35 bg-app-muted transition-all duration-200',
          'md:relative md:flex md:w-64 md:translate-x-0',
          isOpen
            ? 'fixed top-11 bottom-0 left-0 z-20 flex w-64 animate-slide-in'
            : 'hidden',
        ].join(' ')}
      >
        <div className="flex flex-shrink-0 items-center justify-between gap-2 border-b border-stone-600/35 px-3 pb-2 pt-2.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
            Gespräche
          </span>
          <AppCtaButton size="sm" onClick={onNew} className="h-8 px-3 py-0 text-xs">
            <Plus size={13} />
            + Neu
          </AppCtaButton>

          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition-colors hover:bg-white/10 hover:text-stone-100 md:hidden"
            title="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {showLLPanel && (
          <div className="flex-shrink-0 border-t border-stone-600/35 px-3 py-2.5">
            <div className="mb-2.5 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-950/35 px-2.5 py-2">
              <span className="text-xs font-semibold text-stone-200">Sprachlernen</span>
              <span className="inline-flex items-center rounded-full border border-amber-500/35 bg-app-raised/90 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                {languageLearningMode ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

            {languageLearningMode && (
              <div className="mt-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ich spreche</label>
                <select
                  value={nativeLangCode}
                  onChange={e => onNativeLangChange(e.target.value)}
                  className="w-full rounded-md border border-stone-600/45 bg-app-raised px-2 py-1.5 text-xs text-stone-200 outline-none focus:border-primary"
                >
                  {NATIVE_LANGS.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                </select>

                <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">Ich lerne</label>
                <select
                  value={targetLangCode}
                  onChange={e => onTargetLangChange(e.target.value)}
                  className="w-full rounded-md border border-stone-600/45 bg-app-raised px-2 py-1.5 text-xs text-stone-200 outline-none focus:border-primary"
                >
                  {TARGET_LANGS.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {showProgPanel && (
          <div className="flex-shrink-0 border-t border-stone-600/35 px-3 py-2.5">
            <p className="mb-2 text-xs font-medium text-stone-200">Sprache oder Thema</p>
            <div className="flex flex-col gap-1">
              {PROGRAMMING_LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => onProgLangChange(lang.id)}
                  className={[
                    'rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                    progLang === lang.id
                      ? 'bg-primary text-white'
                      : 'text-stone-400 hover:bg-white/8 hover:text-stone-100',
                  ].join(' ')}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showInterviewPanel && (
          <div className="flex-shrink-0 border-t border-stone-600/35 px-3 py-2.5">
            <p className="text-xs font-medium text-stone-200">Interview Setup</p>
            <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
              Der Kontextdialog erscheint automatisch zu Beginn. Dort kannst du Stelle und Lebenslauf hinterlegen.
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-1.5">
          {sessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-stone-500">
              <span className="text-xl font-semibold opacity-40">{(currentToolType ?? 'general').toUpperCase()}</span>
              <p className="px-6 text-center text-xs">Noch keine Gespräche. Starte einen neuen Chat!</p>
            </div>
          ) : (
            <ul className="space-y-0.5 px-2">
              {sessions.map((session, idx) => {
                const label = sessionListLabel(session, 30)
                const time = new Date(session.messages[session.messages.length - 1]?.timestamp ?? session.createdAt)
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const isActive = session.id === activeSessionId
                const isStreaming = sessionIsStreaming?.(session.id) ?? false

                const Icon = TOOL_ICON[session.toolType]
                const theme = getTheme(session.toolType)
                const shape = getShape(idx)
                const isDragging = dragFrom === idx
                const isTouchDragging = touchDragFrom === idx
                const htmlDropTarget = dragOverIndex === idx && dragFrom !== null && dragFrom !== idx
                const touchDropTarget = touchDragOver === idx && touchDragFrom !== null && touchDragFrom !== idx
                const isDropTarget = htmlDropTarget || touchDropTarget

                return (
                  <li
                    key={session.id}
                    data-session-index={idx}
                    className={[
                      'group relative flex cursor-pointer items-center overflow-hidden rounded-xl border-l-[3px] py-2 transition-all duration-150',
                      canReorder ? 'gap-1 pl-1 pr-2.5' : 'gap-2 px-2.5',
                      isActive
                        ? 'shadow-sm'
                        : 'border-transparent hover:border-l-stone-400 hover:bg-white/[0.04]',
                      (isDragging || isTouchDragging) ? 'opacity-50' : '',
                      isDropTarget ? 'ring-2 ring-primary/35 ring-offset-1' : '',
                    ].join(' ')}
                    style={{
                      borderLeftColor: isActive ? theme.color : undefined,
                      backgroundColor: isActive ? theme.activeBg : undefined,
                    }}
                    onDragOver={canReorder ? e => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = 'move'
                      setDragOverIndex(idx)
                    } : undefined}
                    onDragLeave={canReorder ? e => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverIndex(null)
                    } : undefined}
                    onDrop={canReorder ? e => {
                      e.preventDefault()
                      const raw = e.dataTransfer.getData('text/plain')
                      const from = parseInt(raw, 10)
                      if (Number.isNaN(from) || !onReorderSessions) return
                      onReorderSessions(from, idx)
                      setDragFrom(null)
                      setDragOverIndex(null)
                    } : undefined}
                    onClick={() => {
                      if (suppressNextClickRef.current) {
                        suppressNextClickRef.current = false
                        return
                      }
                      if (renamingId) return
                      onSelect(session.id)
                      onClose()
                    }}
                  >
                    {canReorder && (
                      <button
                        type="button"
                        draggable
                        onClick={e => e.stopPropagation()}
                        onDragStart={e => {
                          e.stopPropagation()
                          setDragFrom(idx)
                          e.dataTransfer.effectAllowed = 'move'
                          e.dataTransfer.setData('text/plain', String(idx))
                        }}
                        onDragEnd={() => {
                          setDragFrom(null)
                          setDragOverIndex(null)
                        }}
                        onPointerDown={(e) => {
                          if (e.pointerType === 'mouse')
                            return
                          e.stopPropagation()
                          touchPointerIdRef.current = e.pointerId
                          touchMovedRef.current = false
                          setTouchDragFrom(idx)
                          setTouchDragOver(idx)
                          e.currentTarget.setPointerCapture(e.pointerId)
                        }}
                        onPointerMove={(e) => {
                          if (touchPointerIdRef.current !== e.pointerId || touchDragFrom === null)
                            return
                          const el = document.elementFromPoint(e.clientX, e.clientY)
                          const target = el?.closest('[data-session-index]') as HTMLElement | null
                          const raw = target?.dataset.sessionIndex
                          const nextIndex = raw ? Number.parseInt(raw, 10) : NaN
                          if (!Number.isNaN(nextIndex) && nextIndex !== touchDragOver) {
                            touchMovedRef.current = true
                            setTouchDragOver(nextIndex)
                          }
                        }}
                        onPointerUp={(e) => {
                          if (touchPointerIdRef.current !== e.pointerId || touchDragFrom === null)
                            return
                          if (touchMovedRef.current && touchDragOver !== null && touchDragOver !== touchDragFrom && onReorderSessions) {
                            onReorderSessions(touchDragFrom, touchDragOver)
                            suppressNextClickRef.current = true
                          }
                          resetTouchDrag()
                        }}
                        onPointerCancel={() => {
                          resetTouchDrag()
                        }}
                        className="flex h-8 w-6 flex-shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-stone-400 active:cursor-grabbing hover:bg-white/10 hover:text-stone-100"
                        aria-label="Reihenfolge ändern"
                        title="Ziehen zum Sortieren"
                      >
                        <GripVertical size={14} />
                      </button>
                    )}
                    {/* Decorative geometric shapes in tab background */}
                    <div
                      className={`pointer-events-none absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 translate-x-2 opacity-60 ${shape.cls}`}
                      style={{ backgroundColor: theme.shape1 }}
                    />
                    <div
                      className={`pointer-events-none absolute right-5 top-0.5 h-5 w-5 border ${SHAPES[(idx + 2) % SHAPES.length].cls} opacity-50`}
                      style={{ borderColor: theme.shape2 }}
                    />

                    {/* Colored icon dot */}
                    <div
                      className="relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg border border-stone-600/50 bg-stone-800/90 shadow-sm"
                      style={{ backgroundColor: isActive ? theme.iconBg : undefined }}
                    >
                      <Icon size={12} style={{ color: theme.color }} />
                    </div>

                    <div className="relative min-w-0 flex-1">
                      {renamingId === session.id ? (
                        <div className="flex flex-col gap-1" onClick={e => e.stopPropagation()}>
                          <input
                            ref={renameInputRef}
                            value={renameDraft}
                            onChange={e => setRenameDraft(e.target.value)}
                            maxLength={120}
                            className="w-full rounded-md border border-stone-600/45 bg-app-raised px-2 py-1 text-[12px] text-stone-100 outline-none focus:border-primary"
                            aria-label="Tab-Titel bearbeiten"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                void commitRename()
                              }
                              if (e.key === 'Escape') {
                                e.preventDefault()
                                cancelRename()
                              }
                            }}
                          />
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => void commitRename()}
                              className="inline-flex items-center gap-0.5 rounded-md px-2 py-0.5 text-[11px] font-medium text-white transition hover:brightness-110"
                              style={{ backgroundColor: theme.color }}
                            >
                              <Check size={12} aria-hidden />
                              Speichern
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              className="rounded-md border border-stone-600/45 px-2 py-0.5 text-[11px] text-stone-300 hover:bg-white/8"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className={`truncate text-[12px] font-medium ${isActive ? 'text-stone-100' : 'text-stone-300'}`}>
                          {label}
                        </p>
                      )}
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full opacity-70" style={{ backgroundColor: theme.color }} />
                        <p className="text-[10px] text-stone-400">{time}</p>
                        {isStreaming && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-400">
                            <Loader2 size={10} className="animate-spin" />
                            Antwort läuft…
                          </span>
                        )}
                      </div>
                    </div>

                    {onRenameSession && renamingId !== session.id ? (
                      <button
                        type="button"
                        onClick={e => beginRename(session, e)}
                        disabled={isStreaming}
                        className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-stone-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-white/10 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-30"
                        title={isStreaming ? 'Während Antwort nicht umbenennen' : 'Umbenennen'}
                        aria-label="Chat umbenennen"
                      >
                        <Pencil size={12} />
                      </button>
                    ) : null}
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(session.id)
                      }}
                      className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-stone-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-950/55 hover:text-red-300"
                      title="Löschen"
                    >
                      <X size={12} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {sessions.length > 0 && (
          <button
            onClick={onClear}
            className="flex w-full flex-shrink-0 items-center justify-center gap-1.5 border-t border-stone-600/35 py-2.5 text-xs text-stone-500 transition-colors hover:text-red-400"
          >
            <Trash2 size={12} />
            Verlauf löschen
          </button>
        )}
      </aside>
    </>
  )
}

