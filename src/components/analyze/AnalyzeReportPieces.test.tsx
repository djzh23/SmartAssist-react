import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AnalyzeHero from './AnalyzeHero'
import AnalyzeWarningBanner from './AnalyzeWarningBanner'
import AnalyzeSkillBuckets from './AnalyzeSkillBuckets'
import AnalyzeBulletRewrites from './AnalyzeBulletRewrites'
import AnalyzeScoreBreakdown from './AnalyzeScoreBreakdown'
import AnalyzeReportView from './AnalyzeReportView'
import type { AnalyzeReport } from '../../api/analyzeClient'
import { emptySkillGap } from './analyzeFormat'

describe('analyze report pieces', () => {
  it('shows score caption and the fact check as positive info', () => {
    render(<AnalyzeHero score={2.6} factGateCount={2} />)
    expect(screen.getByText('2,6')).toBeInTheDocument()
    expect(screen.getByText(/klarem Grund/)).toBeInTheDocument()
    expect(screen.getByText('Faktenprüfung aktiv')).toBeInTheDocument()
    expect(screen.getByText('2 erfundene Skills blockiert')).toBeInTheDocument()
  })

  it('renders a single skill-gap banner', () => {
    render(
      <AnalyzeWarningBanner
        skillGap={{ ...emptySkillGap(), gap: ['ITIL', 'PRINCE2'] }}
        warnings={['FactGate: ignored']}
      />,
    )
    expect(screen.getByText('ITIL und PRINCE2 fehlen im Lebenslauf')).toBeInTheDocument()
    expect(screen.queryByText(/FactGate/)).not.toBeInTheDocument()
  })

  it('maps skill buckets to green, blue and red groups', () => {
    render(
      <AnalyzeSkillBuckets
        skillGap={{
          existing: ['C#'],
          supportedByResume: ['Agile'],
          gap: ['ITIL'],
          extractedJdSkills: ['C#', 'Agile', 'ITIL'],
          reasonCode: 'ok',
        }}
      />,
    )
    expect(screen.getAllByText('C#').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agile').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ITIL').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Nicht im Lebenslauf gefunden').length).toBeGreaterThan(0)
  })

  it('offers a copy control on rewritten bullets', () => {
    render(
      <AnalyzeBulletRewrites
        bullets={[
          {
            originalBullet: 'APIs gebaut',
            rewrittenBullet: 'ASP.NET Core REST APIs entwickelt',
            reasoning: 'Steht so im Lebenslauf.',
          },
        ]}
      />,
    )
    expect(screen.getAllByRole('button', { name: 'Vorschlag kopieren' }).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/ASP\.NET Core REST APIs entwickelt/).length).toBeGreaterThan(0)
  })

  it('explains instead of silently disappearing when no bullet was rewritten', () => {
    render(<AnalyzeBulletRewrites bullets={[]} />)

    expect(screen.getAllByText('Keine Formulierungsvorschläge').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/kein passender Formulierungsvorschlag/).length).toBeGreaterThan(0)
  })

  it('explains that suggestions were withheld because they were not backed by the résumé', () => {
    render(<AnalyzeBulletRewrites bullets={[]} blockedByFactCheck />)

    expect(screen.getAllByText('Formulierungsvorschläge zurückgehalten').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/nicht belegt waren/).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'Trotzdem anzeigen' })).not.toBeInTheDocument()
  })

  it('offers withheld suggestions behind a button instead of never showing them', () => {
    render(
      <AnalyzeBulletRewrites
        bullets={[]}
        blockedByFactCheck
        unverifiedBullets={[
          { originalBullet: 'APIs gebaut', rewrittenBullet: 'Kubernetes-Cluster betrieben', reasoning: 'nicht im Lebenslauf belegt' },
        ]}
      />,
    )

    expect(screen.queryAllByText(/Kubernetes-Cluster betrieben/).length).toBe(0)

    const reveal = screen.getAllByRole('button', { name: 'Trotzdem anzeigen' })[0]
    fireEvent.click(reveal)

    expect(screen.getAllByText(/Kubernetes-Cluster betrieben/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Nicht geprüft/).length).toBeGreaterThan(0)
  })
})

describe('skill comparison that found nothing', () => {
  it('says so instead of claiming "no hits" and "no gaps"', () => {
    render(<AnalyzeSkillBuckets skillGap={{ ...emptySkillGap(), reasonCode: 'no-skill-candidates' }} />)

    expect(screen.getAllByText('Kein automatischer Abgleich möglich').length).toBeGreaterThan(0)
    expect(screen.queryByText('Keine Treffer')).not.toBeInTheDocument()
    expect(screen.queryByText('Keine Lücken erkannt')).not.toBeInTheDocument()
  })

  it('warns that a flagged result may be incomplete', () => {
    render(
      <AnalyzeSkillBuckets
        skillGap={{ ...emptySkillGap(), existing: ['C#'], extractedJdSkills: ['C#'], reasonCode: 'no-requirements-section' }}
      />,
    )

    expect(screen.getAllByText(/Liste kann unvollständig sein/).length).toBeGreaterThan(0)
  })

  it('celebrates a complete match instead of showing an empty gap list', () => {
    render(
      <AnalyzeSkillBuckets
        skillGap={{ ...emptySkillGap(), existing: ['C#'], extractedJdSkills: ['C#'], reasonCode: 'ok' }}
      />,
    )

    expect(screen.getAllByText('Alle erkannten Anforderungen sind im Lebenslauf belegt.').length).toBeGreaterThan(0)
  })
})

describe('score breakdown', () => {
  it('explains each part in words and relates it to the posting', () => {
    render(
      <AnalyzeScoreBreakdown
        cvMatch={4.5}
        roleAlignment={4.2}
        culture={4}
        redFlags={1}
        coveredCount={4}
        requirementTotal={5}
        warningCount={0}
      />,
    )

    expect(screen.getByText('Fähigkeiten und Erfahrung')).toBeInTheDocument()
    expect(screen.getByText('Dein Lebenslauf belegt 4 von 5 Anforderungen der Stellenanzeige.')).toBeInTheDocument()
    expect(screen.getByText('Eignung für die Rolle')).toBeInTheDocument()
    expect(screen.getByText('Arbeitsumfeld')).toBeInTheDocument()
  })

  it('shows "no warning signs" for a warning score of 1.0 instead of a bad-looking 1,0 out of 5', () => {
    render(<AnalyzeScoreBreakdown cvMatch={4} roleAlignment={4} culture={4} redFlags={1} warningCount={0} />)

    expect(screen.getByText('Warnsignale in der Anzeige')).toBeInTheDocument()
    expect(screen.getByText('Keine Auffälligkeiten')).toBeInTheDocument()
    expect(screen.queryByText(/1,0 von 5/)).not.toBeInTheDocument()
    expect(screen.queryByText(/red flag/i)).not.toBeInTheDocument()
  })

  it('names the number of warning signs when there are some', () => {
    render(<AnalyzeScoreBreakdown cvMatch={3} roleAlignment={3} culture={3} redFlags={3.2} warningCount={2} />)

    expect(screen.getByText('Deutliche Warnsignale')).toBeInTheDocument()
    expect(screen.getByText('2 Auffälligkeiten in der Anzeige, siehe Hinweise.')).toBeInTheDocument()
  })
})

describe('report view', () => {
  const report: AnalyzeReport = {
    globalScore: 4.4,
    dimensions: { cvMatch: 4.5, roleAlignment: 4.2, culture: 4, redFlags: 1 },
    skillGap: { ...emptySkillGap(), reasonCode: 'no-skill-candidates' },
    bullets: [
      {
        originalBullet: 'Termine gemacht',
        rewrittenBullet: 'Termine koordiniert',
        reasoning: 'Die JD verlangt Terminkoordination.',
      },
    ],
    roleSummary: 'Junior .NET Developer, Vollzeit',
    warnings: ['Die JD nennt kein Gehalt.'],
    cultureScreen: 'not_evaluated',
    factViolations: [],
  }

  it('never shows the abbreviation "JD" or the term "Red Flags"', () => {
    const { container } = render(<AnalyzeReportView report={report} createdLabel="gerade eben erstellt" onNewAnalysis={() => {}} />)

    const text = container.textContent ?? ''
    expect(text).not.toMatch(/\bJD\b/)
    expect(text).not.toMatch(/red flag/i)
    expect(text).toContain('Die Stellenanzeige verlangt Terminkoordination.')
    expect(text).toContain('Die Stellenanzeige nennt kein Gehalt.')
  })

  it('tells the user why no CV rewrite was blocked by the fact check, instead of just omitting it', () => {
    const blocked: AnalyzeReport = {
      ...report,
      bullets: [],
      roleSummary: '',
      factViolations: [{ violationType: 'InventedSkill', snippet: 'Kubernetes', reason: 'nicht im Lebenslauf' }],
    }

    render(<AnalyzeReportView report={blocked} createdLabel="gerade eben erstellt" onNewAnalysis={() => {}} />)

    expect(screen.getAllByText('Formulierungsvorschläge zurückgehalten').length).toBeGreaterThan(0)
  })

  it('lets the user reveal an unverified rewrite from the full report', () => {
    const blocked: AnalyzeReport = {
      ...report,
      bullets: [],
      roleSummary: '',
      factViolations: [{ violationType: 'InventedSkill', snippet: 'Kubernetes', reason: 'nicht im Lebenslauf' }],
      unverifiedBullets: [
        { originalBullet: 'APIs gebaut', rewrittenBullet: 'Kubernetes-Cluster betrieben', reasoning: 'nicht im Lebenslauf belegt' },
      ],
    }

    render(<AnalyzeReportView report={blocked} createdLabel="gerade eben erstellt" onNewAnalysis={() => {}} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Trotzdem anzeigen' })[0])

    expect(screen.getAllByText(/Kubernetes-Cluster betrieben/).length).toBeGreaterThan(0)
  })

  it('offers a new analysis at the top and keeps the score in reach', () => {
    render(<AnalyzeReportView report={report} createdLabel="gerade eben erstellt" onNewAnalysis={() => {}} />)

    expect(screen.getAllByRole('button', { name: /Neue Analyse/ }).length).toBe(2)
    expect(screen.getByText('4,4')).toBeInTheDocument()
  })
})
