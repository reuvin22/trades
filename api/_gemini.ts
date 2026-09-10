import type { TradeSummary } from './_trade-summary'

/**
 * The Gemini call behind the dashboard's Behavioural Leak card.
 *
 * Kept separate from the request handler so it can be exercised directly by
 * scripts/test-leak.mjs without needing a signed-in session.
 */

/**
 * An alias rather than a pinned version. Google retires numbered models
 * ("no longer available to new users"), and this one tracks whatever the
 * current flash model is. Override with GEMINI_MODEL when you need to pin.
 */
export const DEFAULT_MODEL = 'gemini-flash-latest'

export type LeakResult = {
  title: string
  finding: string
  costLabel: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

export const SYSTEM_PROMPT = `You are a trading performance coach analysing one trader's journal.

Name the single most expensive BEHAVIOURAL leak — a pattern in how they act, not
a market opinion. Good examples: revenge trading after losses, size creep,
cutting winners early, trading a losing session time, abandoning the plan under
stress, over-trading a setup that does not work for them.

Rules:
- Ground every claim in the supplied numbers, and quote the specific figure.
- Give the cost as a real dollar amount or per-trade expected value that is
  derivable from the data. Never invent a number you were not given.
- If the data shows no meaningful leak, say so plainly and set severity to
  "low". Do not manufacture a problem to seem useful.
- Be direct and concrete. No hedging, no filler, no generic trading advice.
- The trader is an adult professional. Do not moralise or lecture.

"title" is at most four words, naming the pattern.
"finding" is at most two sentences, as it will sit on a dashboard card.
"costLabel" is a short figure such as "-$1,850 this month" or "-$112 per trade".
"recommendation" is one concrete rule they could add to their written plan.`

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    finding: { type: 'STRING' },
    costLabel: { type: 'STRING' },
    severity: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    recommendation: { type: 'STRING' },
  },
  required: ['title', 'finding', 'costLabel', 'severity', 'recommendation'],
} as const

export class GeminiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message)
    this.name = 'GeminiError'
  }
}

export async function generateLeak(
  summary: TradeSummary,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<LeakResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `Journal statistics (all money in the account's base currency):\n\n${JSON.stringify(
                summary,
                null,
                1,
              )}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.35,
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    }),
  })

  if (!response.ok) {
    // The key travels in the URL, so never echo the request itself.
    const detail = await response.text()
    throw new GeminiError('Gemini rejected the request', response.status, detail.slice(0, 400))
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[]
  }

  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new GeminiError(
      'Gemini returned no content',
      502,
      payload.candidates?.[0]?.finishReason,
    )
  }

  try {
    return JSON.parse(text) as LeakResult
  } catch {
    throw new GeminiError('Gemini returned malformed JSON', 502)
  }
}
