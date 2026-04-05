import { useState, useRef } from 'react'
import { Plus, Trash2, X, ChevronRight, FileText, Check, Upload, Loader2, UserCheck, Pencil } from 'lucide-react'
import { extractTextFromPdf } from '../../utils/pdfParser'
import { buildTechnicalCvContext } from '../../utils/cvTechnicalContext'

// ── CV Summary Display ─────────────────────────────────────
interface CvSections { skills: string[]; experience: string[]; projects: string[]; education: string[] }

function parseCvSummary(text: string): CvSections {
  const out: CvSections = { skills: [], experience: [], projects: [], education: [] }
  let cur: keyof CvSections | null = null
  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue
    if (/^SKILLS?:/i.test(line)) {
      cur = 'skills'
      const content = line.replace(/^SKILLS?:\s*/i, '')
      if (content) out.skills = content.split(/[,;|]+/).map(s => s.trim()).filter(Boolean)
      continue
    }
    if (/^(EXPERIENCE?|ERFAHRUNG|BERUF):/i.test(line)) { cur = 'experience'; continue }
    if (/^(PROJECTS?|PROJEKTE?):/i.test(line))          { cur = 'projects';   continue }
    if (/^(EDUCATION|AUSBILDUNG|STUDIUM):/i.test(line)) { cur = 'education';  continue }
    const clean = line.replace(/^[-•*]\s*/, '')
    if (cur === 'skills')     out.skills.push(...clean.split(/[,;|]+/).map(s => s.trim()).filter(Boolean))
    else if (cur)             out[cur].push(clean)
  }
  out.skills = [...new Set(out.skills)]
  return out
}

function CvSummaryDisplay({ text, onEdit }: { text: string; onEdit: () => void }) {
  const sec = parseCvSummary(text)
  const hasSections = sec.skills.length || sec.experience.length || sec.projects.length || sec.education.length

  if (!hasSections) {
    // Fallback: raw text preview
    return (
      <div className="border border-slate-200 rounded-lg bg-white p-2.5">
        <p className="text-[10px] text-slate-500 whitespace-pre-wrap leading-relaxed line-clamp-6">{text}</p>
        <button onClick={onEdit} className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-500 hover:text-indigo-700">
          <Pencil size={9} /> Bearbeiten
        </button>
      </div>
    )
  }

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white text-[10px]">
      {sec.skills.length > 0 && (
        <div className="px-2.5 py-2 border-b border-slate-100">
          <p className="font-bold uppercase tracking-wider text-indigo-500 mb-1.5" style={{ fontSize: '9px' }}>Skills & Tools</p>
          <div className="flex flex-wrap gap-1">
            {sec.skills.slice(0, 20).map((s, i) => (
              <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded px-1.5 py-0.5 font-medium">{s}</span>
            ))}
          </div>
        </div>
      )}
      {sec.experience.length > 0 && (
        <div className="px-2.5 py-2 border-b border-slate-100">
          <p className="font-bold uppercase tracking-wider text-blue-500 mb-1" style={{ fontSize: '9px' }}>Erfahrung</p>
          {sec.experience.slice(0, 4).map((e, i) => <p key={i} className="text-slate-700 leading-snug mb-0.5">• {e}</p>)}
        </div>
      )}
      {sec.projects.length > 0 && (
        <div className="px-2.5 py-2 border-b border-slate-100">
          <p className="font-bold uppercase tracking-wider text-emerald-600 mb-1" style={{ fontSize: '9px' }}>Projekte</p>
          {sec.projects.slice(0, 4).map((p, i) => <p key={i} className="text-slate-700 leading-snug mb-0.5">• {p}</p>)}
        </div>
      )}
      {sec.education.length > 0 && (
        <div className="px-2.5 py-2">
          <p className="font-bold uppercase tracking-wider text-amber-600 mb-1" style={{ fontSize: '9px' }}>Ausbildung</p>
          {sec.education.slice(0, 2).map((e, i) => <p key={i} className="text-slate-700 leading-snug mb-0.5">• {e}</p>)}
        </div>
      )}
      <button
        onClick={onEdit}
        className="flex items-center justify-center gap-1 w-full py-1.5 text-[10px] text-slate-400 hover:text-indigo-600 border-t border-slate-100 transition-colors"
      >
        <Pencil size={9} /> Bearbeiten
      </button>
    </div>
  )
}
import type { ChatSession, ToolType } from '../../types'
import { PROGRAMMING_LANGUAGES, NATIVE_LANGS, TARGET_LANGS, INTERVIEW_LANGS } from '../../types'

const TOOL_BADGE: Record<ToolType, string | null> = {
  general:     null,
  jobanalyzer: '💼',
  language:    '🌍',
  programming: '💻',
  interview:   '🎤',
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
  nativeLangCode: string
  targetLangCode: string
  onNativeLangChange: (v: string) => void
  onTargetLangChange: (v: string) => void
  // Programming panel
  showProgPanel: boolean
  progLang: string
  onProgLangChange: (v: string) => void
  // Interview panel
  showInterviewPanel: boolean
  interviewLang: string
  onInterviewLangChange: (v: string) => void
  cvText: string
  onCvChange: (v: string) => void
  cvAlias: string
  onCvAliasChange: (v: string) => void
}


export default function ChatSidebar({
  sessions, activeSessionId, currentToolType,
  isOpen, onOpen, onClose,
  onSelect, onNew, onDelete, onClear,
  showLLPanel, languageLearningMode,
  nativeLangCode, targetLangCode, onNativeLangChange, onTargetLangChange,
  showProgPanel, progLang, onProgLangChange,
  showInterviewPanel, interviewLang, onInterviewLangChange,
  cvText, onCvChange, cvAlias, onCvAliasChange,
}: Props) {
  const [cvDraft, setCvDraft] = useState(cvText)
  const [aliasDraft, setAliasDraft] = useState(cvAlias)
  const [cvSaved, setCvSaved] = useState(false)
  const [cvEditing, setCvEditing] = useState(!cvText.trim())
  const [pdfParsing, setPdfParsing] = useState(false)
  const [pdfParseStep, setPdfParseStep] = useState<'reading' | 'analysing' | null>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [pdfFileName, setPdfFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCvSave = () => {
    onCvChange(cvDraft)
    onCvAliasChange(aliasDraft.trim())
    setCvSaved(true)
    setCvEditing(false)
    setTimeout(() => setCvSaved(false), 2000)
  }

  const handleCvClear = () => {
    setCvDraft('')
    setAliasDraft('')
    setPdfFileName(null)
    setPdfError(null)
    setCvEditing(true)
    onCvChange('')
    onCvAliasChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfError(null)
    setPdfParsing(true)
    setPdfParseStep('reading')
    setPdfFileName(file.name)
    try {
      // Step 1: extract raw text from PDF in browser
      const rawText = await extractTextFromPdf(file)
      if (!rawText.trim()) {
        setPdfError('Kein lesbarer Text gefunden. Bitte ein text-basiertes PDF verwenden (kein gescanntes Bild).')
        setPdfFileName(null)
        return
      }

      // Step 2: local profiling only (no CV data sent to API)
      setPdfParseStep('analysing')
      const summary = buildTechnicalCvContext(rawText)
      setCvDraft(summary.slice(0, 2000))
      setCvEditing(true) // show in edit mode so user can review before saving
    } catch {
      setPdfError('PDF konnte nicht verarbeitet werden. Bitte prüfen ob es passwortgeschützt ist.')
      setPdfFileName(null)
    } finally {
      setPdfParsing(false)
      setPdfParseStep(null)
    }
  }

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
          'md:w-64 md:relative md:translate-x-0 md:flex',
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

        {/* Language learning panel */}
        {showLLPanel && (
          <div className="px-3 py-2.5 border-t border-slate-200 flex-shrink-0">
            <label className="flex items-center justify-between cursor-pointer select-none">
              <span className="text-xs font-medium text-slate-700">🌍 Language Learning</span>
              <button
                className={[
                  'relative w-9 h-5 rounded-full cursor-default',
                  languageLearningMode ? 'bg-primary' : 'bg-slate-300',
                ].join(' ')}
                disabled
                aria-label="Language learning mode is always active in this tool"
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

        {/* Programming language panel */}
        {showProgPanel && (
          <div className="px-3 py-2.5 border-t border-slate-200 flex-shrink-0">
            <p className="text-xs font-medium text-slate-700 mb-2">💻 Language / Topic</p>
            <div className="flex flex-col gap-1">
              {PROGRAMMING_LANGUAGES.map(l => (
                <button
                  key={l.id}
                  onClick={() => onProgLangChange(l.id)}
                  className={[
                    'text-left text-xs px-2.5 py-1.5 rounded-md transition-colors font-medium',
                    progLang === l.id
                      ? 'bg-primary text-white'
                      : 'text-slate-600 hover:bg-slate-200',
                  ].join(' ')}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic mt-2">AI will focus on this language and give code examples.</p>
          </div>
        )}

        {/* Interview panel */}
        {showInterviewPanel && (
          <div className="border-t border-slate-200 flex-shrink-0 flex flex-col">
            {/* Language selector */}
            <div className="px-3 pt-2.5 pb-2">
              <p className="text-xs font-medium text-slate-700 mb-2">🎯 Interview Language</p>
              <div className="flex gap-2">
                {INTERVIEW_LANGS.map(l => (
                  <button
                    key={l.code}
                    onClick={() => onInterviewLangChange(l.code)}
                    className={[
                      'flex-1 text-xs py-1.5 rounded-md transition-colors font-medium border',
                      interviewLang === l.code
                        ? 'bg-primary text-white border-primary'
                        : 'text-slate-600 border-slate-200 hover:border-primary hover:text-primary',
                    ].join(' ')}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CV / Lebenslauf upload + paste area */}
            <div className="px-3 pb-3 border-t border-slate-100 pt-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <FileText size={12} className="text-indigo-500" />
                  <p className="text-xs font-medium text-slate-700">Lebenslauf / CV</p>
                  <span className="text-[9px] text-slate-400 italic">(optional)</span>
                </div>
                {cvText.trim() && (
                  <span className="text-[9px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                    ✓ aktiv
                  </span>
                )}
              </div>

              {/* PDF upload button */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={handlePdfUpload}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={pdfParsing}
                className={[
                  'w-full flex items-center justify-center gap-2 text-xs font-medium py-2 rounded-lg border-2 border-dashed transition-colors',
                  pdfParsing
                    ? 'border-indigo-200 text-indigo-400 cursor-wait'
                    : pdfFileName
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50',
                ].join(' ')}
              >
                {pdfParsing
                  ? <><Loader2 size={13} className="animate-spin" /> {pdfParseStep === 'analysing' ? 'Analysiere lokal…' : 'Lese PDF…'}</>
                  : pdfFileName
                    ? <><Check size={13} /> {pdfFileName.length > 22 ? pdfFileName.slice(0, 22) + '…' : pdfFileName}</>
                    : <><Upload size={13} /> PDF hochladen</>
                }
              </button>

              {/* PDF error */}
              {pdfError && (
                <p className="text-[10px] text-red-500 mt-1 leading-snug">{pdfError}</p>
              )}

              {/* CV summary — view or edit mode */}
              <div className="mt-2">
                {cvDraft.trim() && !cvEditing ? (
                  <CvSummaryDisplay text={cvDraft} onEdit={() => setCvEditing(true)} />
                ) : (
                  <>
                    <p className="text-[10px] text-slate-400 mb-1">
                      {pdfFileName ? 'Lokale technische Zusammenfassung (bearbeitbar):' : 'Profil manuell eingeben:'}
                    </p>
                    <textarea
                      value={cvDraft}
                      onChange={e => setCvDraft(e.target.value)}
                      maxLength={2000}
                      rows={5}
                      placeholder={'SKILLS: React, TypeScript, C#…\nEXPERIENCE: Developer @ Company (2021-2024)\nPROJECTS: App-Name (React, .NET)\nEDUCATION: B.Sc. Informatik'}
                      className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 placeholder-slate-300 resize-none focus:border-indigo-400 outline-none leading-relaxed font-mono"
                    />
                    <span className="text-[10px] text-slate-300">{cvDraft.length}/2000</span>
                  </>
                )}
              </div>

              {/* Alias / Anonymisierung */}
              <div className="mt-2.5 border-t border-slate-100 pt-2.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <UserCheck size={12} className="text-indigo-400" />
                  <p className="text-[11px] font-medium text-slate-700">Alias / Pseudonym</p>
                  <span className="text-[9px] text-slate-400 italic">(optional)</span>
                </div>
                <input
                  type="text"
                  value={aliasDraft}
                  onChange={e => setAliasDraft(e.target.value)}
                  maxLength={40}
                  placeholder="z.B. Max oder Alex"
                  className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 placeholder-slate-300 focus:border-indigo-400 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Wird statt deinem echten Namen im Chat verwendet.
                </p>
              </div>

              {/* Save / Clear */}
              <div className="flex items-center justify-end gap-1.5 mt-2.5">
                {(cvDraft.trim() || cvText.trim()) && (
                  <button
                    onClick={handleCvClear}
                    className="text-[10px] text-slate-400 hover:text-red-500 transition-colors px-2 py-0.5 rounded"
                  >
                    Alles löschen
                  </button>
                )}
                <button
                  onClick={handleCvSave}
                  disabled={(cvDraft === cvText && aliasDraft.trim() === cvAlias) || pdfParsing}
                  className={[
                    'flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-md transition-all',
                    cvSaved
                      ? 'bg-emerald-100 text-emerald-700'
                      : (cvDraft !== cvText || aliasDraft.trim() !== cvAlias) && !pdfParsing
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-slate-100 text-slate-400 cursor-default',
                  ].join(' ')}
                >
                  {cvSaved ? <><Check size={10} /> Gespeichert</> : 'Speichern'}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 italic mt-1.5 leading-snug">
                🔒 PDF-Auslesen und Profilbildung laufen lokal im Browser. Sensible Angaben werden bestmoeglich reduziert.
              </p>
            </div>
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

