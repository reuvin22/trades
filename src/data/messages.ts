/**
 * How a person is drawn in the chat dock.
 *
 * Presentation only: a colour, two letters, and a readable name. Who the
 * person actually is comes from the API — see `lib/chat.ts` and
 * `lib/directory.ts` — and nothing about a conversation lives here.
 */

/**
 * The tints a contact can take. Fixed hues rather than theme tokens, so a
 * person keeps the same colour in either theme, and assigned by uid rather
 * than by position so they keep it as the list reorders.
 */
const ACCENTS = ['#6353e8', '#17914f', '#0d8ba4', '#b7791f', '#c2410c', '#9333ea']

/** Stable per-uid, so someone keeps their colour across sessions. */
export function accentFor(uid: string): string {
  let hash = 0
  for (let index = 0; index < uid.length; index += 1) {
    hash = (hash * 31 + uid.charCodeAt(index)) >>> 0
  }
  return ACCENTS[hash % ACCENTS.length]
}

/**
 * Up to two letters for the avatar fallback: initials from a two-part name,
 * otherwise the start of whatever we have. The email is the last resort —
 * an account can exist before it has a display name.
 */
export function initialsFor(name: string, email: string): string {
  const source = name.trim() || email.split('@')[0] || '?'
  const parts = source.split(/[\s._-]+/).filter(Boolean)

  const letters =
    parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2)

  return letters.toUpperCase()
}

/** The name to show for an account that has not set a display name. */
export function displayNameFor(name: string, email: string): string {
  return name.trim() || email.split('@')[0] || 'Trader'
}
