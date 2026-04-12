import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { Square, Volume2, VolumeX } from 'lucide-react'
import { fetchTtsAudio } from '../../api/client'
import type { LearningData } from '../../types'
import StreamingTextCursor from './StreamingTextCursor'

interface Props {
  data: LearningData
  targetLang: string
  nativeLang: string
  targetLangCode: string
  timestamp: string
  /**
   * Optional audio fetch override. When provided, replaces the default
   * authenticated backend TTS call. Used by the public landing-page demo
   * to call /api/speech/demo-tts without a token.
   */
  fetchAudio?: (text: string, langCode: string) => Promise<Blob | null>
  showStreamCursor?: boolean
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

export default function LearningResponse({
  data,
  targetLang,
  nativeLang,
  targetLangCode,
  timestamp,
  fetchAudio,
  showStreamCursor = false,
}: Props) {
  const time = new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const { getToken } = useAuth()
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  // For browser TTS fallback
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])

  const stopAndCleanup = useCallback(() => {
    // Stop backend audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    // Stop browser TTS
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel()
    }
    uttRef.current = null
    setIsPlaying(false)
  }, [])

  useEffect(() => () => { stopAndCleanup() }, [stopAndCleanup])

  // Pre-load browser voices on mount
  useEffect(() => {
    if (!window.speechSynthesis) return
    const syncVoices = () => { voicesRef.current = window.speechSynthesis.getVoices() }
    syncVoices()
    window.speechSynthesis.addEventListener('voiceschanged', syncVoices)
    return () => window.speechSynthesis.removeEventListener('voiceschanged', syncVoices)
  }, [])

  /** Fallback: browser Web Speech API */
  const speakWithBrowser = useCallback((text: string) => {
    if (!window.speechSynthesis) {
      setAudioError('Keine Sprachausgabe verfügbar')
      window.setTimeout(() => setAudioError(null), 3000)
      setIsPlaying(false)
      return
    }
    const langTag = SPEECH_LANG_MAP[targetLangCode] ?? targetLangCode
    window.speechSynthesis.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = langTag
    utt.rate = 0.85
    utt.pitch = 1.0
    const best = pickBestVoice(voicesRef.current, langTag)
    if (best) utt.voice = best
    utt.onend = () => { uttRef.current = null; setIsPlaying(false) }
    utt.onerror = () => {
      uttRef.current = null
      setIsPlaying(false)
      setAudioError('Sprachausgabe fehlgeschlagen')
      window.setTimeout(() => setAudioError(null), 2500)
    }
    uttRef.current = utt
    window.speechSynthesis.speak(utt)
  }, [targetLangCode])

  const handleSpeak = useCallback(async () => {
    if (isPlaying) { stopAndCleanup(); return }

    const text = data.targetLanguageText.trim()
    if (!text) return

    setIsPlaying(true)
    setAudioError(null)

    // ── Primary: backend TTS (Azure Neural — real human voice) ───────────
    try {
      const blob = fetchAudio
        ? await fetchAudio(text, targetLangCode)
        : await fetchTtsAudio(text, targetLangCode, await getToken())
      if (blob) {
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audioRef.current = audio
        audio.onended = () => {
          URL.revokeObjectURL(url)
          audioRef.current = null
          setIsPlaying(false)
        }
        audio.onerror = () => {
          URL.revokeObjectURL(url)
          audioRef.current = null
          speakWithBrowser(text)   // silent fallback to browser TTS
        }
        await audio.play()
        return
      }
    } catch {
      // backend unavailable — fall through to browser TTS silently
    }

    // ── Fallback: browser Web Speech API ──────────────────────────────────
    speakWithBrowser(text)
  }, [isPlaying, data.targetLanguageText, targetLangCode, getToken, fetchAudio, stopAndCleanup, speakWithBrowser])

  return (
    <div className="flex max-w-[520px] animate-slide-up flex-col gap-1.5">
      <div className="learning-card-target group rounded-xl border-l-[3px] border-l-[#D97706] bg-[#FFFBEB] px-4 py-3.5 transition-transform duration-100 hover:translate-x-0.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-[1.2px] text-slate-500">
            {targetLang}
          </span>
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={() => void handleSpeak()}
              title={audioError ?? 'Aussprache anhören'}
              className={[
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm transition-all duration-150',
                'bg-[rgba(180,100,0,0.1)] text-[#D97706] hover:bg-[rgba(180,100,0,0.2)]',
                isPlaying ? 'bg-[#D97706] text-white motion-safe:animate-pulse' : '',
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
          {showStreamCursor ? <StreamingTextCursor /> : null}
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

      {data.learnContext && (
        <div className="rounded-xl border-l-[3px] border-l-sky-400 bg-sky-50/80 px-4 py-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.2px] text-sky-700">
            Kontext
          </div>
          <p className="text-sm leading-relaxed text-slate-700">{data.learnContext}</p>
        </div>
      )}

      {data.learnVariants && (
        <div className="rounded-xl border-l-[3px] border-l-violet-400 bg-violet-50/80 px-4 py-3">
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[1.2px] text-violet-800">
            Varianten
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{data.learnVariants}</p>
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
