import { describe, expect, it } from 'vitest'
import { TOOL_TO_QUERY } from './useChatSessions'

describe('TOOL_TO_QUERY', () => {
  it('maps_each_tool_to_query_segment', () => {
    expect(TOOL_TO_QUERY.general).toBe('general')
    expect(TOOL_TO_QUERY.jobanalyzer).toBe('jobanalyzer')
    expect(TOOL_TO_QUERY.language).toBe('language')
    expect(TOOL_TO_QUERY.programming).toBe('programming')
    expect(TOOL_TO_QUERY.interview).toBe('interview')
  })
})
