import type { TradeSummary } from './_trade-summary'
import { DEFAULT_MODEL, GeminiError } from './_gemini'

/**
 * The AI Coach conversation.
 *
 * Two constraints shape the prompt. It must stay inside this app — a trading
 * journal is not a general assistant, and a coach that answers anything at all
 * invites questions it has no business answering, like what to buy next. And it
 * must sound like a person, because the numbers are already on the dashboard;
 * what the trader needs here is someone explaining what they mean.
 */

export type CoachTurn = {
  role: 'user' | 'coach'
  text: string
}

const REFUSAL_GUIDANCE = `You only discuss this trader's own journal: their logged
trades, their results, their habits, their psychology around trading, and how to
use this app.

If asked about anything else — general knowledge, news, coding, other people,
what to buy, where a market is heading, homework, recipes, anything at all
outside their own trading — decline warmly in one short sentence and offer
something you can help with instead. Do not answer the question even partially.
Do not explain that you are an AI or describe your restrictions in detail. Just
be a coach who talks about their trading and nothing else.

You never predict prices, never recommend a specific trade, and never tell them
what to buy or sell. You talk about patterns in what they have already done.`

const TONE_GUIDANCE = `Talk like a real person who happens to coach traders. Warm,
direct, a little dry. You are talking, not writing a report.

- Short sentences. Ordinary words.
- No jargon unless they use it first. Say "how often you win" rather than "win
  rate distribution", "your average winner" rather than "mean positive P&L".
- Never use bullet points, headings, bold text, tables or markdown of any kind.
  Just plain conversational sentences, like a message.
- At most three or four sentences per reply unless they ask for more.
- Use their real numbers, but round them and say them the way a person would:
  "about two hundred quid a trade", "roughly two out of three".
- Do not open with pleasantries every time. Get to the point.
- Never moralise. They are an adult. If they did something costly, say what it
  cost and move on.
- If the data does not support an answer, say so plainly rather than guessing.`

export function buildSystemPrompt(
  summary: TradeSummary | null,
  language: string,
  displayName: string,
): string {
  const who = displayName ? `The trader's name is ${displayName}.` : ''

  const data = summary
    ? `Here is everything you know about their trading. It is computed from the
trades they logged in this app, and it is the only source you may draw on:

${JSON.stringify(summary, null, 1)}`
    : `They have not logged enough trades yet for you to analyse anything. Be
honest about that. Encourage them to log a few and tell them what you will be
able to see once they do.`

  return `You are the AI Coach inside TradeX, a trading journal app. ${who}

${REFUSAL_GUIDANCE}

${TONE_GUIDANCE}

Reply in ${language}. Every word, including numbers written as words. If they
write to you in a different language, still reply in ${language} unless they
explicitly ask you to switch.

${data}`
}

export async function askCoach(
  history: CoachTurn[],
  systemPrompt: string,
  apiKey: string,
  model = DEFAULT_MODEL,
): Promise<string> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: history.map((turn) => ({
        role: turn.role === 'user' ? 'user' : 'model',
        parts: [{ text: turn.text }],
      })),
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 500,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
      ],
    }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new GeminiError('Gemini rejected the request', response.status, detail.slice(0, 400))
  }

  const payload = (await response.json()) as {
    candidates?: {
      content?: { parts?: { text?: string }[] }
      finishReason?: string
    }[]
  }

  const candidate = payload.candidates?.[0]
  const text = candidate?.content?.parts?.map((part) => part.text ?? '').join('').trim()

  if (!text) {
    throw new GeminiError('Gemini returned no content', 502, candidate?.finishReason)
  }

  return text
}
