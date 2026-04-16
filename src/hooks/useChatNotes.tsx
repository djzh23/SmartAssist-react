import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useUser } from '@clerk/clerk-react'
import type { ChatSavedNote, ChatSavedNoteSource, ToolType } from '../types'

function storageKey(userId: string): string {
  return `privateprep_chat_notes_${userId}`
}

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase()
}

function uid(): string {
  return crypto.randomUUID()
}

function isToolType(v: string): v is ToolType {
  return v === 'general' || v === 'jobanalyzer' || v === 'language' || v === 'programming' || v === 'interview'
}

function parseNotes(raw: string): ChatSavedNote[] {
  try {
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    const out: ChatSavedNote[] = []
    for (const row of data) {
      if (!row || typeof row !== 'object') continue
      const r = row as Record<string, unknown>
      if (typeof r.id !== 'string' || typeof r.title !== 'string' || typeof r.body !== 'string') continue
      const tags = Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string').map(normalizeTag).filter(Boolean) : []
      let source: ChatSavedNoteSource | undefined
      if (r.source && typeof r.source === 'object') {
        const s = r.source as Record<string, unknown>
        if (
          typeof s.sessionId === 'string'
          && typeof s.messageId === 'string'
          && typeof s.toolType === 'string'
          && isToolType(s.toolType)
        ) {
          source = { toolType: s.toolType, sessionId: s.sessionId, messageId: s.messageId }
        }
      }
      out.push({
        id: r.id,
        createdAt: typeof r.createdAt === 'string' ? r.createdAt : new Date().toISOString(),
        updatedAt: typeof r.updatedAt === 'string' ? r.updatedAt : new Date().toISOString(),
        title: r.title,
        body: r.body,
        tags,
        source,
      })
    }
    return out
  }
  catch (e) {
    console.warn('[useChatNotes] JSON parse failed', e)
    return []
  }
}

export interface AddChatNoteInput {
  title: string
  body: string
  tags: string[]
  source?: ChatSavedNoteSource
}

export interface ChatNotesStore {
  isSignedIn: boolean
  notes: ChatSavedNote[]
  filteredNotes: ChatSavedNote[]
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedTags: string[]
  toggleTagFilter: (tag: string) => void
  clearTagFilters: () => void
  allTags: string[]
  addNote: (input: AddChatNoteInput) => ChatSavedNote
  updateNote: (id: string, patch: Partial<Pick<ChatSavedNote, 'title' | 'body' | 'tags'>>) => void
  deleteNote: (id: string) => void
  hasNoteForMessage: (messageId: string) => boolean
  reload: () => void
}

const ChatNotesContext = createContext<ChatNotesStore | null>(null)

function useChatNotesState(): ChatNotesStore {
  const { user, isSignedIn } = useUser()
  const userId = user?.id ?? null
  const [notes, setNotes] = useState<ChatSavedNote[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  const reload = useCallback(() => {
    if (!userId) {
      setNotes([])
      return
    }
    try {
      const raw = localStorage.getItem(storageKey(userId))
      setNotes(raw ? parseNotes(raw) : [])
    }
    catch (e) {
      console.warn('[useChatNotes] read failed', e)
      setNotes([])
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const addNote = useCallback(
    (input: AddChatNoteInput): ChatSavedNote => {
      const now = new Date().toISOString()
      const tagSet = [...new Set(input.tags.map(normalizeTag).filter(Boolean))]
      const note: ChatSavedNote = {
        id: uid(),
        createdAt: now,
        updatedAt: now,
        title: input.title.trim(),
        body: input.body,
        tags: tagSet,
        source: input.source,
      }
      setNotes(prev => {
        const next = [note, ...prev]
        if (userId) {
          try {
            localStorage.setItem(storageKey(userId), JSON.stringify(next))
          }
          catch (e) {
            console.warn('[useChatNotes] write failed', e)
          }
        }
        return next
      })
      return note
    },
    [userId],
  )

  const updateNote = useCallback(
    (id: string, patch: Partial<Pick<ChatSavedNote, 'title' | 'body' | 'tags'>>) => {
      setNotes(prev => {
        const next = prev.map(n => {
          if (n.id !== id) return n
          const tags = patch.tags !== undefined ? [...new Set(patch.tags.map(normalizeTag).filter(Boolean))] : n.tags
          return {
            ...n,
            title: patch.title !== undefined ? patch.title.trim() : n.title,
            body: patch.body !== undefined ? patch.body : n.body,
            tags,
            updatedAt: new Date().toISOString(),
          }
        })
        if (userId) {
          try {
            localStorage.setItem(storageKey(userId), JSON.stringify(next))
          }
          catch (e) {
            console.warn('[useChatNotes] write failed', e)
          }
        }
        return next
      })
    },
    [userId],
  )

  const deleteNote = useCallback(
    (id: string) => {
      setNotes(prev => {
        const next = prev.filter(n => n.id !== id)
        if (userId) {
          try {
            localStorage.setItem(storageKey(userId), JSON.stringify(next))
          }
          catch (e) {
            console.warn('[useChatNotes] write failed', e)
          }
        }
        return next
      })
    },
    [userId],
  )

  const hasNoteForMessage = useCallback(
    (messageId: string) => notes.some(n => n.source?.messageId === messageId),
    [notes],
  )

  const allTags = useMemo(() => {
    const s = new Set<string>()
    for (const n of notes) for (const t of n.tags) s.add(t)
    return [...s].sort((a, b) => a.localeCompare(b))
  }, [notes])

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return notes.filter(n => {
      if (selectedTags.length > 0) {
        const hasAny = selectedTags.some(t => n.tags.includes(t))
        if (!hasAny) return false
      }
      if (!q) return true
      return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
    })
  }, [notes, searchQuery, selectedTags])

  const toggleTagFilter = useCallback((tag: string) => {
    const t = normalizeTag(tag)
    setSelectedTags(prev => (prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]))
  }, [])

  const clearTagFilters = useCallback(() => setSelectedTags([]), [])

  return useMemo(
    () => ({
      isSignedIn: Boolean(isSignedIn && userId),
      notes,
      filteredNotes,
      searchQuery,
      setSearchQuery,
      selectedTags,
      toggleTagFilter,
      clearTagFilters,
      allTags,
      addNote,
      updateNote,
      deleteNote,
      hasNoteForMessage,
      reload,
    }),
    [
      isSignedIn,
      userId,
      notes,
      filteredNotes,
      searchQuery,
      selectedTags,
      toggleTagFilter,
      clearTagFilters,
      allTags,
      addNote,
      updateNote,
      deleteNote,
      hasNoteForMessage,
      reload,
    ],
  )
}

export function ChatNotesProvider({ children }: { children: ReactNode }) {
  const value = useChatNotesState()
  return <ChatNotesContext.Provider value={value}>{children}</ChatNotesContext.Provider>
}

export function useChatNotes(): ChatNotesStore {
  const ctx = useContext(ChatNotesContext)
  if (!ctx) throw new Error('useChatNotes must be used within ChatNotesProvider')
  return ctx
}
