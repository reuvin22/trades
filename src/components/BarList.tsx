import type { CSSProperties } from 'react'
import {
  BAR_FILL,
  BAR_LINE,
  BAR_LIST,
  BAR_NAME,
  BAR_TRACK,
  BAR_VALUE,
  BAR_ZERO,
  CARD,
  NEG,
  PANEL,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  POS,
  SECTION_EMPTY,
} from './ui'

export type Bar = { label: string; value: number; caption?: string }

/**
 * A row of bars that grow either side of zero.
 *
 * Either side, because every distribution on this page can be negative — a
 * session that loses money, a day of the week that costs you. Bars pinned to
 * the left edge would draw a loss the same way as a gain and leave the sign to
 * a minus that is easy to miss.
 *
 * Scaled against the largest absolute value present, so the widest bar always
 * fills the track and the rest are read against it.
 */
export function BarList({
  title,
  bars,
  format,
  note,
  empty = 'Nothing recorded here yet.',
  bare = false,
}: {
  /** Omit when the surrounding card already carries the heading. */
  title?: string
  bars: Bar[]
  format: (value: number) => string
  note?: string
  empty?: string
  /** Drop the card shell, for a list already inside one. */
  bare?: boolean
}) {
  const scale = Math.max(1, ...bars.map((bar) => Math.abs(bar.value)))

  return (
    <article className={bare ? '' : `${CARD} ${PANEL}`}>
      {(title || note) && (
        <div className={PANEL_HEAD}>
          {title && <h3 className={PANEL_TITLE}>{title}</h3>}
          {note && <span className={PANEL_NOTE}>{note}</span>}
        </div>
      )}

      {bars.length === 0 ? (
        <p className={SECTION_EMPTY}>{empty}</p>
      ) : (
        <div className={BAR_LIST}>
          {bars.map((bar) => {
            const share = (Math.abs(bar.value) / scale) * 50
            const positive = bar.value >= 0

            return (
              <div key={bar.label} className={BAR_LINE}>
                <span className={BAR_NAME} title={bar.label}>
                  {bar.label}
                </span>

                <span className={BAR_TRACK}>
                  <span className={BAR_ZERO} style={{ left: '50%' }} />
                  <span
                    className={`${BAR_FILL} ${positive ? 'bg-green' : 'bg-red'}`}
                    style={
                      {
                        width: `${share}%`,
                        // Grows right from the midline, or left to it.
                        left: positive ? '50%' : `${50 - share}%`,
                      } as CSSProperties
                    }
                  />
                </span>

                <span className={`${BAR_VALUE} ${positive ? POS : NEG}`}>
                  {format(bar.value)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
