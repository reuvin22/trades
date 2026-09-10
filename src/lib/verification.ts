import { auth } from './firebase'
import { resendVerification } from './useAuth'

export type SendOutcome = 'sent' | 'already-verified' | 'sent-unbranded'

/**
 * Asks the server to send the branded email through Brevo.
 *
 * If the endpoint is unreachable we still get a link into the user's hands via
 * Firebase's own sender, but that returns 'sent-unbranded' so the UI can say so.
 * Reporting a plain 'sent' hid the fact that the branded path never ran.
 */
export async function sendVerificationEmail(): Promise<SendOutcome> {
  const current = auth?.currentUser
  if (!current) throw new Error('No signed-in account to verify.')

  let response: Response
  try {
    response = await fetch('/api/send-verification', {
      method: 'POST',
      headers: { authorization: `Bearer ${await current.getIdToken()}` },
    })
  } catch {
    await resendVerification()
    return 'sent-unbranded'
  }

  // No handler here: the server answers with the SPA shell rather than JSON.
  if (response.status === 404 || !response.headers.get('content-type')?.includes('json')) {
    await resendVerification()
    return 'sent-unbranded'
  }

  const body = (await response.json()) as { status?: SendOutcome; error?: string }

  if (!response.ok) {
    throw new Error(body.error ?? 'Could not send the verification email.')
  }

  return body.status ?? 'sent'
}
