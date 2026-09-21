import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import AnalyzeHero from './AnalyzeHero'
import AnalyzeWarningBanner from './AnalyzeWarningBanner'
import AnalyzeSkillBuckets from './AnalyzeSkillBuckets'
import AnalyzeBulletRewrites from './AnalyzeBulletRewrites'
import { emptySkillGap } from './analyzeFormat'

describe('analyze report pieces', () => {
  it('shows score caption and Fact-Gate as positive info', () => {
    render(<AnalyzeHero score={2.6} factGateCount={2} />)
    expect(screen.getByText('2,6')).toBeInTheDocument()
    expect(screen.getByText(/klarem Grund/)).toBeInTheDocument()
    expect(screen.getByText('Fact-Gate aktiv')).toBeInTheDocument()
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
          reasonCode: '',
        }}
      />,
    )
    expect(screen.getAllByText('C#').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Agile').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ITIL').length).toBeGreaterThan(0)
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
})
