import { useEffect, useId, useRef } from 'react'
import { currency, signed } from '../data/dashboard'
import type { StoredTrade } from '../lib/trades'
import { CloseIcon } from './Icons'
import {
  CHIP,
  DAY_EMPTY,
  DAY_SUMMARY,
  DAY_SUMMARY_CELL,
  DAY_SUMMARY_LABEL,
  DAY_SUMMARY_VALUE,
  DAY_TRADE,
  DAY_TRADES,
  DAY_TRADE_HEAD,
  DAY_TRADE_META,
  MODAL,
  MODAL_BODY,
  MODAL_CLOSE,
  MODAL_HEAD,
  MODAL_NARROW,
  MODAL_SUB,
  MODAL_TITLE,
  MONO,
  NEG,
  POS,
  SIDE_BADGE,
  SIDE_LONG,
  SIDE_SHORT,
  TICKER,
} from './ui'

export type DaySelection = {
  date: Date
  trades: StoredTrade[]
}

type DayDetailProps = {
  day: DaySelection | null
  onClose: () => void
}

const fullDate = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const clockTime = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
})

function timeOf(value: string): string | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : clockTime.format(parsed)
}

/** What a trader wants to know about a single day, in the order they ask it. */
function summarise(trades: StoredTrade[]) {
  const closed = trades.filter((trade) => trade.netPl !== null)
  const results = closed.map((trade) => trade.netPl as number)
  const wins = results.filter((value) => value >= 0)

  return {
    netPl: results.reduce((sum, value) => sum + value, 0),
    count: trades.length,
    open: trades.length - closed.length,
    winRate: closed.length === 0 ? null : (wins.length / closed.length) * 100,
    best: results.length === 0 ? null : Math.max(...results),
    worst: results.length === 0 ? null : Math.min(...results),
  }
}

function Figure({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className={DAY_SUMMARY_CELL}>
      <span className={DAY_SUMMARY_LABEL}>{label}</span>
      <span className={`${DAY_SUMMARY_VALUE} ${tone ?? 'text-fg-strong'}`}>{value}</span>
    </div>
  )
}

/**
 * The summary behind a calendar cell.
 *
 * Opens for every date, including ones with nothing logged — a blank day is
 * itself worth seeing, and a cell that sometimes does nothing when clicked
 * teaches the trader not to click.
 */
export function DayDetail({ day, onClose }: DayDetailProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  // <dialog> gives us the focus trap, backdrop and Esc handling for free.
  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (day && !node.open) {
      node.showModal()
    } else if (!day && node.open) {
      node.close()
    }
  }, [day])

  const totals = summarise(day?.trades ?? [])

  return (
    <dialog
      ref={dialog}
      className={`${MODAL} ${MODAL_NARROW}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        // A click that lands on the dialog itself is a click on the backdrop.
        if (event.target === dialog.current) onClose()
      }}
    >
      {day && (
        <>
          <header className={MODAL_HEAD}>
            <div>
              <h2 className={MODAL_TITLE} id={titleId}>
                {fullDate.format(day.date)}
              </h2>
              <p className={MODAL_SUB}>
                {totals.count === 0
                  ? 'Nothing logged on this day.'
                  : `${totals.count} ${totals.count === 1 ? 'trade' : 'trades'}${
                      totals.open > 0 ? `, ${totals.open} still open` : ''
                    }.`}
              </p>
            </div>

            <button
              type="button"
              className={MODAL_CLOSE}
              onClick={onClose}
              aria-label="Close"
            >
              <CloseIcon />
            </button>
          </header>

          <div className={MODAL_BODY}>
            {totals.count > 0 && (
              <div className={DAY_SUMMARY}>
                <Figure
                  label="Net P/L"
                  value={signed(totals.netPl)}
                  tone={totals.netPl >= 0 ? POS : NEG}
                />
                <Figure
                  label="Win rate"
                  value={totals.winRate === null ? '—' : `${Math.round(totals.winRate)}%`}
                />
                <Figure
                  label="Best"
                  value={totals.best === null ? '—' : signed(totals.best)}
                  tone={POS}
                />
                <Figure
                  label="Worst"
                  value={totals.worst === null ? '—' : signed(totals.worst)}
                  tone={NEG}
                />
              </div>
            )}

            {totals.count === 0 ? (
              <p className={DAY_EMPTY}>
                No trades on this date. A flat day is a result too.
              </p>
            ) : (
              <ul className={DAY_TRADES}>
                {day.trades.map((trade) => {
                  const entry = timeOf(trade.entryAt)
                  const exit = timeOf(trade.exitAt)
                  const won = (trade.netPl ?? 0) >= 0

                  return (
                    <li key={trade.id} className={DAY_TRADE}>
                      <div className={DAY_TRADE_HEAD}>
                        <span className={TICKER}>{trade.ticker || '—'}</span>
                        <span
                          className={`${SIDE_BADGE} ${
                            trade.direction === 'Long' ? SIDE_LONG : SIDE_SHORT
                          }`}
                        >
                          {trade.direction.toUpperCase()}
                        </span>
                        {trade.setup?.trim() && (
                          <span className={CHIP}>{trade.setup.trim()}</span>
                        )}

                        <span
                          className={`${MONO} ml-auto text-[14px] font-medium ${
                            trade.netPl === null ? 'text-fg-muted' : won ? POS : NEG
                          }`}
                        >
                          {trade.netPl === null ? 'Open' : signed(trade.netPl)}
                        </span>
                      </div>

                      <div className={DAY_TRADE_META}>
                        {entry && <span>In {entry}</span>}
                        {exit && <span>Out {exit}</span>}
                        {trade.entryPrice !== null && (
                          <span>
                            {currency.format(trade.entryPrice)}
                            {trade.exitPrice !== null
                              ? ` → ${currency.format(trade.exitPrice)}`
                              : ''}
                          </span>
                        )}
                        {trade.riskReward !== null && (
                          <span>R:R 1 : {trade.riskReward.toFixed(1)}</span>
                        )}
                        {trade.emotionDuring?.trim() && (
                          <span>Felt {trade.emotionDuring.trim().toLowerCase()}</span>
                        )}
                        {(trade.mistakes ?? []).length > 0 && (
                          <span className={NEG}>{trade.mistakes.join(', ')}</span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </dialog>
  )
}
