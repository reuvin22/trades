import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  EMOTIONS,
  EMPTY_TRADE,
  MISTAKE_TAGS,
  SETUPS,
  missingRequired,
  type Compliance,
  type Direction,
  type SizeUnit,
  type TradeEntry,
} from '../data/tradeForm'
import { readableFirestoreError } from '../lib/trades'
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
  PILL_ACCENT,
  TAG_ACTIVE,
  TAG_CLOUD,
  TAG_TOGGLE,
  TOGGLE,
  TOGGLE_GROUP,
  TOGGLE_LONG,
  TOGGLE_SHORT,
  YES_NO,
} from './ui'

type QuickAddTradeProps = {
  open: boolean
  onClose: () => void
  onSave: (trade: TradeEntry) => void | Promise<void>
}

const COMPLIANCE_ROWS: { key: keyof TradeEntry; label: string }[] = [
  { key: 'compliedEntry', label: 'Entry followed the plan' },
  { key: 'compliedExit', label: 'Exit followed the plan' },
  { key: 'compliedManagement', label: 'Management followed the plan' },
]

export function QuickAddTrade({ open, onClose, onSave }: QuickAddTradeProps) {
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
      node.showModal()
    } else if (!open && node.open) {
      node.close()
    }
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

  function reset() {
    setTrade(EMPTY_TRADE)
    setShowGaps(false)
    setSaveError('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (missingRequired(trade).length > 0) {
      setShowGaps(true)
      return
    }

    setSaving(true)
    setSaveError('')

    try {
      await onSave(trade)
      // The dialog is about to close, so the confirmation has to live outside it.
      toast.success(
        'Trade logged',
        `${trade.ticker.trim() || 'Your trade'} is in the journal.`,
      )
      reset()
      onClose()
    } catch (cause) {
      const message = readableFirestoreError(cause)
      setSaveError(message)
      toast.error('Could not save the trade', message)
    } finally {
      setSaving(false)
    }
  }

  const gaps = missingRequired(trade)

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
              Log a Trade
            </h2>
            <p className={MODAL_SUB}>
              Execution, context and mindset — the three things that make a journal
              worth reviewing.
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
                      className={`${TAG_TOGGLE} ${trade.mistakes.includes(tag) ? TAG_ACTIVE : ''}`}
                      aria-pressed={trade.mistakes.includes(tag)}
                      onClick={() => toggleMistake(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </fieldset>

        </div>

        <footer className={MODAL_FOOT}>
          <p
            className={MODAL_NOTE}
            role={saveError || (showGaps && gaps.length > 0) ? 'alert' : undefined}
          >
            {saveError ||
              (showGaps && gaps.length > 0
                ? `Still needed: ${gaps.join(', ')}`
                : 'Fields marked * are required.')}
          </p>

          <div className={MODAL_BUTTONS}>
            <button type="button" className={PILL} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={`${PILL} ${PILL_ACCENT}`} disabled={saving}>
              {saving && <SpinnerIcon className="animate-spin" size={14} />}
              {saving ? 'Saving…' : 'Save Trade'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
