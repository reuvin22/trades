import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminAuth } from './_firebase-admin'
import { verificationHtml, verificationText } from './_email-template'

/**
 * Sends the email-verification link through Brevo.
 *
 * The Brevo key is a real secret — it can send mail as you — so it lives only
 * in process.env on the server. It is never prefixed with VITE_, never
 * imported from src/, and never returned in a response.
 *
 * The caller proves who they are with a Firebase ID token; the address the mail
 * goes to comes from the *verified token*, never from the request body, so a
 * caller cannot aim someone else's inbox.
 */

const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'
const COOLDOWN_MS = 60_000

/** Best-effort throttle. Serverless instances are short-lived, so treat this
 *  as a courtesy limit rather than a security control. */
const lastSent = new Map<string, number>()

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return response.status(405).json({ error: 'Use POST.' })
  }

  const apiKey = process.env.BREVO_API_KEY
  const sender = process.env.BREVO_SENDER_EMAIL
  if (!apiKey || !sender) {
    return response
      .status(500)
      .json({ error: 'Email sending is not configured on the server.' })
  }

  const header = request.headers.authorization ?? ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (idToken === '') {
    return response.status(401).json({ error: 'Missing bearer token.' })
  }

  let uid: string
  let email: string
  let name: string

  try {
    // checkRevoked: a signed-out or disabled account cannot trigger mail.
    const decoded = await adminAuth().verifyIdToken(idToken, true)
    const record = await adminAuth().getUser(decoded.uid)

    if (record.emailVerified) {
      return response.status(200).json({ status: 'already-verified' })
    }
    if (!record.email) {
      return response.status(400).json({ error: 'This account has no email address.' })
    }

    uid = record.uid
    email = record.email
    name = record.displayName ?? ''
  } catch {
    return response.status(401).json({ error: 'Could not verify your session.' })
  }

  const previous = lastSent.get(uid) ?? 0
  if (Date.now() - previous < COOLDOWN_MS) {
    return response.status(429).json({ error: 'Wait a minute before requesting another email.' })
  }

  try {
    const appUrl = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
    const link = await adminAuth().generateEmailVerificationLink(email, {
      url: `${appUrl}/#/login`,
    })

    const brand = process.env.BREVO_SENDER_NAME ?? 'RagDex'

    const sent = await fetch(BREVO_ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: sender, name: brand },
        to: [{ email, name: name || email }],
        subject: `Confirm your email to open your ${brand} journal`,
        htmlContent: verificationHtml({ link, name, brand, gifUrl: `${appUrl}/email/verify.gif` }),
        // A text part materially improves deliverability.
        textContent: verificationText({ link, name, brand }),
        tags: ['verification'],
      }),
    })

    if (!sent.ok) {
      // Brevo echoes the key in some error payloads; log the status only.
      console.error('Brevo rejected the send', sent.status)
      return response.status(502).json({ error: 'The email provider rejected the request.' })
    }

    lastSent.set(uid, Date.now())
    return response.status(200).json({ status: 'sent' })
  } catch (cause) {
    console.error('Verification send failed', cause instanceof Error ? cause.message : cause)
    return response.status(500).json({ error: 'Could not send the verification email.' })
  }
}
