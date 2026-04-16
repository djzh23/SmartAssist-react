import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import {
  createChatNoteRemote,
  deleteChatNoteRemote,
  fetchChatNotes,
  updateChatNoteRemote,
} from '../api/client'
import type { ChatSavedNote, ChatSavedNoteSource, ToolType } from '../types'

function localStorageKey(userId: string): string {
  return `privateprep_chat_notes_${userId}`
}

function normalizeTag(raw: string): string {
  return raw.trim().toLowerCase()
}

function isToolType(v: string): v is ToolType {
  return v === 'general' || v === 'jobanalyzer' || v === 'language' || v === 'programming' || v === 'interview'
}

/** Parse legacy localStorage export (v1) for one-time migration to the API. */
function parseLocalNotes(raw: string): ChatSavedNote[] {
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
    console.warn('[useChatNotes] legacy JSON parse failed', e)
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
  notesLoading: boolean
  notesError: string | null
  clearNotesError: () => void
  addNote: (input: AddChatNoteInput) => Promise<ChatSavedNote>
  updateNote: (id: string, patch: Partial<Pick<ChatSavedNote, 'title' | 'body' | 'tags'>>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  hasNoteForMessage: (messageId: string) => boolean
  reload: () => Promise<void>
}

const ChatNotesContext = createContext<ChatNotesStore | null>(null)

async function migrateLocalNotesToServer(token: string, userId: string): Promise<boolean> {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(localStorageKey(userId))
  }
  catch (e) {
    console.warn('[useChatNotes] localStorage read for migration failed', e)
    return false
  }
  if (!raw) return false
  const local = parseLocalNotes(raw)
  if (local.length === 0) return false

  for (const n of local) {
    try {
      await createChatNoteRemote(token, {
        title: n.title,
        body: n.body,
        tags: n.tags,
        source: n.source,
      })
    }
    catch (e) {
      console.warn('[useChatNotes] migration item failed', n.id, e)
    }
  }
  try {
    localStorage.removeItem(localStorageKey(userId))
  }
  catch (e) {
    console.warn('[useChatNotes] could not remove legacy key after migration', e)
  }
  return true
}

function useChatNotesState(): ChatNotesStore {
  const { user, isSignedIn } = useUser()
  const { getToken } = useAuth()
  const userId = user?.id ?? null
  const [notes, setNotes] = useState<ChatSavedNote[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)

  const clearNotesError = useCallback(() => setNotesError(null), [])

  const reload = useCallback(async () => {
    if (!userId || !isSignedIn) {
      setNotes([])
      setNotesError(null)
      setNotesLoading(false)
      return
    }
    setNotesLoading(true)
    setNotesError(null)
    try {
      const token = await getToken()
      if (!token) {
        setNotes([])
        setNotesError('Kein gültiges Anmelde-Token.')
        return
      }
      let list = await fetchChatNotes(token)
      if (list.length === 0) {
        const migrated = await migrateLocalNotesToServer(token, userId)
        if (migrated)
          list = await fetchChatNotes(token)
      }
      setNotes(list)
    }
    catch (e) {
      const msg = e instanceof Error ? e.message : 'Notizen konnten nicht geladen werden.'
      setNotesError(msg)
      setNotes([])
    }
    finally {
      setNotesLoading(false)
    }
  }, [userId, isSignedIn, getToken])

  useEffect(() => {
    void reload()
  }, [reload])

  const addNote = useCallback(
    async (input: AddChatNoteInput): Promise<ChatSavedNote> => {
      const token = await getToken()
      if (!token)
        throw new Error('Nicht angemeldet.')
      const tagSet = [...new Set(input.tags.map(normalizeTag).filter(Boolean))]
      const created = await createChatNoteRemote(token, {
        title: input.title.trim(),
        body: input.body,
        tags: tagSet,
        source: input.source,
      })
      setNotes(prev => {
        const withoutDup = prev.filter(n => n.id !== created.id)
        return [created, ...withoutDup]
      })
      return created
    },
    [getToken],
  )

  const updateNote = useCallback(
    async (id: string, patch: Partial<Pick<ChatSavedNote, 'title' | 'body' | 'tags'>>) => {
      const token = await getToken()
      if (!token)
        throw new Error('Nicht angemeldet.')
      const body: { title?: string; body?: string; tags?: string[] } = {}
      if (patch.title !== undefined) body.title = patch.title.trim()
      if (patch.body !== undefined) body.body = patch.body
      if (patch.tags !== undefined) body.tags = [...new Set(patch.tags.map(normalizeTag).filter(Boolean))]
      const updated = await updateChatNoteRemote(token, id, body)
      setNotes(prev => prev.map(n => (n.id === id ? updated : n)))
    },
    [getToken],
  )

  const deleteNote = useCallback(
    async (id: string) => {
      const token = await getToken()
      if (!token)
        throw new Error('Nicht angemeldet.')
      await deleteChatNoteRemote(token, id)
      setNotes(prev => prev.filter(n => n.id !== id))
    },
    [getToken],
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
      notesLoading,
      notesError,
      clearNotesError,
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
      notesLoading,
      notesError,
      clearNotesError,
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
