import { apiFetch } from './api'

export type SendOutcome = 'sent' | 'already-verified'

/**
 * Asks the API to send the branded confirmation email through Brevo.
 *
 * There is no unbranded fallback any more. The old one existed because the
 * Vercel function might not be deployed, and the client could still reach
 * Firebase's own sender directly — it cannot now, and it should not be able
 * to. A failure is reported as a failure rather than quietly sending a
 * different email than the one that was asked for.
 *
 * The address is not a parameter. It comes from the account the session names,
 * so this cannot be pointed at someone else's inbox.
 */
export async function sendVerificationEmail(): Promise<SendOutcome> {
  const body = await apiFetch<{ status: SendOutcome }>('/api/v1/auth/verify-email', {
    method: 'POST',
  })
  return body.status
}
