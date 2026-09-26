import { useCallback, useEffect, useState } from 'react'
import { apiFetch, date, readableApiError } from './api'

/**
 * The connected trading account, through the API.
 *
 * Tradovate is reached only from the backend — the browser posts a username
 * and password to RagDex and gets back a status, never a token. That is the
 * same rule everything else follows, and it matters more here than usual: a
 * Tradovate access token is the whole account, so the browser is deliberately
 * never given one to lose.
 *
 * Simulation only. The server has no live endpoint to point at, so there is
 * no switch here either.
 */

export type BrokerAccount = {
  id: number
  name: string
  nickname: string
}

export type BrokerConnection = {
  connected: boolean
  broker: string | null
  environment: string | null
  /** The Tradovate login in use, so it can be checked without leaving. */
  username: string
  accounts: BrokerAccount[]
  connectedAt: Date | null
  expiresAt: Date | null
}

type ConnectionWire = Record<string, unknown>

const DISCONNECTED: BrokerConnection = {
  connected: false,
  broker: null,
  environment: null,
  username: '',
  accounts: [],
  connectedAt: null,
  expiresAt: null,
}

function toConnection(wire: ConnectionWire): BrokerConnection {
  return {
    connected: Boolean(wire.connected),
    broker: (wire.broker as string) ?? null,
    environment: (wire.environment as string) ?? null,
    username: String(wire.username ?? ''),
    accounts: Array.isArray(wire.accounts)
      ? wire.accounts.map((entry) => {
          const account = entry as Record<string, unknown>
          return {
            id: Number(account.id ?? 0),
            name: String(account.name ?? ''),
            nickname: String(account.nickname ?? ''),
          }
        })
      : [],
    connectedAt: date(wire.connected_at),
    expiresAt: date(wire.expires_at),
  }
}

/**
 * Hand the credentials over once.
 *
 * The password is not kept anywhere on this side — not in state after this
 * resolves, not in storage, not in a ref. The caller clears its field on
 * success and the server exchanges it for a token it keeps instead.
 */
export async function connectTradovate(
  username: string,
  password: string,
): Promise<BrokerConnection> {
  const wire = await apiFetch<ConnectionWire>('/api/v1/brokers/tradovate', {
    method: 'POST',
    body: { username, password },
  })
  return toConnection(wire)
}

export async function disconnectTradovate(): Promise<void> {
  await apiFetch('/api/v1/brokers/tradovate', { method: 'DELETE' })
}

export type BrokerState = {
  connection: BrokerConnection
  loading: boolean
  error: string | null
  reload: () => void
}

/**
 * The current connection, re-read whenever it changes.
 *
 * The answer carries the request it belongs to rather than `loading` being
 * its own state. Flipping a loading flag on in the effect body is a
 * synchronous setState inside an effect — a cascading render, and the thing
 * `set-state-in-effect` exists to catch. Comparing the answered nonce against
 * the current one says the same thing for free.
 *
 * The previous connection is kept while a reload is in flight, so confirming
 * a connect does not flash the empty form on the way back.
 */
export function useBroker(enabled: boolean): BrokerState {
  const [answered, setAnswered] = useState<{
    nonce: number
    connection: BrokerConnection
    error: string | null
  } | null>(null)

  const [nonce, setNonce] = useState(0)
  const reload = useCallback(() => setNonce((current) => current + 1), [])

  useEffect(() => {
    if (!enabled) return

    const abort = new AbortController()

    apiFetch<ConnectionWire>('/api/v1/brokers', { signal: abort.signal })
      .then((wire) => {
        setAnswered({ nonce, connection: toConnection(wire), error: null })
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setAnswered({
          nonce,
          connection: DISCONNECTED,
          error: readableApiError(cause),
        })
      })

    return () => abort.abort()
  }, [enabled, nonce])

  const fresh = answered !== null && answered.nonce === nonce

  return {
    connection: answered?.connection ?? DISCONNECTED,
    loading: enabled && !fresh,
    error: fresh ? answered.error : null,
    reload,
  }
}
