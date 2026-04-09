const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''

export interface StripeAuthContext {
  token: string
  userId: string
}

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as { error?: string; message?: string }
    return data.error || data.message || fallback
  } catch {
    return fallback
  }
}

export const createCheckoutSession = async (
  plan: string,
  email: string | null | undefined,
  auth: StripeAuthContext,
): Promise<string> => {
  if (!auth.token) throw new Error('Missing auth token for checkout')
  if (!auth.userId) throw new Error('Missing user ID for checkout')
  if (!email) throw new Error('Missing email for checkout')

  const response = await fetch(`${API_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ plan, email, userId: auth.userId }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create checkout'))
  }

  const data = await response.json() as { url?: string }
  if (!data.url) throw new Error('Stripe checkout URL missing')
  return data.url
}

export interface ConfirmPlanResult {
  plan: string
  confirmed: boolean
}

export const confirmPlanFromSession = async (
  sessionId: string,
  token: string,
): Promise<ConfirmPlanResult> => {
  if (!token) throw new Error('Missing auth token for plan confirmation')
  if (!sessionId) throw new Error('Missing session ID for plan confirmation')

  const response = await fetch(
    `${API_URL}/api/stripe/confirm-plan?session_id=${encodeURIComponent(sessionId)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to confirm plan'))
  }

  return response.json() as Promise<ConfirmPlanResult>
}

export interface SyncPlanResult {
  plan: string
  synced: boolean
}

/**
 * Calls POST /api/stripe/sync-plan — the backend queries Stripe for the user's
 * active subscription and overwrites Redis to match. Use when webhook + confirm-plan
 * have both failed and the user is still stuck on "free".
 */
export const syncPlanFromStripe = async (token: string): Promise<SyncPlanResult> => {
  if (!token) throw new Error('Missing auth token for plan sync')

  const response = await fetch(`${API_URL}/api/stripe/sync-plan`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to sync plan from Stripe'))
  }

  return response.json() as Promise<SyncPlanResult>
}

export const createPortalSession = async (auth: StripeAuthContext): Promise<string> => {
  if (!auth.token) throw new Error('Missing auth token for customer portal')
  if (!auth.userId) throw new Error('Missing user ID for customer portal')

  const response = await fetch(`${API_URL}/api/stripe/portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.token}`,
    },
    body: JSON.stringify({ userId: auth.userId }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create portal session'))
  }

  const data = await response.json() as { url?: string }
  if (!data.url) throw new Error('Stripe portal URL missing')
  return data.url
}
