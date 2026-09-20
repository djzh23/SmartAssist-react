import { describe, expect, it } from 'vitest'
import type { SkillGapReport } from '../../api/analyzeClient'
import { emptySkillGap, requirementCount, scoreCaption, scoreLabel, scorePercent, skillWarning, splitRoleSummary } from './analyzeFormat'

describe('analyzeFormat', () => {
  it('formats German scores and captions', () => {
    expect(scoreLabel(2.6)).toBe('2,6')
    expect(scoreCaption(2.6)).toContain('klarem Grund')
    expect(scorePercent(2.6)).toBeCloseTo(52, 0)
  })

  it('splits role summary without inventing job meta', () => {
    expect(splitRoleSummary('Junior IT-Consultant, Vollzeit, Hybrid')).toEqual({
      title: 'Junior IT-Consultant',
      subtitle: 'Vollzeit, Hybrid',
    })
    expect(splitRoleSummary('')).toEqual({ title: 'Stellenanalyse' })
    expect(splitRoleSummary('Teamassistenz')).toEqual({ title: 'Teamassistenz' })
  })

  it('builds a single skill-gap warning', () => {
    const two = skillWarning({ ...emptySkillGap(), gap: ['ITIL', 'PRINCE2'] })
    expect(two?.title).toBe('ITIL und PRINCE2 fehlen im Lebenslauf')
    const many = skillWarning({ ...emptySkillGap(), gap: ['A', 'B', 'C'] })
    expect(many?.title).toBe('3 Skill-Lücken erkannt')
    expect(skillWarning({ ...emptySkillGap(), gap: [] })).toBeNull()
  })

  it('counts unique JD skills', () => {
    const gap: SkillGapReport = {
      existing: ['C#'],
      supportedByResume: ['Agile'],
      gap: ['ITIL'],
      extractedJdSkills: ['C#', '.NET', 'ITIL', 'Agile'],
      reasonCode: '',
    }
    expect(requirementCount(gap)).toBe(4)
  })
})
