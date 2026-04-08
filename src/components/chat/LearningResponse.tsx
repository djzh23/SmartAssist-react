import { useCallback, useEffect, useRef, useState } from 'react'
import { Square, Volume2, VolumeX } from 'lucide-react'
import type { LearningData } from '../../types'

interface Props {
  data: LearningData
  targetLang: string
  nativeLang: string
  targetLangCode: string
  timestamp: string
}

/** Best BCP-47 tag per language code */
const SPEECH_LANG_MAP: Record<string, string> = {
  de: 'de-DE',
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  it: 'it-IT',
  ar: 'ar-SA',
  pt: 'pt-PT',
}

/**
 * Pick the highest-quality available voice for a given BCP-47 language tag.
 * Priority: Google neural > Microsoft Online/Natural > any network voice > local voice.
 */
function pickBestVoice(langTag: string): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices()
  if (!voices.length) return null

  const base = langTag.split('-')[0].toLowerCase()
  const candidates = voices.filter(v => v.lang.toLowerCase().startsWith(base))
  if (!candidates.length) return null

  const rank = (v: SpeechSynthesisVoice): number => {
    if (/google/i.test(v.name)) return 4
    if (/microsoft.*(natural|online)/i.test(v.name)) return 3
    if (!v.localService) return 2   // any online/network voice
    return 1
  }

  return [...candidates].sort((a, b) => rank(b) - rank(a))[0]
}

export default function LearningResponse({ data, targetLang, nativeLang, targetLangCode, timestamp }: Props) {
  const time = new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null)

  const stopAndCleanup = useCallback(() => {
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel()
    }
    uttRef.current = null
    setIsPlaying(false)
  }, [])

  useEffect(() => () => {
    stopAndCleanup()
  }, [stopAndCleanup])

  // Trigger voice list load on mount — Chrome loads voices asynchronously
  useEffect(() => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.getVoices()
    const handler = () => window.speechSynthesis.getVoices()
    window.speechSynthesis.addEventListener('voiceschanged', handler)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', handler)
  }, [])

  const handleSpeak = () => {
    if (isPlaying) {
      stopAndCleanup()
      return
    }

    const text = data.targetLanguageText.trim()
    if (!text) return

    if (!window.speechSynthesis) {
      setAudioError(true)
      window.setTimeout(() => setAudioError(false), 2000)
      return
    }

    const langTag = SPEECH_LANG_MAP[targetLangCode] ?? targetLangCode
    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = langTag
    utt.rate = 0.85   // slightly slower for language learning
    utt.pitch = 1.0

    const bestVoice = pickBestVoice(langTag)
    if (bestVoice) utt.voice = bestVoice

    utt.onend = () => {
      uttRef.current = null
      setIsPlaying(false)
    }
    utt.onerror = () => {
      uttRef.current = null
      setIsPlaying(false)
      setAudioError(true)
      window.setTimeout(() => setAudioError(false), 2000)
    }
    uttRef.current = utt
    setIsPlaying(true)
    window.speechSynthesis.speak(utt)
  }

  return (
    <div className="flex max-w-[520px] animate-slide-up flex-col gap-1.5">
      <div className="learning-card-target group rounded-xl border-l-[3px] border-l-[#7C3AED] bg-[#F5F3FF] px-4 py-3.5 transition-transform duration-100 hover:translate-x-0.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500">
            {targetLang}
          </span>
          <button
            type="button"
            onClick={handleSpeak}
            title="Aussprache anhören"
            className={[
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm transition-all duration-150',
              'bg-[rgba(124,58,237,0.1)] text-[#7C3AED] hover:bg-[rgba(124,58,237,0.2)]',
              isPlaying ? 'bg-[#7C3AED] text-white motion-safe:animate-pulse' : '',
              audioError ? 'bg-red-100 text-red-600' : '',
            ].join(' ')}
          >
            {isPlaying
              ? <Square size={13} fill="currentColor" />
              : audioError
                ? <VolumeX size={15} />
                : <Volume2 size={15} />}
          </button>
        </div>
        <p className="font-serif text-lg font-medium leading-relaxed text-[#2D1B69]">
          {data.targetLanguageText}
        </p>
      </div>

      {data.nativeLanguageText && (
        <div className="learning-card-translation rounded-xl border-l-[3px] border-l-slate-300 bg-[#F9FAFB] px-4 py-3.5 transition-transform duration-100 hover:translate-x-0.5">
          <div className="mb-2 text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500">
            {nativeLang}
          </div>
          <p className="text-sm italic leading-relaxed text-slate-500">
            {data.nativeLanguageText}
          </p>
        </div>
      )}

      {data.learnTip && (
        <div className="learning-card-tip rounded-xl border-l-[3px] border-l-amber-500 bg-[#FFFBEB] px-3.5 py-2 transition-transform duration-100 hover:translate-x-0.5">
          <p className="font-mono text-[13px] leading-snug text-amber-900">
            <span className="mr-1" aria-hidden>💡</span>
            {data.learnTip}
          </p>
        </div>
      )}

      <span className="pl-1 text-[11px] text-slate-400">{time}</span>
    </div>
  )
}
