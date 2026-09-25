import { describe, expect, it, vi } from 'vitest'
import { waitForAuthToken } from './waitForAuthToken'

describe('waitForAuthToken', () => {
  it('returns the first non-empty token', async () => {
    const getToken = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce('jwt-ready')

    await expect(waitForAuthToken(getToken, { attempts: 5, delayMs: 1 })).resolves.toBe('jwt-ready')
    expect(getToken).toHaveBeenCalledTimes(3)
  })

  it('returns null when Clerk never yields a token', async () => {
    const getToken = vi.fn().mockResolvedValue(null)

    await expect(waitForAuthToken(getToken, { attempts: 3, delayMs: 1 })).resolves.toBeNull()
    expect(getToken).toHaveBeenCalledTimes(3)
  })
})
