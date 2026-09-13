import { useEffect, useRef, useState, type FormEvent } from 'react'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import {
  COMMON_STRATEGIES,
  EDGE_WINDOWS,
  FUNDING_TYPES,
  LEAK_CADENCES,
  MARKET_TYPES,
  saveTradingSetup,
  type FundingType,
  type MarketType,
  type Period,
  type Profile as ProfileRecord,
  type TradingSetup,
} from '../lib/profile'
import { Select } from '../components/Select'
import { CloseIcon, SpinnerIcon } from '../components/Icons'
import {
  CARD,
  EDIT_CHIP,
  EDIT_CHIP_REMOVE,
  FIELD,
  FIELD_GRID,
  FORM_SECTION,
  FIELD_HINT,
  FIELD_LABEL,
  INPUT_PAIR,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  SAVE_ERROR,
  SAVE_BAR,
  SECTION_TITLE,
  TAG_CLOUD,
  TAG_TOGGLE,
} from '../components/ui'

type SettingsProps = {
  profile: ProfileRecord | null
  /**
   * Re-read the account record after a save.
   *
   * Without it the server has the new setups and the rest of the app does not:
   * the journal filter and the trade form both read their list out of the
   * profile held in App, which nothing was refreshing. Saving appeared to do
   * nothing until a full page reload.
   */
  onSaved: () => void
}

/**
 * How this trader trades, in their own words and numbers.
 *
 * None of this is decoration. Until it is filled in the coach can see that a
 * position was larger than the last one but cannot say it broke a limit,
 * because it does not know of any limit — so "be more disciplined" is the only
 * thing left to say, which is the advice this app exists to avoid giving.
 * Every field here turns a vague observation into a specific one.
 *
 * Percentages rather than cash for the risk limits: they survive the account
 * changing size, which it will.
 */

/** Text in the box, not the number. Kept separate so a half-typed "1." is not
 *  parsed into something surprising while it is being typed. */
type Draft = {
  marketType: MarketType | ''
  fundingType: FundingType | ''
  propFirm: string
  accountSize: string
  riskPerTradePct: string
  maxDailyLossPct: string
  targetR: string
  maxTradesPerDay: string
  strategies: string[]
  tradingRules: string
  leakCadence: Period
  edgeWindow: Period
}

function toDraft(record: ProfileRecord | null): Draft {
  const text = (value: number | null | undefined) =>
    value === null || value === undefined ? '' : String(value)

  return {
    marketType: record?.marketType ?? '',
    fundingType: record?.fundingType ?? '',
    propFirm: record?.propFirm ?? '',
    accountSize: text(record?.accountSize),
    riskPerTradePct: text(record?.riskPerTradePct),
    maxDailyLossPct: text(record?.maxDailyLossPct),
    targetR: text(record?.targetR),
    maxTradesPerDay: text(record?.maxTradesPerDay),
    strategies: record?.strategies ?? [],
    tradingRules: record?.tradingRules ?? '',
    leakCadence: record?.leakCadence ?? 'daily',
    edgeWindow: record?.edgeWindow ?? 'monthly',
  }
}

/** Blank means "not set", which is different from zero and must stay so. */
function toNumber(value: string): number | null {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : null
}

function toSetup(draft: Draft): TradingSetup {
  return {
    marketType: draft.marketType === '' ? null : draft.marketType,
    fundingType: draft.fundingType === '' ? null : draft.fundingType,
    propFirm: draft.propFirm.trim(),
    accountSize: toNumber(draft.accountSize),
    riskPerTradePct: toNumber(draft.riskPerTradePct),
    maxDailyLossPct: toNumber(draft.maxDailyLossPct),
    targetR: toNumber(draft.targetR),
    maxTradesPerDay: toNumber(draft.maxTradesPerDay),
    strategies: draft.strategies,
    tradingRules: draft.tradingRules.trim(),
    leakCadence: draft.leakCadence,
    edgeWindow: draft.edgeWindow,
  }
}

export function Settings({ profile, onSaved }: SettingsProps) {
  const [draft, setDraft] = useState<Draft>(() => toDraft(profile))

  /*
   * Seed the form once the account record actually arrives.
   *
   * The initialiser above runs on the first render only, and on that render
   * the profile is usually still being fetched — so the form filled itself
   * with defaults and stayed that way. Everything typed into it then saved
   * correctly, but every field left alone saved as a blank over whatever was
   * already there, which is why this page looked like it accepted nothing.
   *
   * Keyed on the uid rather than the object: useProfile hands back a new
   * object on every reload, and re-seeding on each one would wipe whatever was
   * half-typed when the save that triggered the reload came back.
   */
  const seeded = useRef<string | null>(null)

  useEffect(() => {
    if (!profile || seeded.current === profile.uid) return
    seeded.current = profile.uid
    setDraft(toDraft(profile))
  }, [profile])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [newStrategy, setNewStrategy] = useState('')
  const toast = useToast()

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  /**
   * Pick the behavioural cadence, moving the other span out of the way.
   *
   * The two must differ, and the select below simply hides whatever is chosen
   * here. Hiding the selected option without changing it would leave a select
   * showing a value that is not in its own list — so when they collide, the
   * second one moves to the first span still free.
   */
  function chooseCadence(value: Period) {
    setDraft((current) => ({
      ...current,
      leakCadence: value,
      edgeWindow:
        current.edgeWindow === value
          ? (EDGE_WINDOWS.find((window) => window.value !== value)?.value ?? 'monthly')
          : current.edgeWindow,
    }))
  }

  /**
   * Add a setup to the list, from the suggestions or typed in.
   *
   * Case-insensitive on the way in: "Breakout" and "breakout" are the same
   * setup to a person, and letting both onto the list would split their trades
   * into two buckets that each look half as significant as the truth.
   */
  function addStrategy(name: string) {
    const trimmed = name.trim()
    if (trimmed === '') return

    setDraft((current) =>
      current.strategies.some(
        (entry) => entry.toLowerCase() === trimmed.toLowerCase(),
      )
        ? current
        : { ...current, strategies: [...current.strategies, trimmed] },
    )
    setNewStrategy('')
  }

  function removeStrategy(name: string) {
    setDraft((current) => ({
      ...current,
      strategies: current.strategies.filter((entry) => entry !== name),
    }))
  }

  // The stock list, minus anything already chosen.
  const suggestions = COMMON_STRATEGIES.filter(
    (name) =>
      !draft.strategies.some((entry) => entry.toLowerCase() === name.toLowerCase()),
  )

  const capital = toNumber(draft.accountSize)
  const risk = toNumber(draft.riskPerTradePct)
  // The percentage is what they set; the cash figure is what they feel, and
  // seeing it is usually what makes someone change the number.
  const perTrade =
    capital !== null && risk !== null ? Math.round((capital * risk) / 100) : null

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setSaveError('')

    try {
      await saveTradingSetup(toSetup(draft))
      onSaved()
      toast.success('Settings saved', 'The coach will hold you to these.')
    } catch (cause) {
      const message = readableApiError(cause)
      setSaveError(message)
      toast.error('Could not save your settings', message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Settings</h2>
          <p className={PAGE_SUB}>
            How you trade, and the limits you hold yourself to. The coach measures
            your execution against these, so a trade that crosses one broke a rule
            you wrote rather than an opinion it formed.
          </p>
        </div>
      </div>

      <section className={`${CARD} ${FORM_SECTION}`}>
        <h3 className={SECTION_TITLE}>What you trade</h3>

        <div className={FIELD_GRID}>
          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Market</span>
            <Select
              value={draft.marketType}
              onChange={(event) =>
                update('marketType', event.target.value as MarketType | '')
              }
            >
              <option value="">Not set</option>
              {MARKET_TYPES.map((market) => (
                <option key={market.value} value={market.value}>
                  {market.label}
                </option>
              ))}
            </Select>
          </label>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Account</span>
            <Select
              value={draft.fundingType}
              onChange={(event) =>
                update('fundingType', event.target.value as FundingType | '')
              }
            >
              <option value="">Not set</option>
              {FUNDING_TYPES.map((funding) => (
                <option key={funding.value} value={funding.value}>
                  {funding.label}
                </option>
              ))}
            </Select>
            <span className={FIELD_HINT}>
              {FUNDING_TYPES.find((entry) => entry.value === draft.fundingType)
                ?.blurb ?? 'Whose money is at risk changes what good advice looks like.'}
            </span>
          </label>

          {draft.fundingType === 'prop_firm' && (
            <label className={`${FIELD} col-span-full`}>
              <span className={FIELD_LABEL}>Which firm</span>
              <input
                value={draft.propFirm}
                onChange={(event) => update('propFirm', event.target.value)}
                placeholder="FTMO, Topstep, MyForexFunds…"
                autoComplete="off"
              />
              <span className={FIELD_HINT}>
                Named, so the coach knows a drawdown breach ends the account rather
                than denting it.
              </span>
            </label>
          )}
        </div>
      </section>

      <section className={`${CARD} ${FORM_SECTION}`}>
        <h3 className={SECTION_TITLE}>Risk management</h3>

        <div className={FIELD_GRID}>
          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Total capital</span>
            <input
              type="number"
              step="any"
              min="0"
              value={draft.accountSize}
              onChange={(event) => update('accountSize', event.target.value)}
              placeholder="50000"
            />
          </label>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Max risk per trade (%)</span>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              value={draft.riskPerTradePct}
              onChange={(event) => update('riskPerTradePct', event.target.value)}
              placeholder="1"
            />
            <span className={FIELD_HINT}>
              {perTrade === null
                ? 'A percentage rather than a cash figure, so it survives the account changing size.'
                : `About ${perTrade.toLocaleString()} a trade at your current capital.`}
            </span>
          </label>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Daily loss limit (%)</span>
            <input
              type="number"
              step="any"
              min="0"
              max="100"
              value={draft.maxDailyLossPct}
              onChange={(event) => update('maxDailyLossPct', event.target.value)}
              placeholder="3"
            />
            <span className={FIELD_HINT}>The point where the day is over.</span>
          </label>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Reward per unit of risk (R)</span>
            <input
              type="number"
              step="any"
              min="0"
              value={draft.targetR}
              onChange={(event) => update('targetR', event.target.value)}
              placeholder="2"
            />
            <span className={FIELD_HINT}>
              2 means risking one to make two. This is what you plan, not what you
              get — the journal already knows what you got.
            </span>
          </label>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Max trades per day</span>
            <input
              type="number"
              step="1"
              min="0"
              value={draft.maxTradesPerDay}
              onChange={(event) => update('maxTradesPerDay', event.target.value)}
              placeholder="6"
            />
            <span className={FIELD_HINT}>
              A circuit breaker against overtrading. Leave blank if you do not cap
              it.
            </span>
          </label>
        </div>
      </section>

      <section className={`${CARD} ${FORM_SECTION}`}>
        <h3 className={SECTION_TITLE}>Strategies and rules</h3>

        <div className={FIELD_GRID}>
          <div className={`${FIELD} col-span-full`}>
            <span className={FIELD_LABEL}>Setups you trade</span>

            {draft.strategies.length > 0 && (
              <div className={TAG_CLOUD}>
                {draft.strategies.map((name) => (
                  <span key={name} className={EDIT_CHIP}>
                    {name}
                    <button
                      type="button"
                      className={EDIT_CHIP_REMOVE}
                      onClick={() => removeStrategy(name)}
                      aria-label={`Remove ${name}`}
                    >
                      <CloseIcon size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Suggestions, not the list itself. Whatever is already on the
                list drops out of here — offering it again reads as a second,
                unselected copy of a setup they have already chosen. */}
            {suggestions.length > 0 && (
              <div className={TAG_CLOUD}>
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className={TAG_TOGGLE}
                    onClick={() => addStrategy(name)}
                  >
                    + {name}
                  </button>
                ))}
              </div>
            )}

            <span className={INPUT_PAIR}>
              <input
                value={newStrategy}
                onChange={(event) => setNewStrategy(event.target.value)}
                // Enter adds rather than submitting the whole form, which is
                // the reflex after typing into a field like this.
                onKeyDown={(event) => {
                  if (event.key !== 'Enter') return
                  event.preventDefault()
                  addStrategy(newStrategy)
                }}
                placeholder="Add your own — ICT silver bullet, judas swing…"
                aria-label="Add a setup"
                autoComplete="off"
              />
              <button
                type="button"
                className={`${PILL} ${PILL_IDLE}`}
                onClick={() => addStrategy(newStrategy)}
                disabled={newStrategy.trim() === ''}
              >
                Add
              </button>
            </span>

            <span className={FIELD_HINT}>
              What you mean to trade. These are the setups the journal offers you
              when logging a trade, and the ones it filters by — so the list should
              be yours, not ours.
            </span>
          </div>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Read how I&apos;m trading</span>
            <Select
              value={draft.leakCadence}
              onChange={(event) => chooseCadence(event.target.value as Period)}
            >
              {LEAK_CADENCES.map((cadence) => (
                <option key={cadence.value} value={cadence.value}>
                  {cadence.label}
                </option>
              ))}
            </Select>
            <span className={FIELD_HINT}>
              {LEAK_CADENCES.find((entry) => entry.value === draft.leakCadence)?.blurb}{' '}
              The card keeps the last reading in between, and its refresh button
              re-runs it whenever you want.
            </span>
          </label>

          <label className={`${FIELD} col-span-2`}>
            <span className={FIELD_LABEL}>Read what&apos;s working</span>
            <Select
              value={draft.edgeWindow}
              onChange={(event) => update('edgeWindow', event.target.value as Period)}
            >
              {/* The span already given to the behavioural reading is not
                  offered here. Two cards over the same window tell you the
                  same thing twice. */}
              {EDGE_WINDOWS.filter((window) => window.value !== draft.leakCadence).map(
                (window) => (
                  <option key={window.value} value={window.value}>
                    {window.label}
                  </option>
                ),
              )}
            </Select>
            <span className={FIELD_HINT}>
              {EDGE_WINDOWS.find((entry) => entry.value === draft.edgeWindow)?.blurb}{' '}
              Worked out in the browser as you look, so this is the stretch it
              ranks over rather than a schedule.
            </span>
          </label>

          <label className={`${FIELD} col-span-full`}>
            <span className={FIELD_LABEL}>Your non-negotiable rules</span>
            <textarea
              rows={6}
              value={draft.tradingRules}
              onChange={(event) => update('tradingRules', event.target.value)}
              placeholder={
                'No trading in the first five minutes.\nStop goes on before the entry.\nTwo losses and I stop for the day.'
              }
            />
            <span className={FIELD_HINT}>
              In your own words, one per line. These are the rules you will be held
              to — so write the ones you actually break, not the ones that sound
              good.
            </span>
          </label>
        </div>
      </section>

      {saveError && (
        <p className={SAVE_ERROR} role="alert">
          {saveError}
        </p>
      )}

      <div className={SAVE_BAR}>
        <button type="submit" className={`${PILL} ${PILL_ACCENT}`} disabled={saving}>
          {saving && <SpinnerIcon size={14} />}
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </form>
  )
}
