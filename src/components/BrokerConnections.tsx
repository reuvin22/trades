import { useState, type FormEvent } from 'react'
import {
  connectAccount,
  disconnectAccount,
  pauseConnection,
  useConnections,
  type Connection,
  type Platform,
} from '../lib/connections'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { Select } from './Select'
import { SpinnerIcon } from './Icons'
import {
  CONNECT_ACTION,
  CONNECT_ACTIONS,
  CONNECT_BAD,
  CONNECT_DANGER,
  CONNECT_LIST,
  CONNECT_META,
  CONNECT_NAME,
  CONNECT_NOTE,
  CONNECT_OFF,
  CONNECT_OK,
  CONNECT_ROW,
  CONNECT_STATE,
  CONNECT_WAIT,
  CONNECT_WHY,
  FIELD,
  FIELD_GRID,
  FIELD_HINT,
  FIELD_LABEL,
  PILL,
  PILL_ACCENT,
  SAVE_ERROR,
  SECTION_EMPTY,
} from './ui'

const STATE_STYLE: Record<Connection['state'], string> = {
  connected: CONNECT_OK,
  pending: CONNECT_WAIT,
  failed: CONNECT_BAD,
  disconnected: CONNECT_OFF,
}

const STATE_WORD: Record<Connection['state'], string> = {
  connected: 'Connected',
  pending: 'Connecting…',
  failed: 'Failed',
  disconnected: 'Disconnected',
}

const ago = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

function lastSync(when: Date | null): string {
  if (when === null) return 'never synced'

  const minutes = Math.round((when.getTime() - Date.now()) / 60_000)
  if (minutes > -60) return `synced ${ago.format(minutes, 'minute')}`

  const hours = Math.round(minutes / 60)
  return hours > -24 ? `synced ${ago.format(hours, 'hour')}` : `synced ${ago.format(Math.round(hours / 24), 'day')}`
}

/**
 * Connecting a MetaTrader account, with no download.
 *
 * The form asks for the **investor password** and says so twice — once in the
 * note above it and once under the field. That repetition is deliberate: this
 * is the only place in the app that asks for a credential belonging to another
 * company, and the difference between the investor password and the real one
 * is the entire reason it is reasonable to ask. A trader who does not know
 * that distinction should not be handing anything over, and one who does can
 * see immediately that this cannot trade or withdraw.
 */
export function BrokerConnections({ uid }: { uid: string | null }) {
  const { connections, loading, error, reload } = useConnections(uid)
  const toast = useToast()

  const [platform, setPlatform] = useState<Platform>('mt5')
  const [server, setServer] = useState('')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [label, setLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState('')
  const [working, setWorking] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setFormError('')

    try {
      await connectAccount({
        platform,
        server,
        login,
        investorPassword: password,
        label,
      })

      // Cleared immediately on success — there is no reason for a broker
      // password to sit in a form field after it has been sent.
      setPassword('')
      setServer('')
      setLogin('')
      setLabel('')

      reload()
      toast.success(
        'Account added',
        'Connecting to your broker. This can take a minute.',
      )
    } catch (cause) {
      const message = readableApiError(cause)
      setFormError(message)
      toast.error('Could not connect that account', message)
    } finally {
      setBusy(false)
    }
  }

  async function act(id: string, run: () => Promise<unknown>, done: string) {
    setWorking(id)
    try {
      await run()
      reload()
      toast.success(done)
    } catch (cause) {
      toast.error('That did not work', readableApiError(cause))
    } finally {
      setWorking(null)
    }
  }

  return (
    <>
      <p className={CONNECT_NOTE}>
        Your trades import on their own — nothing to install. RagDex asks for
        your broker&apos;s <strong>investor password</strong>, which is the
        read-only one: it can see your account but{' '}
        <strong>cannot place trades or withdraw money</strong>. You can find it
        in the email your broker sent when you opened the account, or generate a
        new one in their client portal. It is encrypted here and never shown
        again — not even to you.
      </p>

      {connections.length > 0 && (
        <div className={`${CONNECT_LIST} mb-16`}>
          {connections.map((entry) => (
            <div key={entry.id} className={CONNECT_ROW}>
              <span className={CONNECT_NAME}>
                {entry.label || `${entry.platform.toUpperCase()} ${entry.login}`}
                <span className={CONNECT_META}>
                  {entry.server} · {entry.login} · {entry.tradesSynced} trades ·{' '}
                  {entry.paused ? 'paused' : lastSync(entry.lastSyncedAt)}
                </span>
              </span>

              <span
                className={`${CONNECT_STATE} ${
                  entry.paused ? CONNECT_OFF : STATE_STYLE[entry.state]
                }`}
              >
                {entry.paused ? 'Paused' : STATE_WORD[entry.state]}
              </span>

              <span className={CONNECT_ACTIONS}>
                <button
                  type="button"
                  className={CONNECT_ACTION}
                  disabled={working === entry.id}
                  onClick={() =>
                    void act(
                      entry.id,
                      () => pauseConnection(entry.id, !entry.paused),
                      entry.paused ? 'Syncing again' : 'Sync paused',
                    )
                  }
                >
                  {entry.paused ? 'Resume' : 'Pause'}
                </button>

                <button
                  type="button"
                  className={`${CONNECT_ACTION} ${CONNECT_DANGER}`}
                  disabled={working === entry.id}
                  onClick={() =>
                    void act(
                      entry.id,
                      () => disconnectAccount(entry.id),
                      'Account disconnected',
                    )
                  }
                >
                  Disconnect
                </button>
              </span>

              {entry.state === 'failed' && entry.message && (
                <span className={CONNECT_WHY}>{entry.message}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {connections.length === 0 && !loading && (
        <p className={`${SECTION_EMPTY} mb-16`}>
          No accounts connected yet. Add one below and your closed trades start
          appearing in the journal.
        </p>
      )}

      {error && (
        <p className={SAVE_ERROR} role="alert">
          {error}
        </p>
      )}

      {/*
        Its own form element, not part of the settings form around it. A broker
        password must not ride along with an unrelated "Save settings" press,
        and a nested form would be invalid HTML besides.
      */}
      <form className={FIELD_GRID} onSubmit={(event) => void submit(event)}>
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Platform</span>
          <Select
            value={platform}
            onChange={(event) => setPlatform(event.target.value as Platform)}
          >
            <option value="mt5">MetaTrader 5</option>
            <option value="mt4">MetaTrader 4</option>
          </Select>
        </label>

        <label className={FIELD}>
          <span className={FIELD_LABEL}>Server</span>
          <input
            value={server}
            onChange={(event) => setServer(event.target.value)}
            placeholder="ICMarketsSC-MT5"
            autoComplete="off"
            required
          />
          <span className={FIELD_HINT}>
            Exactly as your terminal shows it, under File → Login to Trade
            Account.
          </span>
        </label>

        <label className={FIELD}>
          <span className={FIELD_LABEL}>Account number</span>
          <input
            value={login}
            onChange={(event) => setLogin(event.target.value)}
            placeholder="51234567"
            autoComplete="off"
            required
          />
        </label>

        <label className={FIELD}>
          <span className={FIELD_LABEL}>Investor password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            // Off, deliberately: a browser offering to save this alongside the
            // trader's other logins invites them to store the wrong one.
            autoComplete="off"
            required
          />
          <span className={FIELD_HINT}>
            The read-only password, not your main one. If you paste your trading
            password by mistake, change it at your broker.
          </span>
        </label>

        <label className={`${FIELD} col-span-2`}>
          <span className={FIELD_LABEL}>Name it (optional)</span>
          <input
            value={label}
            onChange={(event) => setLabel(event.target.value)}
            placeholder="FTMO 100k Phase 2"
            autoComplete="off"
          />
        </label>

        {formError && (
          <p className={`${SAVE_ERROR} col-span-2`} role="alert">
            {formError}
          </p>
        )}

        <div className="col-span-2">
          <button type="submit" className={`${PILL} ${PILL_ACCENT}`} disabled={busy}>
            {busy && <SpinnerIcon size={14} />}
            {busy ? 'Connecting…' : 'Connect account'}
          </button>
        </div>
      </form>
    </>
  )
}
