import { Briefcase, Code2, Globe2, MessageCircle, Plus, Target, Trash2, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ChatSession, ToolType } from '../../types'
import { NATIVE_LANGS, PROGRAMMING_LANGUAGES, TARGET_LANGS } from '../../types'

const TOOL_ICON: Record<ToolType, LucideIcon> = {
  general:     MessageCircle,
  jobanalyzer: Briefcase,
  language:    Globe2,
  programming: Code2,
  interview:   Target,
}


const TOOL_BADGE: Record<ToolType, string> = {
  general: 'CHAT',
  jobanalyzer: 'JOB',
  language: 'LANG',
  programming: 'CODE',
  interview: 'INTV',
}

// 8 distinct color themes for session tabs
const SESSION_THEMES = [
  { bg: 'bg-amber-50',  border: 'border-l-amber-500', icon: 'text-amber-600',  dot: 'bg-amber-400',  shape1: 'bg-amber-200/50',  shape2: 'border-amber-300/60' },
  { bg: 'bg-amber-50',    border: 'border-l-amber-400',   icon: 'text-amber-600',    dot: 'bg-amber-400',    shape1: 'bg-amber-100/60',    shape2: 'border-amber-200/60' },
  { bg: 'bg-emerald-50', border: 'border-l-emerald-400',icon: 'text-emerald-600', dot: 'bg-emerald-400', shape1: 'bg-emerald-200/50', shape2: 'border-emerald-300/60' },
  { bg: 'bg-amber-50',   border: 'border-l-amber-400',  icon: 'text-amber-600',   dot: 'bg-amber-400',   shape1: 'bg-amber-200/50',   shape2: 'border-amber-300/60' },
  { bg: 'bg-rose-50',    border: 'border-l-rose-400',   icon: 'text-rose-500',    dot: 'bg-rose-400',    shape1: 'bg-rose-200/50',    shape2: 'border-rose-300/60' },
  { bg: 'bg-blue-50',    border: 'border-l-blue-400',   icon: 'text-blue-500',    dot: 'bg-blue-400',    shape1: 'bg-blue-200/50',    shape2: 'border-blue-300/60' },
  { bg: 'bg-orange-50',  border: 'border-l-orange-400', icon: 'text-orange-500',  dot: 'bg-orange-400',  shape1: 'bg-orange-200/50',  shape2: 'border-orange-300/60' },
  { bg: 'bg-teal-50',    border: 'border-l-teal-400',   icon: 'text-teal-600',    dot: 'bg-teal-400',    shape1: 'bg-teal-200/50',    shape2: 'border-teal-300/60' },
] as const

// Geometric shape variants — cycles through for visual variety
const SHAPES = [
  { type: 'circle',  cls: 'rounded-full' },
  { type: 'square',  cls: 'rounded-md rotate-12' },
  { type: 'diamond', cls: 'rounded-md rotate-45' },
  { type: 'squircle',cls: 'rounded-2xl -rotate-6' },
] as const

function getTheme(index: number) {
  return SESSION_THEMES[index % SESSION_THEMES.length]
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
      {isOpen && (
        <div
          className="fixed inset-x-0 top-11 bottom-0 z-10 bg-black/30 animate-fade-in md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'flex flex-col overflow-hidden border-r border-slate-200 bg-slate-50 transition-all duration-200',
          'md:relative md:flex md:w-64 md:translate-x-0',
          isOpen
            ? 'fixed top-11 bottom-0 left-0 z-20 flex w-64 animate-slide-in'
            : 'hidden',
        ].join(' ')}
      >
        <div className="flex flex-shrink-0 items-center justify-between px-3 pb-1 pt-3">
          <button
            onClick={onNew}
            className="flex flex-1 items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={15} />
            Neues Gespräch
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
            <div className="mb-2.5 flex items-center justify-between rounded-lg border border-cyan-200 bg-amber-50 px-2.5 py-2">
              <span className="text-xs font-semibold text-slate-700">Sprachlernen</span>
              <span className="inline-flex items-center rounded-full border border-amber-300 bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                {languageLearningMode ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>

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
              Der Kontextdialog erscheint automatisch zu Beginn. Dort kannst du Stelle und Lebenslauf hinterlegen.
            </p>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto py-1">
          {sessions.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-10 text-slate-400">
              <span className="text-xl font-semibold opacity-40">{TOOL_BADGE[currentToolType] ?? 'CHAT'}</span>
              <p className="px-6 text-center text-xs">Noch keine Gespräche. Starte einen neuen Chat!</p>
            </div>
          ) : (
            <ul className="px-2">
              {sessions.map((session, idx) => {
                const preview = session.messages.find(msg => msg.isUser)?.text ?? 'Neue Konversation'
                const time = new Date(session.messages[session.messages.length - 1]?.timestamp ?? session.createdAt)
                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const isActive = session.id === activeSessionId

                const Icon = TOOL_ICON[session.toolType]
                const theme = getTheme(idx)
                const shape = getShape(idx)

                return (
                  <li
                    key={session.id}
                    className={[
                      'group relative mb-1 flex cursor-pointer items-center gap-2 overflow-hidden rounded-xl border-l-[3px] px-2.5 py-2.5 transition-all duration-150',
                      isActive
                        ? `${theme.border} ${theme.bg} shadow-sm`
                        : `border-transparent hover:${theme.bg} hover:border-l-slate-300`,
                    ].join(' ')}
                    onClick={() => {
                      onSelect(session.id)
                      onClose()
                    }}
                  >
                    {/* Decorative geometric shapes in tab background */}
                    <div className={`pointer-events-none absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 translate-x-2 opacity-60 ${theme.shape1} ${shape.cls}`} />
                    <div className={`pointer-events-none absolute right-5 top-0.5 h-5 w-5 border ${theme.shape2} ${SHAPES[(idx + 2) % SHAPES.length].cls} opacity-50`} />

                    {/* Colored icon dot */}
                    <div className={`relative flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg ${isActive ? theme.bg : 'bg-white/70'} border border-white shadow-sm`}>
                      <Icon size={12} className={theme.icon} />
                    </div>

                    <div className="relative min-w-0 flex-1">
                      <p className={`truncate text-[12px] font-medium ${isActive ? 'text-slate-800' : 'text-slate-600'}`}>
                        {preview.length > 28 ? `${preview.slice(0, 28)}…` : preview}
                      </p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${theme.dot} opacity-70`} />
                        <p className="text-[10px] text-slate-400">{time}</p>
                      </div>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation()
                        onDelete(session.id)
                      }}
                      className="relative flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-slate-400 opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-red-500"
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

