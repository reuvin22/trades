import { apiFetch } from './api'
import { prepareImage } from './chartImage'

import { uploadAllowed } from './entitlements'
/**
 * Putting an image in storage, from the browser.
 *
 * Two steps and one rule. The API is asked for a slot; it answers with a URL
 * that permits exactly one PUT, of one size, of one type, for a few minutes.
 * The bytes then go straight to R2 — the only request this app makes to
 * anywhere but its own API, and the reason is size: ten megabytes through a
 * free-tier instance twice over buys nothing, since the API's job is deciding
 * whether an upload is allowed rather than carrying it.
 *
 * What comes back and gets stored is a *key*, never a URL. The bucket is
 * private and every read URL expires, so a stored URL would be a link that
 * works for ten minutes and then quietly does not.
 */

/** The four folders the bucket has. Mirrors UploadKind on the API. */
export type UploadKind = 'profile' | 'charts' | 'ai' | 'messages'

/**
 * Whether a stored value is a link someone pasted rather than a key of ours.
 *
 * The one place this distinction is made, because every caller has to agree
 * on it: a field holding either kind is only unambiguous while one function
 * decides which is which.
 */
export function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value)
}

type Slot = { key: string; url: string; expires_in: number }

/**
 * Sizes per purpose, in pixels on the long edge and characters of data URL.
 *
 * All well under the API's 10MB ceiling. That ceiling is the point past which
 * an upload is refused; these are the point past which it stops being worth
 * the bytes. An avatar rendered at 44px does not need 4000 across.
 */
const BUDGETS: Record<UploadKind, { maxEdge: number; maxCharacters: number }> = {
  profile: { maxEdge: 512, maxCharacters: 400_000 },
  charts: { maxEdge: 1_600, maxCharacters: 2_000_000 },
  ai: { maxEdge: 1_400, maxCharacters: 170_000 },
  messages: { maxEdge: 1_000, maxCharacters: 120_000 },
}

/** A data URL back to the bytes it stands for. */
function toBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(',')
  const type = header.slice(header.indexOf(':') + 1, header.indexOf(';'))
  const binary = atob(encoded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return new Blob([bytes], { type })
}

/**
 * Store one image and return its key.
 *
 * `onProgress` exists because this is the slowest thing the app does from a
 * click: shrinking runs on the main thread and the upload is a real network
 * round trip. A caller with nothing to show for that time has a button that
 * looks broken.
 */
export async function uploadImage(
  file: File,
  kind: UploadKind,
  onProgress?: (stage: 'preparing' | 'uploading') => void,
): Promise<string> {
  if (!uploadAllowed(kind)) throw new Error('Your plan does not include this upload.')
  onProgress?.('preparing')
  const shrunk = await prepareImage(file, BUDGETS[kind])
  const blob = toBlob(shrunk)

  onProgress?.('uploading')
  const slot = await apiFetch<Slot>('/api/v1/uploads', {
    method: 'POST',
    body: { kind, content_type: blob.type, content_length: blob.size },
  })

  const response = await fetch(slot.url, {
    method: 'PUT',
    body: blob,
    // Both are signed into the URL, so they must match exactly or R2 rejects
    // the signature. Content-Length the browser sets itself from the blob.
    headers: { 'Content-Type': blob.type },
  })

  if (!response.ok) {
    // The body is R2's XML and means nothing to anyone here.
    throw new Error('The image could not be uploaded. Try again in a moment.')
  }

  return slot.key
}

/**
 * A readable URL for a stored key, cached until shortly before it expires.
 *
 * Without the cache every render of a journal table would ask the API to sign
 * each screenshot again. The margin is deliberate: a URL that expires while
 * the image is still being fetched is a broken image, so it is replaced with
 * time to spare.
 */
const signed = new Map<string, { url: string; until: number }>()

export async function imageUrl(key: string): Promise<string> {
  // A pasted http(s) link is already a URL and was never ours to sign.
  if (/^https?:\/\//i.test(key)) return key
  // Charts, coach images and chat attachments belong to features a plan may
  // not include; reading one is as much a request as uploading it.
  if (!uploadAllowed(key.split('/')[0])) throw new Error('Your plan does not include this image.')

  const cached = signed.get(key)
  if (cached && cached.until > Date.now()) return cached.url

  const { url, expires_in } = await apiFetch<{ url: string; expires_in: number }>(
    '/api/v1/uploads/url',
    { query: { key } },
  )

  signed.set(key, { url, until: Date.now() + (expires_in - 60) * 1000 })
  return url
}

/** Drop every cached URL. Called on sign-out, like the message keys. */
export function forgetImageUrls(): void {
  signed.clear()
}
