import { Select } from './Select'
import {
  CONNECT_NOTE,
  FIELD,
  FIELD_GRID,
  FIELD_HINT,
  FIELD_LABEL,
  PILL,
  PILL_ACCENT,
} from './ui'

/**
 * Connecting a MetaTrader account — the screen, without the plumbing.
 *
 * Deliberately inert: there is no API behind it, nothing is stored, and
 * nothing is sent anywhere. It exists so the shape of the feature is settled —
 * what is asked for, in what order, with what explanation — before any of it
 * is built. Every field is disabled and uncontrolled, so it cannot collect
 * anything even by accident.
 *
 * Two things about it are worth keeping whenever it is wired up.
 *
 * It asks for the **investor password**, and says so plainly. That password is
 * read-only at the broker: it can see an account but cannot place trades or
 * withdraw money. The difference is the entire reason asking is reasonable,
 * and a trader who does not know it exists should not be handing anything
 * over.
 *
 * And it must be its own element, never nested inside the settings form. A
 * broker credential must not ride along with an unrelated "Save settings"
 * press — and a form inside a form is invalid HTML, which silently breaks
 * submit handling on both. That one already cost an afternoon.
 */
export function BrokerConnections() {
  return (
    <>
      <p className={CONNECT_NOTE}>
        <strong>Coming soon.</strong> Your closed trades will import on their
        own — nothing to install. RagDex will ask for your broker&apos;s{' '}
        <strong>investor password</strong>, which is the read-only one: it can
        see your account but{' '}
        <strong>cannot place trades or withdraw money</strong>. Nothing on this
        form is saved or sent anywhere yet.
      </p>

      <div className={FIELD_GRID} aria-describedby="broker-soon">
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Platform</span>
          <Select defaultValue="mt5" disabled>
            <option value="mt5">MetaTrader 5</option>
            <option value="mt4">MetaTrader 4</option>
          </Select>
        </label>

        <label className={FIELD}>
          <span className={FIELD_LABEL}>Server</span>
          <input disabled placeholder="ICMarketsSC-MT5" autoComplete="off" />
          <span className={FIELD_HINT}>
            Exactly as your terminal shows it, under File → Login to Trade
            Account.
          </span>
        </label>

        <label className={FIELD}>
          <span className={FIELD_LABEL}>Account number</span>
          <input disabled placeholder="51234567" autoComplete="off" />
        </label>

        {/*
          No password field, and leaving it out beats disabling one: a control
          that accepts a broker credential should not exist until there is
          somewhere safe for it to go. A disabled input still invites a
          password manager to fill it.
        */}
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Name it (optional)</span>
          <input disabled placeholder="FTMO 100k Phase 2" autoComplete="off" />
        </label>

        <div className="col-span-2">
          <button type="button" className={`${PILL} ${PILL_ACCENT}`} disabled>
            Connect account
          </button>
        </div>
      </div>
    </>
  )
}
