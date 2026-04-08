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
  pt: 'pt-BR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
  nl: 'nl-NL',
  pl: 'pl-PL',
  tr: 'tr-TR',
}

/**
 * Pick the highest-quality voice for a given BCP-47 tag from a known list.
 * Must match the language prefix exactly — never return a voice from a different language.
 * Priority: Google neural > Microsoft Natural/Online > any remote voice > local voice.
 */
function pickBestVoice(voices: SpeechSynthesisVoice[], langTag: string): SpeechSynthesisVoice | null {
  if (!voices.length) return null

  const base = langTag.split('-')[0].toLowerCase()
  // Only accept voices whose lang tag starts with the correct language prefix
  const candidates = voices.filter(v => v.lang.toLowerCase().startsWith(base))
  if (!candidates.length) return null

  const rank = (v: SpeechSynthesisVoice): number => {
    const n = v.name.toLowerCase()
    // Google voices are highest quality and correctly tagged
    if (n.includes('google') && v.lang.toLowerCase().startsWith(base)) return 4
    // Microsoft Natural / Online voices
    if (n.includes('microsoft') && /(natural|online)/i.test(v.name)) return 3
    // Any non-local (network) voice in the right language
    if (!v.localService) return 2
    return 1
  }

  return [...candidates].sort((a, b) => rank(b) - rank(a))[0]
}

export default function LearningResponse({ data, targetLang, nativeLang, targetLangCode, timestamp }: Props) {
  const time = new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null)
  // Keep voices in a ref — updated whenever voiceschanged fires
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

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

  // Load voices on mount and keep ref up to date
  useEffect(() => {
    if (!window.speechSynthesis) return
    const syncVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    syncVoices()
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', syncVoices)
  }, [])

  const handleSpeak = () => {
    if (isPlaying) {
      stopAndCleanup()
      return
    }

    const text = data.targetLanguageText.trim()
    if (!text) return

    if (!window.speechSynthesis) {
      setAudioError('Dein Browser unterstützt keine Sprachausgabe.')
      window.setTimeout(() => setAudioError(null), 3000)
      return
    }

    const langTag = SPEECH_LANG_MAP[targetLangCode] ?? null

    // If we don't know the BCP-47 tag for this language, fail loudly
    if (!langTag) {
      setAudioError(`Kein Sprachcode für "${targetLangCode}"`)
      window.setTimeout(() => setAudioError(null), 3000)
      return
    }

    // Ensure we have the latest voices (they may have loaded after mount)
    if (!voicesRef.current.length) {
      voicesRef.current = window.speechSynthesis.getVoices()
    }

    const bestVoice = pickBestVoice(voicesRef.current, langTag)

    // If no matching voice found for this language, warn the user instead of
    // silently falling back to an English voice that would sound wrong
    if (!bestVoice && voicesRef.current.length > 0) {
      setAudioError(`Keine ${targetLang}-Stimme auf diesem Gerät`)
      window.setTimeout(() => setAudioError(null), 3500)
      return
    }

    window.speechSynthesis.cancel()

    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = langTag
    utt.rate = 0.85
    utt.pitch = 1.0
    if (bestVoice) utt.voice = bestVoice

    utt.onend = () => {
      uttRef.current = null
      setIsPlaying(false)
    }
    utt.onerror = () => {
      uttRef.current = null
      setIsPlaying(false)
      setAudioError('Sprachausgabe fehlgeschlagen')
      window.setTimeout(() => setAudioError(null), 2000)
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
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleSpeak}
              title={audioError ?? 'Aussprache anhören'}
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
            {audioError && (
              <span className="max-w-[180px] text-right text-[10px] leading-tight text-red-500">
                {audioError}
              </span>
            )}
          </div>
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
