import { apiFetch } from './api'

/**
 * Message encryption, done in the browser.
 *
 * Chat writes straight to the Realtime Database over a websocket — that is what
 * makes a message land in under a second — so the API never handles one and
 * could not encrypt it if it wanted to. The browser does it instead, which
 * keeps the speed and still leaves ciphertext in the database.
 *
 * Be exact about what this protects. The key is derived by the API from the
 * thread id, so the server can derive any conversation's key and could read any
 * conversation: this is **not** end-to-end encryption. What it does is make
 * stored messages unreadable to anyone who reaches the database rather than the
 * application — the Firebase console, a backup, a leaked service account. That
 * was the actual complaint: message text sitting in plain sight in the console.
 *
 * AES-256-GCM, which is authenticated — a tampered message fails to open rather
 * than decrypting into something plausible and wrong.
 */

/** Version tag. A different scheme gets a different one, and `decrypt` can keep
 *  reading the old while new messages use the new. */
const PREFIX = 'enc.v1.'

/** GCM's recommended nonce length, fresh for every message. */
const NONCE_BYTES = 12

/**
 * Keys are fetched once per conversation and kept for the tab's lifetime.
 *
 * In memory only — never localStorage. A key on disk outlives the session that
 * earned it and is readable by anything that can run script on this origin,
 * which would give away most of what the encryption is for.
 */
const keys = new Map<string, Promise<CryptoKey>>()

/**
 * Base64 to bytes, url-safe alphabet included — the API returns keys that way
 * so they survive a path segment without escaping.
 *
 * Built on an explicit ArrayBuffer rather than `Uint8Array.from`, because
 * WebCrypto's types demand a concrete buffer and `from` produces the wider
 * `ArrayBufferLike`.
 */
function toBytes(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64.replace(/-/g, '+').replace(/_/g, '/'))
  const bytes = new Uint8Array(new ArrayBuffer(binary.length))

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
}

/** The key for one conversation, fetched once and remembered. */
function keyFor(uid: string): Promise<CryptoKey> {
  const existing = keys.get(uid)
  if (existing) return existing

  const pending = apiFetch<{ key: string }>(`/api/v1/chat/key/${uid}`)
    .then((body) =>
      crypto.subtle.importKey('raw', toBytes(body.key), 'AES-GCM', false, [
        'encrypt',
        'decrypt',
      ]),
    )
    .catch((cause: unknown) => {
      // Do not cache a failure: a request that failed because the API was
      // waking up should be retried, not remembered as broken for the session.
      keys.delete(uid)
      throw cause
    })

  keys.set(uid, pending)
  return pending
}

/** Encrypt one message for the conversation with `uid`. */
export async function encryptMessage(uid: string, text: string): Promise<string> {
  const key = await keyFor(uid)
  const nonce = crypto.getRandomValues(new Uint8Array(NONCE_BYTES))

  const sealed = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      new TextEncoder().encode(text),
    ),
  )

  const payload = new Uint8Array(nonce.length + sealed.length)
  payload.set(nonce)
  payload.set(sealed, nonce.length)

  return PREFIX + toBase64(payload)
}

/**
 * Decrypt a message, or pass it through if it was never encrypted.
 *
 * Passing plaintext through is what lets this be switched on over a database
 * that already holds messages — the conversations written before today keep
 * rendering instead of turning into errors.
 *
 * A message that *claims* to be encrypted and will not open shows a placeholder
 * rather than raw ciphertext or a thrown error: one unreadable message should
 * not take the whole thread down with it.
 */
export async function decryptMessage(uid: string, text: string): Promise<string> {
  if (!text.startsWith(PREFIX)) return text

  try {
    const key = await keyFor(uid)
    const payload = toBytes(text.slice(PREFIX.length))

    const opened = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: payload.slice(0, NONCE_BYTES) },
      key,
      payload.slice(NONCE_BYTES),
    )

    return new TextDecoder().decode(opened)
  } catch {
    return 'This message could not be decrypted.'
  }
}

/** Drop every cached key. Called on sign-out, so the next session fetches its own. */
export function forgetKeys(): void {
  keys.clear()
}
