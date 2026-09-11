/**
 * OpenRouter client. OpenAI-compatible chat completions.
 *
 * The key is a real secret (sk-or-v1-…), so it is read from process.env on the
 * server only — never VITE_-prefixed, never imported from src/.
 */

export class OpenRouterError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detail?: string,
  ) {
    super(message)
    this.name = 'OpenRouterError'
  }
}

/**
 * Free models rate-limit hard and independently, so the request carries a list
 * and OpenRouter falls through to the next one on 429. Ordered fastest-first;
 * every entry was checked to answer without leaking its own reasoning.
 */
export const DEFAULT_MODELS = [
  'meta-llama/llama-3.2-3b-instruct',
  'nex-agi/nex-n2.5-mini:free',
  'nex-agi/nex-n2.5-pro:free',
]

export function configuredModels(): string[] {
  const configured = process.env.OPENROUTER_MODEL
  if (!configured) return DEFAULT_MODELS

  // Accept either a single slug or a comma-separated fallback chain.
  return configured
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

type CompleteOptions = {
  messages: ChatMessage[]
  apiKey: string
  models?: string[]
  temperature?: number
  maxTokens?: number
  /** Ask the provider to emit a JSON object rather than prose. */
  json?: boolean
}

/** Some open models emit chain-of-thought tags; never show those to a user. */
function stripReasoning(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '')
    .trim()
}

export async function complete({
  messages,
  apiKey,
  models = configuredModels(),
  temperature = 0.6,
  maxTokens = 1200,
  json = false,
}: CompleteOptions): Promise<{ text: string; model: string }> {
  const body: Record<string, unknown> = {
    messages,
    temperature,
    max_tokens: maxTokens,
    // Several free models think in a separate `reasoning` field before writing
    // anything to `content`, and those tokens count against max_tokens. Keeping
    // reasoning on measurably improves the arithmetic, so budget for it and
    // simply never return it.
    reasoning: { exclude: true },
  }

  if (models.length === 1) body.model = models[0]
  else body.models = models

  if (json) body.response_format = { type: 'json_object' }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
      // OpenRouter uses these for attribution on its dashboard.
      'HTTP-Referer': process.env.APP_URL ?? 'http://localhost:5173',
      'X-Title': 'RadEx',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new OpenRouterError(
      'OpenRouter rejected the request',
      response.status,
      detail.slice(0, 400),
    )
  }

  const payload = (await response.json()) as {
    model?: string
    choices?: {
      message?: { content?: string | null; reasoning?: string | null }
      finish_reason?: string
    }[]
    error?: { message?: string }
  }

  if (payload.error) {
    throw new OpenRouterError(payload.error.message ?? 'OpenRouter returned an error', 502)
  }

  const choice = payload.choices?.[0]
  const text = stripReasoning(choice?.message?.content ?? '')

  if (text === '') {
    const reason = choice?.finish_reason ?? 'empty response'
    throw new OpenRouterError(
      reason === 'length'
        ? 'The model ran out of tokens before answering. Raise maxTokens.'
        : 'OpenRouter returned no content',
      502,
      reason,
    )
  }

  return { text, model: payload.model ?? models[0] }
}

/** Parses a JSON reply, tolerating the code fences some models add anyway. */
export function parseJsonReply<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = (fenced?.[1] ?? text).trim()

  try {
    return JSON.parse(candidate) as T
  } catch {
    // Last resort: the outermost object in the response.
    const start = candidate.indexOf('{')
    const end = candidate.lastIndexOf('}')
    if (start !== -1 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1)) as T
    }
    throw new OpenRouterError('The model returned malformed JSON', 502)
  }
}

/** Human-readable guidance for the failures that actually happen. */
export function explainOpenRouterError(error: OpenRouterError): string {
  switch (error.status) {
    case 401:
      return 'OpenRouter rejected the API key. Check OPENROUTER_API_KEY.'
    case 402:
      return 'This model needs credits on your OpenRouter account. Use a :free model or add credits.'
    case 429:
      return 'Every model in the fallback chain is rate limited right now. Try again shortly.'
    case 403:
      return 'That model is not available to this account.'
    default:
      return 'The analysis service could not complete the request.'
  }
}
