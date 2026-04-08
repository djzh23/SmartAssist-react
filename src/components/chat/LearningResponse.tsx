import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2, Square, Volume2, VolumeX } from 'lucide-react'
import type { LearningData } from '../../types'
import { fetchSpeechBlob } from '../../api/client'

interface Props {
  data: LearningData
  targetLang: string
  nativeLang: string
  targetLangCode: string
  timestamp: string
}

export default function LearningResponse({ data, targetLang, nativeLang, targetLangCode, timestamp }: Props) {
  const time = new Date(timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  const [isLoadingAudio, setIsLoadingAudio] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioError, setAudioError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)

  const stopAndCleanup = useCallback(() => {
    const a = audioRef.current
    if (a) {
      a.pause()
      audioRef.current = null
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    // Also cancel any browser TTS that might be running
    if (window.speechSynthesis?.speaking) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => () => {
    stopAndCleanup()
  }, [stopAndCleanup])

  const playBlob = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob)
    objectUrlRef.current = url
    const audio = new Audio(url)
    audioRef.current = audio
    audio.onended = () => stopAndCleanup()
    audio.onerror = () => stopAndCleanup()
    setIsPlaying(true)
    audio.play().catch(() => stopAndCleanup())
  }, [stopAndCleanup])

  const handleSpeak = async () => {
    if (isPlaying) {
      stopAndCleanup()
      return
    }

    const text = data.targetLanguageText.trim()
    if (!text) return

    setIsLoadingAudio(true)
    setAudioError(false)
    try {
      const blob = await fetchSpeechBlob(text.slice(0, 1200), targetLangCode)
      stopAndCleanup()
      playBlob(blob)
    } catch {
      // ElevenLabs unavailable — fall back to browser Web Speech API
      stopAndCleanup()
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
        const utt = new SpeechSynthesisUtterance(text)
        utt.lang = targetLangCode
        utt.onend = () => setIsPlaying(false)
        utt.onerror = () => {
          setIsPlaying(false)
          setAudioError(true)
          window.setTimeout(() => setAudioError(false), 2000)
        }
        setIsPlaying(true)
        window.speechSynthesis.speak(utt)
      } else {
        setAudioError(true)
        window.setTimeout(() => setAudioError(false), 2000)
      }
    } finally {
      setIsLoadingAudio(false)
    }
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
            onClick={() => void handleSpeak()}
            disabled={isLoadingAudio}
            title="Aussprache anhören"
            className={[
              'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm transition-all duration-150',
              'bg-[rgba(124,58,237,0.1)] text-[#7C3AED] hover:bg-[rgba(124,58,237,0.2)]',
              isPlaying ? 'bg-[#7C3AED] text-white motion-safe:animate-pulse' : '',
              isLoadingAudio ? 'cursor-wait opacity-60' : '',
              audioError ? 'bg-red-100 text-red-600' : '',
            ].join(' ')}
          >
            {isLoadingAudio
              ? <Loader2 size={15} className="animate-spin" />
              : isPlaying
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
