import type { ToolType } from '../types'

/** Stable accent dot for a tool type (Tailwind bg-*), for nav “Letzte Gespräche”. */
export function toolSessionDotClass(tool: ToolType): string {
  switch (tool) {
    case 'general':
      return 'bg-amber-400'
    case 'jobanalyzer':
      return 'bg-emerald-400'
    case 'language':
      return 'bg-rose-400'
    case 'programming':
      return 'bg-violet-500'
    case 'interview':
      return 'bg-orange-400'
    default:
      return 'bg-slate-400'
  }
}
