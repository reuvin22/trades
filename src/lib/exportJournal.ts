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
  // Firefox and Android Chrome ignore a click on an element that is not in the
  // document, so the link has to be attached before it is clicked.
  link.style.display = 'none'
  document.body.append(link)
  link.click()
  link.remove()

  // Revoked on a later turn of the loop, not here: revoking in the same tick
  // can pull the blob out from under a download that has not started yet,
  // which is a save that silently produces nothing.
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
}

/* ------------------------------------------------------------------- PDF */

/** Theme tokens lifted off the live page, so the document matches the app. */


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



/**
 * Open the journal as a printable document and raise the print dialogue.
 *
 * A separate window rather than a print stylesheet over the app: the page is
 * a grid of cards built for a screen, and bending it into a table with
 * `@media print` means every future layout change risks quietly breaking an
 * export nobody looks at until they need it.
 */
/**
 * Writes the journal to a real PDF file and saves it.
 *
 * This used to open a window and call print(), which left the browser's print
 * dialogue in front of the trader and produced a file only if they then chose
 * "Save as PDF" — and nothing at all on a phone, where that option often is
 * not offered. Generating the document here means the button does what its
 * label says: one click, one file, no dialogue.
 *
 * jsPDF is imported on demand. It and the table plugin together are larger
 * than the rest of the page, and most sessions never export anything, so the
 * cost belongs on the click rather than on every load.
 */
export async function downloadPdf(
  trades: StoredTrade[],
  rangeLabel: string,
): Promise<void> {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])

  // Landscape: the table is nine columns wide and portrait squeezes the two
  // that matter — setup and net P&L — into something unreadable.
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const width = doc.internal.pageSize.getWidth()
  const totals = totalsOf(trades)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('RagDex', 40, 46)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor(110)
  doc.text(`Trade journal · ${rangeLabel}`, 40, 64)
  doc.text(
    `Exported ${LONG_DATE.format(new Date())}`,
    width - 40,
    64,
    { align: 'right' },
  )

  // The same four figures the app shows above the table, so a printed journal
  // and the screen it came from never disagree.
  const summary: [string, string][] = [
    ['Trades', String(totals.count)],
    ['Net P&L', money(totals.netPl)],
    ['Win rate', totals.winRate === null ? '—' : `${totals.winRate.toFixed(1)}%`],
    [
      'Profit factor',
      totals.profitFactor === null ? '—' : totals.profitFactor.toFixed(2),
    ],
  ]

  summary.forEach(([label, value], index) => {
    const x = 40 + index * 150
    doc.setFontSize(8)
    doc.setTextColor(130)
    doc.text(label.toUpperCase(), x, 96)
    doc.setFontSize(14)
    doc.setTextColor(20)
    doc.text(value, x, 114)
  })

  autoTable(doc, {
    startY: 132,
    head: [['Date', 'Ticker', 'Side', 'Setup', 'Session', 'Entry', 'Exit', 'R:R', 'Net P&L']],
    body: trades.map((trade) => [
      when(trade),
      trade.ticker || '—',
      trade.direction,
      trade.setup || '—',
      sessionsOf(trade) || '—',
      money(trade.entryPrice),
      money(trade.exitPrice),
      trade.riskReward === null ? '—' : `${trade.riskReward.toFixed(2)}R`,
      money(trade.netPl),
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 6, textColor: 45 },
    headStyles: { fillColor: [124, 108, 246], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [246, 245, 252] },
    columnStyles: { 8: { halign: 'right' } },
    // A loss is worth seeing at a glance on paper too.
    didParseCell: (data) => {
      if (data.section !== 'body' || data.column.index !== 8) return
      const value = trades[data.row.index]?.netPl
      if (typeof value === 'number') {
        data.cell.styles.textColor = value < 0 ? [194, 49, 75] : [24, 121, 78]
      }
    },
    margin: { left: 40, right: 40 },
  })

  if (trades.length === 0) {
    doc.setFontSize(11)
    doc.setTextColor(130)
    doc.text('No trades in this range.', 40, 160)
  }

  doc.save(`ragdex-journal-${FILE_STAMP.format(new Date())}.pdf`)
}
