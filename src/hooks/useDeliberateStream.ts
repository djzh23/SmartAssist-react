import { useCallback, useEffect, useRef, useState } from 'react'

export interface DeliberateStreamOptions {
  charsPerSecond?: number
  initialDelayMs?: number
  onDisplayUpdate: (text: string) => void
  /** Wird einmal aufgerufen, wenn die gedrosselte Anzeige den vollen Text erreicht hat. */
  onRevealComplete: (finalText: string) => void
}

/**
 * Puffert den vollständigen API-Stream und zeigt ihn erst gedrosselt an (nach Thinking-Phase).
 * Kein Blockieren des Netzwerk-Threads — nur setInterval für die Anzeige.
 */
export function useDeliberateStream(options: DeliberateStreamOptions) {
  const { charsPerSecond = 80, initialDelayMs = 200, onDisplayUpdate, onRevealComplete } = options

  const bufferRef = useRef('')
  const networkCompleteRef = useRef(false)
  const revealStartedRef = useRef(false)
  const revealCompleteFiredRef = useRef(false)
  const displayEndRef = useRef(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isRevealing, setIsRevealing] = useState(false)

  const clearTimers = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (delayRef.current) {
      clearTimeout(delayRef.current)
      delayRef.current = null
    }
  }, [])

  const reset = useCallback(() => {
    clearTimers()
    bufferRef.current = ''
    networkCompleteRef.current = false
    revealStartedRef.current = false
    revealCompleteFiredRef.current = false
    displayEndRef.current = 0
    setIsRevealing(false)
  }, [clearTimers])

  const appendFromNetwork = useCallback((text: string) => {
    if (!text) return
    bufferRef.current += text
  }, [])

  const markNetworkComplete = useCallback(() => {
    networkCompleteRef.current = true
  }, [])

  const tick = useCallback(() => {
    const buf = bufferRef.current
    const len = buf.length
    const end = displayEndRef.current
    const chunk = Math.min(3, Math.max(0, len - end))
    if (chunk > 0) {
      displayEndRef.current = end + chunk
      onDisplayUpdate(buf.slice(0, displayEndRef.current))
    }
    if (networkCompleteRef.current && displayEndRef.current >= len && len >= 0) {
      if (!revealCompleteFiredRef.current) {
        revealCompleteFiredRef.current = true
        clearTimers()
        setIsRevealing(false)
        onRevealComplete(buf)
      }
    }
  }, [clearTimers, onDisplayUpdate, onRevealComplete])

  const startReveal = useCallback(
    (overrideCharsPerSecond?: number) => {
      if (revealStartedRef.current) return
      revealStartedRef.current = true
      setIsRevealing(true)
      const cps = Math.max(40, overrideCharsPerSecond ?? charsPerSecond)
      const msPerChunk = (1000 / cps) * 3

      delayRef.current = setTimeout(() => {
        delayRef.current = null
        intervalRef.current = setInterval(() => {
          tick()
        }, msPerChunk)
        tick()
      }, initialDelayMs)
    },
    [charsPerSecond, initialDelayMs, tick],
  )

  useEffect(() => () => {
    clearTimers()
  }, [clearTimers])

  return {
    appendFromNetwork,
    markNetworkComplete,
    startReveal,
    reset,
    isRevealing,
  }
}
