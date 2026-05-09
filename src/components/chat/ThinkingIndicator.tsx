import { useEffect, useMemo, useRef, useState } from 'react'
import type { ToolType } from '../../types'

export const STREAM_CHARS_PER_SECOND: Record<ToolType, number> = {
  jobanalyzer: 60,
  interview: 70,
  programming: 100,
  language: 80,
  general: 80,
}

const MAX_TOTAL_STEP_MS = 2800

interface ThinkingStep {
  label: string
  durationMs: number
}

function scaleStepDurations(steps: ThinkingStep[]): ThinkingStep[] {
  const sum = steps.reduce((a, s) => a + s.durationMs, 0)
  if (sum <= MAX_TOTAL_STEP_MS) return steps
  const factor = MAX_TOTAL_STEP_MS / sum
  return steps.map(s => ({
    ...s,
    durationMs: Math.max(220, Math.round(s.durationMs * factor)),
  }))
}

type StepFn = (
  includeProfileStep: boolean,
  hasTargetJob: boolean,
  profileStatsLine: string | null,
) => ThinkingStep[]

const STEPS_BY_TOOL: Partial<Record<ToolType, StepFn>> = {
  jobanalyzer: (includeProfileStep, _hasTargetJob, stats) =>
    scaleStepDurations([
      { label: 'Stellenanzeige strukturieren', durationMs: 520 },
      { label: 'Anforderungen und Keywords extrahieren', durationMs: 620 },
      ...(includeProfileStep
        ? [{
            label: stats
              ? `Abgleich mit deinem Profil (${stats})`
              : 'Abgleich mit deinem Profil',
            durationMs: 640,
          }]
        : []),
      { label: 'Lücken und Risiken einordnen', durationMs: 520 },
      { label: 'Empfehlungen formulieren', durationMs: 480 },
    ]),

  interview: (includeProfileStep, _hasTargetJob, stats) =>
    scaleStepDurations([
      { label: 'Stelle und Branche einordnen', durationMs: 480 },
      ...(includeProfileStep
        ? [{
            label: stats
              ? `Profil-Stärken prüfen (${stats})`
              : 'Profil-Stärken und Lücken prüfen',
            durationMs: 560,
          }]
        : []),
      { label: 'Passende Fragen auswählen', durationMs: 580 },
      { label: 'STAR-Struktur vorbereiten', durationMs: 460 },
    ]),

  programming: () =>
    scaleStepDurations([
      { label: 'Code und Kontext lesen', durationMs: 480 },
      { label: 'Lösung entwerfen', durationMs: 620 },
      { label: 'Best Practices abgleichen', durationMs: 420 },
    ]),

  language: (includeProfileStep, _hasTargetJob, stats) =>
    scaleStepDurations([
      { label: 'Übersetzung vorbereiten', durationMs: 420 },
      ...(includeProfileStep
        ? [{
            label: stats
              ? `Berufsvokabular anpassen (${stats})`
              : 'Berufsvokabular anpassen',
            durationMs: 420,
          }]
        : []),
      { label: 'Formulierungen finalisieren', durationMs: 380 },
    ]),

  general: (includeProfileStep, hasTargetJob, stats) =>
    scaleStepDurations([
      { label: 'Frage einordnen', durationMs: 380 },
      ...(includeProfileStep
        ? [{
            label: stats
              ? `Bezug zu deinem Profil (${stats})`
              : 'Bezug zu deinem Karriereprofil',
            durationMs: 420,
          }]
        : []),
      ...(hasTargetJob
        ? [{ label: 'Zielstelle berücksichtigen', durationMs: 360 }]
        : []),
      { label: 'Antwort strukturieren', durationMs: 340 },
    ]),
}

const ACCENT: Record<ToolType, { done: string; active: string; wait: string; ring: string }> = {
  jobanalyzer: {
    done: 'bg-amber-950/45 text-amber-100 border border-amber-800/45',
    active: 'bg-amber-900/55 text-amber-50 border border-amber-600/50 animate-pulse',
    wait: 'bg-stone-900/60 text-stone-500 border border-stone-700/60',
    ring: 'ring-amber-700/35',
  },
  interview: {
    done: 'bg-amber-950/40 text-amber-100 border border-amber-800/40',
    active: 'bg-amber-900/50 text-amber-50 border border-amber-600/45 animate-pulse',
    wait: 'bg-stone-900/60 text-stone-500 border border-stone-700/60',
    ring: 'ring-amber-700/30',
  },
  programming: {
    done: 'bg-stone-900/70 text-stone-200 border border-stone-600/50',
    active: 'bg-stone-800/90 text-stone-100 border border-stone-500/55 animate-pulse',
    wait: 'bg-stone-900/60 text-stone-500 border border-stone-700/60',
    ring: 'ring-stone-600/40',
  },
  language: {
    done: 'bg-stone-900/65 text-amber-100/90 border border-stone-600/45',
    active: 'bg-amber-950/45 text-amber-50 border border-amber-800/40 animate-pulse',
    wait: 'bg-stone-900/60 text-stone-500 border border-stone-700/60',
    ring: 'ring-amber-800/30',
  },
  general: {
    done: 'bg-stone-900/65 text-stone-300 border border-stone-700/55',
    active: 'bg-amber-950/40 text-amber-100 border border-amber-800/45 animate-pulse',
    wait: 'bg-stone-900/60 text-stone-500 border border-stone-700/60',
    ring: 'ring-amber-700/35',
  },
}

export interface ThinkingIndicatorProps {
  toolType: ToolType
  includeProfileStep: boolean
  hasTargetJob: boolean
  /** Kurzzeile z. B. "8 Skills · 2 Erfahrungen" für Vertrauen */
  profileStatsLine: string | null
  onComplete: () => void
}

export function ThinkingIndicator({
  toolType,
  includeProfileStep,
  hasTargetJob,
  profileStatsLine,
  onComplete,
}: ThinkingIndicatorProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const completedRef = useRef(false)
  const accent = ACCENT[toolType] ?? ACCENT.general

  const steps = useMemo(() => {
    const fn = STEPS_BY_TOOL[toolType]
    if (!fn) {
      return STEPS_BY_TOOL.general!(includeProfileStep, hasTargetJob, profileStatsLine)
    }
    return fn(includeProfileStep, hasTargetJob, profileStatsLine)
  }, [toolType, includeProfileStep, hasTargetJob, profileStatsLine])

  useEffect(() => {
    if (stepIndex >= steps.length) {
      if (!completedRef.current) {
        completedRef.current = true
        onComplete()
      }
      return
    }

    const t = window.setTimeout(() => {
      setStepIndex(i => i + 1)
    }, steps[stepIndex].durationMs)

    return () => window.clearTimeout(t)
  }, [stepIndex, steps, onComplete])

  if (stepIndex >= steps.length) return null

  return (
    <div
      className={[
        'flex max-w-sm flex-col gap-1.5 rounded-2xl border border-slate-200 bg-white py-2 pl-2 pr-3 shadow-sm',
        'ring-1',
        accent.ring,
      ].join(' ')}
      aria-live="polite"
      aria-busy="true"
    >
      <p className="mb-0.5 pl-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        Assistent denkt nach
      </p>
      {steps.map((step, i) => {
        const done = i < stepIndex
        const active = i === stepIndex
        const chip = done ? accent.done : active ? accent.active : accent.wait
        return (
          <div key={`${step.label}-${i}`} className="flex items-center gap-2.5">
            <div
              className={[
                'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
                chip,
              ].join(' ')}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={[
                'text-xs leading-snug',
                done ? 'text-slate-400' : '',
                active ? 'font-medium text-slate-800' : '',
                !done && !active ? 'text-slate-300' : '',
              ].join(' ')}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export function shouldSkipThinkingUi(message: string, toolType: ToolType): boolean {
  if (toolType !== 'general') return false
  const t = message.trim()
  if (t.length > 140) return false
  return false
}
