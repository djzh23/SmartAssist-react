import { GraduationCap, Languages, Lightbulb, Volume2 } from 'lucide-react'
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
    <div className="flex animate-slide-up flex-col gap-2">
      <div className="overflow-hidden rounded-xl border border-blue-200">
        <div className="flex items-center justify-between border-b border-blue-200 bg-blue-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-800">
            <Languages size={12} />
            <span>{targetLang}</span>
          </span>
          <button
            onClick={() => speak(data.targetLanguageText, targetLangCode)}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-200 text-blue-700 transition-colors hover:bg-blue-600 hover:text-white"
            title="Aussprache anhören"
          >
            <Volume2 size={13} />
          </button>
        </div>
        <div className="bg-blue-50 px-3 py-2.5 font-serif text-[15px] font-medium leading-relaxed tracking-[0.2px] text-sky-900">
          {data.targetLanguageText}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-emerald-200">
        <div className="border-b border-emerald-200 bg-emerald-100 px-3 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
            <GraduationCap size={12} />
            <span>{nativeLang}</span>
          </span>
        </div>
        <div className="bg-emerald-50 px-3 py-2.5 text-sm italic leading-relaxed text-slate-600">
          {data.nativeLanguageText}
        </div>
      </div>

      {data.learnTip && (
        <div className="overflow-hidden rounded-xl border border-amber-200">
          <div className="border-b border-amber-200 bg-amber-100 px-3 py-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              <Lightbulb size={12} />
              <span>Lernhinweis</span>
            </span>
          </div>
          <div className="bg-amber-50 px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-amber-900">
            {data.learnTip}
          </div>
        </div>
      )}

      <span className="pl-1 text-[11px] text-slate-400">{time}</span>
    </div>
  )
}
