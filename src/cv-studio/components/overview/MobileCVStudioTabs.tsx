export type CVStudioMobileTab = 'categories' | 'resumes' | 'exports'

interface MobileCVStudioTabsProps {
  activeTab: CVStudioMobileTab
  onChange: (tab: CVStudioMobileTab) => void
}

const TAB_LABELS: Record<CVStudioMobileTab, string> = {
  categories: 'Kategorien',
  resumes: 'Lebensläufe',
  exports: 'PDF-Export',
}

export default function MobileCVStudioTabs({ activeTab, onChange }: MobileCVStudioTabsProps) {
  return (
    <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-[#120e0b]/70 p-1">
      {(Object.keys(TAB_LABELS) as CVStudioMobileTab[]).map(tab => (
        <button
          key={tab}
          type="button"
          onClick={() => onChange(tab)}
          className={[
            'rounded-lg px-2 py-2 text-xs font-semibold transition',
            activeTab === tab
              ? 'bg-amber-500/20 text-amber-300'
              : 'text-stone-300 hover:bg-white/5',
          ].join(' ')}
        >
          {TAB_LABELS[tab]}
        </button>
      ))}
    </div>
  )
}

