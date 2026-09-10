import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminAuth, adminDb } from './_firebase-admin'
import { summarise, type RawTrade } from './_trade-summary'
import { DEFAULT_MODEL, GeminiError, generateLeak } from './_gemini'

/**
 * Generates the dashboard's Behavioural Leak card with Gemini.
 *
 * The Gemini key is a real secret, so it lives only in process.env on the
 * server — never VITE_-prefixed, never imported from src/.
 *
 * Trades are read here with the Admin SDK rather than accepted from the client,
 * so the analysis always reflects what is actually stored and a caller cannot
 * feed in someone else's numbers.
 */

const MODEL = process.env.GEMINI_MODEL ?? DEFAULT_MODEL

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

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return bad(response, 501, 'Gemini is not configured on the server.')

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
    // left open all day does not spend a Gemini call on every reload.
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

    const result = await generateLeak(summarise(trades), apiKey, MODEL)

    const { FieldValue } = await import('firebase-admin/firestore')
    await cacheRef.set({
      fingerprint,
      result,
      model: MODEL,
      generatedAt: FieldValue.serverTimestamp(),
    })

    return response.status(200).json({
      status: 'ok',
      cached: false,
      generatedAt: new Date().toISOString(),
      result,
    })
  } catch (cause) {
    if (cause instanceof GeminiError) {
      console.error('Gemini failure', cause.status, cause.detail ?? cause.message)

      // These two are configuration problems, not transient faults, so say what
      // to fix rather than leaving someone retrying a request that cannot work.
      if (cause.status === 403) {
        return bad(
          response,
          502,
          'Gemini denied this project. Enable the Generative Language API and billing for the key in Google AI Studio.',
        )
      }
      if (cause.status === 404) {
        return bad(
          response,
          502,
          `Model "${MODEL}" is not available to this project. Set GEMINI_MODEL to a current one.`,
        )
      }

      return bad(response, 502, 'The analysis service could not complete the request.')
    }

    console.error(
      'Behavioural leak generation failed',
      cause instanceof Error ? cause.message : cause,
    )
    return bad(response, 500, 'Could not generate the analysis.')
  }
}
