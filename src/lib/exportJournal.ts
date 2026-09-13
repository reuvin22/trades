import type { StoredTrade } from './trades'
import { SESSION_LABELS } from '../data/tradeForm'
import { tradeDate } from './stats'

/**
 * Taking the journal out of the app: as a spreadsheet, or as a document.
 *
 * The PDF is printed rather than generated. The browser already has a PDF
 * engine, and a library to build one would be a dependency shipped to every
 * visitor so that a few of them can occasionally save a file. Printing also
 * gets pagination, headers and the user's own paper size for nothing.
 *
 * "Use the system theme" is taken literally: the colours are read off the live
 * page with getComputedStyle, so the document matches whatever theme is on at
 * the moment it is exported rather than a second palette kept in step by hand.
 */

const FILE_STAMP = new Intl.DateTimeFormat('en-CA') // YYYY-MM-DD

const LONG_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const ROW_DATE = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: '2-digit',
})

const MONEY = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function when(trade: StoredTrade): string {
  const date = tradeDate(trade)
  return date ? ROW_DATE.format(date) : '—'
}

function money(value: number | null): string {
  return value === null ? '—' : MONEY.format(value)
}

function sessionsOf(trade: StoredTrade): string {
  return trade.sessions.map((key) => SESSION_LABELS[key] ?? key).join(' + ')
}

/* ------------------------------------------------------------------- CSV */

/**
 * One field, escaped.
 *
 * The leading apostrophe on anything a spreadsheet would read as a formula is
 * not decoration: a setup named "=cmd" is executed by Excel on open, and a
 * journal is exactly the sort of file that gets mailed around. Prefixing it
 * makes the cell text, which is what it always was.
 */
function cell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

const COLUMNS = [
  'Date',
  'Ticker',
  'Direction',
  'Setup',
  'Session',
  'Size',
  'Unit',
  'Entry',
  'Exit',
  'Stop',
  'Target',
  'R:R',
  'Held',
  'Net P&L',
  'Rules: entry',
  'Rules: exit',
  'Rules: management',
  'Emotion before',
  'Emotion during',
  'Mistakes',
  'Rationale',
  'Notes',
]

export function toCsv(trades: StoredTrade[]): string {
  const rows = trades.map((trade) =>
    [
      when(trade),
      trade.ticker,
      trade.direction,
      trade.setup,
      sessionsOf(trade),
      trade.size,
      trade.sizeUnit,
      trade.entryPrice,
      trade.exitPrice,
      trade.stopLoss,
      trade.takeProfit,
      trade.riskReward,
      trade.duration,
      trade.netPl,
      trade.compliedEntry,
      trade.compliedExit,
      trade.compliedManagement,
      trade.emotionBefore,
      trade.emotionDuring,
      trade.mistakes.join('; '),
      trade.rationale,
      trade.notes,
    ]
      .map(cell)
      .join(','),
  )

  // CRLF and a BOM, both for Excel: without the BOM it reads UTF-8 as the
  // local codepage and every accented ticker or note arrives mangled. Written
  // as an escape rather than the character itself, which is invisible in an
  // editor and reads as a stray space to anything that lints it.
  return `\uFEFF${[COLUMNS.map(cell).join(','), ...rows].join('\r\n')}`
}

export function downloadCsv(trades: StoredTrade[]): void {
  const blob = new Blob([toCsv(trades)], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `ragdex-journal-${FILE_STAMP.format(new Date())}.csv`
  link.click()

  // The blob stays alive until it is revoked, and a journal is not small.
  URL.revokeObjectURL(url)
}

/* ------------------------------------------------------------------- PDF */

/** Theme tokens lifted off the live page, so the document matches the app. */
function palette(): Record<string, string> {
  const computed = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) =>
    computed.getPropertyValue(name).trim() || fallback

  return {
    ink: read('--color-fg-strong', '#11131a'),
    body: read('--color-fg', '#2a2d38'),
    muted: read('--color-fg-muted', '#767a89'),
    line: read('--color-line', '#e2e4ec'),
    accent: read('--color-accent', '#4b6dff'),
    green: read('--color-green', '#18794e'),
    red: read('--color-red', '#c4314b'),
    panel: read('--color-panel-solid', '#ffffff'),
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Totals = {
  count: number
  netPl: number
  winRate: number | null
  profitFactor: number | null
}

function totalsOf(trades: StoredTrade[]): Totals {
  const closed = trades.filter((trade) => trade.netPl !== null)
  const results = closed.map((trade) => trade.netPl as number)
  const wins = results.filter((value) => value >= 0)
  const grossLoss = Math.abs(
    results.filter((value) => value < 0).reduce((sum, value) => sum + value, 0),
  )

  return {
    count: trades.length,
    netPl: results.reduce((sum, value) => sum + value, 0),
    winRate: closed.length === 0 ? null : (wins.length / closed.length) * 100,
    profitFactor:
      grossLoss === 0
        ? null
        : wins.reduce((sum, value) => sum + value, 0) / grossLoss,
  }
}

function summaryCard(label: string, value: string, tone = ''): string {
  return `<div class="stat"><p class="stat-label">${label}</p>
    <p class="stat-value ${tone}">${value}</p></div>`
}

function documentHtml(trades: StoredTrade[], rangeLabel: string): string {
  const c = palette()
  const totals = totalsOf(trades)
  const dark = document.documentElement.dataset.theme === 'dark'

  const rows = trades
    .map((trade) => {
      const pl = trade.netPl
      const tone = pl === null ? '' : pl >= 0 ? 'pos' : 'neg'

      return `<tr>
        <td>${escapeHtml(when(trade))}</td>
        <td class="strong">${escapeHtml(trade.ticker || '—')}</td>
        <td>${escapeHtml(trade.direction)}</td>
        <td>${escapeHtml(trade.setup || '—')}</td>
        <td>${escapeHtml(sessionsOf(trade) || '—')}</td>
        <td class="num">${escapeHtml(money(trade.entryPrice))}</td>
        <td class="num">${escapeHtml(money(trade.exitPrice))}</td>
        <td class="num">${trade.riskReward === null ? '—' : `${trade.riskReward.toFixed(2)}R`}</td>
        <td class="num ${tone}">${escapeHtml(money(pl))}</td>
      </tr>`
    })
    .join('')

  return `<!doctype html>
<html lang="en" data-theme="${dark ? 'dark' : 'light'}">
<head>
<meta charset="utf-8">
<title>RagDex — Trade Journal</title>
<style>
  /* Margins on the page rather than the body, so every printed sheet gets
     them and not only the first. */
  @page { size: A4 landscape; margin: 14mm 12mm; }

  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: ${c.panel};
    color: ${c.body};
    font: 400 10pt/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  header { display: flex; align-items: flex-end; justify-content: space-between;
           gap: 24px; padding-bottom: 12px; border-bottom: 2px solid ${c.ink}; }
  .brand { font-size: 20pt; font-weight: 600; letter-spacing: -0.02em; color: ${c.ink}; }
  .brand span { color: ${c.accent}; }
  .sub { margin: 2px 0 0; font-size: 9pt; color: ${c.muted}; }
  .meta { text-align: right; font-size: 8.5pt; color: ${c.muted}; }
  .range { display: block; font-size: 11pt; font-weight: 500; color: ${c.ink}; }

  .stats { display: flex; gap: 28px; margin: 18px 0 20px; }
  .stat { flex: 1; }
  .stat-label { margin: 0; font-size: 7.5pt; font-weight: 600; letter-spacing: 0.12em;
                text-transform: uppercase; color: ${c.muted}; }
  .stat-value { margin: 3px 0 0; font-size: 16pt; font-weight: 600; color: ${c.ink};
                font-variant-numeric: tabular-nums; }

  table { width: 100%; border-collapse: collapse; }
  thead { display: table-header-group; }   /* repeats on every printed page */
  tr { break-inside: avoid; }
  th { padding: 0 8px 7px; font-size: 7.5pt; font-weight: 600; letter-spacing: 0.1em;
       text-align: left; text-transform: uppercase; color: ${c.muted};
       border-bottom: 1px solid ${c.line}; }
  td { padding: 7px 8px; font-size: 9pt; border-bottom: 1px solid ${c.line};
       vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .strong { font-weight: 600; color: ${c.ink}; }
  .pos { color: ${c.green}; }
  .neg { color: ${c.red}; }

  .empty { padding: 48px 0; text-align: center; color: ${c.muted}; }
  footer { margin-top: 18px; font-size: 8pt; color: ${c.muted}; }
</style>
</head>
<body>
  <header>
    <div>
      <p class="brand">Rag<span>Dex</span></p>
      <p class="sub">Trade journal</p>
    </div>
    <div class="meta">
      <strong class="range">${escapeHtml(rangeLabel)}</strong>
      Exported ${escapeHtml(LONG_DATE.format(new Date()))}
    </div>
  </header>

  <section class="stats">
    ${summaryCard('Trades', String(totals.count))}
    ${summaryCard(
      'Net P&amp;L',
      MONEY.format(totals.netPl),
      totals.netPl >= 0 ? 'pos' : 'neg',
    )}
    ${summaryCard(
      'Win rate',
      totals.winRate === null ? '—' : `${totals.winRate.toFixed(1)}%`,
    )}
    ${summaryCard(
      'Profit factor',
      totals.profitFactor === null ? '—' : totals.profitFactor.toFixed(2),
    )}
  </section>

  ${
    trades.length === 0
      ? '<p class="empty">No trades in this range.</p>'
      : `<table>
    <thead><tr>
      <th>Date</th><th>Ticker</th><th>Side</th><th>Setup</th><th>Session</th>
      <th class="num">Entry</th><th class="num">Exit</th>
      <th class="num">R:R</th><th class="num">Net P&amp;L</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>`
  }

  <footer>Written from your own logged trades. Figures are realised, not marked to market.</footer>
</body>
</html>`
}

/**
 * Open the journal as a printable document and raise the print dialogue.
 *
 * A separate window rather than a print stylesheet over the app: the page is
 * a grid of cards built for a screen, and bending it into a table with
 * `@media print` means every future layout change risks quietly breaking an
 * export nobody looks at until they need it.
 */
export function printPdf(trades: StoredTrade[], rangeLabel: string): boolean {
  const sheet = window.open('', '_blank', 'noopener,width=1100,height=800')
  if (!sheet) return false

  sheet.document.write(documentHtml(trades, rangeLabel))
  sheet.document.close()

  // Give the new document a frame to lay out: printing an empty body is what
  // happens if the dialogue opens first.
  sheet.addEventListener('load', () => {
    sheet.focus()
    sheet.print()
  })

  return true
}
