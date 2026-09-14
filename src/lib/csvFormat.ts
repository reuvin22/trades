import { EMPTY_TRADE, type Direction, type SizeUnit, type TradeEntry } from '../data/tradeForm'

/**
 * Turning somebody else's CSV into ours.
 *
 * Every broker exports a different file. MT5 writes semicolons and European
 * decimals, cTrader writes "Buy"/"Sell", TradingView writes "Open Time" where
 * MT4 writes "Time", and half of them put the account currency symbol inside
 * the price column. Asking a trader to rearrange that by hand is asking them
 * not to import anything.
 *
 * So this reads the file, works out which column is which, and converts the
 * values — then says what it decided, because the decisions it makes are the
 * kind that ruin data silently when they go wrong. The two that matter most:
 *
 * **Decimal commas.** "1.234,56" is a thousand two hundred in most of Europe
 * and one-point-two in the US. Guess wrong on a price column and every trade
 * is off by a factor of a thousand, with nothing to show for it.
 *
 * **Day and month order.** "03/04/2026" is the third of April or the fourth of
 * March. Guessed wrong, the journal is quietly shifted and the calendar, the
 * sessions and every time-of-day breakdown go with it.
 *
 * Neither is guessed per value. Both are decided once, from the whole column,
 * and reported so a person can overrule them.
 */

/* ------------------------------------------------------------- parsing */

/**
 * Split CSV text into rows of cells.
 *
 * Hand-written rather than a library, for the same reason this project signs
 * its own R2 URLs: the whole grammar is quotes, doubled quotes and a
 * delimiter, and it is less code than the import statement for a parser plus
 * the bundle it drags in.
 */
export function parseCsv(text: string, delimiter: string): string[][] {
  // A BOM is invisible and turns the first header into "\uFEFFDate", which
  // then matches nothing. Excel writes one on every export.
  const body = text.replace(/^\uFEFF/, '')

  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index]

    if (quoted) {
      if (character !== '"') {
        cell += character
      } else if (body[index + 1] === '"') {
        // A doubled quote inside a quoted cell is one literal quote.
        cell += '"'
        index += 1
      } else {
        quoted = false
      }
      continue
    }

    if (character === '"') {
      quoted = true
    } else if (character === delimiter) {
      row.push(cell)
      cell = ''
    } else if (character === '\n' || character === '\r') {
      // Swallow the LF of a CRLF pair rather than emitting a blank row.
      if (character === '\r' && body[index + 1] === '\n') index += 1
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else {
      cell += character
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell)
    rows.push(row)
  }

  // Trailing newlines and the blank lines brokers pad exports with.
  return rows.filter((entry) => entry.some((value) => value.trim() !== ''))
}

const DELIMITERS = [',', ';', '\t', '|']

/**
 * Which character separates the columns.
 *
 * Chosen by which one yields the most *consistent* row width rather than the
 * most occurrences. A semicolon file full of prose commas would otherwise win
 * on count alone and parse into ragged nonsense.
 */
export function detectDelimiter(text: string): string {
  const sample = text.replace(/^\uFEFF/, '').split(/\r?\n/).slice(0, 20).join('\n')

  let best = ','
  let bestScore = -1

  for (const delimiter of DELIMITERS) {
    const widths = parseCsv(sample, delimiter).map((row) => row.length)
    if (widths.length === 0) continue

    const columns = widths[0]
    if (columns < 2) continue

    const consistent = widths.filter((width) => width === columns).length
    // Columns break ties: two delimiters that both parse cleanly means the one
    // finding more structure is the real one.
    const score = consistent / widths.length + columns / 100

    if (score > bestScore) {
      bestScore = score
      best = delimiter
    }
  }

  return best
}

/* ---------------------------------------------------------- the fields */

/** Every field this formatter can fill. The order the output is written in. */
export const FIELDS = [
  'ticker',
  'direction',
  'size',
  'sizeUnit',
  'entryPrice',
  'exitPrice',
  'entryAt',
  'exitAt',
  'stopLoss',
  'takeProfit',
  'setup',
  'rationale',
  'notes',
] as const

export type Field = (typeof FIELDS)[number]

export const FIELD_LABEL: Record<Field, string> = {
  ticker: 'Symbol',
  direction: 'Direction',
  size: 'Size',
  sizeUnit: 'Unit',
  entryPrice: 'Entry price',
  exitPrice: 'Exit price',
  entryAt: 'Opened',
  exitAt: 'Closed',
  stopLoss: 'Stop-loss',
  takeProfit: 'Take-profit',
  setup: 'Setup',
  rationale: 'Rationale',
  notes: 'Notes',
}

/** Without these a row is not a trade, and is reported rather than imported. */
export const REQUIRED: Field[] = ['ticker', 'direction']

/**
 * Header names seen in the wild, per field.
 *
 * Matched on a squashed form — lowercase, letters and digits only — so
 * "Open Time", "open_time" and "OpenTime" are one entry rather than three.
 * Longer names are tried first: "entryprice" must win over "price" on a file
 * that has both.
 */
const SYNONYMS: Record<Field, string[]> = {
  ticker: ['symbol', 'ticker', 'instrument', 'pair', 'market', 'asset', 'contract'],
  // No "position": MetaTrader's Position column is the position *id*, and it
  // was claiming the direction column away from "Type" on every MT5 export.
  direction: ['direction', 'side', 'type', 'ordertype', 'buysell', 'action'],
  size: ['volume', 'size', 'lots', 'lot', 'quantity', 'qty', 'units', 'amount', 'shares'],
  sizeUnit: ['unit', 'sizeunit', 'volumeunit'],
  entryPrice: [
    'entryprice',
    'openprice',
    'priceopen',
    'fillprice',
    'avgprice',
    'entry',
    'open',
    // Last, and deliberately: MT5 calls the opening price plainly "Price" and
    // the closing one "Close Price". A longer synonym always outranks this, so
    // it can only claim a column nothing more specific wanted.
    'price',
  ],
  exitPrice: ['exitprice', 'closeprice', 'priceclose', 'exit', 'close'],
  entryAt: ['entrytime', 'opentime', 'timeopen', 'openedat', 'entrydate', 'opendate', 'datetime', 'time', 'date', 'opened'],
  exitAt: ['exittime', 'closetime', 'timeclose', 'closedat', 'exitdate', 'closedate', 'closed'],
  stopLoss: ['stoploss', 'sl', 'stop', 'slprice'],
  takeProfit: ['takeprofit', 'tp', 'target', 'tpprice'],
  setup: ['setup', 'strategy', 'playbook', 'system', 'model'],
  rationale: ['rationale', 'reason', 'thesis', 'idea', 'why'],
  notes: ['notes', 'comment', 'comments', 'note', 'remark', 'description'],
}

function squash(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

export type Mapping = Partial<Record<Field, number>>

/**
 * Work out which column holds which field.
 *
 * Header names first, because they are what the exporter meant. Columns are
 * claimed at most once — a file with "Open" and "Open Time" must not put the
 * same column in both entry price and entry time — and the longest matching
 * synonym wins, so "entryprice" beats a bare "price".
 */
export function detectColumns(headers: string[]): Mapping {
  const squashed = headers.map(squash)
  const mapping: Mapping = {}
  const claimed = new Set<number>()

  type Candidate = { field: Field; column: number; strength: number }
  const candidates: Candidate[] = []

  for (const field of FIELDS) {
    for (const synonym of SYNONYMS[field]) {
      for (let column = 0; column < squashed.length; column += 1) {
        const header = squashed[column]
        if (header === '') continue

        // Exact beats contained, and a longer synonym beats a shorter one.
        const strength =
          header === synonym ? 100 + synonym.length : header.includes(synonym) ? synonym.length : 0

        if (strength > 0) candidates.push({ field, column, strength })
      }
    }
  }

  candidates.sort((a, b) => b.strength - a.strength)

  for (const candidate of candidates) {
    if (mapping[candidate.field] !== undefined || claimed.has(candidate.column)) continue
    mapping[candidate.field] = candidate.column
    claimed.add(candidate.column)
  }

  return mapping
}

/* ------------------------------------------------------------- numbers */

/**
 * Whether a column of numbers uses a comma for the decimal point.
 *
 * Decided over the whole column, never per value, because per value it is
 * genuinely undecidable: "1,234" is a thousand in one convention and 1.234 in
 * the other, and both appear in real files.
 *
 * The tells, in order of certainty: a value holding both separators settles it
 * outright — the last one is the decimal. Failing that, a comma followed by
 * anything other than exactly three digits cannot be a thousands separator.
 */
export function usesDecimalComma(values: string[]): boolean {
  let commaDecimal = 0
  let dotDecimal = 0

  for (const value of values) {
    const text = value.trim()
    const comma = text.lastIndexOf(',')
    const dot = text.lastIndexOf('.')

    if (comma >= 0 && dot >= 0) {
      // Both present: whichever comes last is the decimal point.
      if (comma > dot) commaDecimal += 1
      else dotDecimal += 1
      continue
    }

    if (comma >= 0) {
      const after = text.length - comma - 1
      if (after !== 3) commaDecimal += 1
    }

    if (dot >= 0) {
      const after = text.length - dot - 1
      if (after !== 3) dotDecimal += 1
    }
  }

  return commaDecimal > dotDecimal
}

/**
 * A number, with the currency symbols and separators brokers leave in.
 *
 * Returns null rather than NaN or zero: a price that could not be read is not
 * a price of nothing, and every figure downstream is built on these.
 */
export function toNumber(value: string, decimalComma: boolean): number | null {
  let text = value.trim()
  if (text === '') return null

  // Parentheses are accounting notation for a negative, and appear in P&L
  // columns exported from spreadsheets.
  const bracketed = /^\((.*)\)$/.exec(text)
  if (bracketed) text = `-${bracketed[1]}`

  // Currency symbols, spaces and non-breaking spaces used as group separators.
  text = text.replace(/[^\d,.\-+]/g, '')

  // Checked after stripping, because "n/a" and "--" strip to nothing and
  // Number('') is 0 — which would file a price of nothing as a real price.
  if (!/\d/.test(text)) return null

  if (decimalComma) {
    text = text.replace(/\./g, '').replace(',', '.')
  } else {
    text = text.replace(/,/g, '')
  }

  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

/* --------------------------------------------------------------- dates */

export type DateOrder = 'dmy' | 'mdy' | 'iso'

/**
 * Whether a column of dates is day-first or month-first.
 *
 * ISO is recognised outright. Otherwise the column is scanned for a value
 * whose first number is above twelve — that can only be a day, and one such
 * value settles the whole column. With no evidence either way it answers
 * day-first, because most of the world and every MetaTrader export is, and
 * because the caller shows the choice for a person to overrule.
 */
export function detectDateOrder(values: string[]): DateOrder {
  let sawSlashes = false

  for (const value of values) {
    const text = value.trim()
    if (text === '') continue

    if (/^\d{4}-\d{2}-\d{2}/.test(text)) return 'iso'

    const parts = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/.exec(text)
    if (!parts) continue

    sawSlashes = true
    if (Number(parts[1]) > 12) return 'dmy'
    if (Number(parts[2]) > 12) return 'mdy'
  }

  return sawSlashes ? 'dmy' : 'iso'
}

/**
 * A timestamp, as the value the datetime-local inputs use.
 *
 * Returns "YYYY-MM-DDTHH:mm" — what `EMPTY_TRADE.entryAt` holds and what the
 * Quick Add form expects — or an empty string when it cannot be read.
 */
export function toTimestamp(value: string, order: DateOrder): string {
  const text = value.trim()
  if (text === '') return ''

  // MetaTrader and many exports use "YYYY.MM.DD HH:MM:SS".
  const dotted = /^(\d{4})\.(\d{1,2})\.(\d{1,2})(.*)$/.exec(text)
  if (dotted) {
    return assemble(dotted[1], dotted[2], dotted[3], dotted[4])
  }

  if (order === 'iso' || /^\d{4}-\d{1,2}-\d{1,2}/.test(text)) {
    const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/.exec(text)
    if (iso) return assemble(iso[1], iso[2], iso[3], iso[4])
  }

  const parts = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(.*)$/.exec(text)
  if (parts) {
    const [, first, second, yearPart, rest] = parts
    const year = yearPart.length === 2 ? `20${yearPart}` : yearPart
    const day = order === 'mdy' ? second : first
    const month = order === 'mdy' ? first : second
    return assemble(year, month, day, rest)
  }

  // A plain epoch, in seconds or milliseconds.
  if (/^\d{10}$|^\d{13}$/.test(text)) {
    const stamp = new Date(Number(text) * (text.length === 10 ? 1000 : 1))
    return Number.isNaN(stamp.getTime()) ? '' : local(stamp)
  }

  return ''
}

function assemble(year: string, month: string, day: string, rest: string): string {
  const time = /(\d{1,2}):(\d{2})/.exec(rest)
  const hours = time ? time[1].padStart(2, '0') : '00'
  const minutes = time ? time[2] : '00'

  const date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  const check = new Date(`${date}T${hours}:${minutes}`)

  if (Number.isNaN(check.getTime())) return ''

  /*
   * The components are compared back, because Date does not reject an
   * impossible date — it rolls it forward. 31 February becomes 3 March, which
   * is worse than an error: the trade is silently filed on a day it did not
   * happen, and nothing downstream can tell.
   */
  if (
    check.getFullYear() !== Number(year) ||
    check.getMonth() + 1 !== Number(month) ||
    check.getDate() !== Number(day)
  ) {
    return ''
  }

  return `${date}T${hours}:${minutes}`
}

function local(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

/* ----------------------------------------------------------- direction */

const SHORT_WORDS = ['sell', 'short', 'sld', 's', 'sell limit', 'sell stop', '1']
const LONG_WORDS = ['buy', 'long', 'bot', 'b', 'buy limit', 'buy stop', '0']

/**
 * Which way the trade went.
 *
 * Defaults to Long when unreadable, and the caller reports that rather than
 * hiding it — a wrong direction inverts the trade's result, so a guess has to
 * be visible.
 */
export function toDirection(value: string): Direction | null {
  const text = squash(value)
  if (text === '') return null

  // Checked before the prefixes: MetaTrader writes "DEAL_TYPE_SELL", and a
  // naive startsWith on "s" would call every such row short including buys.
  if (SHORT_WORDS.some((word) => text === squash(word)) || text.includes('sell') || text.includes('short')) {
    return 'Short'
  }

  if (LONG_WORDS.some((word) => text === squash(word)) || text.includes('buy') || text.includes('long')) {
    return 'Long'
  }

  return null
}

const UNITS: { match: string[]; unit: SizeUnit }[] = [
  { match: ['lot', 'lots'], unit: 'Lots' },
  { match: ['contract', 'contracts', 'cfd'], unit: 'Contracts' },
  { match: ['share', 'shares', 'unit', 'units', 'qty'], unit: 'Shares' },
]

export function toSizeUnit(value: string, fallback: SizeUnit): SizeUnit {
  const text = squash(value)
  for (const entry of UNITS) {
    if (entry.match.some((word) => text.includes(word))) return entry.unit
  }
  return fallback
}

/* ------------------------------------------------------------ the pass */

export type RowProblem = { row: number; why: string }

export type FormatResult = {
  trades: TradeEntry[]
  problems: RowProblem[]
  mapping: Mapping
  headers: string[]
  delimiter: string
  decimalComma: boolean
  dateOrder: DateOrder
  /** Rows read, including the ones that failed. */
  seen: number
}

/**
 * Read a whole file into trades.
 *
 * `mapping` is optional so the caller can accept what was detected or hand
 * back a corrected one — the same function runs either way, which is what
 * makes the preview trustworthy: what is previewed is what is imported.
 */
export function formatCsv(text: string, override?: Mapping): FormatResult {
  const delimiter = detectDelimiter(text)
  const rows = parseCsv(text, delimiter)

  if (rows.length === 0) {
    return {
      trades: [],
      problems: [{ row: 0, why: 'The file is empty.' }],
      mapping: {},
      headers: [],
      delimiter,
      decimalComma: false,
      dateOrder: 'iso',
      seen: 0,
    }
  }

  const headers = rows[0].map((header) => header.trim())
  const body = rows.slice(1)
  const mapping = override ?? detectColumns(headers)

  const column = (field: Field, row: string[]): string => {
    const index = mapping[field]
    return index === undefined ? '' : (row[index] ?? '').trim()
  }

  const columnValues = (field: Field): string[] => {
    const index = mapping[field]
    return index === undefined ? [] : body.map((row) => (row[index] ?? '').trim())
  }

  // Both settled once, over every value in the relevant columns.
  const decimalComma = usesDecimalComma([
    ...columnValues('entryPrice'),
    ...columnValues('exitPrice'),
    ...columnValues('size'),
  ])

  const dateOrder = detectDateOrder([...columnValues('entryAt'), ...columnValues('exitAt')])

  const trades: TradeEntry[] = []
  const problems: RowProblem[] = []

  body.forEach((row, index) => {
    // Numbered as a person reading the file in a spreadsheet would: the header
    // is row 1, so the first trade is row 2.
    const number = index + 2

    const ticker = column('ticker', row).toUpperCase()
    if (ticker === '') {
      problems.push({ row: number, why: 'No symbol.' })
      return
    }

    const direction = toDirection(column('direction', row))
    if (direction === null) {
      problems.push({
        row: number,
        why: `Could not tell buy from sell in ${JSON.stringify(column('direction', row))}.`,
      })
      return
    }

    const size = toNumber(column('size', row), decimalComma)
    const entryPrice = toNumber(column('entryPrice', row), decimalComma)
    const exitPrice = toNumber(column('exitPrice', row), decimalComma)
    const stopLoss = toNumber(column('stopLoss', row), decimalComma)
    const takeProfit = toNumber(column('takeProfit', row), decimalComma)

    trades.push({
      ...EMPTY_TRADE,
      ticker,
      direction,
      size: size === null ? '' : String(size),
      sizeUnit: toSizeUnit(column('sizeUnit', row) || column('size', row), 'Lots'),
      entryPrice: entryPrice === null ? '' : String(entryPrice),
      exitPrice: exitPrice === null ? '' : String(exitPrice),
      entryAt: toTimestamp(column('entryAt', row), dateOrder),
      exitAt: toTimestamp(column('exitAt', row), dateOrder),
      // A stop of zero is MetaTrader for "none", not a stop at zero — and the
      // difference decides every risk and R figure in the app.
      stopLoss: stopLoss === null || stopLoss === 0 ? '' : String(stopLoss),
      takeProfit: takeProfit === null || takeProfit === 0 ? '' : String(takeProfit),
      setup: column('setup', row),
      rationale: column('rationale', row),
      notes: column('notes', row),
      // Left empty on purpose. P&L is derived by the server from price and
      // size, so a broker's own figure — which quietly folds in commission and
      // swap — never becomes the number the statistics are built on.
      netPl: '',
      // The session follows from the entry time, and the server works it out.
      sessions: [],
    })
  })

  return {
    trades,
    problems,
    mapping,
    headers,
    delimiter,
    decimalComma,
    dateOrder,
    seen: body.length,
  }
}

/* ------------------------------------------------------------- writing */

/** One cell, quoted only where it has to be. */
function cell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

/**
 * The trades back out, in this system's own format.
 *
 * The point of the whole exercise: a file that can be checked in a
 * spreadsheet, corrected, and fed straight back in — because it is already in
 * the shape the importer expects, so the second pass needs no detection at
 * all.
 */
export function toCanonicalCsv(trades: TradeEntry[]): string {
  const header = FIELDS.map((field) => FIELD_LABEL[field])

  const rows = trades.map((trade) =>
    FIELDS.map((field) => cell(String(trade[field] ?? ''))).join(','),
  )

  // CRLF and a BOM, so Excel opens it as UTF-8 rather than mojibake.
  return `\uFEFF${[header.join(','), ...rows].join('\r\n')}\r\n`
}

/* -------------------------------------------------- the second opinion */

/** What the API returns from a sample. Mirrors CsvAnalysis on the server. */
export type Analysis = {
  mapping: Mapping
  confidence: Partial<Record<Field, number>>
  headers: string[]
  rows_sampled: number
}

/**
 * How much of the file to send for analysis.
 *
 * The header plus a slice, never the whole thing. A hundred rows settle what
 * a column means as surely as ten thousand, the request cap is 256KB, and the
 * service reading it has 512MB to live in.
 */
export const SAMPLE_ROWS = 120

/** Past this a cell is prose or a corrupted file, not a value to judge by. */
const MAX_CELL = 500

export type Sample = { headers: string[]; rows: string[][] }

/**
 * A slice of the file, already split into cells.
 *
 * Split here rather than on the server, deliberately. The delimiter is
 * decided by `detectDelimiter`, which is tested and handles a case
 * Python's `csv.Sniffer` gets wrong — a semicolon file full of prose commas.
 * Parsing it in both places would be two answers to a settled question, and
 * they would eventually disagree about the same file.
 */
export function sampleOf(text: string): Sample {
  const parsed = parseCsv(text, detectDelimiter(text)).slice(0, SAMPLE_ROWS + 1)

  if (parsed.length === 0) return { headers: [], rows: [] }

  const trim = (row: string[]) => row.map((value) => value.slice(0, MAX_CELL))

  return { headers: trim(parsed[0]), rows: parsed.slice(1).map(trim) }
}

/* ------------------------------------------------------------ decoding */

/**
 * Read the bytes of a file as text, in whatever encoding it actually is.
 *
 * `File.text()` always decodes as UTF-8, and a great many broker exports are
 * not. MetaTrader writes its statements as **UTF-16LE**; older platforms and
 * anything that has been through an English-language Excel write
 * **Windows-1252**. Decoded as UTF-8, the first arrives as text separated by
 * NUL bytes and the second turns every accented symbol name into a replacement
 * character — in both cases the file parses into nonsense rather than failing,
 * which is the worst way for it to go wrong.
 *
 * A byte-order mark settles it outright when there is one. Without one, UTF-8
 * is tried strictly: real UTF-8 always decodes, and Windows-1252 nearly always
 * does not, because its accented bytes are invalid as UTF-8 sequences.
 */
export function decodeCsv(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes)

  // A BOM is the file telling you outright. TextDecoder strips it itself.
  if (view[0] === 0xef && view[1] === 0xbb && view[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(bytes)
  }

  if (view[0] === 0xff && view[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(bytes)
  }

  if (view[0] === 0xfe && view[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(bytes)
  }

  /*
   * No mark. UTF-16 without one is still common from MetaTrader, and it is
   * recognisable: ASCII text in UTF-16 is every other byte NUL, and which
   * side they fall on says which way round it is.
   */
  const head = view.subarray(0, 1_000)
  let oddNuls = 0
  let evenNuls = 0

  for (let index = 0; index < head.length; index += 1) {
    if (head[index] !== 0) continue
    if (index % 2 === 0) evenNuls += 1
    else oddNuls += 1
  }

  // A third of one side being NUL is not something UTF-8 text does.
  if (oddNuls > head.length / 6 && evenNuls < oddNuls / 4) {
    return new TextDecoder('utf-16le').decode(bytes)
  }

  if (evenNuls > head.length / 6 && oddNuls < evenNuls / 4) {
    return new TextDecoder('utf-16be').decode(bytes)
  }

  try {
    // `fatal` is the point: without it an invalid byte becomes U+FFFD and the
    // file looks like it decoded when it did not.
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    /*
     * Not valid UTF-8, so it is a single-byte encoding. Windows-1252 rather
     * than Latin-1: it is what Excel and most Windows tooling write, and it
     * decodes every byte, so this cannot fail again.
     */
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

/* ----------------------------------------------- checking the result */

/**
 * Whether the trades a mapping produced actually make sense.
 *
 * This is the important half of the importer, and it is worth saying why.
 *
 * Matching columns by name and by content is guesswork, however careful. The
 * way to catch a wrong guess is not more guessing — it is to look at what the
 * guess produced. A long trade whose stop sits above its entry, an exit dated
 * before its entry, a "price" a thousand times the other price: none of those
 * are trades. They are a column pointed at the wrong thing, and they say so
 * loudly enough to stop the import rather than quietly filling a journal with
 * numbers that will misprice every statistic in the app afterwards.
 *
 * Wrong data is worse than no data here. A missing trade is visible; a wrong
 * one is indistinguishable from a real one for as long as anybody looks.
 */

export type Suspicion = {
  /** Which field the evidence points at. */
  field: Field
  /** How many rows show it. */
  rows: number
  /** What was seen, in the trader's terms. */
  why: string
}

/** A sane hold: nothing is opened and closed a century apart. */
const MAX_HOLD_DAYS = 400

/**
 * Look for the shapes a wrong column makes.
 *
 * Reported per field rather than per row, because a mis-mapped column is wrong
 * in every row at once — a hundred identical complaints is noise, "the stop is
 * on the wrong side of the entry in 97 of 100 rows" is a finding.
 */
export function suspicions(trades: TradeEntry[]): Suspicion[] {
  if (trades.length === 0) return []

  const found: Suspicion[] = []
  const number = (value: string) => (value === '' ? null : Number(value))

  let backwards = 0
  let wrongSideStop = 0
  let wrongSideTarget = 0
  let farApart = 0
  let absurdHold = 0
  let dated = 0
  let priced = 0
  let stopped = 0
  let targeted = 0

  for (const trade of trades) {
    const entry = number(trade.entryPrice)
    const exit = number(trade.exitPrice)
    const stop = number(trade.stopLoss)
    const target = number(trade.takeProfit)
    const long = trade.direction === 'Long'

    if (trade.entryAt !== '' && trade.exitAt !== '') {
      dated += 1
      const opened = new Date(trade.entryAt).getTime()
      const closed = new Date(trade.exitAt).getTime()

      // Two columns swapped is the usual cause, and it is worth naming
      // because the fix is one dropdown rather than a re-export.
      if (closed < opened) backwards += 1
      else if (closed - opened > MAX_HOLD_DAYS * 86_400_000) absurdHold += 1
    }

    if (entry !== null && exit !== null && entry > 0 && exit > 0) {
      priced += 1
      // An entry and an exit are the same instrument minutes apart. An order
      // of magnitude between them is a column holding something else —
      // usually P&L, a balance, or a lot size.
      const ratio = Math.max(entry, exit) / Math.min(entry, exit)
      if (ratio > 10) farApart += 1
    }

    if (entry !== null && stop !== null && entry > 0 && stop > 0) {
      stopped += 1
      // The strongest signal in this function. A stop protects a position, so
      // it sits below the entry on a long and above it on a short. Wrong side
      // means the direction column is wrong, or the stop column is.
      if (long === stop > entry) wrongSideStop += 1
    }

    if (entry !== null && target !== null && entry > 0 && target > 0) {
      targeted += 1
      // The mirror of the stop, and it fails the same way.
      if (long === target < entry) wrongSideTarget += 1
    }
  }

  /** Only worth raising when it is the rule rather than an odd row. */
  const mostly = (count: number, of: number) => of >= 3 && count / of > 0.5

  if (mostly(backwards, dated)) {
    found.push({
      field: 'exitAt',
      rows: backwards,
      why: `${backwards} trades close before they open. The opened and closed columns are probably the other way round.`,
    })
  }

  if (mostly(absurdHold, dated)) {
    found.push({
      field: 'entryAt',
      rows: absurdHold,
      why: `${absurdHold} trades are held for over a year. One of the date columns is probably not a date.`,
    })
  }

  if (mostly(farApart, priced)) {
    found.push({
      field: 'exitPrice',
      rows: farApart,
      why: `In ${farApart} trades the entry and exit prices differ by more than ten times. One of them is probably not a price.`,
    })
  }

  if (mostly(wrongSideStop, stopped)) {
    found.push({
      field: 'stopLoss',
      rows: wrongSideStop,
      why: `${wrongSideStop} stops are on the wrong side of the entry. Either the stop column or the direction column is wrong.`,
    })
  }

  if (mostly(wrongSideTarget, targeted)) {
    found.push({
      field: 'takeProfit',
      rows: wrongSideTarget,
      why: `${wrongSideTarget} targets are on the wrong side of the entry. Either the target column or the direction column is wrong.`,
    })
  }

  return found
}

export type Summary = {
  trades: number
  symbols: string[]
  longs: number
  shorts: number
  from: string
  to: string
  priceLow: number | null
  priceHigh: number | null
}

/**
 * What is about to be imported, in one glance.
 *
 * The last line of defence, and the cheapest. A person who knows their own
 * trading spots "prices from 0.0001 to 48,000" or "dates in 1970" instantly,
 * where no rule written here would know those were wrong. Everything above
 * catches the mistakes that have a shape; this catches the rest.
 */
export function summarise(trades: TradeEntry[]): Summary {
  const symbols = new Set<string>()
  const dates: string[] = []
  const prices: number[] = []

  let longs = 0
  let shorts = 0

  for (const trade of trades) {
    if (trade.ticker) symbols.add(trade.ticker)
    if (trade.direction === 'Long') longs += 1
    else shorts += 1

    for (const stamp of [trade.entryAt, trade.exitAt]) {
      if (stamp !== '') dates.push(stamp)
    }

    for (const value of [trade.entryPrice, trade.exitPrice]) {
      const parsed = value === '' ? null : Number(value)
      if (parsed !== null && Number.isFinite(parsed) && parsed > 0) prices.push(parsed)
    }
  }

  dates.sort()

  return {
    trades: trades.length,
    symbols: [...symbols].sort(),
    longs,
    shorts,
    from: dates[0] ?? '',
    to: dates[dates.length - 1] ?? '',
    priceLow: prices.length === 0 ? null : Math.min(...prices),
    priceHigh: prices.length === 0 ? null : Math.max(...prices),
  }
}
