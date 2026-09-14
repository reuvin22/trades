import { useEffect, useRef, useState } from 'react'
import {
  decodeCsv,
  FIELD_LABEL,
  FIELDS,
  formatCsv,
  sampleOf,
  suspicions,
  summarise,
  toCanonicalCsv,
  type Analysis,
  type Field,
  type FormatResult,
  type Mapping,
} from '../lib/csvFormat'
import { AlertIcon } from './Icons'
import { saveTrade } from '../lib/trades'
import { apiFetch, readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import { Select } from './Select'
import { CloseIcon, DownloadIcon, SpinnerIcon } from './Icons'
import {
  CSV_ALERT,
  CSV_ALERT_CHECK,
  CSV_ALERT_ITEM,
  CSV_ALERT_STOP,
  CSV_ALERT_TITLE,
  CSV_BODY,
  CSV_DROP,
  CSV_FACT,
  CSV_HEAD,
  CSV_MAP,
  CSV_MAP_EMPTY,
  CSV_MAP_NAME,
  CSV_MAP_PICK,
  CSV_MAP_ROW,
  CSV_PREVIEW,
  CSV_PROBLEMS,
  CSV_READING,
  CSV_SUMMARY,
  CSV_SUMMARY_ITEM,
  CSV_SUMMARY_LABEL,
  CSV_SUMMARY_VALUE,
  CSV_TABLE,
  CSV_UNSURE,
  MODAL,
  MODAL_BODY,
  MODAL_BUTTONS,
  MODAL_CLOSE,
  MODAL_FOOT,
  MODAL_HEAD,
  MODAL_SHELL,
  MODAL_SUB,
  MODAL_TITLE,
  MODAL_WIDE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  SECTION_EMPTY,
} from './ui'

/** Enough to check the mapping is right without scrolling for a minute. */
const PREVIEW_ROWS = 8

/** Shown in the preview, and the ones a wrong mapping is most obvious in. */
const PREVIEW_FIELDS: Field[] = [
  'ticker',
  'direction',
  'size',
  'entryPrice',
  'exitPrice',
  'entryAt',
  'stopLoss',
]

const ORDER_WORDS = {
  dmy: 'day / month / year',
  mdy: 'month / day / year',
  iso: 'year-month-day',
} as const

/**
 * Import a CSV from anywhere, in this system's shape.
 *
 * Every broker exports something different, so the work is not reading a file
 * — it is deciding what each column means and what each value says. That
 * happens in `lib/csvFormat`; this is the part that shows its working.
 *
 * Showing it is the whole design. Two of those decisions ruin data silently
 * when they go wrong: whether a comma was a decimal point, and whether 03/04
 * was March or April. Both are stated at the top, before anything is written,
 * and every guessed column can be corrected from the same screen — re-running
 * the same function, so what is previewed is exactly what gets imported.
 */
export function CsvImport({
  open,
  onClose,
  onImported,
}: {
  open: boolean
  onClose: () => void
  /** Refetch the journal — the imported rows belong in it. */
  onImported: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const toast = useToast()

  // The raw text is kept so a corrected mapping can re-read it without asking
  // for the file again.
  const [text, setText] = useState('')
  const [name, setName] = useState('')
  const [result, setResult] = useState<FormatResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [reading, setReading] = useState(false)
  const [done, setDone] = useState(0)
  /**
   * Which fields the server matched on contents rather than on a header.
   *
   * Marked in the list, because those are the ones worth a glance: a column
   * found by its name is what the exporter said it was, while one found by
   * what is in it is an inference — a good one, but an inference.
   */
  const [guessed, setGuessed] = useState<Set<Field>>(new Set())
  /**
   * Uncertain fields the trader has confirmed by touching the dropdown.
   *
   * Touching it is the confirmation — picking the same column again is still a
   * decision, and it is the only one that can be made here. Import stays shut
   * until every uncertain field has had one.
   */
  const [confirmed, setConfirmed] = useState<Set<Field>>(new Set())

  // In an effect, not during render: a ref holds nothing on the first pass
  // and reading one while rendering is what `react-hooks/refs` exists to
  // catch. The same shape as every other dialog in this app.
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (open && !node.open) node.showModal()
    else if (!open && node.open) node.close()
  }, [open])

  function reset() {
    setText('')
    setName('')
    setResult(null)
    setDone(0)
    setConfirmed(new Set())
  }

  async function read(file: File | null) {
    if (!file) return

    // Not file.text(), which always assumes UTF-8. MetaTrader writes UTF-16
    // and old exports write Windows-1252; both decode as UTF-8 into nonsense
    // that parses rather than failing.
    const body = decodeCsv(await file.arrayBuffer())
    setText(body)
    setName(file.name)

    // Read locally first, so something is on screen immediately and the
    // dialog still works when the API cannot be reached.
    const local = formatCsv(body)
    setResult(local)
    setGuessed(new Set())
    setConfirmed(new Set())

    /*
     * Then ask the server for a second opinion. It reads the contents as well
     * as the headers, which is what handles a misspelled column, two columns
     * with the same name, or no useful header row at all.
     *
     * Only its *mapping* is taken. Converting the values stays here, in the
     * code that is tested and that already ran — two implementations of the
     * same conversion is two answers to the same question.
     */
    setReading(true)
    try {
      const analysis = await apiFetch<Analysis>('/api/v1/imports/analyse', {
        method: 'POST',
        body: sampleOf(body),
      })

      const found = Object.keys(analysis.mapping).length
      if (found > Object.keys(local.mapping).length) {
        setResult(formatCsv(body, analysis.mapping))
        setGuessed(
          new Set(
            (Object.keys(analysis.mapping) as Field[]).filter(
              (field) => (analysis.confidence[field] ?? 1) < 0.8,
            ),
          ),
        )
      }
    } catch {
      // The local reading stands. This is an improvement on it, not a
      // requirement — an import should not fail because an analyser is down.
    } finally {
      setReading(false)
    }
  }

  /** Re-read the same file with one column pointed somewhere else. */
  function remap(field: Field, column: number | null) {
    if (!result) return

    const mapping: Mapping = { ...result.mapping }
    if (column === null) delete mapping[field]
    else mapping[field] = column

    // Choosing is confirming, whichever column was chosen.
    setConfirmed((current) => new Set(current).add(field))
    setResult(formatCsv(text, mapping))
  }

  function download() {
    if (!result) return

    const blob = new Blob([toCanonicalCsv(result.trades)], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = name.replace(/\.csv$/i, '') + '-ragdex.csv'
    link.click()

    URL.revokeObjectURL(url)
  }

  async function importAll() {
    if (!result || result.trades.length === 0) return

    setBusy(true)
    setDone(0)

    let saved = 0
    let failed = 0

    /*
     * One at a time, not all at once. The API rate-limits per minute and a
     * hundred parallel writes would trip it — and a partial import is far
     * easier to reason about when the rows went in the order the file had them.
     */
    for (const trade of result.trades) {
      try {
        await saveTrade(trade)
        saved += 1
      } catch (cause) {
        failed += 1
        // The first failure is the informative one; the rest are usually the
        // same cause repeated.
        if (failed === 1) {
          toast.error('Some rows could not be saved', readableApiError(cause))
        }
      }
      setDone(saved + failed)
    }

    setBusy(false)
    onImported()

    if (saved > 0) {
      toast.success(
        `${saved} ${saved === 1 ? 'trade' : 'trades'} imported`,
        failed > 0 ? `${failed} could not be saved.` : 'They are in your journal now.',
      )
    }

    if (failed === 0) {
      reset()
      onClose()
    }
  }

  const preview = result?.trades.slice(0, PREVIEW_ROWS) ?? []

  /*
   * What the produced trades say about the mapping that produced them.
   *
   * This is the check that matters. Header matching is guesswork however
   * careful, and the way to catch a wrong guess is to look at what it made: a
   * long trade whose stop sits above its entry is not a trade, it is a column
   * pointed at the wrong thing. These stop the import.
   */
  const wrong = result ? suspicions(result.trades) : []
  const overview = result ? summarise(result.trades) : null

  // Fields matched weakly and not yet looked at.
  const unchecked = [...guessed].filter((field) => !confirmed.has(field))

  const blocked = wrong.length > 0 || unchecked.length > 0

  return (
    <dialog
      ref={dialog}
      className={`${MODAL} ${MODAL_WIDE}`}
      aria-labelledby="csv-title"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) {
          reset()
          onClose()
        }
      }}
    >
      <div className={MODAL_SHELL}>
        <div className={MODAL_HEAD}>
          <div>
            <h2 className={MODAL_TITLE} id="csv-title">
              Import trades
            </h2>
            <p className={MODAL_SUB}>
              A CSV from any broker. RagDex works out which column is which.
            </p>
          </div>

          <button
            type="button"
            className={MODAL_CLOSE}
            aria-label="Close"
            disabled={busy}
            onClick={() => {
              reset()
              onClose()
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div className={`${MODAL_BODY} min-h-0 overflow-y-auto`}>
          {result === null ? (
            <>
              <label className={CSV_DROP}>
                <DownloadIcon size={22} className="rotate-180" />
                <span>
                  <strong className="text-fg">Choose a CSV</strong>
                  <br />
                  MetaTrader, cTrader, TradingView, a spreadsheet — any of them.
                </span>
                <input
                  ref={picker}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) => {
                    void read(event.target.files?.[0] ?? null)
                    event.target.value = ''
                  }}
                />
              </label>
            </>
          ) : (
            <>
              {/* What it decided, before anything is written. */}
              <div className={CSV_READING}>
                <span className={CSV_FACT}>
                  <strong>{name}</strong>
                </span>
                <span className={CSV_FACT}>
                  Separator <strong>{result.delimiter === '\t' ? 'tab' : result.delimiter}</strong>
                </span>
                <span className={CSV_FACT}>
                  Decimals <strong>{result.decimalComma ? 'comma' : 'point'}</strong>
                </span>
                <span className={CSV_FACT}>
                  Dates <strong>{ORDER_WORDS[result.dateOrder]}</strong>
                </span>
                <span className={CSV_FACT}>
                  Read <strong>{result.trades.length}</strong> of {result.seen}
                </span>
                {reading && (
                  <span className={CSV_FACT}>
                    <SpinnerIcon size={11} /> Checking the columns…
                  </span>
                )}
              </div>

              <div className={CSV_MAP}>
                {FIELDS.map((field) => (
                  <div key={field} className={CSV_MAP_ROW}>
                    <span className={CSV_MAP_NAME}>
                      {FIELD_LABEL[field]}
                      {guessed.has(field) &&
                        (confirmed.has(field) ? (
                          <span className={CSV_MAP_EMPTY}> · guessed</span>
                        ) : (
                          <span className={CSV_UNSURE}> · check this</span>
                        ))}
                    </span>
                    <span className={CSV_MAP_PICK}>
                      <Select
                        value={result.mapping[field] ?? ''}
                        onChange={(event) =>
                          remap(
                            field,
                            event.target.value === '' ? null : Number(event.target.value),
                          )
                        }
                      >
                        <option value="">— not in this file —</option>
                        {result.headers.map((header, column) => (
                          <option key={column} value={column}>
                            {header || `Column ${column + 1}`}
                          </option>
                        ))}
                      </Select>
                    </span>
                  </div>
                ))}
              </div>

              {wrong.length > 0 && (
                <div className={`${CSV_ALERT} ${CSV_ALERT_STOP}`} role="alert">
                  <p className={CSV_ALERT_TITLE}>
                    <AlertIcon size={14} className="text-red" />
                    These columns look wrong
                  </p>
                  {wrong.map((problem) => (
                    <p key={problem.field} className={CSV_ALERT_ITEM}>
                      <span>{problem.why}</span>
                    </p>
                  ))}
                  <p className={CSV_ALERT_ITEM}>
                    <span>
                      Fix the mapping above. Importing this would put wrong
                      numbers into every statistic in the app.
                    </span>
                  </p>
                </div>
              )}

              {unchecked.length > 0 && wrong.length === 0 && (
                <div className={`${CSV_ALERT} ${CSV_ALERT_CHECK}`}>
                  <p className={CSV_ALERT_TITLE}>
                    <AlertIcon size={14} className="text-amber" />
                    Check {unchecked.length}{' '}
                    {unchecked.length === 1 ? 'column' : 'columns'} before importing
                  </p>
                  <p className={CSV_ALERT_ITEM}>
                    <span>
                      {unchecked.map((field) => FIELD_LABEL[field]).join(', ')} —
                      matched by what is in the column rather than its name.
                      Confirm each one above, even if it is already right.
                    </span>
                  </p>
                </div>
              )}

              {overview && overview.trades > 0 && (
                <div className={CSV_SUMMARY}>
                  <span className={CSV_SUMMARY_ITEM}>
                    <span className={CSV_SUMMARY_LABEL}>Trades</span>
                    <span className={CSV_SUMMARY_VALUE}>
                      {overview.trades} · {overview.longs} long, {overview.shorts} short
                    </span>
                  </span>
                  <span className={CSV_SUMMARY_ITEM}>
                    <span className={CSV_SUMMARY_LABEL}>Symbols</span>
                    <span className={CSV_SUMMARY_VALUE}>
                      {overview.symbols.slice(0, 6).join(', ') || '—'}
                      {overview.symbols.length > 6 && ` +${overview.symbols.length - 6}`}
                    </span>
                  </span>
                  <span className={CSV_SUMMARY_ITEM}>
                    <span className={CSV_SUMMARY_LABEL}>Dates</span>
                    <span className={CSV_SUMMARY_VALUE}>
                      {overview.from ? `${overview.from.slice(0, 10)} → ${overview.to.slice(0, 10)}` : '—'}
                    </span>
                  </span>
                  <span className={CSV_SUMMARY_ITEM}>
                    <span className={CSV_SUMMARY_LABEL}>Prices</span>
                    <span className={CSV_SUMMARY_VALUE}>
                      {overview.priceLow === null
                        ? '—'
                        : `${overview.priceLow} → ${overview.priceHigh}`}
                    </span>
                  </span>
                </div>
              )}

              {preview.length > 0 && (
                <div className={CSV_PREVIEW}>
                  <table className={CSV_TABLE}>
                    <thead className={CSV_HEAD}>
                      <tr>
                        {PREVIEW_FIELDS.map((field) => (
                          <th key={field}>{FIELD_LABEL[field]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className={CSV_BODY}>
                      {preview.map((trade, row) => (
                        <tr key={row}>
                          {PREVIEW_FIELDS.map((field) => (
                            <td key={field}>{String(trade[field] ?? '') || '—'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {result.trades.length === 0 && (
                <p className={SECTION_EMPTY}>
                  Nothing readable yet. Point <strong>Symbol</strong> and{' '}
                  <strong>Direction</strong> at the right columns above — those
                  two are what make a row a trade.
                </p>
              )}

              {result.problems.length > 0 && (
                <div className={CSV_PROBLEMS}>
                  <strong>
                    {result.problems.length}{' '}
                    {result.problems.length === 1 ? 'row was' : 'rows were'} skipped
                  </strong>
                  {result.problems.slice(0, 20).map((problem) => (
                    <div key={problem.row}>
                      Row {problem.row}: {problem.why}
                    </div>
                  ))}
                  {result.problems.length > 20 && <div>…and more.</div>}
                </div>
              )}
            </>
          )}
        </div>

        <div className={MODAL_FOOT}>
          <div className={MODAL_BUTTONS}>
            {result !== null && (
              <>
                <button
                  type="button"
                  className={`${PILL} ${PILL_IDLE}`}
                  onClick={reset}
                  disabled={busy}
                >
                  Choose another
                </button>

                {/*
                  The formatter's real output, downloadable. It is already in
                  the shape the importer expects, so a file corrected in a
                  spreadsheet feeds straight back in with no detection at all.
                */}
                <button
                  type="button"
                  className={`${PILL} ${PILL_IDLE}`}
                  onClick={download}
                  disabled={busy || result.trades.length === 0}
                >
                  <DownloadIcon size={14} />
                  Download tidied CSV
                </button>

                <button
                  type="button"
                  className={`${PILL} ${PILL_ACCENT}`}
                  onClick={() => void importAll()}
                  disabled={busy || result.trades.length === 0 || blocked}
                  title={
                    blocked
                      ? 'Resolve the warnings above first'
                      : undefined
                  }
                >
                  {busy && <SpinnerIcon size={14} />}
                  {busy
                    ? `Importing ${done} of ${result.trades.length}…`
                    : `Import ${result.trades.length}`}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}
