/**
 * Sanity-checks OPENROUTER_API_KEY shape.
 *
 * Deliberately shallow. An earlier version of this file inferred meaning from a
 * Gemini key's prefix, decided a perfectly valid key was a session token, and
 * blocked it. Format tells you almost nothing — only an empty or obviously
 * truncated value is worth flagging here. Everything else is the API's job.
 */

export function describeOpenRouterKey(value) {
  if (!value || value.trim() === '') {
    return { ok: false, note: 'not set' }
  }

  const key = value.trim()

  if (key.length < 20) {
    return {
      ok: false,
      note: `only ${key.length} characters — looks truncated. Copy the whole key from https://openrouter.ai/keys`,
    }
  }

  if (!key.startsWith('sk-or-')) {
    return {
      ok: true,
      note: `unfamiliar prefix "${key.slice(0, 6)}…" — OpenRouter keys usually start sk-or-v1-, but formats change`,
    }
  }

  return { ok: true, note: 'shape looks fine' }
}

export function warnAboutKey(value) {
  const { ok, note } = describeOpenRouterKey(value)
  if (!ok) console.error(`\n  OPENROUTER_API_KEY problem: ${note}\n`)
  return ok
}

/** Guidance for the failures that actually happen with a valid key. */
export const ERROR_HELP = {
  401: 'OpenRouter rejected the key. Check OPENROUTER_API_KEY at https://openrouter.ai/keys',
  402: 'This model needs credits. Use a :free model, or add credits at https://openrouter.ai/credits',
  403: 'That model is not available to this account.',
  429: 'Every model in the fallback chain is rate limited. Free models throttle hard — wait, or set OPENROUTER_MODEL to a paid slug.',
}
