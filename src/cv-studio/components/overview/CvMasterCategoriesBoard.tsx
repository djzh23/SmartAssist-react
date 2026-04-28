import { useEffect, useRef, useState } from 'react'
import {
  Check, ChevronDown, ChevronRight, FolderOpen,
  GripVertical, Loader2, Pencil, Plus, Trash2, X,
} from 'lucide-react'
import type { CvStudioResumeSummary, CvUserCategoryDto } from '../../../types'
import CvResumeRow from './CvResumeRow'

interface Props {
  resumes: CvStudioResumeSummary[]
  categories: CvUserCategoryDto[]
  loaded: boolean
  categoryError: string | null
  getCategoryIdForResume: (resumeId: string) => string | null
  assignResume: (resumeId: string, categoryId: string | null) => void | Promise<void>
  renameCategory: (id: string, name: string) => void | Promise<void>
  reorderCategories: (orderedIds: string[]) => void | Promise<void>
  onDeleteCategory: (category: CvUserCategoryDto) => void | Promise<void>
  onDeleteResume: (resume: CvStudioResumeSummary) => void | Promise<void>
  onCreateCategory: () => void
  onCreateResumeInCategory: (category: CvUserCategoryDto) => void
}

type DragState =
  | { type: 'category'; id: string }
  | { type: 'resume'; id: string }
  | null


export default function CvMasterCategoriesBoard({
  resumes,
  categories,
  loaded,
  categoryError,
  getCategoryIdForResume,
  assignResume,
  renameCategory,
  reorderCategories,
  onDeleteCategory,
  onDeleteResume,
  onCreateCategory,
  onCreateResumeInCategory,
}: Props) {
  const [dragState, setDragState] = useState<DragState>(null)
  const [dropTargetId, setDropTargetId] = useState<string | 'uncategorized' | null>(null)

  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const uncategorized = resumes.filter(r => !getCategoryIdForResume(r.id))

  // ── DnD handlers ──────────────────────────────────────────────────────────

  function handleCategoryDrop(targetId: string) {
    if (dragState?.type !== 'category' || dragState.id === targetId) return
    const fromIdx = sorted.findIndex(c => c.id === dragState.id)
    const toIdx = sorted.findIndex(c => c.id === targetId)
    if (fromIdx < 0 || toIdx < 0) return
    const reordered = [...sorted]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    void reorderCategories(reordered.map(c => c.id))
  }

  function handleResumeDrop(targetCategoryId: string | null) {
    if (dragState?.type !== 'resume') return
    void assignResume(dragState.id, targetCategoryId)
  }

  function endDrag() {
    setDragState(null)
    setDropTargetId(null)
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (!loaded) {
    return (
      <div className="flex items-center gap-2 py-10 text-sm text-stone-600">
        <Loader2 size={16} className="animate-spin" aria-hidden />
        Kategorien werden geladen…
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (categories.length === 0 && resumes.length === 0) {
    return (
      <div className="space-y-3">
        {categoryError && <ErrorBanner message={categoryError} />}
        <div
          className="rounded-2xl border border-dashed border-stone-400/50 px-5 py-14 text-center"
          style={{ backgroundColor: 'rgb(250, 246, 238)' }}
        >
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FolderOpen size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-stone-900">Noch keine Kategorien</p>
          <p className="mt-1 text-xs text-stone-600">
            Lege deine erste Kategorie an — z. B. „Frontend", „SAP" oder „Google".
          </p>
          <button
            type="button"
            onClick={onCreateCategory}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
          >
            <Plus size={15} aria-hidden />
            Erste Kategorie anlegen
          </button>
        </div>
      </div>
    )
  }

  // ── Main list ──────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto w-full max-w-5xl space-y-1.5" onDragEnd={endDrag}>
      {categoryError && <ErrorBanner message={categoryError} />}

      {/* Category sections */}
      {sorted.map(cat => {
        const inCat = resumes.filter(r => getCategoryIdForResume(r.id) === cat.id)
        return (
          <CategorySection
            key={cat.id}
            category={cat}
            resumes={inCat}
            dragState={dragState}
            isDropTarget={dropTargetId === cat.id}
            onSectionDragStart={e => {
              e.dataTransfer.effectAllowed = 'move'
              setDragState({ type: 'category', id: cat.id })
            }}
            onSectionDragOver={e => {
              e.preventDefault()
              if (dragState?.type === 'category' && dragState.id !== cat.id) setDropTargetId(cat.id)
              else if (dragState?.type === 'resume') setDropTargetId(cat.id)
            }}
            onSectionDrop={e => {
              e.preventDefault()
              if (dragState?.type === 'category') handleCategoryDrop(cat.id)
              else if (dragState?.type === 'resume') handleResumeDrop(cat.id)
              endDrag()
            }}
            onResumeDragStart={(resumeId, e) => {
              e.dataTransfer.effectAllowed = 'move'
              setDragState({ type: 'resume', id: resumeId })
            }}
            onDelete={() => void onDeleteCategory(cat)}
            onRename={name => void renameCategory(cat.id, name)}
            onDeleteResume={r => void onDeleteResume(r)}
            onCreateResume={() => onCreateResumeInCategory(cat)}
          />
        )
      })}

      {/* Uncategorized section */}
      {(uncategorized.length > 0 || dragState?.type === 'resume') && (
        <UncategorizedSection
          resumes={uncategorized}
          dragState={dragState}
          isDropTarget={dropTargetId === 'uncategorized'}
          onDragOver={e => {
            e.preventDefault()
            if (dragState?.type === 'resume') setDropTargetId('uncategorized')
          }}
          onDrop={e => {
            e.preventDefault()
            handleResumeDrop(null)
            endDrag()
          }}
          onResumeDragStart={(resumeId, e) => {
            e.dataTransfer.effectAllowed = 'move'
            setDragState({ type: 'resume', id: resumeId })
          }}
          onDeleteResume={r => void onDeleteResume(r)}
        />
      )}
    </div>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-rose-400/50 bg-rose-50 px-3 py-2 text-xs text-rose-800">
      {message}
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  category: CvUserCategoryDto
  resumes: CvStudioResumeSummary[]
  dragState: DragState
  isDropTarget: boolean
  onSectionDragStart: (e: React.DragEvent<HTMLDivElement>) => void
  onSectionDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onSectionDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onResumeDragStart: (resumeId: string, e: React.DragEvent<HTMLDivElement>) => void
  onDelete: () => void
  onRename: (name: string) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void
  onCreateResume: () => void
}

function CategorySection({
  category,
  resumes,
  dragState,
  isDropTarget,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onResumeDragStart,
  onDelete,
  onRename,
  onDeleteResume,
  onCreateResume,
}: CategorySectionProps) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const isDraggedCategory = dragState?.type === 'category' && dragState.id === category.id

  // Sync editName when server updates the name
  useEffect(() => {
    if (!editing) setEditName(category.name)
  }, [category.name, editing])

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function commitRename() {
    const trimmed = editName.trim()
    if (trimmed && trimmed !== category.name) onRename(trimmed)
    setEditing(false)
  }

  function cancelRename() {
    setEditName(category.name)
    setEditing(false)
  }

  return (
    <div
      onDragOver={onSectionDragOver}
      onDrop={onSectionDrop}
      className={[
        'overflow-hidden rounded-xl border border-stone-400/40 transition-all',
        isDraggedCategory ? 'opacity-40' : '',
        isDropTarget && !isDraggedCategory ? 'ring-2 ring-inset ring-primary/25' : '',
      ].join(' ')}
      style={{ backgroundColor: 'rgb(250, 246, 238)' }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div
        className="flex cursor-pointer items-center gap-2 border-b border-stone-300/70 bg-app-parchmentDeep/70 px-3 py-1.5"
        onClick={() => !editing && setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        {/* Drag grip */}
        <div
          draggable={!editing}
          onDragStart={!editing ? onSectionDragStart : undefined}
          onClick={e => e.stopPropagation()}
          className="shrink-0 cursor-grab rounded p-0.5 active:cursor-grabbing"
          aria-hidden
        >
          <GripVertical
            size={14}
            className="text-stone-400 hover:text-stone-600"
            aria-hidden
          />
        </div>

        {editing ? (
          /* Inline rename input */
          <div className="flex min-w-0 flex-1 items-center gap-1" onClick={e => e.stopPropagation()}>
            <input
              ref={inputRef}
              value={editName}
              onChange={e => setEditName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename()
                if (e.key === 'Escape') cancelRename()
              }}
              onBlur={commitRename}
              maxLength={80}
              className="min-w-0 flex-1 rounded border border-stone-400/60 bg-white px-2 py-0.5 text-sm font-semibold text-stone-900 focus:border-primary/60 focus:outline-none"
            />
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); commitRename() }}
              onClick={e => e.stopPropagation()}
              className="rounded p-0.5 text-emerald-700 hover:bg-emerald-100"
              title="Bestätigen"
            >
              <Check size={13} aria-hidden />
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); cancelRename() }}
              onClick={e => e.stopPropagation()}
              className="rounded p-0.5 text-stone-500 hover:bg-stone-200/80"
              title="Abbrechen"
            >
              <X size={13} aria-hidden />
            </button>
          </div>
        ) : (
          <>
            {/* Category name */}
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-stone-900">
              {category.name}
            </span>

            {/* Count badge */}
            <span className="shrink-0 rounded bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-700">
              {resumes.length}
            </span>

            {/* + Lebenslauf */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onCreateResume() }}
              onMouseDown={e => e.stopPropagation()}
              className="flex shrink-0 items-center gap-1 rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary/20"
            >
              <Plus size={11} aria-hidden />
              Lebenslauf
            </button>

            {/* Rename */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              onMouseDown={e => e.stopPropagation()}
              className="shrink-0 rounded p-1 text-stone-500 hover:bg-stone-200/90 hover:text-stone-800"
              title="Kategorie umbenennen"
            >
              <Pencil size={13} aria-hidden />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onDelete() }}
              onMouseDown={e => e.stopPropagation()}
              className="shrink-0 rounded p-1 text-stone-400 hover:bg-rose-100 hover:text-rose-700"
              title="Kategorie löschen"
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          onMouseDown={e => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 text-stone-500 hover:bg-stone-200/90 hover:text-stone-800"
          aria-expanded={open}
          aria-label={open ? 'Einklappen' : 'Ausklappen'}
        >
          {open
            ? <ChevronDown size={14} aria-hidden />
            : <ChevronRight size={14} aria-hidden />}
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      {open && (
        <div id={`cat-body-${category.id}`} className="px-2.5 pb-2.5 pt-2">
          {resumes.length === 0 ? (
            <button
              type="button"
              onClick={onCreateResume}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-400/50 py-5 text-xs text-stone-500 transition-colors hover:border-stone-400 hover:bg-stone-100/60 hover:text-stone-700"
            >
              <Plus size={13} aria-hidden />
              Ersten Lebenslauf anlegen
            </button>
          ) : (
            <div className="space-y-1">
              {resumes.map(r => (
                <CvResumeRow
                  key={r.id}
                  resume={r}
                  isDragging={dragState?.type === 'resume' && dragState.id === r.id}
                  onDragStart={e => onResumeDragStart(r.id, e)}
                  onDelete={() => onDeleteResume(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Uncategorized Section ────────────────────────────────────────────────────

interface UncategorizedProps {
  resumes: CvStudioResumeSummary[]
  dragState: DragState
  isDropTarget: boolean
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void
  onResumeDragStart: (resumeId: string, e: React.DragEvent<HTMLDivElement>) => void
  onDeleteResume: (resume: CvStudioResumeSummary) => void
}

function UncategorizedSection({
  resumes,
  dragState,
  isDropTarget,
  onDragOver,
  onDrop,
  onResumeDragStart,
  onDeleteResume,
}: UncategorizedProps) {
  const [open, setOpen] = useState(false)

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        'overflow-hidden rounded-xl border border-stone-400/40 transition-all',
        isDropTarget ? 'ring-2 ring-inset ring-primary/25' : '',
      ].join(' ')}
      style={{ backgroundColor: 'rgb(250, 246, 238)' }}
    >
      {/* Header */}
      <div
        className="flex cursor-pointer items-center gap-2 border-b border-stone-300/70 bg-app-parchmentDeep/70 px-3 py-1.5"
        onClick={() => setOpen(o => !o)}
        role="button"
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 text-sm font-bold text-stone-600">Ohne Kategorie</span>
        <span className="shrink-0 rounded bg-stone-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-600">
          {resumes.length}
        </span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          onMouseDown={e => e.stopPropagation()}
          className="shrink-0 rounded p-0.5 text-stone-500 hover:bg-stone-200/90 hover:text-stone-800"
          aria-expanded={open}
          aria-label={open ? 'Einklappen' : 'Ausklappen'}
        >
          {open
            ? <ChevronDown size={14} aria-hidden />
            : <ChevronRight size={14} aria-hidden />}
        </button>
      </div>

      {open && (
        <div className="px-2.5 pb-2.5 pt-2">
          {resumes.length === 0 ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-400/50 py-5 text-xs text-stone-500">
              Lebenslauf hierher ziehen, um Kategorie zu entfernen
            </div>
          ) : (
            <div className="space-y-1">
              {resumes.map(r => (
                <CvResumeRow
                  key={r.id}
                  resume={r}
                  isDragging={dragState?.type === 'resume' && dragState.id === r.id}
                  onDragStart={e => onResumeDragStart(r.id, e)}
                  onDelete={() => onDeleteResume(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
