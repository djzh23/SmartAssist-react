import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AnalyzeHero from './AnalyzeHero'
import AnalyzeWarningBanner from './AnalyzeWarningBanner'
import AnalyzeSkillBuckets from './AnalyzeSkillBuckets'
import AnalyzeBulletRewrites from './AnalyzeBulletRewrites'
import AnalyzeScoreBreakdown from './AnalyzeScoreBreakdown'
import AnalyzeReportView from './AnalyzeReportView'
import AnalyzeVerdict from './AnalyzeVerdict'
import AnalyzeActionPlan from './AnalyzeActionPlan'
import AnalyzeSectionFindings from './AnalyzeSectionFindings'
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

  it('renders a v1 report unchanged when no v2 field is present', () => {
    render(<AnalyzeReportView report={report} createdLabel="gerade eben erstellt" onNewAnalysis={() => {}} />)

    expect(screen.queryByLabelText('Bewerbungs-Empfehlung')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Konkrete nächste Schritte')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Analyse nach Lebenslauf-Bereichen')).not.toBeInTheDocument()
    // The heuristic lead sentence is the only narrative a v1 report has, so it must stay.
    expect(screen.getByText(/Gute Grundlage für eine Bewerbung/)).toBeInTheDocument()
  })

  it('drops the heuristic lead once the model supplies its own verdict', () => {
    const v2: AnalyzeReport = {
      ...report,
      verdictHeadline: 'Bewerbbar mit gezielten Anpassungen.',
      verdictParagraph: 'Der Werdegang bringt die verlangte Praxis mit.',
    }

    render(<AnalyzeReportView report={v2} createdLabel="gerade eben erstellt" onNewAnalysis={() => {}} />)

    expect(screen.getByText('Bewerbbar mit gezielten Anpassungen.')).toBeInTheDocument()
    expect(screen.queryByText(/Gute Grundlage für eine Bewerbung/)).not.toBeInTheDocument()
  })
})

describe('v2 blocks', () => {
  it('AnalyzeVerdict renders both parts and survives the empty state', () => {
    const { container } = render(<AnalyzeVerdict headline="" paragraph={null} />)
    expect(container).toBeEmptyDOMElement()

    render(<AnalyzeVerdict headline="Bewerbbar mit Anpassungen." paragraph="Die JD verlangt SQL." />)
    expect(screen.getByText('Bewerbbar mit Anpassungen.')).toBeInTheDocument()
    expect(screen.getByText('Die Stellenanzeige verlangt SQL.')).toBeInTheDocument()
  })

  it('AnalyzeActionPlan sorts by priority and labels effort and impact', () => {
    const { container } = render(<AnalyzeActionPlan items={[]} />)
    expect(container).toBeEmptyDOMElement()

    render(
      <AnalyzeActionPlan
        items={[
          { priority: 2, action: 'Profilsatz umschreiben.', effortMinutes: 180, impact: 'medium' },
          { priority: 1, action: 'Skill-Reihenfolge ändern.', effortMinutes: 5, impact: 'high' },
          { priority: 3, action: 'Sprachkurs starten.', effortMinutes: null, impact: 'low' },
        ]}
      />,
    )

    const steps = screen.getAllByRole('listitem').map(li => li.textContent ?? '')
    expect(steps[0]).toContain('Skill-Reihenfolge ändern.')
    expect(steps[0]).toContain('5 Min.')
    expect(steps[0]).toContain('Hoher Hebel')
    expect(steps[1]).toContain('3 Std.')
    expect(steps[2]).toContain('länger')
    expect(steps[2]).toContain('Kleiner Hebel')
  })

  it('AnalyzeActionPlan omits the impact chip for an unknown impact value', () => {
    render(
      <AnalyzeActionPlan
        items={[{ priority: 1, action: 'Irgendwas tun.', effortMinutes: 10, impact: null }]}
      />,
    )

    // Not a bare /Hebel/: the section subtitle contains that word too.
    expect(screen.queryByText(/(Hoher|Mittlerer|Kleiner) Hebel/)).not.toBeInTheDocument()
  })

  it('AnalyzeSectionFindings shows observation and action, and skips half-empty findings', () => {
    const { container } = render(<AnalyzeSectionFindings findings={[]} />)
    expect(container).toBeEmptyDOMElement()

    render(
      <AnalyzeSectionFindings
        findings={[
          {
            section: 'technical_skills',
            label: 'Technische Skills',
            observation: 'Die JD verlangt zuerst C#.',
            action: 'Reihenfolge umsortieren.',
          },
          { section: 'other', label: 'Sonstiges', observation: 'Etwas', action: '   ' },
        ]}
      />,
    )

    expect(screen.getByText('Die Stellenanzeige verlangt zuerst C#.')).toBeInTheDocument()
    expect(screen.getByText('Reihenfolge umsortieren.')).toBeInTheDocument()
    expect(screen.queryByText('Sonstiges')).not.toBeInTheDocument()
  })
})

describe('per-bullet fact check', () => {
  const bullets = [
    { originalBullet: 'APIs gebaut', rewrittenBullet: 'REST APIs entwickelt', reasoning: 'passt' },
    { originalBullet: 'APIs gebaut', rewrittenBullet: 'Kubernetes betrieben', reasoning: 'passt' },
  ]

  it('marks only the flagged rewrite instead of the whole pane', () => {
    render(<AnalyzeBulletRewrites bullets={bullets} unverifiedIndices={[0]} />)

    expect(screen.queryAllByText(/Nicht geprüft:/)).toHaveLength(0)
    // Desktop shows the first rewrite and hides the rest behind a button, so exactly one note
    // is on screen; after expanding, the clean second rewrite must still carry none.
    expect(screen.getAllByText(/Nicht mit Lebenslauf abgeglichen/)).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: /1 weiteren Vorschlag anzeigen/ }))

    expect(screen.getAllByText(/Nicht mit Lebenslauf abgeglichen/)).toHaveLength(1)
    expect(screen.getAllByText(/Kubernetes betrieben/).length).toBeGreaterThan(0)
  })

  it('falls back to the pane-wide notice when every rewrite is flagged', () => {
    render(<AnalyzeBulletRewrites bullets={bullets} unverifiedIndices={[0, 1]} />)

    expect(screen.getAllByText(/Nicht geprüft:/).length).toBeGreaterThan(0)
    expect(screen.queryAllByText(/Nicht mit Lebenslauf abgeglichen/)).toHaveLength(0)
  })

  it('marks nothing when the backend sent no indices', () => {
    render(<AnalyzeBulletRewrites bullets={bullets} />)

    expect(screen.queryAllByText(/Nicht mit Lebenslauf abgeglichen/)).toHaveLength(0)
    expect(screen.queryAllByText(/Nicht geprüft:/)).toHaveLength(0)
  })
})
