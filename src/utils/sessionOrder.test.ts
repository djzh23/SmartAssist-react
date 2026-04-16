import { describe, expect, it } from 'vitest'
import { reorderSessionOrderForTool } from './sessionOrder'
import type { ChatSession, ToolType } from '../types'

function session(id: string, tool: ToolType): ChatSession {
  return {
    id,
    toolType: tool,
    messages: [],
    createdAt: new Date().toISOString(),
    title: 't',
  }
}

describe('reorderSessionOrderForTool', () => {
  it('returns_same_order_when_indices_invalid', () => {
    const order = ['a', 'b', 'c']
    const sessions: Record<string, ChatSession> = {
      a: session('a', 'general'),
      b: session('b', 'general'),
      c: session('c', 'jobanalyzer'),
    }
    expect(reorderSessionOrderForTool(order, 'general', -1, 0, sessions)).toEqual(order)
    expect(reorderSessionOrderForTool(order, 'general', 0, 5, sessions)).toEqual(order)
  })

  it('reorders_only_matching_tool_sessions', () => {
    const order = ['g1', 'j1', 'g2']
    const sessions: Record<string, ChatSession> = {
      g1: session('g1', 'general'),
      j1: session('j1', 'jobanalyzer'),
      g2: session('g2', 'general'),
    }
    const next = reorderSessionOrderForTool(order, 'general', 0, 1, sessions)
    expect(next).toEqual(['g2', 'j1', 'g1'])
  })

  it('returns_unchanged_when_from_equals_to', () => {
    const order = ['x', 'y']
    const sessions: Record<string, ChatSession> = {
      x: session('x', 'general'),
      y: session('y', 'general'),
    }
    expect(reorderSessionOrderForTool(order, 'general', 0, 0, sessions)).toEqual(order)
  })
})
