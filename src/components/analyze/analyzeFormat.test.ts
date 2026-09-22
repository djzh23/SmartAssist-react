import { describe, expect, it } from 'vitest'
import type { SkillGapReport } from '../../api/analyzeClient'
import {
  emptySkillGap,
  formatRelativeCreated,
  joinGerman,
  normalizeGap,
  plainGerman,
  reportLead,
  requirementCount,
  scoreBadge,
  scoreCaption,
  scoreLabel,
  scoreLevel,
  scorePercent,
  skillGapState,
  skillWarning,
  splitRoleSummary,
  warningLevel,
} from './analyzeFormat'

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

  it('counts unique skills named in the posting', () => {
    const gap: SkillGapReport = {
      existing: ['C#'],
      supportedByResume: ['Agile'],
      gap: ['ITIL'],
      extractedJdSkills: ['C#', '.NET', 'ITIL', 'Agile'],
      reasonCode: '',
    }
    expect(requirementCount(gap)).toBe(4)
  })

  it('formats relative created labels', () => {
    expect(formatRelativeCreated(new Date().toISOString())).toBe('gerade eben erstellt')
  })

  it('joins a German list naturally', () => {
    expect(joinGerman([])).toBe('')
    expect(joinGerman(['C#'])).toBe('C#')
    expect(joinGerman(['C#', 'SQL'])).toBe('C# und SQL')
    expect(joinGerman(['C#', 'SQL', 'Docker'])).toBe('C#, SQL und Docker')
  })

  it('badges the score without the word "Passung"', () => {
    expect(scoreBadge(2.0)).toBe('Passt kaum')
    expect(scoreBadge(3.0)).toBe('Passt teilweise')
    expect(scoreBadge(4.0)).toBe('Passt gut')
    expect(scoreBadge(4.8)).toBe('Passt sehr gut')
  })
})

describe('reportLead', () => {
  it('names which requirement is missing instead of only counting it', () => {
    const lead = reportLead({
      covered: 4,
      total: 5,
      missingSkills: ['Führerschein Klasse B'],
      roleAlignment: 3.9,
      warningCount: 2,
      score: 3.8,
    })

    expect(lead).toContain('Dein Lebenslauf belegt 4 von 5 Anforderungen der Stellenanzeige, und die Rolle passt zu deinem Profil.')
    expect(lead).toContain('Zu prüfen: Führerschein Klasse B fehlt im Lebenslauf und die Anzeige enthält 2 Warnzeichen.')
  })

  it('names all missing requirements, not just the count, when there is more than one', () => {
    const lead = reportLead({
      covered: 0,
      total: 2,
      missingSkills: ['Backend-Erfahrung', 'Datenbank-Kenntnisse'],
      roleAlignment: 2,
      warningCount: 1,
      score: 2.0,
    })

    expect(lead).toContain('Zu prüfen: Backend-Erfahrung und Datenbank-Kenntnisse fehlen im Lebenslauf und die Anzeige enthält ein Warnzeichen.')
  })

  it('never starts with a lower-case fragment when only the role fits', () => {
    const lead = reportLead({ roleAlignment: 4.2, score: 4.4 })

    expect(lead.startsWith('Die Rolle passt zu deinem Profil.')).toBe(true)
    expect(lead).not.toMatch(/^[a-zäöü]/)
  })

  it('falls back to the caption when nothing else is known', () => {
    expect(reportLead({ score: 2.6 })).toBe(scoreCaption(2.6))
  })

  it('does not use the words "JD" or "Red Flags"', () => {
    const lead = reportLead({
      covered: 1,
      total: 3,
      missingSkills: ['ITIL', 'PRINCE2'],
      roleAlignment: 4,
      warningCount: 1,
      score: 3,
    })

    expect(lead).not.toMatch(/\bJD\b/)
    expect(lead).not.toMatch(/red flag/i)
  })
})

describe('score wording', () => {
  it('turns a score into a plain level', () => {
    expect(scoreLevel(4.6).word).toBe('Sehr gut')
    expect(scoreLevel(3.6).word).toBe('Gut')
    expect(scoreLevel(2.6).word).toBe('Teilweise')
    expect(scoreLevel(1.9)).toEqual({ word: 'Gering', tone: 'low' })
  })

  it('reads warning signs the other way round: 1.0 is the best result', () => {
    expect(warningLevel(1.0)).toEqual({ word: 'Keine Auffälligkeiten', tone: 'good' })
    expect(warningLevel(2.0).tone).toBe('mid')
    expect(warningLevel(3.5)).toEqual({ word: 'Deutliche Warnsignale', tone: 'low' })
  })
})

describe('skill comparison state', () => {
  const filled: SkillGapReport = { ...emptySkillGap(), existing: ['C#'], gap: ['ITIL'], reasonCode: 'ok' }

  it('is unavailable when nothing was recognised, whatever the reason', () => {
    expect(skillGapState(emptySkillGap())).toBe('unavailable')
    expect(skillGapState({ ...emptySkillGap(), reasonCode: 'no-skill-candidates' })).toBe('unavailable')
  })

  it('is partial when skills were found but the extractor flagged the result', () => {
    expect(skillGapState({ ...filled, reasonCode: 'no-requirements-section' })).toBe('partial')
  })

  it('is ok for a normal result, with or without a reason code', () => {
    expect(skillGapState(filled)).toBe('ok')
    expect(skillGapState({ ...filled, reasonCode: '' })).toBe('ok')
  })

  it('fills missing arrays of an incomplete API answer', () => {
    const partial = { existing: ['C#'] } as unknown as SkillGapReport

    expect(normalizeGap(partial)).toEqual({ ...emptySkillGap(), existing: ['C#'] })
    expect(normalizeGap(undefined)).toEqual(emptySkillGap())
  })
})

describe('plainGerman', () => {
  it('replaces the abbreviation "JD" with the word users know', () => {
    expect(plainGerman('Die JD verlangt .NET.')).toBe('Die Stellenanzeige verlangt .NET.')
    expect(plainGerman('Zwei JDs im Vergleich')).toBe('Zwei Stellenanzeigen im Vergleich')
  })

  it('leaves other words alone', () => {
    expect(plainGerman('JDK und JDBC bleiben')).toBe('JDK und JDBC bleiben')
    expect(plainGerman(undefined)).toBe('')
  })
})
