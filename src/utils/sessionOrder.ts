import type { ChatSession, ToolType } from '../types'

/**
 * Reorders only sessions for `toolType` inside the global `sessionOrder` array.
 */
export function reorderSessionOrderForTool(
  sessionOrder: string[],
  toolType: ToolType,
  fromIndex: number,
  toIndex: number,
  sessions: Record<string, ChatSession>,
): string[] {
  const slotIndices: number[] = []
  sessionOrder.forEach((id, i) => {
    if (sessions[id]?.toolType === toolType) slotIndices.push(i)
  })

  if (
    fromIndex < 0
    || toIndex < 0
    || fromIndex >= slotIndices.length
    || toIndex >= slotIndices.length
    || fromIndex === toIndex
  ) {
    return sessionOrder
  }

  const visibleIds = slotIndices.map(i => sessionOrder[i])
  const nextVisible = [...visibleIds]
  const [moved] = nextVisible.splice(fromIndex, 1)
  nextVisible.splice(toIndex, 0, moved)

  const next = [...sessionOrder]
  slotIndices.forEach((orderIndex, k) => {
    next[orderIndex] = nextVisible[k]
  })
  return next
}
