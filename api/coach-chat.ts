import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminAuth, adminDb } from './_firebase-admin'
import { summarise, type RawTrade } from './_trade-summary'
import { DEFAULT_MODEL, GeminiError } from './_gemini'
import { askCoach, buildSystemPrompt, type CoachTurn } from './_coach'

/**
 * One turn of the AI Coach conversation.
 *
 * The journal is read here with the Admin SDK, never accepted from the client,
 * so the coach can only ever talk about trades the trader actually logged.
 */

const MODEL = process.env.GEMINI_MODEL ?? DEFAULT_MODEL
const MAX_TRADES = 300
/** How much conversation to carry. Older turns fall away to bound the cost. */
const HISTORY_LIMIT = 20
const MAX_MESSAGE = 2000

function bad(response: VercelResponse, status: number, error: string) {
  return response.status(status).json({ error })
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST')
    return bad(response, 405, 'Use POST.')
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return bad(response, 501, 'The coach is not configured on the server.')

  const header = request.headers.authorization ?? ''
  const idToken = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (idToken === '') return bad(response, 401, 'Missing bearer token.')

  let uid: string
  let displayName = ''
  try {
    const decoded = await adminAuth().verifyIdToken(idToken, true)
    if (!decoded.email_verified) return bad(response, 403, 'Confirm your email first.')
    uid = decoded.uid
    displayName = (decoded.name as string | undefined) ?? ''
  } catch {
    return bad(response, 401, 'Could not verify your session.')
  }

  const body = request.body as
    | { message?: string; history?: CoachTurn[]; language?: string }
    | undefined

  const message = (body?.message ?? '').trim()
  if (message === '') return bad(response, 400, 'Say something first.')
  if (message.length > MAX_MESSAGE) return bad(response, 400, 'That message is too long.')

  const language = (body?.language ?? 'English').slice(0, 40)

  // Trust the client for conversation shape only; every fact comes from Firestore.
  const history: CoachTurn[] = Array.isArray(body?.history)
    ? body.history
        .filter(
          (turn): turn is CoachTurn =>
            typeof turn?.text === 'string' &&
            (turn.role === 'user' || turn.role === 'coach'),
        )
        .slice(-HISTORY_LIMIT)
        .map((turn) => ({ role: turn.role, text: turn.text.slice(0, MAX_MESSAGE) }))
    : []

  try {
    const snapshot = await adminDb()
      .collection('users')
      .doc(uid)
      .collection('trades')
      .orderBy('createdAt', 'desc')
      .limit(MAX_TRADES)
      .get()

    const trades = snapshot.docs.map((doc) => doc.data() as RawTrade)
    const summary = trades.length === 0 ? null : summarise(trades)

    const reply = await askCoach(
      [...history, { role: 'user', text: message }],
      buildSystemPrompt(summary, language, displayName),
      apiKey,
      MODEL,
    )

    return response.status(200).json({ reply, tradeCount: trades.length })
  } catch (cause) {
    if (cause instanceof GeminiError) {
      console.error('Coach failure', cause.status, cause.detail ?? cause.message)

      if (cause.status === 403) {
        return bad(
          response,
          502,
          'Gemini denied this project. Enable the Generative Language API and billing for the key.',
        )
      }
      if (cause.status === 404) {
        return bad(response, 502, `Model "${MODEL}" is not available to this project.`)
      }
      if (cause.status === 429) {
        return bad(response, 429, 'The coach is rate limited right now. Try again shortly.')
      }
      return bad(response, 502, 'The coach could not answer just now.')
    }

    console.error('Coach failed', cause instanceof Error ? cause.message : cause)
    return bad(response, 500, 'Could not reach the coach.')
  }
}
