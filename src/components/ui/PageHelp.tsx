import { useState, type ReactNode } from 'react'
import { HelpCircle, X } from 'lucide-react'

export interface PageHelpTab {
  id: string
  label: string
  content: ReactNode
}

interface Props {
  tabs: PageHelpTab[]
  title?: string
  /** Extra class for the trigger button */
  className?: string
}

/**
 * Reusable "?" help button that opens a tabbed modal.
 * Drop it into any page header.
 */
export default function PageHelp({ tabs, title = 'Hilfe', className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? '')

  if (tabs.length === 0) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          'rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-700/60 hover:text-stone-200',
          className,
        ].join(' ')}
        aria-label="Hilfe & Hinweise"
      >
        <HelpCircle size={17} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-2xl border border-stone-300/40 bg-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
              <h2 className="text-base font-semibold text-stone-900">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
                aria-label="Schließen"
              >
                <X size={18} />
              </button>
            </div>

            {/* Tabs (only if > 1) */}
            {tabs.length > 1 && (
              <div className="flex gap-1 border-b border-stone-200 px-4 pt-3">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      'rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
                      activeTab === tab.id
                        ? 'border-b-2 border-violet-600 text-violet-700'
                        : 'text-stone-500 hover:text-stone-900',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="max-h-[62vh] overflow-y-auto px-5 py-5 text-sm text-stone-700 leading-relaxed">
              {tabs.find(t => t.id === activeTab)?.content}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
