import { ChevronRight, Plus, Trash2, X } from 'lucide-react'
import type { ChatSession, ToolType } from '../../types'
import { NATIVE_LANGS, PROGRAMMING_LANGUAGES, TARGET_LANGS } from '../../types'

const TOOL_BADGE: Record<ToolType, string | null> = {
  general: null,
  jobanalyzer: 'JA',
  language: 'LL',
  programming: 'DEV',
  interview: 'INT',
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
  onOpen,
  onClose,
  onSelect,
  onNew,
  onDelete,
  onClear,
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
  return (
    <>
      {!isOpen && (
        <button
          onClick={onOpen}
          className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:border-primary hover:text-primary md:hidden"
          title="Chats öffnen"
        >
          <ChevronRight size={16} />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 animate-fade-in md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'flex flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-all duration-200',
          'md:relative md:flex md:w-64 md:translate-x-0',
          isOpen
            ? 'fixed inset-y-0 left-0 z-20 flex w-64 animate-slide-in'
            : 'hidden',
        ].join(' ')}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-3 pb-1 pt-3">
          <button
            onClick={onNew}
            className="flex flex-1 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={15} />
            Neuer Chat
          </button>

          <button
            onClick={onClose}
            className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-600 md:hidden"
            title="Schließen"
          >
            <X size={16} />
          </button>
        </div>

        {showLLPanel && (
          <div className="flex-shrink-0 border-t border-slate-200 px-3 py-2.5">
            <label className="flex cursor-pointer select-none items-center justify-between">
              <span className="text-xs font-medium text-slate-700">Sprachlernen</span>
              <button
                className={[
                  'relative h-5 w-9 cursor-default rounded-full',
                  languageLearningMode ? 'bg-primary' : 'bg-slate-300',
                ].join(' ')}
                disabled
                aria-label="Sprachlernen ist in diesem Tool immer aktiv"
              >
                <span
                  className={[
                    'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
                    languageLearningMode ? 'translate-x-4' : 'translate-x-0.5',
                  ].join(' ')}
                />
              </button>
            </label>

            {languageLearningMode && (
              <div className="mt-2 flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ich spreche</label>
                <select
                  value={nativeLangCode}
                  onChange={e => onNativeLangChange(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                >
                  {NATIVE_LANGS.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                </select>

                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ich lerne</label>
                <select
                  value={targetLangCode}
                  onChange={e => onTargetLangChange(e.target.value)}
                  className="w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-primary"
                >
                  {TARGET_LANGS.map(lang => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                </select>
              </div>
            )}
          </div>
        )}

        {showProgPanel && (
          <div className="flex-shrink-0 border-t border-slate-200 px-3 py-2.5">
            <p className="mb-2 text-xs font-medium text-slate-700">Sprache oder Thema</p>
            <div className="flex flex-col gap-1">
              {PROGRAMMING_LANGUAGES.map(lang => (
                <button
                  key={lang.id}
                  onClick={() => onProgLangChange(lang.id)}
                  className={[
                    'rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors',
                    progLang === lang.id
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {showInterviewPanel && (
          <div className="flex-shrink-0 border-t border-slate-200 px-3 py-2.5">
            <p className="text-xs font-medium text-slate-700">Interview Setup</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Starte einen neuen Chat und hinterlege dort Sprache, Alias, Lebenslauf und Stellenziel.
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {sessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <span className="text-xl font-semibold opacity-40">{TOOL_BADGE[currentToolType] ?? 'CHAT'}</span>
              <p className="px-6 text-center text-xs">Noch keine Konversationen</p>
            </div>
          ) : (
            <ul className="px-2">
              {sessions.map(session => {
                const badge = TOOL_BADGE[session.toolType]
                const preview = session.messages.find(msg => msg.isUser)?.text ?? 'Neue Konversation'
                const time = new Date(session.messages[session.messages.length - 1]?.timestamp ?? session.createdAt)
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const isActive = session.id === activeSessionId

                return (
                  <li
                    key={session.id}
                    className={[
                      'group mb-0.5 flex cursor-pointer items-center gap-1.5 rounded-lg border-l-2 px-2.5 py-2 transition-colors',
                      isActive
                        ? 'border-primary bg-primary-light'
                        : 'border-transparent hover:bg-slate-100',
                    ].join(' ')}
                    onClick={() => {
                      onSelect(session.id)
                      onClose()
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[12.5px] ${isActive ? 'font-medium text-primary' : 'text-slate-700'}`}>
                        {badge && <span className="mr-1">[{badge}]</span>}
                        {preview.length > 30 ? `${preview.slice(0, 30)}...` : preview}
                      </p>
                      <p className="text-[10.5px] text-slate-400">{time}</p>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(session.id)
                      }}
                      className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
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
            className="flex w-full flex-shrink-0 items-center justify-center gap-1.5 border-t border-slate-200 py-2.5 text-xs text-slate-400 transition-colors hover:text-red-500"
          >
            <Trash2 size={12} />
            Verlauf löschen
          </button>
        )}
      </aside>
    </>
  )
}
