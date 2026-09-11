/**
 * The one place the front end talks to anything.
 *
 * This is the whole outbound surface of the client. There is no Firebase SDK,
 * no vendor key and no project configuration anywhere in `src/` — the browser
 * knows one address, and every read, write, sign-in and third-party call
 * happens behind it.
 *
 * Identity is a cookie the page cannot read. It is set by the API on sign-in,
 * sent automatically by the browser, and verified server-side on every request
 * with `check_revoked`, so a signed-out session stops working immediately.
 * Nothing here ever sends a uid: the API reads it from the session, and a
 * client that could name the account it acts on would make every ownership
 * check in the service decorative.
 */

/**
 * Same-origin by default, which is what the rewrite in vercel.json arranges.
 *
 * That rewrite is load-bearing rather than cosmetic: a session cookie set by
 * a different site is a third-party cookie, and Safari blocks those outright
 * while Chrome is busy following. Proxying through the app's own origin makes
 * the cookie first-party. Set VITE_API_BASE_URL to point at a local uvicorn.
 */
export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

/** The service answers every failure with one envelope shape. */
type ErrorEnvelope = {
  error?: { code?: string; message?: string; request_id?: string }
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  /** Echoed back by the service; the same id is in its logs. */
  readonly requestId: string | null

  constructor(status: number, code: string, message: string, requestId: string | null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.requestId = requestId
  }

  /** A 401 means the session is gone, not that the request was malformed. */
  get isAuth(): boolean {
    return this.status === 401
  }
}

type Options = {
  method?: string
  body?: unknown
  query?: Record<string, string | number | undefined>
  signal?: AbortSignal
}

/**
 * Performs one authenticated request and returns the parsed body.
 *
 * `null` is returned for 204, which is what DELETE answers with — a caller
 * that expects no content should not have to special-case an empty parse.
 */
export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const { method = 'GET', body, query, signal } = options

  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  const headers: Record<string, string> = {}
  if (body !== undefined) headers['content-type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      // The session cookie is the credential. Without this the browser leaves
      // it off and every request is anonymous.
      credentials: 'include',
    })
  } catch (cause) {
    // A rejected fetch is a network failure, a blocked CORS preflight, or the
    // free instance still waking up — none of which have a status code.
    if (signal?.aborted) throw cause
    throw new ApiError(
      0,
      'unreachable',
      'Cannot reach the API right now. It may be waking up — try again in a moment.',
      null,
    )
  }

  if (response.status === 204) return null as T

  const isJson = response.headers.get('content-type')?.includes('json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const envelope = (payload ?? {}) as ErrorEnvelope
    throw new ApiError(
      response.status,
      envelope.error?.code ?? 'error',
      envelope.error?.message ?? `Request failed (${response.status}).`,
      envelope.error?.request_id ?? null,
    )
  }

  return payload as T
}

/** Turns any thrown value into something worth showing a person. */
export function readableApiError(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return error instanceof Error ? error.message : 'The request failed.'
}

/* ------------------------------------------------------------- conversion */

/**
 * The API is snake_case and the client is camelCase, and neither should bend
 * to the other: these mappers are the seam. They are written out rather than
 * generated from key names so that the type changes that come with the wire
 * format — a Decimal arriving as a string, a datetime as ISO text — are
 * handled in the same place as the rename.
 */

/** Pydantic may send a Decimal as a number or as a string. */
export function num(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

export function date(value: unknown): Date | null {
  if (typeof value !== 'string' || value === '') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** Datetime-local input text ("2024-05-01T14:30") to something ISO-parseable. */
export function toIso(value: string): string | null {
  if (value.trim() === '') return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

/** ISO text back to what a datetime-local input expects. */
export function fromIso(value: unknown): string {
  const parsed = date(value)
  if (!parsed) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}` +
    `T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
  )
}
