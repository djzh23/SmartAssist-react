export async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null

  const clerk = (window as Window & {
    Clerk?: {
      load?: () => Promise<void>
      session?: {
        getToken?: () => Promise<string | null> | string | null
      }
    }
  }).Clerk

  if (!clerk) return null

  try {
    if (clerk.load) await clerk.load()
    const token = await clerk.session?.getToken?.()
    return token ?? null
  } catch {
    return null
  }
}
