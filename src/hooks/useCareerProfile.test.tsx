import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCareerProfile } from './useCareerProfile'
import type { CareerProfile } from '../api/profileClient'

const { fetchProfile, skipOnboardingApi, mockGetToken } = vi.hoisted(() => {
  const mockGetToken = vi.fn().mockResolvedValue('jwt-test')
  return {
    fetchProfile: vi.fn(),
    skipOnboardingApi: vi.fn(),
    mockGetToken,
  }
})

vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    getToken: mockGetToken,
    isSignedIn: true,
  }),
  useUser: () => ({ user: { id: 'user_test_1' } }),
}))

vi.mock('../api/profileClient', () => ({
  fetchProfile,
  skipOnboardingApi,
}))

function minimalProfile(overrides: Partial<CareerProfile> = {}): CareerProfile {
  const now = new Date().toISOString()
  return {
    userId: 'user_test_1',
    field: null,
    fieldLabel: null,
    level: null,
    levelLabel: null,
    currentRole: null,
    goals: [],
    skills: [],
    experience: [],
    educationEntries: [],
    languages: [],
    cvRawText: null,
    cvSummary: null,
    cvUploadedAt: null,
    targetJobs: [],
    onboardingCompleted: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('useCareerProfile', () => {
  beforeEach(() => {
    fetchProfile.mockReset()
    skipOnboardingApi.mockReset()
    mockGetToken.mockReset()
    mockGetToken.mockResolvedValue('jwt-test')
    for (const k of Object.keys(localStorage))
      localStorage.removeItem(k)
  })

  it('loads_profile_when_signed_in', async () => {
    fetchProfile.mockResolvedValue(minimalProfile())

    const { result } = renderHook(() => useCareerProfile())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(fetchProfile).toHaveBeenCalledWith('jwt-test')
    expect(result.current.profile?.userId).toBe('user_test_1')
    expect(result.current.needsOnboarding).toBe(false)
    expect(result.current.hasProfile).toBe(true)
  })

  it('sets_error_when_fetch_throws', async () => {
    fetchProfile.mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useCareerProfile())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('network down')
    expect(result.current.profile).toBeNull()
  })

  it('needsOnboarding_true_when_profile_incomplete', async () => {
    fetchProfile.mockResolvedValue(minimalProfile({ onboardingCompleted: false }))

    const { result } = renderHook(() => useCareerProfile())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.needsOnboarding).toBe(true)
    expect(result.current.hasProfile).toBe(false)
  })
})
