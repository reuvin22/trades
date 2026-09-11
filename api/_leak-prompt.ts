import type { TradeSummary } from './_trade-summary'
import { complete, parseJsonReply, type ChatMessage } from './_openrouter'

/**
 * The prompt behind the dashboard's Behavioural Leak card.
 *
 * Kept separate from the request handler so scripts/test-leak.mjs can exercise
 * it without a signed-in session.
 */

export type LeakResult = {
  title: string
  finding: string
  costLabel: string
  severity: 'low' | 'medium' | 'high'
  recommendation: string
}

const SYSTEM_PROMPT = `You are a trading performance coach analysing one trader's journal.

Name the single most expensive BEHAVIOURAL leak — a pattern in how they act, not
a market opinion. Good examples: revenge trading after losses, size creep,
cutting winners early, trading a losing session time, abandoning the plan under
stress, over-trading a setup that does not work for them.

Rules:
- Ground every claim in the supplied numbers, and quote the specific figure.
- Give the cost as a real amount or per-trade expected value that is derivable
  from the data. Never invent a number you were not given.
- If the data shows no meaningful leak, say so plainly and set severity to
  "low". Do not manufacture a problem to seem useful.
- Be direct and concrete. No hedging, no filler, no generic trading advice.
- The trader is an adult professional. Do not moralise or lecture.
- Never show your reasoning. Return the answer only.

Reply with a JSON object and nothing else. No prose, no code fences.

{
  "title": at most four words naming the pattern,
  "finding": at most two sentences — it sits on a dashboard card,
  "costLabel": a short figure such as "-$1,850 this month" or "-$112 per trade",
  "severity": "low" | "medium" | "high",
  "recommendation": one concrete rule they could add to their written plan
}`

export async function generateLeak(
  summary: TradeSummary,
  apiKey: string,
  models?: string[],
): Promise<{ result: LeakResult; model: string }> {
  const messages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Journal statistics (money is in the account's base currency):\n\n${JSON.stringify(
        summary,
        null,
        1,
      )}`,
    },
  ]

  const { text, model } = await complete({
    messages,
    apiKey,
    models,
    temperature: 0.35,
    maxTokens: 1600,
    json: true,
  })

  const parsed = parseJsonReply<Partial<LeakResult>>(text)

  return {
    model,
    result: {
      title: parsed.title?.trim() || 'Pattern found',
      finding: parsed.finding?.trim() || '',
      costLabel: parsed.costLabel?.trim() || '',
      severity:
        parsed.severity === 'high' || parsed.severity === 'medium' ? parsed.severity : 'low',
      recommendation: parsed.recommendation?.trim() || '',
    },
  }
}
