import { readableApiError } from '../lib/api'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  EMOTIONS,
  EMPTY_TRADE,
  MAX_SESSIONS,
  MISTAKE_TAGS,
  SESSIONS,
  SESSION_HOURS,
  SESSION_LABELS,
  SETUPS,
  inconsistencies,
  missingRequired,
  type Compliance,
  type Direction,
  type SizeUnit,
  type TradeEntry,
  type TradingSession,
} from '../data/tradeForm'
import { useToast } from '../lib/toast'
import { Combobox } from './Combobox'
import { Select } from './Select'
import { ArrowDownIcon, ArrowUpIcon, CloseIcon, SpinnerIcon } from './Icons'
import {
  ANSWER,
  COMPLIANCE,
  COMPLIANCE_ROW,
  FIELD,
  FIELD_GRID,
  FIELD_GROUP,
  FIELD_HINT,
  FIELD_LABEL,
  FIELD_LEGEND,
  GROUP_GLYPH,
  INPUT_PAIR,
  MODAL,
  MODAL_BODY,
  MODAL_BUTTONS,
  MODAL_CLOSE,
  MODAL_FOOT,
  MODAL_FORM,
  MODAL_HEAD,
  MODAL_NOTE,
  MODAL_SUB,
  MODAL_TITLE,
  MODAL_WIDE,
  PILL,
  PILL_IDLE,
  PILL_ACCENT,
  TAG_CLOUD,
  TAG_TOGGLE,
  TOGGLE,
  TOGGLE_CHOICE,
  TOGGLE_GROUP,
  TOGGLE_LONG,
  TOGGLE_SHORT,
  YES_NO,
} from './ui'

type QuickAddTradeProps = {
  open: boolean
  onClose: () => void
  onSave: (trade: TradeEntry) => void | Promise<void>
  /**
   * An existing entry to edit. Absent means a new one.
   *
   * The same form serves both: the fields, the validation and the derived
   * figures are identical, and a second copy of a form this size is a second
   * place for them to drift apart.
   */
  initial?: TradeEntry | null
}

/**
 * What to say under the session picker.
 *
 * Three states, because the choice means three different things. Nothing
 * picked is a question the server will answer from the entry time; one is the
 * band that session covers; two is the overlap, which is the case the trader
 * reached for the second button to describe.
 */
function sessionHint(sessions: TradingSession[]): string {
  if (sessions.length === 0) {
    return 'Left unknown, this is worked out from the entry time.'
  }

  if (sessions.length === 1) return SESSION_HOURS[sessions[0]]

  const names = sessions.map((entry) => SESSION_LABELS[entry]).join(' and ')
  return `Held across ${names} — this trade counts towards both.`
}

const COMPLIANCE_ROWS: { key: keyof TradeEntry; label: string }[] = [
  { key: 'compliedEntry', label: 'Entry followed the plan' },
  { key: 'compliedExit', label: 'Exit followed the plan' },
  { key: 'compliedManagement', label: 'Management followed the plan' },
]

export function QuickAddTrade({
  open,
  onClose,
  onSave,
  initial = null,
}: QuickAddTradeProps) {
  const editing = initial !== null
  const dialog = useRef<HTMLDialogElement>(null)
  const [trade, setTrade] = useState<TradeEntry>(EMPTY_TRADE)
  const [showGaps, setShowGaps] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const toast = useToast()
  const formId = useId()

  // <dialog> gives us the focus trap, backdrop and Esc handling for free.
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (open && !node.open) {
      // Seeded on open rather than on every render: the trade being edited is
      // a new object each time the journal reloads, and re-seeding mid-edit
      // would throw away whatever had been typed.
      setTrade(initial ?? EMPTY_TRADE)
      setShowGaps(false)
      setSaveError('')
      node.showModal()
    } else if (!open && node.open) {
      node.close()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function update<K extends keyof TradeEntry>(key: K, value: TradeEntry[K]) {
    setTrade((current) => ({ ...current, [key]: value }))
  }

  function toggleMistake(tag: string) {
    setTrade((current) => ({
      ...current,
      mistakes: current.mistakes.includes(tag)
        ? current.mistakes.filter((existing) => existing !== tag)
        : [...current.mistakes, tag],
    }))
  }

  function toggleSession(value: TradingSession) {
    setTrade((current) => {
      if (current.sessions.includes(value)) {
        return {
          ...current,
          sessions: current.sessions.filter((entry) => entry !== value),
        }
      }

      // The cap is enforced here as well as on the button. The disabled
      // attribute is a hint to the person using the form; this is the rule.
      if (current.sessions.length >= MAX_SESSIONS) return current

      return { ...current, sessions: [...current.sessions, value] }
    })
  }

  function reset() {
    setTrade(EMPTY_TRADE)
    setShowGaps(false)
    setSaveError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    // Both checks before anything is sent. The API refuses an exit that
    // precedes its entry, but its answer names no field, so the form would
    // have nothing to point at.
    if (missingRequired(trade).length > 0 || inconsistencies(trade).length > 0) {
      setShowGaps(true)
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      await onSave(trade)
      // The dialog is about to close, so the confirmation has to live outside it.
      const name = trade.ticker.trim() || 'Your trade'
      toast.success(
        editing ? 'Trade updated' : 'Trade logged',
        editing ? `${name} has been changed.` : `${name} is in the journal.`,
      )
      reset()
      onClose()
    } catch (cause) {
      const message = readableApiError(cause)
      setSaveError(message)
      toast.error('Could not save the trade', message)
    } finally {
      setSaving(false)
    }
  }

  const gaps = missingRequired(trade)
  const wrong = inconsistencies(trade)

  return (
    <dialog
      ref={dialog}
      className={`${MODAL} ${MODAL_WIDE}`}
      aria-labelledby={`${formId}-title`}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click that lands on the dialog itself is a click on the backdrop.
        if (event.target === dialog.current) onClose()
      }}
    >
      <form className={MODAL_FORM} onSubmit={handleSubmit}>
        <header className={MODAL_HEAD}>
          <div>
            <h2 className={MODAL_TITLE} id={`${formId}-title`}>
              {editing ? 'Edit Trade' : 'Log a Trade'}
            </h2>
            <p className={MODAL_SUB}>
              {editing
                ? 'Correcting the record is part of keeping one. The figures are recomputed on save.'
                : 'Execution, context and mindset — the three things that make a journal worth reviewing.'}
            </p>
          </div>
          <button type="button" className={MODAL_CLOSE} onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </header>

        <div className={MODAL_BODY}>
          <fieldset className={FIELD_GROUP}>
            <legend className={FIELD_LEGEND}>
              <span className={GROUP_GLYPH}>&#128202;</span>
              Essential trade data
            </legend>

            <div className={FIELD_GRID}>
              <label className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>
                  Instrument / Ticker <b>*</b>
                </span>
                <input
                  value={trade.ticker}
                  onChange={(event) => update('ticker', event.target.value.toUpperCase())}
                  placeholder="NVDA, EURUSD, ES..."
                  autoComplete="off"
                />
              </label>

              <div className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>Direction</span>
                <div className={TOGGLE_GROUP}>
                  {(['Long', 'Short'] as Direction[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`${TOGGLE} ${
                        trade.direction !== option
                          ? ''
                          : option === 'Long'
                            ? TOGGLE_LONG
                            : TOGGLE_SHORT
                      }`}
                      aria-pressed={trade.direction === option}
                      onClick={() => update('direction', option)}
                    >
                      {option === 'Long' ? <ArrowUpIcon /> : <ArrowDownIcon />}
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <label className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>
                  Position size <b>*</b>
                </span>
                <span className={INPUT_PAIR}>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={trade.size}
                    onChange={(event) => update('size', event.target.value)}
                    placeholder="150"
                  />
                  <Select
                    value={trade.sizeUnit}
                    onChange={(event) => update('sizeUnit', event.target.value as SizeUnit)}
                    aria-label="Size unit"
                  >
                    <option>Shares</option>
                    <option>Lots</option>
                    <option>Contracts</option>
                  </Select>
                </span>
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>
                  Entry price <b>*</b>
                </span>
                <input
                  type="number"
                  step="any"
                  value={trade.entryPrice}
                  onChange={(event) => update('entryPrice', event.target.value)}
                  placeholder="482.10"
                />
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>Exit price</span>
                <input
                  type="number"
                  step="any"
                  value={trade.exitPrice}
                  onChange={(event) => update('exitPrice', event.target.value)}
                  placeholder="Leave blank if still open"
                />
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>
                  Entry timestamp <b>*</b>
                </span>
                <input
                  type="datetime-local"
                  value={trade.entryAt}
                  onChange={(event) => update('entryAt', event.target.value)}
                />
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>Exit timestamp</span>
                <input
                  type="datetime-local"
                  value={trade.exitAt}
                  onChange={(event) => update('exitAt', event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className={FIELD_GROUP}>
            <legend className={FIELD_LEGEND}>
              <span className={GROUP_GLYPH}>&#128204;</span>
              Strategy &amp; risk parameters
            </legend>

            <div className={FIELD_GRID}>
              <label className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>Setup / Strategy ID</span>
                <Combobox
                  value={trade.setup}
                  onChange={(setup) => update('setup', setup)}
                  options={SETUPS}
                  placeholder="Pick one or name your own"
                />
              </label>

              <div className={`${FIELD} col-span-full`}>
                <span className={FIELD_LABEL}>Session</span>
                <div className={TOGGLE_GROUP}>
                  {SESSIONS.map((option) => {
                    const picked = trade.sessions.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={TOGGLE_CHOICE}
                        aria-pressed={picked}
                        // Only the third choice is blocked, and only while two
                        // are already held — so the control reads as full
                        // rather than broken, and any picked session can still
                        // be tapped off to make room.
                        disabled={!picked && trade.sessions.length >= MAX_SESSIONS}
                        onClick={() => toggleSession(option.value)}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
                <span className={FIELD_HINT}>{sessionHint(trade.sessions)}</span>
              </div>

              <label className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>Chart screenshot</span>
                <input
                  type="url"
                  value={trade.screenshot}
                  onChange={(event) => update('screenshot', event.target.value)}
                  placeholder="Paste an image or TradingView link"
                />
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>Stop-loss</span>
                <input
                  type="number"
                  step="any"
                  value={trade.stopLoss}
                  onChange={(event) => update('stopLoss', event.target.value)}
                  placeholder="478.50"
                />
              </label>

              <label className={FIELD}>
                <span className={FIELD_LABEL}>Take-profit</span>
                <input
                  type="number"
                  step="any"
                  value={trade.takeProfit}
                  onChange={(event) => update('takeProfit', event.target.value)}
                  placeholder="494.00"
                />
              </label>

              <label className={`${FIELD} col-span-full`}>
                <span className={FIELD_LABEL}>Catalyst / Rationale</span>
                <textarea
                  rows={3}
                  value={trade.rationale}
                  onChange={(event) => update('rationale', event.target.value)}
                  placeholder="What in your plan made this trade valid?"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className={FIELD_GROUP}>
            <legend className={FIELD_LEGEND}>
              <span className={GROUP_GLYPH}>&#128161;</span>
              Outcome &amp; behavioral metrics
            </legend>

            <div className={FIELD_GRID}>
              <label className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>Emotional state before</span>
                <Select
                  value={trade.emotionBefore}
                  onChange={(event) => update('emotionBefore', event.target.value)}
                >
                  <option value="">Not recorded</option>
                  {EMOTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotion}
                    </option>
                  ))}
                </Select>
              </label>

              <label className={`${FIELD} col-span-2`}>
                <span className={FIELD_LABEL}>Emotional state during</span>
                <Select
                  value={trade.emotionDuring}
                  onChange={(event) => update('emotionDuring', event.target.value)}
                >
                  <option value="">Not recorded</option>
                  {EMOTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotion}
                    </option>
                  ))}
                </Select>
              </label>

              <div className={`${FIELD} col-span-full`}>
                <span className={FIELD_LABEL}>Plan compliance</span>
                <div className={COMPLIANCE}>
                  {COMPLIANCE_ROWS.map((row) => (
                    <div className={COMPLIANCE_ROW} key={row.key}>
                      <span>{row.label}</span>
                      <div className={YES_NO}>
                        {(['yes', 'no'] as Compliance[]).map((answer) => (
                          <button
                            key={answer}
                            type="button"
                            className={`${ANSWER} ${
                              trade[row.key] !== answer
                                ? ''
                                : answer === 'yes'
                                  ? TOGGLE_LONG
                                  : TOGGLE_SHORT
                            }`}
                            aria-pressed={trade[row.key] === answer}
                            onClick={() =>
                              update(row.key, answer as TradeEntry[typeof row.key])
                            }
                          >
                            {answer === 'yes' ? 'Yes' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${FIELD} col-span-full`}>
                <span className={FIELD_LABEL}>Mistakes tag</span>
                <div className={TAG_CLOUD}>
                  {MISTAKE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={TAG_TOGGLE}
                      aria-pressed={trade.mistakes.includes(tag)}
                      onClick={() => toggleMistake(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Last, and deliberately so: the catch-all comes after every
                  question that has its own box, not in competition with them. */}
              <label className={`${FIELD} col-span-full`}>
                <span className={FIELD_LABEL}>Additional notes</span>
                <textarea
                  rows={4}
                  value={trade.notes}
                  onChange={(event) => update('notes', event.target.value)}
                  placeholder="Anything else worth remembering about this trade — what the market was doing, what you were thinking, what you would do differently."
                />
                <span className={FIELD_HINT}>
                  Optional, and for you to read back. The coach works from your
                  numbers, not your prose.
                </span>
              </label>
            </div>
          </fieldset>

        </div>

        <footer className={MODAL_FOOT}>
          <p
            className={MODAL_NOTE}
            role={
              saveError || (showGaps && (gaps.length > 0 || wrong.length > 0))
                ? 'alert'
                : undefined
            }
          >
            {saveError ||
              (showGaps && wrong.length > 0
                ? wrong.join('. ')
                : showGaps && gaps.length > 0
                  ? `Still needed: ${gaps.join(', ')}`
                  : 'Fields marked * are required.')}
          </p>

          <div className={MODAL_BUTTONS}>
            <button type="button" className={`${PILL} ${PILL_IDLE}`} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={`${PILL} ${PILL_ACCENT}`} disabled={saving}>
              {saving && <SpinnerIcon className="animate-spin" size={14} />}
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Save Trade'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
