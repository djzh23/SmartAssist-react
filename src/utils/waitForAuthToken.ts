export type TokenGetter = () => Promise<string | null | undefined>

const DEFAULT_ATTEMPTS = 8
const DEFAULT_DELAY_MS = 150

function wait(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

/**
 * Clerk often reports `isSignedIn` before `getToken()` can return a JWT.
 * Waiting a few short ticks avoids a false "not signed in" error that only
 * an F5 would recover from.
 */
export async function waitForAuthToken(
  getToken: TokenGetter,
  options?: { attempts?: number; delayMs?: number },
): Promise<string | null> {
  const attempts = Math.max(1, options?.attempts ?? DEFAULT_ATTEMPTS)
  const delayMs = Math.max(0, options?.delayMs ?? DEFAULT_DELAY_MS)

  for (let i = 0; i < attempts; i++) {
    const token = await getToken()
    if (token) return token
    if (i < attempts - 1 && delayMs > 0)
      await wait(delayMs)
  }

  return null
}
