export const BETA_ACCESS_MESSAGE =
  'Aktuell nur für eingeladene Beta-Tester verfügbar. Wenn du eingeladen sein solltest: melde dich unter ijd.zouh@yahoo.com.'

export class BetaAccessRequiredError extends Error {
  readonly code = 'beta_access_required'

  constructor(message = BETA_ACCESS_MESSAGE) {
    super(message)
    this.name = 'BetaAccessRequiredError'
  }
}

type Listener = () => void
const listeners = new Set<Listener>()

export function subscribeBetaAccessDenied(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function notifyBetaAccessDenied(): void {
  for (const listener of listeners)
    listener()
}

export function throwIfBetaForbidden(
  status: number,
  payload: { error?: string; message?: string },
): void {
  if (status !== 403)
    return
  if (payload.error && payload.error !== 'beta_access_required')
    return
  notifyBetaAccessDenied()
  throw new BetaAccessRequiredError(payload.message ?? BETA_ACCESS_MESSAGE)
}
