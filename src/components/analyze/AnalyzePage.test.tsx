import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import AnalyzePage from '../../pages/AnalyzePage'
import type { AnalyzeReport } from '../../api/analyzeClient'

const USER_ID = 'user_analyze_ui'

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: vi.fn().mockResolvedValue('jwt-test'),
    userId: USER_ID,
    isLoaded: true,
  }),
}))

vi.mock('../../hooks/useCareerProfile', () => ({
  useCareerProfile: () => ({
    profile: { cvContentHash: 'abc123' },
    loading: false,
  }),
}))

const sampleReport: AnalyzeReport = {
  globalScore: 2.6,
  dimensions: { cvMatch: 2, roleAlignment: 2.5, culture: 3.5, redFlags: 2 },
  skillGap: {
    existing: ['C#', '.NET'],
    supportedByResume: ['Agile'],
    gap: ['ITIL', 'PRINCE2'],
    extractedJdSkills: ['C#', '.NET', 'Agile', 'ITIL', 'PRINCE2'],
    reasonCode: '',
  },
  bullets: [
    {
      originalBullet: 'APIs gebaut',
      rewrittenBullet: 'ASP.NET Core REST APIs entwickelt',
      reasoning: 'Steht so im Lebenslauf.',
    },
  ],
  roleSummary: 'Junior IT-Consultant, Hybrid',
  warnings: [],
  cultureScreen: 'caution',
  factViolations: [{ violationType: 'InventedSkill', snippet: 'Kubernetes', reason: 'nicht im Lebenslauf' }],
}

describe('AnalyzePage report view', () => {
  beforeEach(() => {
    sessionStorage.clear()
    sessionStorage.setItem(
      `privateprep_last_analyze_report_${USER_ID}`,
      JSON.stringify({ report: sampleReport, storedAt: new Date().toISOString() }),
    )
  })

  it('shows the stored report instead of the job form', () => {
    render(
      <MemoryRouter>
        <AnalyzePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Junior IT-Consultant' })).toBeInTheDocument()
    expect(screen.getByText('Hybrid')).toBeInTheDocument()
    expect(screen.getByText('2,6')).toBeInTheDocument()
    expect(screen.getByText('Fact-Gate aktiv')).toBeInTheDocument()
    expect(screen.getByText('ITIL und PRINCE2 fehlen im Lebenslauf')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Neue Analyse/ })).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
