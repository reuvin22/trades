import { useMemo, useState } from 'react'
import {
  byDirection,
  byDuration,
  byEmotion,
  byHour,
  byMistake,
  byRiskBand,
  bySession,
  bySymbol,
  byWeekday,
  execution,
  overTime,
  postLoss,
  streaks,
  type Grain,
} from '../lib/analytics'
import { bySetup } from '../lib/dashboardStats'
import { RollingEquityCurve } from './RollingEquityCurve'
import { SliceTable } from './SliceTable'
import { BarList } from './BarList'
import { formatHold, type DerivedStats } from '../lib/stats'
import type { StoredTrade } from '../lib/trades'
import {
  CARD,
  NEG,
  PANEL,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  POS,
  RISK_AGAINST,
  RISK_GRID,
  RISK_ITEM,
  RISK_LABEL,
  RISK_VALUE,
  SECTION_ASK,
  SECTION_EMPTY,
  SEGMENT,
  SEGMENT_ACTIVE,
  SEGMENT_IDLE,
  SEGMENTED,
  SPLIT,
} from './ui'

type Common = {
  trades: StoredTrade[]
  stats: DerivedStats
  capital: number
  money: (value: number) => string
}

const asR = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}R`

/* ------------------------------------------------------------- overview */

export function OverviewSection({ trades, stats, capital, money }: Common) {
  const [grain, setGrain] = useState<Grain>('monthly')
  const buckets = useMemo(() => overTime(trades, grain), [trades, grain])
  const run = useMemo(() => streaks(trades), [trades])

  const GRAINS: Grain[] = ['daily', 'weekly', 'monthly']

  return (
    <>
      <p className={SECTION_ASK}>
        How performance has changed — not what it is. The dashboard answers
        &ldquo;where do I stand&rdquo;; this answers &ldquo;which way am I
        going&rdquo;.
      </p>

      <RollingEquityCurve equity={stats.equity} opening={capital} />

      <div className={SPLIT}>
        <div className={`${CARD} ${PANEL}`}>
          <div className={PANEL_HEAD}>
            <h3 className={PANEL_TITLE}>P&amp;L over time</h3>
            <div className={SEGMENTED} role="group" aria-label="Grouping">
              {GRAINS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`${SEGMENT} ${grain === option ? SEGMENT_ACTIVE : SEGMENT_IDLE}`}
                  aria-pressed={grain === option}
                  onClick={() => setGrain(option)}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <BarListInline buckets={buckets} money={money} />
        </div>

        <div className={`${CARD} ${PANEL}`}>
          <div className={PANEL_HEAD}>
            <h3 className={PANEL_TITLE}>Streaks and shape</h3>
          </div>

          <div className={RISK_GRID}>
            <Figure label="Best winning run" value={run.bestWin === 0 ? '—' : `${run.bestWin}`} note="trades in a row" />
            <Figure
              label="Worst losing run"
              value={run.worstLoss === 0 ? '—' : `${Math.abs(run.worstLoss)}`}
              note="trades in a row"
              tone={run.worstLoss < 0 ? NEG : ''}
            />
            <Figure
              label="Current run"
              value={run.current === 0 ? '—' : `${Math.abs(run.current)}`}
              note={run.current > 0 ? 'winning' : run.current < 0 ? 'losing' : 'none'}
              tone={run.current > 0 ? POS : run.current < 0 ? NEG : ''}
            />
            <Figure
              label="Average trade"
              value={money(stats.expectancy)}
              note={`over ${stats.closedCount} closed`}
              tone={stats.expectancy >= 0 ? POS : NEG}
            />
          </div>
        </div>
      </div>
    </>
  )
}

/** The over-time buckets, drawn with the shared bar list. */
function BarListInline({
  buckets,
  money,
}: {
  buckets: { label: string; netPl: number; trades: number }[]
  money: (value: number) => string
}) {
  return (
    <BarList
      bare
      bars={buckets.map((bucket) => ({ label: bucket.label, value: bucket.netPl }))}
      format={money}
      empty="Log trades with a date and this fills in."
    />
  )
}

function Figure({
  label,
  value,
  note,
  tone = '',
}: {
  label: string
  value: string
  note: string
  tone?: string
}) {
  return (
    <div className={RISK_ITEM}>
      <span className={RISK_LABEL}>{label}</span>
      <strong className={`${RISK_VALUE} ${tone}`}>{value}</strong>
      <span className={RISK_AGAINST}>{note}</span>
    </div>
  )
}

/* --------------------------------------------------------------- setups */

export function SetupsSection({ trades, money }: Common) {
  const rows = useMemo(() => bySetup(trades), [trades])

  return (
    <>
      <p className={SECTION_ASK}>
        Which setups earn their place. Sort by P&amp;L to see what pays, by Avg
        R to see what pays <em>per unit of risk</em> — they are rarely the same
        list.
      </p>
      <SliceTable title="By setup" nameHeading="Setup" rows={rows} money={money} />
    </>
  )
}

/* -------------------------------------------------------------- markets */

export function MarketsSection({ trades, money }: Common) {
  const symbols = useMemo(() => bySymbol(trades), [trades])
  const sides = useMemo(() => byDirection(trades), [trades])

  return (
    <>
      <p className={SECTION_ASK}>
        Where your edge actually lives. A symbol you trade often and lose on is
        the most expensive habit in a journal.
      </p>

      <SliceTable title="By symbol" nameHeading="Symbol" rows={symbols} money={money} />
      <SliceTable
        title="Long against short"
        nameHeading="Direction"
        rows={sides}
        money={money}
      />
    </>
  )
}

/* ----------------------------------------------------------------- risk */

export function RiskSection({ trades, capital, money }: Common) {
  const bands = useMemo(() => byRiskBand(trades, capital), [trades, capital])

  const negativeAbove = bands.find((band) => band.avgR !== null && band.avgR < 0)

  return (
    <>
      <p className={SECTION_ASK}>
        What size does to your results. The question worth asking here is not
        &ldquo;how much did I lose&rdquo; but &ldquo;at what size do I stop
        making money&rdquo;.
      </p>

      {bands.length === 0 ? (
        <p className={SECTION_EMPTY}>
          This needs an entry price, a stop and a size on your trades, plus a
          capital figure in Settings. Risk is measured as the distance to your
          stop — without one there is nothing to measure.
        </p>
      ) : (
        <>
          {negativeAbove && (
            <p className={SECTION_ASK}>
              <strong className={NEG}>
                Your expectancy turns negative in the {negativeAbove.label} band
              </strong>{' '}
              — {asR(negativeAbove.avgR ?? 0)} across {negativeAbove.rSample}{' '}
              {negativeAbove.rSample === 1 ? 'trade' : 'trades'}.
            </p>
          )}

          <SliceTable
            title="By risk taken"
            nameHeading="Risk per trade"
            rows={bands}
            money={money}
            note="as a share of capital"
          />

          <BarList
            title="Expectancy by risk band"
            bars={bands
              .filter((band) => band.avgR !== null)
              .map((band) => ({ label: band.label, value: band.avgR ?? 0 }))}
            format={asR}
            note="realised R"
            empty="No trades with a stop recorded."
          />
        </>
      )}
    </>
  )
}

/* ----------------------------------------------------------------- time */

export function TimeSection({ trades, stats, money }: Common) {
  const sessions = useMemo(() => bySession(trades), [trades])
  const weekdays = useMemo(() => byWeekday(trades), [trades])
  const hours = useMemo(() => byHour(trades), [trades])
  const durations = useMemo(() => byDuration(trades), [trades])

  return (
    <>
      <p className={SECTION_ASK}>
        When you make money, and when you give it back. A losing hour of the day
        is one of the cheapest things a trader can fix.
      </p>

      <div className={SPLIT}>
        <BarList
          title="By session"
          bars={sessions.map((slice) => ({ label: slice.label, value: slice.netPl }))}
          format={money}
          note="overlaps count twice"
        />
        <BarList
          title="By day of week"
          bars={weekdays.map((slice) => ({ label: slice.label, value: slice.netPl }))}
          format={money}
        />
      </div>

      <div className={SPLIT}>
        <BarList
          title="By time of day"
          bars={hours.map((slice) => ({ label: slice.label, value: slice.netPl }))}
          format={money}
          note="two-hour bands"
          empty="Log an entry time and this fills in."
        />
        <BarList
          title="By how long you held"
          bars={durations.map((slice) => ({ label: slice.label, value: slice.netPl }))}
          format={money}
          empty="Needs both an entry and an exit time."
        />
      </div>

      <div className={`${CARD} ${PANEL}`}>
        <div className={PANEL_HEAD}>
          <h3 className={PANEL_TITLE}>How long you hold</h3>
        </div>

        <div className={RISK_GRID}>
          <Figure
            label="Average hold"
            value={formatHold(stats.avgHoldMinutes)}
            note="entry to exit"
          />
          <Figure
            label="Bands measured"
            value={`${durations.reduce((sum, band) => sum + band.trades, 0)}`}
            note="trades with both times"
          />
        </div>
      </div>

      <SliceTable title="Sessions in full" nameHeading="Session" rows={sessions} money={money} />
    </>
  )
}

/* ------------------------------------------------------------- behaviour */

export function BehaviourSection({ trades, money }: Common) {
  const post = useMemo(() => postLoss(trades), [trades])
  const mistakes = useMemo(() => byMistake(trades), [trades])
  const emotions = useMemo(() => byEmotion(trades), [trades])

  const gap =
    post.after.winRate !== null && post.rest.winRate !== null
      ? post.after.winRate - post.rest.winRate
      : null

  return (
    <>
      <p className={SECTION_ASK}>
        What you do after something happens. A count of mistakes is a list; the
        comparison below is a finding.
      </p>

      <article className={`${CARD} ${PANEL}`}>
        <div className={PANEL_HEAD}>
          <h3 className={PANEL_TITLE}>The trade after a loss</h3>
          <span className={PANEL_NOTE}>within {post.windowMinutes} minutes</span>
        </div>

        {post.after.trades === 0 ? (
          <p className={SECTION_EMPTY}>
            Nothing here yet — no trade in this journal follows a losing one
            inside the hour. That is a good sign, not a gap.
          </p>
        ) : (
          <>
            {gap !== null && gap < 0 && (
              <p className={SECTION_ASK}>
                You take <strong>{post.after.trades}</strong>{' '}
                {post.after.trades === 1 ? 'trade' : 'trades'} straight after a
                loss, and win{' '}
                <strong className={NEG}>{Math.round(post.after.winRate ?? 0)}%</strong>{' '}
                of them against{' '}
                <strong>{Math.round(post.rest.winRate ?? 0)}%</strong> the rest of
                the time
                {post.riskChangePct !== null && post.riskChangePct > 5 && (
                  <>
                    , on{' '}
                    <strong className={NEG}>
                      {Math.round(post.riskChangePct)}% more risk
                    </strong>
                  </>
                )}
                .
              </p>
            )}

            <SliceTable
              nameHeading="Group"
              rows={[post.after, post.rest]}
              money={money}
            />
          </>
        )}
      </article>

      <div className={SPLIT}>
        <SliceTable
          title="By mistake tagged"
          nameHeading="Mistake"
          rows={mistakes}
          money={money}
          note="a trade can carry several"
        />
        <SliceTable
          title="By how you felt"
          nameHeading="Emotion"
          rows={emotions}
          money={money}
          note="before and during"
        />
      </div>
    </>
  )
}

/* ------------------------------------------------------------- execution */

export function ExecutionSection({ trades }: Common) {
  const run = useMemo(() => execution(trades), [trades])

  const nothing = run.targetSample === 0 && run.stopSample === 0

  return (
    <>
      <p className={SECTION_ASK}>
        How closely trades followed the plan they were given — measured against
        the stop and target you wrote down, not against how they felt.
      </p>

      {nothing ? (
        <p className={SECTION_EMPTY}>
          This reads the stop and target you log with a trade against where it
          actually closed. Add those to your entries and it fills in.
        </p>
      ) : (
        <div className={`${CARD} ${PANEL}`}>
          <div className={PANEL_HEAD}>
            <h3 className={PANEL_TITLE}>Against your own plan</h3>
          </div>

          <div className={RISK_GRID}>
            <Figure
              label="Targets reached"
              value={
                run.targetSample === 0
                  ? '—'
                  : `${Math.round((run.targetHit / run.targetSample) * 100)}%`
              }
              note={
                run.targetSample === 0
                  ? 'needs a target logged'
                  : `of ${run.targetSample} winners`
              }
            />
            <Figure
              label="Closed early"
              value={run.targetSample === 0 ? '—' : `${run.targetShort}`}
              note="winners cut before target"
              tone={run.targetShort > 0 ? NEG : ''}
            />
            <Figure
              label="Target captured"
              value={run.captureRate === null ? '—' : `${Math.round(run.captureRate)}%`}
              note="of what was planned"
            />
            <Figure
              label="Past the stop"
              value={run.stopSample === 0 ? '—' : `${run.stopOverrun}`}
              note={`of ${run.stopSample} losers`}
              tone={run.stopOverrun > 0 ? NEG : ''}
            />
          </div>

          {/*
            Named rather than left as a silent gap. MFE and MAE are the two
            figures a trader expects in an execution report, and they cannot be
            worked out from what is stored: nothing records where price went
            between entry and exit.
          */}
          <p className={`${SECTION_ASK} mt-16 mb-0`}>
            Entry quality, MFE and MAE are not here because the journal does not
            hold them — they need the high and low reached while each trade was
            open, which nothing currently records.
          </p>
        </div>
      )}
    </>
  )
}
