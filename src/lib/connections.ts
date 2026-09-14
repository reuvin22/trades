import { apiFetch, date, readableApiError } from './api'
import { useCallback, useEffect, useState } from 'react'

/**
 * Broker accounts the trader has connected.
 *
 * Note what this module cannot do: read a credential back. The API has no
 * endpoint that returns one and no response model with a field for one, so
 * there is nothing here to fetch. A password is written once, on the way in,
 * and after that only the server can see it.
 */

export type Platform = 'mt4' | 'mt5'
export type ConnectionState = 'pending' | 'connected' | 'failed' | 'disconnected'

export type Connection = {
  id: string
  platform: Platform
  server: string
  login: string
  label: string
  state: ConnectionState
  paused: boolean
  message: string
  createdAt: Date | null
  lastSyncedAt: Date | null
  tradesSynced: number
}

type Wire = Record<string, unknown>

function toConnection(wire: Wire): Connection {
  return {
    id: String(wire.id ?? ''),
    platform: (wire.platform === 'mt4' ? 'mt4' : 'mt5') as Platform,
    server: String(wire.server ?? ''),
    login: String(wire.login ?? ''),
    label: String(wire.label ?? ''),
    state: String(wire.state ?? 'pending') as ConnectionState,
    paused: Boolean(wire.paused),
    message: String(wire.message ?? ''),
    createdAt: date(wire.created_at),
    lastSyncedAt: date(wire.last_synced_at),
    tradesSynced: Number(wire.trades_synced ?? 0),
  }
}

export async function listConnections(): Promise<Connection[]> {
  const wire = await apiFetch<{ items: Wire[] }>('/api/v1/connections')
  return wire.items.map(toConnection)
}

export async function connectAccount(input: {
  platform: Platform
  server: string
  login: string
  investorPassword: string
  label: string
}): Promise<Connection> {
  const wire = await apiFetch<Wire>('/api/v1/connections', {
    method: 'POST',
    body: {
      platform: input.platform,
      server: input.server.trim(),
      login: input.login.trim(),
      investor_password: input.investorPassword,
      label: input.label.trim(),
    },
  })
  return toConnection(wire)
}

export async function renameConnection(id: string, label: string): Promise<Connection> {
  const wire = await apiFetch<Wire>(`/api/v1/connections/${id}`, {
    method: 'PATCH',
    body: { label: label.trim() },
  })
  return toConnection(wire)
}

export async function pauseConnection(id: string, paused: boolean): Promise<Connection> {
  const wire = await apiFetch<Wire>(`/api/v1/connections/${id}`, {
    method: 'PATCH',
    body: { paused },
  })
  return toConnection(wire)
}

export type SyncReport = {
  added: number
  seen: number
}

/**
 * Pull whatever has closed since the last pass.
 *
 * Idempotent, so pressing it twice is free — which is the point of having
 * a button at all. A trader who has just closed a trade should not have to
 * wait on a schedule they cannot see.
 */
export async function syncNow(id: string): Promise<SyncReport> {
  const wire = await apiFetch<Wire>(`/api/v1/connections/${id}/sync`, {
    method: 'POST',
  })
  return {
    added: Number(wire.added ?? 0),
    seen: Number(wire.seen ?? 0),
  }
}

export async function disconnectAccount(id: string): Promise<void> {
  await apiFetch<null>(`/api/v1/connections/${id}`, { method: 'DELETE' })
}

/** How often a pending connection is re-checked, in milliseconds. */
const POLL_MS = 5_000

export type ConnectionsState = {
  connections: Connection[]
  loading: boolean
  error: string
  reload: () => void
}

/**
 * The connected accounts, re-checked while any of them is still settling.
 *
 * Standing an account up at the bridge takes up to a minute and happens out of
 * band, so "pending" resolves without anything the browser did. Polling only
 * while something is pending — rather than on a permanent timer — means a
 * settled list costs nothing.
 */
export function useConnections(uid: string | null): ConnectionsState {
  /*
   * One piece of state holding the uid it belongs to, so `loading` can be
   * derived rather than set. Setting it inside the effect is what
   * `set-state-in-effect` exists to catch — it renders twice, and the same
   * pattern is why useTrades and useProfile are written this way.
   */
  const [state, setState] = useState<{
    uid: string | null
    connections: Connection[]
    error: string
  }>({ uid: null, connections: [], error: '' })

  const [nonce, setNonce] = useState(0)
  const reload = useCallback(() => setNonce((current) => current + 1), [])

  useEffect(() => {
    if (!uid) return

    let live = true

    listConnections()
      .then((items) => {
        if (live) setState({ uid, connections: items, error: '' })
      })
      .catch((cause: unknown) => {
        if (live) setState({ uid, connections: [], error: readableApiError(cause) })
      })

    return () => {
      live = false
    }
  }, [uid, nonce])

  // Derived, so switching accounts never shows the last one's connections.
  const fresh = state.uid === uid
  const connections = fresh ? state.connections : []
  const settling = connections.some((entry) => entry.state === 'pending')

  useEffect(() => {
    if (!settling) return

    const timer = setTimeout(reload, POLL_MS)
    return () => clearTimeout(timer)
  }, [settling, nonce, reload])

  return {
    connections,
    loading: Boolean(uid) && !fresh,
    error: fresh ? state.error : '',
    reload,
  }
}
