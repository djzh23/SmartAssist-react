import { getAuthToken } from './AuthService'

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:8080'

async function readErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = await response.json() as { error?: string; message?: string }
    return data.error || data.message || fallback
  } catch {
    return fallback
  }
}

export const createCheckoutSession = async (plan: string, email?: string | null): Promise<string> => {
  const token = await getAuthToken()

  const response = await fetch(`${API_URL}/api/stripe/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ plan, email }),
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create checkout'))
  }

  const data = await response.json() as { url?: string }
  if (!data.url) throw new Error('Stripe checkout URL missing')
  return data.url
}

export const createPortalSession = async (): Promise<string> => {
  const token = await getAuthToken()

  const response = await fetch(`${API_URL}/api/stripe/portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, 'Failed to create portal session'))
  }

  const data = await response.json() as { url?: string }
  if (!data.url) throw new Error('Stripe portal URL missing')
  return data.url
}
