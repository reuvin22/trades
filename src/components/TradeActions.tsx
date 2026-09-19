import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { StoredTrade } from '../lib/trades'
import { currency } from '../data/dashboard'
import { PencilIcon, SpinnerIcon, TrashIcon, CloseIcon } from './Icons'
import { ChartStrip } from './ChartStrip'
import {
  CONFIRM_BODY,
  CONFIRM_CARD,
  CONFIRM_FOOT,
  CONFIRM_TITLE,
  DETAIL_GRID,
  DETAIL_HEAD,
  DETAIL_PL,
  DETAIL_TICKER,
  MODAL,
  MODAL_CLOSE,
  MODAL_DETAIL,
  MODAL_FOOT,
  MODAL_HEAD,
  MODAL_SHELL,
  MODAL_SPLIT,
  MODAL_SPLIT_CHART,
  MODAL_SPLIT_DATA,
  TV_PENDING,
  PILL,
  PILL_ACCENT,
  PILL_DANGER,
  PILL_IDLE,
  SIDE_BADGE,
  SIDE_LONG,
  SIDE_SHORT,
} from './ui'
import { hasFeature } from '../lib/entitlements'

/*
 * Lightweight Charts is ~175KB, and the journal is the page that pays for it.
 *
 * Imported statically it landed in the TradeJournal chunk, taking it from
 * 31KB to 207KB — the whole library downloaded by everyone who opened the
 * journal, whether or not they ever opened a record. Behind lazy() it arrives
 * with the modal, which is the only moment it can be seen.
 */
const TradeChart = lazy(() =>
  import('./TradeChart').then((module) => ({ default: module.TradeChart })),
)

const stamp = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function when(value: string): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : stamp.format(date)
}

function money(value: number | null): string {
  return value === null ? '—' : currency.format(value)
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || '—'}</dd>
    </div>
  )
}

type Props = {
  trade: StoredTrade | null
  onClose: () => void
  onEdit: (trade: StoredTrade) => void
  onDelete: (trade: StoredTrade) => Promise<void>
}

/**
 * What a row in the journal opens: the entry in full, and the two things that
 * can be done to it.
 *
 * Deleting asks first. A journal entry is the only record that a trade
 * happened — there is no undo behind this, and the API has no trash — so the
 * confirmation names the trade rather than asking "are you sure", which is a
 * question people answer without reading.
 */
export function TradeActions({ trade, onClose, onEdit, onDelete }: Props) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [confirming, setConfirming] = useState(false)
  const [working, setWorking] = useState(false)
  /*
   * Whether the dialog is actually on screen, which is not the same as having
   * a trade to show.
   *
   * A closed <dialog> is display:none, and child effects run before the
   * parent's — so a chart mounted in the same pass would measure its
   * container before `showModal` below had given it a size, size itself to
   * zero, and have no coordinates to place the target and stop zones against.
   * Gating on this mounts it only once the dialog has been opened and laid
   * out.
   */
  const [shown, setShown] = useState(false)
  const open = trade !== null

  useEffect(() => {
    const node = dialog.current
    if (!node) return

    if (open && !node.open) {
      setConfirming(false)
      setWorking(false)
      node.showModal()
      setShown(true)
    } else if (!open && node.open) {
      node.close()
      setShown(false)
    }
  }, [open])

  if (!trade) return <dialog ref={dialog} className={MODAL} aria-hidden="true" />

  const pl = trade.netPl ?? 0
  const long = trade.direction === 'Long'

  return (
    <dialog
      ref={dialog}
      className={`${MODAL} ${MODAL_DETAIL}`}
      aria-labelledby="trade-actions-title"
      // Esc and backdrop both close the whole thing, never just the confirm.
      onCancel={(event) => {
        event.preventDefault()
        if (!working) onClose()
      }}
      onClick={(event) => {
        // A click on the dialog itself is a click on the backdrop. Ignored
        // mid-delete: losing the dialog while the request is in flight would
        // leave no way to see whether it worked.
        if (event.target === dialog.current && !working) onClose()
      }}
    >
      <div className={MODAL_SHELL}>
        <div className={MODAL_HEAD}>
          <div className={DETAIL_HEAD}>
            <span className={DETAIL_TICKER} id="trade-actions-title">
              {trade.ticker || '—'}
            </span>
            <span className={`${SIDE_BADGE} ${long ? SIDE_LONG : SIDE_SHORT}`}>
              {trade.direction.toUpperCase()}
            </span>
            <span className={`${DETAIL_PL} ${pl >= 0 ? 'text-green' : 'text-red'}`}>
              {pl >= 0 ? '+' : ''}
              {money(trade.netPl)}
            </span>
          </div>

          <button
            type="button"
            className={MODAL_CLOSE}
            onClick={onClose}
            disabled={working}
            aria-label="Close"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/*
          Two columns: what was recorded on the left, the position drawn from
          it on the right. Below 900px they stack, data first — the chart is
          the illustration, and on a phone the reading order should be the
          numbers and then the picture of them.
        */}
        <div className={MODAL_SPLIT}>
        {/* min-h-0 as well as overflow: a flex child will not shrink below its
            content without it, so the scroll would never engage. */}
        <dl className={`${DETAIL_GRID} ${MODAL_SPLIT_DATA}`}>
          <Row label="Setup" value={trade.setup} />
          <Row
            label="Size"
            value={trade.size === null ? '—' : `${trade.size} ${trade.sizeUnit}`}
          />
          <Row label="Entry" value={money(trade.entryPrice)} />
          <Row label="Exit" value={money(trade.exitPrice)} />
          <Row label="Opened" value={when(trade.entryAt)} />
          <Row label="Closed" value={when(trade.exitAt)} />
          <Row label="Stop" value={money(trade.stopLoss)} />
          <Row label="Target" value={money(trade.takeProfit)} />
          <Row
            label="R:R"
            value={trade.riskReward === null ? '—' : `${trade.riskReward.toFixed(2)}R`}
          />
          <Row label="Held" value={trade.duration ?? '—'} />
          <Row label="Before" value={trade.emotionBefore} />
          <Row label="During" value={trade.emotionDuring} />
          {trade.mistakes.length > 0 && (
            <div className="col-span-full">
              <dt>Mistakes</dt>
              <dd>{trade.mistakes.join(', ')}</dd>
            </div>
          )}
          {trade.rationale && (
            <div className="col-span-full">
              <dt>Rationale</dt>
              <dd>{trade.rationale}</dd>
            </div>
          )}
          {trade.notes && (
            <div className="col-span-full">
              <dt>Notes</dt>
              <dd>{trade.notes}</dd>
            </div>
          )}
          {/* Last, and full width: it is the tallest thing here, and a row of
              thumbnails between two text fields breaks the reading order. */}
          {hasFeature('chartScreenshots') && trade.screenshots.length > 0 && (
            <div className="col-span-full">
              <dt>{trade.screenshots.length === 1 ? 'Chart' : 'Charts'}</dt>
              <dd>
                <ChartStrip keys={trade.screenshots} />
              </dd>
            </div>
          )}
        </dl>

          <div className={MODAL_SPLIT_CHART}>
            {/* The fallback holds the chart's exact height, so the dialog does
                not resize under the pointer when the library lands. */}
            <Suspense fallback={<div className={TV_PENDING} />}>
              {/* Keyed by id so opening a different record mounts a fresh
                  chart rather than leaving the previous trade's candles up
                  while the new ones are still in flight. */}
              {shown && <TradeChart key={trade.id} trade={trade} />}
            </Suspense>
          </div>
        </div>

        {confirming ? (
          <div className={CONFIRM_CARD} role="alertdialog" aria-labelledby="confirm-title">
            <p className={CONFIRM_TITLE} id="confirm-title">
              Delete this entry?
            </p>
            <p className={CONFIRM_BODY}>
              {trade.ticker || 'This trade'}
              {trade.entryAt ? ` from ${when(trade.entryAt)}` : ''} will be removed from
              your journal. Your statistics recalculate without it. This cannot be undone.
            </p>

            <div className={CONFIRM_FOOT}>
              <button
                type="button"
                className={`${PILL} ${PILL_IDLE}`}
                onClick={() => setConfirming(false)}
                disabled={working}
              >
                Keep it
              </button>
              <button
                type="button"
                className={`${PILL} ${PILL_DANGER}`}
                disabled={working}
                onClick={async () => {
                  setWorking(true)
                  try {
                    await onDelete(trade)
                  } finally {
                    setWorking(false)
                  }
                }}
              >
                {working && <SpinnerIcon className="animate-spin" size={14} />}
                {working ? 'Deleting…' : 'Delete trade'}
              </button>
            </div>
          </div>
        ) : (
          <div className={MODAL_FOOT}>
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE}`}
              onClick={() => setConfirming(true)}
            >
              <TrashIcon size={14} />
              Delete
            </button>
            <button
              type="button"
              className={`${PILL} ${PILL_ACCENT}`}
              onClick={() => onEdit(trade)}
            >
              <PencilIcon size={14} />
              Edit trade
            </button>
          </div>
        )}
      </div>
    </dialog>
  )
}
