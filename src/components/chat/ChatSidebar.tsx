import { Plus, Trash2, X, ChevronRight } from 'lucide-react'
import type { ChatSession, ToolType } from '../../types'

const TOOL_BADGE: Record<ToolType, string | null> = {
  general:     null,
  weather:     '🌤️',
  jobanalyzer: '💼',
  jokes:       '😄',
  language:    '🌍',
}

interface Props {
  sessions: ChatSession[]
  activeSessionId: string | null
  currentToolType: ToolType
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
  onClear: () => void
  // Language learning panel
  showLLPanel: boolean
  languageLearningMode: boolean
  onToggleLL: (v: boolean) => void
  nativeLangCode: string
  targetLangCode: string
  onNativeLangChange: (v: string) => void
  onTargetLangChange: (v: string) => void
}

const NATIVE_LANGS  = [{ code: 'de', label: 'German' }, { code: 'en', label: 'English' }, { code: 'fr', label: 'French' }, { code: 'ar', label: 'Arabic' }]
const TARGET_LANGS  = [{ code: 'es', label: 'Spanish' }, { code: 'fr', label: 'French' }, { code: 'en', label: 'English' }, { code: 'it', label: 'Italian' }, { code: 'de', label: 'German' }, { code: 'ar', label: 'Arabic' }, { code: 'pt', label: 'Portuguese' }]

export default function ChatSidebar({
  sessions, activeSessionId, currentToolType,
  isOpen, onOpen, onClose,
  onSelect, onNew, onDelete, onClear,
  showLLPanel, languageLearningMode, onToggleLL,
  nativeLangCode, targetLangCode, onNativeLangChange, onTargetLangChange,
}: Props) {
  return (
    <>
      {/* → open button (mobile, when closed) */}
      {!isOpen && (
        <button
          onClick={onOpen}
          className="md:hidden absolute top-3 left-3 z-10 w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-primary hover:border-primary transition-colors"
          title="Open sessions"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* Overlay (mobile) */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-10 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={[
          'flex flex-col bg-slate-50 border-r border-slate-200 overflow-hidden transition-all duration-200',
          // Desktop: always visible
          'md:w-64 md:relative md:translate-x-0 md:flex',
          // Mobile: drawer
          isOpen
            ? 'fixed inset-y-0 left-0 w-64 z-20 flex animate-slide-in'
            : 'hidden',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-1 flex-shrink-0">
          <button
            onClick={onNew}
            className="flex items-center gap-1.5 flex-1 bg-primary hover:bg-primary-hover text-white rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          >
            <Plus size={15} />
            New Chat
          </button>
          <button
            onClick={onClose}
            className="md:hidden ml-2 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Language learning panel (language tool only) */}
        {showLLPanel && (
          <div className="px-3 py-2.5 border-t border-slate-200 flex-shrink-0">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-medium text-slate-700">🌍 Language Learning</span>
              <button
                onClick={() => onToggleLL(!languageLearningMode)}
                className={[
                  'relative w-9 h-5 rounded-full transition-colors duration-200',
                  languageLearningMode ? 'bg-primary' : 'bg-slate-300',
                ].join(' ')}
                disabled // locked in language mode
              >
                <span
                  className={[
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200',
                    languageLearningMode ? 'translate-x-4' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </label>

            {languageLearningMode && (
              <div className="mt-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">I speak</label>
                <select
                  value={nativeLangCode}
                  onChange={e => onNativeLangChange(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:border-primary outline-none"
                >
                  {NATIVE_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">I want to learn</label>
                <select
                  value={targetLangCode}
                  onChange={e => onTargetLangChange(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-md px-2 py-1.5 bg-white text-slate-700 focus:border-primary outline-none"
                >
                  {TARGET_LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
                <p className="text-[10px] text-slate-400 italic mt-0.5">AI responds in your target language with native support.</p>
              </div>
            )}
          </div>
        )}

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-1 min-h-0">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-10 text-slate-400">
              <span className="text-2xl opacity-30">{TOOL_BADGE[currentToolType] ?? '💬'}</span>
              <p className="text-xs text-center px-6">No conversations yet</p>
            </div>
          ) : (
            <ul className="px-2">
              {sessions.map(session => {
                const badge   = TOOL_BADGE[session.toolType]
                const preview = session.messages.find(m => m.isUser)?.text ?? 'New conversation'
                const time    = new Date(session.messages[session.messages.length - 1]?.timestamp ?? session.createdAt)
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const isActive = session.id === activeSessionId

                return (
                  <li
                    key={session.id}
                    className={[
                      'group flex items-center gap-1.5 px-2.5 py-2 rounded-lg cursor-pointer mb-0.5 transition-colors border-l-2',
                      isActive
                        ? 'bg-primary-light border-primary'
                        : 'border-transparent hover:bg-slate-100',
                    ].join(' ')}
                    onClick={() => { onSelect(session.id); onClose() }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-[12.5px] truncate ${isActive ? 'text-primary font-medium' : 'text-slate-700'}`}>
                        {badge && <span className="mr-1">{badge}</span>}
                        {preview.length > 30 ? preview.slice(0, 30) + '…' : preview}
                      </p>
                      <p className="text-[10.5px] text-slate-400">{time}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(session.id) }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      title="Delete"
                    >
                      <X size={12} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Clear history */}
        {sessions.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center justify-center gap-1.5 w-full py-2.5 text-xs text-slate-400 hover:text-red-500 border-t border-slate-200 transition-colors flex-shrink-0"
          >
            <Trash2 size={12} />
            Clear history
          </button>
        )}
      </aside>
    </>
  )
}
