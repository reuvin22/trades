import type { ReactNode } from 'react'
import { heldMinutes, sessionLabels } from '../lib/analytics'
import { realisedR, riskOf } from '../lib/dashboardStats'
import { formatHold, tradeDate } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import { CheckCircleIcon, ChevronRightIcon, XCircleIcon } from './Icons'
import {
  CARD,
  CARD_HEAD,
  CARD_SUB,
  CARD_TITLE,
  LINK,
  MONO,
  NEG,
  POS,
  ROW,
  ROWS_STAGGER,
  SIDE_BADGE,
  SIDE_LONG,
  SIDE_SHORT,
  TABLE,
  TABLE_EMPTY,
  TABLE_WRAP,
  TD,
  TH,
  TICKER,
} from './ui'

/**
 * The trade log under each analysis tab.
 *
 * It used to be one table — the six biggest movers — repeated verbatim at the
 * bottom of every tab. Six tabs asking six different questions all answered
 * with the same six rows, which made it read as page furniture rather than as
 * evidence, and gave a trader no reason to look at it twice.
 *
 * So the variant is the point: each tab ranks the trades by the thing that
 * tab is about and shows the columns that make that ranking legible. The Risk
 * tab lists what was most risked, with the risk in it; the Time tab lists the
 * longest holds, with the clock in it. The Setups tab has no log at all —
 * its own table already breaks results down by setup, so a second table of
 * individual trades underneath it said nothing new.
 */
export type LogVariant = 'markets' | 'risk' | 'time' | 'behaviour' | 'execution'

/** How many rows a log shows. Enough to see a pattern, short enough to read. */
const LIMIT = 6

type Context = { capital: number }

type Column = {
  label: string
  align?: 'right' | 'center'
  /** Figures are set in the mono face so digits line up down the column;
   *  words are not, because mono prose in a table cell reads as code. */
  mono?: boolean
  cell: (trade: StoredTrade, context: Context) => ReactNode
}

type Variant = {
  title: string
  /** What ranked these. Without it the order looks arbitrary. */
  note: string
  /** Which trades, in which order. Already limited by the caller. */
  pick: (trades: StoredTrade[], context: Context) => StoredTrade[]
  columns: Column[]
  /** Shown when `pick` returns nothing, and says what would fill it. */
  empty: string
}

/* ------------------------------------------------------------ shared cells */

const tickerCell: Column = {
  label: 'Ticker',
  cell: (trade) => <span className={TICKER}>{trade.ticker || '—'}</span>,
}

const sideCell: Column = {
  label: 'Side',
  cell: (trade) => (
    <span
      className={`${SIDE_BADGE} ${trade.direction === 'Long' ? SIDE_LONG : SIDE_SHORT}`}
    >
      {trade.direction.toUpperCase()}
    </span>
  ),
}

const resultCell: Column = {
  label: 'Result',
  align: 'center',
  cell: (trade) => {
    const win = (trade.netPl ?? 0) >= 0
    return (
      <>
        {win ? (
          <CheckCircleIcon className="inline-block text-green" />
        ) : (
          <XCircleIcon className="inline-block text-red" />
        )}
        <span className="sr-only">{win ? 'Win' : 'Loss'}</span>
      </>
    )
  },
}

/** How far price travelled in the trade's favour, as a percentage. */
function percentMoved(trade: StoredTrade): string {
  if (trade.entryPrice === null || trade.exitPrice === null || trade.entryPrice === 0) {
    return '—'
  }

  const move =
    trade.direction === 'Long'
      ? (trade.exitPrice - trade.entryPrice) / trade.entryPrice
      : (trade.entryPrice - trade.exitPrice) / trade.entryPrice

  return `${move >= 0 ? '+' : ''}${(move * 100).toFixed(2)}%`
}

const moveCell: Column = {
  label: 'P/L (%)',
  align: 'right',
  mono: true,
  cell: (trade) => (
    <span className={(trade.netPl ?? 0) >= 0 ? POS : NEG}>{percentMoved(trade)}</span>
  ),
}

const price = (value: number | null) => (value === null ? '—' : value.toString())

/** A kept-or-broken rule, for the execution log's three plan columns. */
function ruleCell(label: string, read: (trade: StoredTrade) => string): Column {
  return {
    label,
    align: 'center',
    cell: (trade) => {
      const answer = read(trade)
      if (answer !== 'yes' && answer !== 'no') return <span className="text-fg-muted">—</span>
      return (
        <span className={answer === 'yes' ? POS : NEG}>
          {answer === 'yes' ? 'Kept' : 'Broken'}
        </span>
      )
    },
  }
}

/* ---------------------------------------------------------------- variants */

const byAbsolutePl = (trades: StoredTrade[]) =>
  [...trades]
    .filter((trade) => trade.netPl !== null)
    .sort((a, b) => Math.abs(b.netPl ?? 0) - Math.abs(a.netPl ?? 0))

const VARIANTS: Record<LogVariant, Variant> = {
  /* Markets is about symbols and direction, so the log shows the price action
     rather than the account's view of it. */
  markets: {
    title: 'Biggest moves',
    note: 'Your largest trades by money, and the price move behind each one.',
    pick: byAbsolutePl,
    columns: [
      tickerCell,
      sideCell,
      { label: 'Entry', align: 'right', mono: true, cell: (trade) => price(trade.entryPrice) },
      { label: 'Exit', align: 'right', mono: true, cell: (trade) => price(trade.exitPrice) },
      moveCell,
      resultCell,
    ],
    empty: 'Closed trades will be ranked here by how far price moved.',
  },

  /* Ranked by what was put at risk, deliberately not by what came back: the
     point of the Risk tab is that the two are not the same, and a log sorted
     by P&L would quietly hide the large risk that happened to win. */
  risk: {
    title: 'Most risked',
    note: 'Ranked by how much of the account was on the line, not by what it returned.',
    pick: (trades, { capital }) => {
      if (capital <= 0) return []
      return [...trades]
        .filter((trade) => riskOf(trade) !== null)
        .sort((a, b) => (riskOf(b) ?? 0) - (riskOf(a) ?? 0))
    },
    columns: [
      tickerCell,
      sideCell,
      {
        label: 'Risked',
        mono: true,
        align: 'right',
        cell: (trade, { capital }) => {
          const risk = riskOf(trade)
          if (risk === null || capital <= 0) return '—'
          return `${((risk / capital) * 100).toFixed(2)}%`
        },
      },
      {
        label: 'Planned',
        mono: true,
        align: 'right',
        cell: (trade) =>
          trade.riskReward === null ? '—' : `1 : ${trade.riskReward.toFixed(1)}`,
      },
      {
        label: 'Realised',
        mono: true,
        align: 'right',
        cell: (trade) => {
          const value = realisedR(trade)
          if (value === null) return '—'
          return (
            <span className={value >= 0 ? POS : NEG}>
              {value > 0 ? '+' : ''}
              {value.toFixed(2)}R
            </span>
          )
        },
      },
      resultCell,
    ],
    empty:
      'Trades with an entry, a stop and a size will be ranked here by how much they risked.',
  },

  /* The Time tab asks when and for how long, so the log answers with the
     clock: session, weekday, hold. */
  time: {
    title: 'Longest holds',
    note: 'The trades you sat in longest, and what the wait earned.',
    pick: (trades) =>
      [...trades]
        .filter((trade) => heldMinutes(trade) !== null)
        .sort((a, b) => (heldMinutes(b) ?? 0) - (heldMinutes(a) ?? 0)),
    columns: [
      tickerCell,
      { label: 'Session', cell: (trade) => sessionLabels(trade) },
      {
        label: 'Day',
        cell: (trade) => {
          const when = tradeDate(trade)
          return when === null
            ? '—'
            : when.toLocaleDateString('en-US', { weekday: 'short' })
        },
      },
      {
        label: 'Held',
        mono: true,
        align: 'right',
        cell: (trade) => {
          const minutes = heldMinutes(trade)
          return minutes === null ? '—' : formatHold(minutes)
        },
      },
      moveCell,
      resultCell,
    ],
    empty: 'Trades with both an entry and an exit time will be ranked here by hold time.',
  },

  /* Only trades carrying a mistake tag, worst first — this tab is about what
     went wrong, so a clean trade in the list would be noise. */
  behaviour: {
    title: 'Trades you flagged',
    note: 'Every trade you tagged a mistake on, costliest first.',
    pick: (trades) =>
      [...trades]
        .filter((trade) => trade.mistakes.length > 0 && trade.netPl !== null)
        .sort((a, b) => (a.netPl ?? 0) - (b.netPl ?? 0)),
    columns: [
      tickerCell,
      {
        label: 'Mistake',
        cell: (trade) => trade.mistakes.join(', ') || '—',
      },
      {
        label: 'Felt',
        cell: (trade) =>
          [trade.emotionBefore, trade.emotionDuring]
            .map((entry) => entry.trim())
            .filter((entry) => entry !== '')
            .join(' → ') || '—',
      },
      moveCell,
      resultCell,
    ],
    empty: 'Tag a mistake on a trade and it will be listed here, costliest first.',
  },

  /* Only trades where a rule was answered "no". The tab's own cards already
     score how often the plan was kept; this names the trades that broke it. */
  execution: {
    title: 'Where the plan slipped',
    note: 'Trades where you marked a rule broken, costliest first.',
    pick: (trades) =>
      [...trades]
        .filter(
          (trade) =>
            trade.compliedEntry === 'no' ||
            trade.compliedExit === 'no' ||
            trade.compliedManagement === 'no',
        )
        .sort((a, b) => (a.netPl ?? 0) - (b.netPl ?? 0)),
    columns: [
      tickerCell,
      ruleCell('Entry', (trade) => trade.compliedEntry),
      ruleCell('Exit', (trade) => trade.compliedExit),
      ruleCell('Management', (trade) => trade.compliedManagement),
      moveCell,
      resultCell,
    ],
    empty:
      'Mark an entry, exit or management rule as broken and those trades will be listed here.',
  },
}

export function TradeLog({
  trades,
  variant,
  capital,
}: {
  trades: StoredTrade[]
  variant: LogVariant
  capital: number
}) {
  const config = VARIANTS[variant]
  const context = { capital }
  const rows = config.pick(trades, context).slice(0, LIMIT)

  return (
    <section className={`${CARD} px-28 pt-26 pb-20`}>
      <div className={CARD_HEAD}>
        <div>
          <h2 className={CARD_TITLE}>{config.title}</h2>
          <p className={CARD_SUB}>{config.note}</p>
        </div>
        <a className={LINK} href="#/journal">
          View All Records
          <ChevronRightIcon />
        </a>
      </div>

      <div className={TABLE_WRAP}>
        <table className={`${TABLE} min-w-620`}>
          <thead>
            <tr>
              {config.columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  className={`${TH} ${column.align === 'right' ? 'text-right' : ''} ${
                    column.align === 'center' ? 'text-center' : ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={ROWS_STAGGER}>
            {rows.map((trade) => (
              <tr key={trade.id} className={ROW}>
                {config.columns.map((column) => (
                  <td
                    key={column.label}
                    className={`${TD} py-13 ${
                      column.mono ? MONO : 'text-[13px] text-fg-dim'
                    } ${column.align === 'right' ? 'text-right' : ''} ${
                      column.align === 'center' ? 'text-center' : ''
                    }`}
                  >
                    {column.cell(trade, context)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {rows.length === 0 && <p className={TABLE_EMPTY}>{config.empty}</p>}
      </div>
    </section>
  )
}
