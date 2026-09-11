import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminAuth, adminDb } from './_firebase-admin'
import { summarise, type RawTrade } from './_trade-summary'
import { generateLeak } from './_leak-prompt'
import { explainOpenRouterError, OpenRouterError } from './_openrouter'

/**
 * Generates the dashboard's Behavioural Leak card through OpenRouter.
 *
 * The API key is a real secret, so it lives only in process.env on the server —
 * never VITE_-prefixed, never imported from src/.
 *
 * Trades are read here with the Admin SDK rather than accepted from the client,
 * so the analysis always reflects what is actually stored and a caller cannot
 * feed in someone else's numbers.
 */

/** Below this there is not enough history for a pattern to mean anything. */
const MIN_TRADES = 8
const MAX_TRADES = 300
const CACHE_HOURS = 12

function bad(response: VercelResponse, status: number, error: string) {
  return response.status(status).json({ error })
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return bad(response, 405, 'Use POST.')
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return bad(response, 501, 'The analysis service is not configured.')

  const header = request.headers.authorization ?? ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (idToken === '') return bad(response, 401, 'Missing bearer token.')

  let uid: string
  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true)
    if (!decoded.email_verified) {
      return bad(response, 403, 'Confirm your email address first.')
    }
    uid = decoded.uid
  } catch {
    return bad(response, 401, 'Could not verify your session.')
  }

  const db = adminDb()
  const force = Boolean((request.body as { refresh?: boolean } | undefined)?.refresh)

  try {
    const snapshot = await db
      .collection('users')
      .doc(uid)
      .collection('trades')
      .orderBy('createdAt', 'desc')
      .limit(MAX_TRADES)
      .get()

    const trades = snapshot.docs.map((doc) => doc.data() as RawTrade)

    if (trades.length < MIN_TRADES) {
      return response
        .status(200)
        .json({ status: 'insufficient', needed: MIN_TRADES, have: trades.length })
    }

    // Regenerate only when the journal has actually changed, so a dashboard
    // left open all day does not spend a call on every reload.
    const fingerprint = `${trades.length}:${snapshot.docs[0]?.id ?? ''}`
    const cacheRef = db
      .collection('users')
      .doc(uid)
      .collection('insights')
      .doc('behavioralLeak')

    if (!force) {
      const cached = await cacheRef.get()
      const data = cached.data()
      const generatedAt = data?.generatedAt?.toDate?.() as Date | undefined

      if (
        data &&
        data.fingerprint === fingerprint &&
        generatedAt &&
        Date.now() - generatedAt.getTime() < CACHE_HOURS * 3600_000
      ) {
        return response.status(200).json({
          status: 'ok',
          cached: true,
          generatedAt: generatedAt.toISOString(),
          result: data.result,
        })
      }
    }

    const { result, model } = await generateLeak(summarise(trades), apiKey)

    const { FieldValue } = await import('firebase-admin/firestore')
    await cacheRef.set({
      fingerprint,
      result,
      model,
      generatedAt: FieldValue.serverTimestamp(),
    })

    return response.status(200).json({
      status: 'ok',
      cached: false,
      generatedAt: new Date().toISOString(),
      result,
    })
  } catch (cause) {
    if (cause instanceof OpenRouterError) {
      console.error('OpenRouter failure', cause.status, cause.detail ?? cause.message)
      return bad(response, cause.status === 429 ? 429 : 502, explainOpenRouterError(cause))
    }

    console.error(
      'Behavioural leak generation failed',
      cause instanceof Error ? cause.message : cause,
    )
    return bad(response, 500, 'Could not generate the analysis.')
  }
}
