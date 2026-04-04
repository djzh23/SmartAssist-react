import { Volume2 } from 'lucide-react'
import type { LearningData } from '../../types'
import { speak } from '../../api/client'

interface Props {
  data: LearningData
  targetLang: string
  nativeLang: string
  targetLangCode: string
  timestamp: string
}

export default function LearningResponse({ data, targetLang, nativeLang, targetLangCode, timestamp }: Props) {
  const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="flex flex-col gap-2 animate-slide-up">
      {/* Target language */}
      <div className="rounded-xl overflow-hidden border border-blue-200">
        <div className="flex items-center justify-between px-3 py-2 bg-blue-100 border-b border-blue-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
            🌍 {targetLang}
          </span>
          <button
            onClick={() => speak(data.targetLanguageText, targetLangCode)}
            className="w-7 h-7 rounded-full bg-blue-200 hover:bg-blue-600 hover:text-white text-blue-700 flex items-center justify-center transition-colors"
            title="Listen"
          >
            <Volume2 size={13} />
          </button>
        </div>
        <div className="px-3 py-2.5 bg-blue-50 font-serif text-[15px] text-indigo-900 font-medium leading-relaxed tracking-[0.2px]">
          {data.targetLanguageText}
        </div>
      </div>

      {/* Native language */}
      <div className="rounded-xl overflow-hidden border border-emerald-200">
        <div className="px-3 py-2 bg-emerald-100 border-b border-emerald-200">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            🗣️ {nativeLang}
          </span>
        </div>
        <div className="px-3 py-2.5 bg-emerald-50 text-sm text-slate-600 italic leading-relaxed">
          {data.nativeLanguageText}
        </div>
      </div>

      {/* Tip */}
      {data.learnTip && (
        <div className="rounded-xl overflow-hidden border border-amber-200">
          <div className="px-3 py-2 bg-amber-100 border-b border-amber-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
              💡 Learn
            </span>
          </div>
          <div className="px-3 py-2.5 bg-amber-50 font-mono text-[12.5px] text-amber-900 leading-relaxed">
            {data.learnTip}
          </div>
        </div>
      )}

      <span className="text-[11px] text-slate-400 pl-1">{time}</span>
    </div>
  )
}
