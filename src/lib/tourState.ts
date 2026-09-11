/**
 * Whether this account has been shown the tour.
 *
 * Kept in localStorage rather than on the profile: it is a per-device nicety,
 * not something worth a round trip to the API on every load, and getting
 * it wrong costs the user one dismissable card.
 */

const key = (uid: string) => `ragdex.tour.${uid}`

/**
 * How long after sign-up an account still counts as new.
 *
 * `isNewAccount` alone is not enough: a new trader has to confirm their email
 * before reaching the app, and the reload that follows clears the flag. An
 * account that is a day old and has never seen the tour still wants it.
 */
const NEW_FOR_MS = 24 * 60 * 60 * 1000

export function tourSeen(uid: string): boolean {
  try {
    return localStorage.getItem(key(uid)) === 'done'
  } catch {
    // Private browsing, or storage switched off. Showing the tour again is a
    // far smaller problem than crashing the shell.
    return false
  }
}

export function markTourSeen(uid: string): void {
  try {
    localStorage.setItem(key(uid), 'done')
  } catch {
    // Nothing to do: the tour simply reappears next time.
  }
}

export function accountIsNew(isNewAccount: boolean, createdAt: Date | null): boolean {
  if (isNewAccount) return true
  if (!createdAt) return false
  return Date.now() - createdAt.getTime() < NEW_FOR_MS
}
