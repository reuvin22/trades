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
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, SpinnerIcon } from './Icons'

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
      reset()
      onClose()
    } catch (cause) {
      setSaveError(readableFirestoreError(cause))
    } finally {
      setSaving(false)
    }
  }

  const gaps = missingRequired(trade)

  return (
    <dialog
      ref={dialog}
      className="modal"
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
      <form className="modal-form" onSubmit={handleSubmit}>
        <header className="modal-head">
          <div>
            <h2 className="modal-title" id={`${formId}-title`}>
              Log a Trade
            </h2>
            <p className="modal-sub">
              Execution, context and mindset — the three things that make a journal
              worth reviewing.
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <PlusIcon size={20} />
          </button>
        </header>

        <div className="modal-body">
          <fieldset className="field-group">
            <legend>
              <span className="group-glyph">&#128202;</span>
              Essential trade data
            </legend>

            <div className="field-grid">
              <label className="field span-2">
                <span className="field-label">
                  Instrument / Ticker <b>*</b>
                </span>
                <input
                  value={trade.ticker}
                  onChange={(event) => update('ticker', event.target.value.toUpperCase())}
                  placeholder="NVDA, EURUSD, ES..."
                  autoComplete="off"
                />
              </label>

              <div className="field span-2">
                <span className="field-label">Direction</span>
                <div className="toggle-group">
                  {(['Long', 'Short'] as Direction[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`toggle ${option.toLowerCase()}${
                        trade.direction === option ? ' is-active' : ''
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

              <label className="field span-2">
                <span className="field-label">
                  Position size <b>*</b>
                </span>
                <span className="input-pair">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={trade.size}
                    onChange={(event) => update('size', event.target.value)}
                    placeholder="150"
                  />
                  <select
                    value={trade.sizeUnit}
                    onChange={(event) => update('sizeUnit', event.target.value as SizeUnit)}
                    aria-label="Size unit"
                  >
                    <option>Shares</option>
                    <option>Lots</option>
                    <option>Contracts</option>
                  </select>
                </span>
              </label>

              <label className="field">
                <span className="field-label">
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

              <label className="field">
                <span className="field-label">Exit price</span>
                <input
                  type="number"
                  step="any"
                  value={trade.exitPrice}
                  onChange={(event) => update('exitPrice', event.target.value)}
                  placeholder="Leave blank if still open"
                />
              </label>

              <label className="field">
                <span className="field-label">
                  Entry timestamp <b>*</b>
                </span>
                <input
                  type="datetime-local"
                  value={trade.entryAt}
                  onChange={(event) => update('entryAt', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Exit timestamp</span>
                <input
                  type="datetime-local"
                  value={trade.exitAt}
                  onChange={(event) => update('exitAt', event.target.value)}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="field-group">
            <legend>
              <span className="group-glyph">&#128204;</span>
              Strategy &amp; risk parameters
            </legend>

            <div className="field-grid">
              <label className="field span-2">
                <span className="field-label">Setup / Strategy ID</span>
                <input
                  list={`${formId}-setups`}
                  value={trade.setup}
                  onChange={(event) => update('setup', event.target.value)}
                  placeholder="Pick one or name your own"
                />
                <datalist id={`${formId}-setups`}>
                  {SETUPS.map((setup) => (
                    <option key={setup} value={setup} />
                  ))}
                </datalist>
              </label>

              <label className="field span-2">
                <span className="field-label">Chart screenshot</span>
                <input
                  type="url"
                  value={trade.screenshot}
                  onChange={(event) => update('screenshot', event.target.value)}
                  placeholder="Paste an image or TradingView link"
                />
              </label>

              <label className="field">
                <span className="field-label">Stop-loss</span>
                <input
                  type="number"
                  step="any"
                  value={trade.stopLoss}
                  onChange={(event) => update('stopLoss', event.target.value)}
                  placeholder="478.50"
                />
              </label>

              <label className="field">
                <span className="field-label">Take-profit</span>
                <input
                  type="number"
                  step="any"
                  value={trade.takeProfit}
                  onChange={(event) => update('takeProfit', event.target.value)}
                  placeholder="494.00"
                />
              </label>

              <label className="field span-4">
                <span className="field-label">Catalyst / Rationale</span>
                <textarea
                  rows={3}
                  value={trade.rationale}
                  onChange={(event) => update('rationale', event.target.value)}
                  placeholder="What in your plan made this trade valid?"
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="field-group">
            <legend>
              <span className="group-glyph">&#128161;</span>
              Outcome &amp; behavioral metrics
            </legend>

            <div className="field-grid">
              <label className="field span-2">
                <span className="field-label">Emotional state before</span>
                <select
                  value={trade.emotionBefore}
                  onChange={(event) => update('emotionBefore', event.target.value)}
                >
                  <option value="">Not recorded</option>
                  {EMOTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotion}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field span-2">
                <span className="field-label">Emotional state during</span>
                <select
                  value={trade.emotionDuring}
                  onChange={(event) => update('emotionDuring', event.target.value)}
                >
                  <option value="">Not recorded</option>
                  {EMOTIONS.map((emotion) => (
                    <option key={emotion} value={emotion}>
                      {emotion}
                    </option>
                  ))}
                </select>
              </label>

              <div className="field span-4">
                <span className="field-label">Plan compliance</span>
                <div className="compliance">
                  {COMPLIANCE_ROWS.map((row) => (
                    <div className="compliance-row" key={row.key}>
                      <span>{row.label}</span>
                      <div className="yes-no">
                        {(['yes', 'no'] as Compliance[]).map((answer) => (
                          <button
                            key={answer}
                            type="button"
                            className={`answer ${answer}${
                              trade[row.key] === answer ? ' is-active' : ''
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

              <div className="field span-4">
                <span className="field-label">Mistakes tag</span>
                <div className="tag-cloud">
                  {MISTAKE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`tag-toggle${
                        trade.mistakes.includes(tag) ? ' is-active' : ''
                      }`}
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

        <footer className="modal-foot">
          <p
            className="modal-note"
            role={saveError || (showGaps && gaps.length > 0) ? 'alert' : undefined}
          >
            {saveError ||
              (showGaps && gaps.length > 0
                ? `Still needed: ${gaps.join(', ')}`
                : 'Fields marked * are required.')}
          </p>

          <div className="modal-buttons">
            <button type="button" className="pill" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="pill is-accent" disabled={saving}>
              {saving && <SpinnerIcon className="spinner" size={14} />}
              {saving ? 'Saving…' : 'Save Trade'}
            </button>
          </div>
        </footer>
      </form>
    </dialog>
  )
}
