import { useState, type FormEvent } from 'react'
import {
  connectTradovate,
  disconnectTradovate,
  useBroker,
  type BrokerConnection,
} from '../lib/broker'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { SpinnerIcon } from './Icons'
import {
  BROKER_ACCOUNT,
  BROKER_ACCOUNT_ID,
  BROKER_ACCOUNT_NAME,
  BROKER_ACCOUNTS,
  BROKER_ACTIONS,
  BROKER_BADGE,
  BROKER_ERROR,
  BROKER_META,
  BROKER_PANEL,
  BROKER_PANEL_HEAD,
  BROKER_WHO,
  CONNECT_NOTE,
  FIELD,
  FIELD_GRID,
  FIELD_HINT,
  FIELD_LABEL,
  PILL,
  PILL_ACCENT,
} from './ui'

const WHEN = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/**
 * Connecting a Tradovate simulation account.
 *
 * Two things about this screen are load-bearing.
 *
 * **It is simulation only, and it says so twice.** Tradovate has no read-only
 * credential — no equivalent of MetaTrader's investor password, which is what
 * the previous version of this screen leaned on to justify asking for one at
 * all. A Tradovate token is the whole account. Pointing it at the demo
 * environment is what keeps that from mattering, so the trader is told which
 * environment they are in rather than left to assume.
 *
 * **The password is typed, sent, and gone.** It is held in component state
 * only until the request resolves, then cleared. Nothing stores it, and the
 * server does not either — it exchanges it for a token and keeps that
 * instead, which is why reconnecting means typing it again.
 *
 * And, as before: this must be its own element and never nested inside the
 * settings form. A broker credential must not ride along with an unrelated
 * "Save settings" press, and a form inside a form is invalid HTML that
 * silently breaks submit handling on both.
 */
export function BrokerConnections() {
  const { connection, loading, error, reload } = useBroker(true)

  return (
    <>
      <p className={CONNECT_NOTE}>
        <strong>Tradovate simulation accounts only.</strong> Tradovate has no
        read-only password, so a live connection would mean this app holding
        something that can place real orders. Pointing it at the simulation
        environment is what makes asking reasonable — your live account cannot
        be reached from here at all. Your password is used once to get a token
        and <strong>is never stored</strong>.
      </p>

      {loading ? (
        <p className={FIELD_HINT}>Checking for a connected account…</p>
      ) : connection.connected ? (
        <Connected connection={connection} onChanged={reload} />
      ) : (
        <ConnectForm onConnected={reload} />
      )}

      {error && <p className={BROKER_ERROR}>{error}</p>}
    </>
  )
}

function Connected({
  connection,
  onChanged,
}: {
  connection: BrokerConnection
  onChanged: () => void
}) {
  const [working, setWorking] = useState(false)
  const toast = useToast()

  async function disconnect() {
    setWorking(true)
    try {
      await disconnectTradovate()
      toast.success('Tradovate disconnected', 'The stored token has been deleted.')
      onChanged()
    } catch (cause) {
      toast.error('Could not disconnect', readableApiError(cause))
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className={BROKER_PANEL}>
      <div className={BROKER_PANEL_HEAD}>
        <span className={BROKER_WHO}>Tradovate — {connection.username}</span>
        <span className={BROKER_BADGE}>Simulation</span>
      </div>

      <p className={BROKER_META}>
        {connection.connectedAt
          ? `Connected ${WHEN.format(connection.connectedAt)}.`
          : 'Connected.'}{' '}
        {connection.expiresAt
          ? `This token stops working ${WHEN.format(connection.expiresAt)}, after which you will need to connect again.`
          : ''}
      </p>

      {connection.accounts.length > 0 && (
        <div className={BROKER_ACCOUNTS}>
          {connection.accounts.map((account) => (
            <div key={account.id} className={BROKER_ACCOUNT}>
              <span className={BROKER_ACCOUNT_NAME}>
                {account.nickname || account.name}
              </span>
              <span className={BROKER_ACCOUNT_ID}>#{account.id}</span>
            </div>
          ))}
        </div>
      )}

      <div className={BROKER_ACTIONS}>
        <button type="button" className={PILL} onClick={() => void disconnect()}>
          {working && <SpinnerIcon className="animate-spin" size={14} />}
          Disconnect
        </button>
      </div>
    </div>
  )
}

function ConnectForm({ onConnected }: { onConnected: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [working, setWorking] = useState(false)
  const [failure, setFailure] = useState('')
  const toast = useToast()

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (working) return

    setWorking(true)
    setFailure('')

    try {
      await connectTradovate(username.trim(), password)
      // Cleared the moment it is no longer needed, so it is not sitting in
      // component state for the rest of the session.
      setPassword('')
      toast.success('Tradovate connected', 'Your simulation account is linked.')
      onConnected()
    } catch (cause) {
      const message = readableApiError(cause)
      setFailure(message)
      toast.error('Could not connect', message)
    } finally {
      setWorking(false)
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div className={FIELD_GRID}>
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Tradovate username</span>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="yourname"
            autoComplete="username"
            required
          />
          <span className={FIELD_HINT}>
            The same username you use to sign in to Tradovate.
          </span>
        </label>

        <label className={FIELD}>
          <span className={FIELD_LABEL}>Tradovate password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
          <span className={FIELD_HINT}>
            Sent once to get an access token. It is not saved.
          </span>
        </label>

        <div className="col-span-2">
          <button
            type="submit"
            className={`${PILL} ${PILL_ACCENT}`}
            disabled={working || username.trim() === '' || password === ''}
          >
            {working && <SpinnerIcon className="animate-spin" size={14} />}
            {working ? 'Connecting…' : 'Connect simulation account'}
          </button>

          {failure && <p className={BROKER_ERROR}>{failure}</p>}
        </div>
      </div>
    </form>
  )
}
