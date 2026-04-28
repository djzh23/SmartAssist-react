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

// 4 cycling accent palettes
const ACCENTS = [
  { border: 'border-violet-700/35', header: 'bg-violet-950/40', dot: 'bg-violet-400' },
  { border: 'border-amber-700/35',  header: 'bg-amber-950/40',  dot: 'bg-amber-400'  },
  { border: 'border-sky-700/35',    header: 'bg-sky-950/40',    dot: 'bg-sky-400'    },
  { border: 'border-emerald-700/35',header: 'bg-emerald-950/40',dot: 'bg-emerald-400'},
]

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
      <div className="flex items-center gap-2 py-10 text-sm text-stone-400">
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
        <div className="rounded-2xl border border-dashed border-stone-600/40 bg-stone-900/40 px-5 py-14 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300/70">
            <FolderOpen size={24} aria-hidden />
          </div>
          <p className="text-sm font-semibold text-stone-200">Noch keine Kategorien</p>
          <p className="mt-1 text-xs text-stone-500">
            Lege deine erste Kategorie an — z. B. „Frontend", „SAP" oder „Google".
          </p>
          <button
            type="button"
            onClick={onCreateCategory}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
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
    <div className="space-y-1.5" onDragEnd={endDrag}>
      {categoryError && <ErrorBanner message={categoryError} />}

      {/* Category sections */}
      {sorted.map((cat, idx) => {
        const inCat = resumes.filter(r => getCategoryIdForResume(r.id) === cat.id)
        return (
          <CategorySection
            key={cat.id}
            index={idx}
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
    <div className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-xs text-rose-200">
      {message}
    </div>
  )
}

// ─── Category Section ─────────────────────────────────────────────────────────

interface CategorySectionProps {
  index: number
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
  index,
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
  const [open, setOpen] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(category.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const accent = ACCENTS[index % ACCENTS.length]
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
      draggable={!editing}
      onDragStart={!editing ? onSectionDragStart : undefined}
      onDragOver={onSectionDragOver}
      onDrop={onSectionDrop}
      className={[
        'overflow-hidden rounded-xl border transition-all',
        accent.border,
        isDraggedCategory ? 'opacity-40' : '',
        isDropTarget && !isDraggedCategory ? 'ring-1 ring-inset ring-white/20' : '',
        'bg-stone-900/50',
      ].join(' ')}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className={`flex items-center gap-2 px-3 py-2 ${accent.header}`}>
        {/* Drag grip */}
        <GripVertical
          size={14}
          className="shrink-0 cursor-grab text-stone-600 hover:text-stone-400 active:cursor-grabbing"
          aria-hidden
        />

        {/* Accent dot */}
        <span className={`h-2 w-2 shrink-0 rounded-full ${accent.dot}`} aria-hidden />

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
              className="min-w-0 flex-1 rounded border border-white/20 bg-black/30 px-2 py-0.5 text-sm font-semibold text-white focus:border-primary/60 focus:outline-none"
            />
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); commitRename() }}
              className="rounded p-0.5 text-emerald-400 hover:bg-emerald-900/30"
              title="Bestätigen"
            >
              <Check size={13} aria-hidden />
            </button>
            <button
              type="button"
              onMouseDown={e => { e.preventDefault(); cancelRename() }}
              className="rounded p-0.5 text-stone-500 hover:bg-stone-700/40"
              title="Abbrechen"
            >
              <X size={13} aria-hidden />
            </button>
          </div>
        ) : (
          <>
            {/* Category name */}
            <span className="min-w-0 flex-1 truncate text-sm font-bold text-white">
              {category.name}
            </span>

            {/* Count badge */}
            <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-300">
              {resumes.length}
            </span>

            {/* + Lebenslauf */}
            <button
              type="button"
              onClick={() => onCreateResume()}
              className="flex shrink-0 items-center gap-1 rounded-md bg-violet-700/70 px-2 py-1 text-[11px] font-semibold text-white hover:bg-violet-600 active:bg-violet-700"
            >
              <Plus size={11} aria-hidden />
              Lebenslauf
            </button>

            {/* Rename */}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="shrink-0 rounded p-1 text-stone-600 hover:bg-stone-700/50 hover:text-stone-300"
              title="Kategorie umbenennen"
            >
              <Pencil size={13} aria-hidden />
            </button>

            {/* Delete */}
            <button
              type="button"
              onClick={onDelete}
              className="shrink-0 rounded p-1 text-stone-700 hover:bg-rose-950/50 hover:text-rose-300"
              title="Kategorie löschen"
            >
              <Trash2 size={13} aria-hidden />
            </button>
          </>
        )}

        {/* Collapse toggle */}
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="shrink-0 rounded p-0.5 text-stone-600 hover:text-stone-300"
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
        <div id={`cat-body-${category.id}`} className="px-3 pb-3 pt-2">
          {resumes.length === 0 ? (
            <button
              type="button"
              onClick={onCreateResume}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-700/60 py-5 text-xs text-stone-600 transition-colors hover:border-stone-600 hover:bg-stone-800/30 hover:text-stone-400"
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
  const [open, setOpen] = useState(true)

  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={[
        'overflow-hidden rounded-xl border border-stone-700/35 bg-stone-900/40 transition-all',
        isDropTarget ? 'ring-1 ring-inset ring-white/20' : '',
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-center gap-2 bg-stone-800/40 px-3 py-2">
        <span className="h-2 w-2 shrink-0 rounded-full bg-stone-600" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-bold text-stone-400">Ohne Kategorie</span>
        <span className="shrink-0 rounded bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-stone-500">
          {resumes.length}
        </span>
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="shrink-0 rounded p-0.5 text-stone-600 hover:text-stone-300"
          aria-expanded={open}
          aria-label={open ? 'Einklappen' : 'Ausklappen'}
        >
          {open
            ? <ChevronDown size={14} aria-hidden />
            : <ChevronRight size={14} aria-hidden />}
        </button>
      </div>

      {open && (
        <div className="px-3 pb-3 pt-2">
          {resumes.length === 0 ? (
            <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-stone-700/50 py-5 text-xs text-stone-700">
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
