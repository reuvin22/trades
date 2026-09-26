import { useMemo } from 'react'
import { BarList, type Bar } from '../components/BarList'
import { EquityChart } from '../components/EquityChart'
import {
  AlertIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
} from '../components/Icons'
import { accentFor, initialsFor } from '../data/messages'
import {
  CARD,
  COMM_AVATAR,
  COMM_AVATAR_FACE,
  EMPTY_BLOCK,
  METER_FILL,
  MONO,
  MUTED_NOTE,
  NEG,
  PAGE_HEAD,
  PAGE_SUB,
  PAGE_TITLE,
  PANEL,
  PANEL_HEAD,
  PANEL_NOTE,
  PANEL_TITLE,
  POS,
  ROW,
  SIDE_BADGE,
  SIDE_LONG,
  SIDE_SHORT,
  STAT_CARD,
  STAT_LABEL,
  STAT_ROW,
  STAT_VALUE,
  TABLE,
  TABLE_WRAP,
  TD,
  TH,
  UNI_BACK,
  UNI_CARD_HEAD,
  UNI_CHART_WRAP,
  UNI_EVENT,
  UNI_EVENT_AGE,
  UNI_EVENT_BODY,
  UNI_EVENT_GLYPH,
  UNI_EVENT_KIND,
  UNI_EVENT_TEXT,
  UNI_EVENT_TITLE,
  UNI_EVENT_TONE,
  UNI_LOADING,
  UNI_PROGRESS,
  UNI_RULE,
  UNI_RULE_HEAD,
  UNI_RULE_PCT,
  UNI_RULES,
  UNI_SPLIT,
  UNI_SPLIT_STACK,
  UNI_TIMELINE,
  UNI_WHO,
  UNI_WHO_BODY,
  UNI_WHO_FACTS,
  UNI_WHO_MAIL,
  UNI_WHO_NAME,
} from '../components/ui'
import { disciplineScore } from '../lib/dashboardStats'
import { moneyIn } from '../lib/journalStats'
import { deriveStats, formatFactor, formatHold, startingCapital } from '../lib/stats'
import { navigate } from '../lib/useHashRoute'
import { nameOf, useStudentJournal, useUniversity } from '../lib/university'
import type { Profile } from '../lib/profile'
import type { StoredTrade } from '../lib/trades'

/** How many of the most recent trades the table shows before it is a journal. */
const RECENT_TRADES = 12

/**
 * Everything one student has done, from their own journal.
 *
 * Reached from the roster, at `#/university/<uid>`. The trades come from
 * `GET /api/v1/university/students/{uid}/journal`, which is the only read in
 * the service that crosses accounts — and it is refused unless that student
 * accepted an invitation from this caller. A 403 here is not a bug; it is the
 * grant doing its job, and the screen says so rather than showing an empty
 * journal that looks like a student who never traded.
 *
 * The figures are computed in the browser by `deriveStats` — the same
 * functions behind the trader's own dashboard — from trades the server
 * already derived the P&L on. Nothing on this page is a number anybody typed.
 */
export function StudentActivity({
  uid,
  profile,
}: {
  uid: string
  profile: Profile | null
}) {
  // The roster is what says who this is and when they enrolled; the journal
  // call answers what they have done.
  const { students, loading: rosterLoading } = useUniversity(profile?.uid ?? null)
  const journal = useStudentJournal(uid)

  const student = students.find((entry) => entry.uid === uid) ?? null

  const opening = startingCapital(profile)
  const stats = useMemo(
    () => deriveStats(journal.trades, opening),
    [journal.trades, opening],
  )
  const rules = useMemo(() => disciplineScore(journal.trades), [journal.trades])
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])

  if (journal.error !== null) {
    return (
      <>
        <BackLink />
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>{journal.error}</p>
          <p className={MUTED_NOTE}>
            You can only read the journal of a trader who accepted your invitation.
          </p>
        </section>
      </>
    )
  }

  if (journal.loading || (rosterLoading && student === null)) {
    return (
      <>
        <BackLink />
        <section className={CARD}>
          <p className={UNI_LOADING}>Loading their record…</p>
        </section>
      </>
    )
  }

  const who = student === null ? 'This student' : nameOf(student.displayName, student.email)

  const setupBars: Bar[] = stats.setups.slice(0, 6).map((slice) => ({
    label: slice.label,
    value: slice.count,
    caption: `${Math.round((slice.wins / slice.count) * 100)}% won`,
  }))

  return (
    <>
      <BackLink />

      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>{who}</h2>
          <p className={PAGE_SUB}>
            Everything they have logged. Every figure is derived from the journal
            itself — nothing here was entered by hand.
          </p>
        </div>
      </div>

      <section className={`${CARD} ${UNI_WHO}`}>
        <span className={COMM_AVATAR} style={{ width: 62, height: 62 }}>
          <span
            className={COMM_AVATAR_FACE}
            style={{ background: accentFor(uid), fontSize: 21 }}
          >
            {initialsFor(who, '')}
          </span>
        </span>

        <div className={UNI_WHO_BODY}>
          <span className={UNI_WHO_NAME}>{who}</span>
          <span className={UNI_WHO_MAIL}>{student?.email ?? ''}</span>
          <span className={UNI_WHO_FACTS}>
            {student?.since != null && (
              <span>
                Enrolled{' '}
                {student.since.toLocaleDateString('en-GB', {
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            )}
            <span>{stats.tradeCount} trades logged</span>
            {student?.lastTradeAt != null && (
              <span>
                Last traded{' '}
                {student.lastTradeAt.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                })}
              </span>
            )}
          </span>
        </div>
      </section>

      {stats.tradeCount === 0 ? (
        <section className={`${CARD} ${EMPTY_BLOCK}`}>
          <p>Nothing logged yet.</p>
          <p className={MUTED_NOTE}>
            They have joined but have not written a trade. There is nothing to read
            until they do.
          </p>
        </section>
      ) : (
        <>
          <div className={STAT_ROW}>
            <Figure
              label="Net P&L"
              value={money(stats.netPl)}
              tone={stats.netPl >= 0 ? 'pos' : 'neg'}
            />
            <Figure label="Win rate" value={`${Math.round(stats.winRate)}%`} />
            <Figure label="Profit factor" value={formatFactor(stats.profitFactor)} />
            <Figure label="Expectancy" value={money(stats.expectancy)} />
            <Figure
              label="Max drawdown"
              value={`${stats.maxDrawdownPct.toFixed(1)}%`}
              tone={stats.maxDrawdownPct > 20 ? 'neg' : undefined}
            />
            <Figure label="Avg hold" value={formatHold(stats.avgHoldMinutes)} />
          </div>

          <div className={UNI_SPLIT}>
            {/* EquityChart draws its own card, so this only gives it a height. */}
            <div className={UNI_CHART_WRAP}>
              <EquityChart
                equity={stats.equity}
                opening={opening}
                spanLabel={`${stats.closedCount} closed trades`}
              />
            </div>

            <div className={UNI_SPLIT_STACK}>
              <section className={CARD}>
                <div className={PANEL}>
                  <div className={PANEL_HEAD}>
                    <h3 className={PANEL_TITLE}>Rules followed</h3>
                    {rules.score !== null && (
                      <span className={PANEL_NOTE}>{Math.round(rules.score)}%</span>
                    )}
                  </div>

                  {rules.score === null ? (
                    <p className={MUTED_NOTE}>
                      Nothing graded yet — the rule questions are blank on every entry.
                    </p>
                  ) : (
                    <div className={UNI_RULES}>
                      <Rule label="Entry" value={rules.entry} />
                      <Rule label="Exit" value={rules.exit} />
                      <Rule label="Management" value={rules.management} />
                    </div>
                  )}
                </div>
              </section>

              <BarList
                title="Setups traded"
                bars={setupBars}
                format={(value) => String(value)}
                note={`${stats.setups.length} in use`}
                empty="No setups labelled yet."
              />
            </div>
          </div>

          <section className={CARD}>
            <div className={UNI_CARD_HEAD}>
              <h3 className={PANEL_TITLE}>Recent trades</h3>
              <span className={PANEL_NOTE}>
                {Math.min(RECENT_TRADES, journal.trades.length)} of{' '}
                {journal.trades.length}
              </span>
            </div>

            <div className={TABLE_WRAP}>
              <table className={TABLE}>
                <thead>
                  <tr>
                    <th className={TH}>Instrument</th>
                    <th className={TH}>Side</th>
                    <th className={TH}>Setup</th>
                    <th className={TH}>Opened</th>
                    <th className={TH}>Held</th>
                    <th className={TH}>R:R</th>
                    <th className={TH}>Rules</th>
                    <th className={TH}>P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {journal.trades.slice(0, RECENT_TRADES).map((trade) => (
                    <TradeRow key={trade.id} trade={trade} money={money} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={CARD}>
            <div className={UNI_CARD_HEAD}>
              <h3 className={PANEL_TITLE}>Notable</h3>
            </div>
            <Timeline trades={journal.trades} money={money} />
          </section>
        </>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ parts */

function BackLink() {
  return (
    <button type="button" className={UNI_BACK} onClick={() => navigate('university')}>
      <ChevronLeftIcon size={15} />
      My University
    </button>
  )
}

function Figure({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'pos' | 'neg'
}) {
  const colour = tone === 'pos' ? POS : tone === 'neg' ? NEG : ''

  return (
    <div className={`${CARD} ${STAT_CARD}`}>
      <span className={STAT_LABEL}>{label}</span>
      <span className={`${STAT_VALUE} ${colour}`}>{value}</span>
    </div>
  )
}

function Rule({ label, value }: { label: string; value: number | null }) {
  return (
    <div className={UNI_RULE}>
      <div className={UNI_RULE_HEAD}>
        <span>{label}</span>
        <span className={UNI_RULE_PCT}>
          {value === null ? '—' : `${Math.round(value)}%`}
        </span>
      </div>
      <span className={UNI_PROGRESS}>
        <span className={METER_FILL} style={{ width: `${value ?? 0}%` }} />
      </span>
    </div>
  )
}

function TradeRow({
  trade,
  money,
}: {
  trade: StoredTrade
  money: (value: number) => string
}) {
  const pl = trade.netPl ?? 0
  const opened = trade.entryAt ? new Date(trade.entryAt) : null

  const held =
    opened !== null && trade.exitAt
      ? formatHold(
          Math.round((new Date(trade.exitAt).getTime() - opened.getTime()) / 60_000),
        )
      : '—'

  // Any one answered "no" is a break; a blank is "not graded" and is not held
  // against them, which is the rule disciplineScore already follows.
  const broke =
    trade.compliedEntry === 'no' ||
    trade.compliedExit === 'no' ||
    trade.compliedManagement === 'no'

  return (
    <tr className={ROW}>
      <td className={TD}>{trade.ticker}</td>
      <td className={TD}>
        <span
          className={`${SIDE_BADGE} ${trade.direction === 'Long' ? SIDE_LONG : SIDE_SHORT}`}
        >
          {trade.direction}
        </span>
      </td>
      <td className={TD}>{trade.setup || '—'}</td>
      <td className={TD}>
        {opened === null
          ? '—'
          : opened.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
      </td>
      <td className={TD}>{held}</td>
      <td className={TD}>{trade.riskReward?.toFixed(2) ?? '—'}</td>
      <td className={TD}>
        {broke ? (
          <AlertIcon size={15} className={NEG} />
        ) : (
          <CheckCircleIcon size={15} className={POS} />
        )}
      </td>
      <td className={`${TD} ${MONO} ${pl >= 0 ? POS : NEG}`}>{money(pl)}</td>
    </tr>
  )
}

type TimelineEntry = {
  id: string
  kind: 'win' | 'loss'
  title: string
  body: string
  age: string
}

/**
 * The two trades worth opening the conversation with.
 *
 * Read off the journal rather than written anywhere, so the best trade in this
 * list is the same trade that made the step in the curve above it. There is no
 * coaching log yet — notes a coach wrote about a student would be a store of
 * their own, and one with real privacy questions attached.
 */
function Timeline({
  trades,
  money,
}: {
  trades: StoredTrade[]
  money: (value: number) => string
}) {
  const entries = useMemo<TimelineEntry[]>(() => {
    const closed = trades.filter((trade) => trade.netPl !== null)
    if (closed.length === 0) return []

    const best = closed.reduce((top, trade) =>
      (trade.netPl ?? 0) > (top.netPl ?? 0) ? trade : top,
    )
    const worst = closed.reduce((low, trade) =>
      (trade.netPl ?? 0) < (low.netPl ?? 0) ? trade : low,
    )

    const describe = (trade: StoredTrade) =>
      `${trade.setup || 'No setup labelled'}, ${trade.direction.toLowerCase()}. ${money(
        trade.netPl ?? 0,
      )}.`

    return [
      {
        id: `${best.id}-best`,
        kind: 'win',
        title: `Best trade — ${best.ticker}`,
        body: describe(best),
        age: relative(best.entryAt),
      },
      {
        id: `${worst.id}-worst`,
        kind: 'loss',
        title: `Worst trade — ${worst.ticker}`,
        body: describe(worst),
        age: relative(worst.entryAt),
      },
    ]
  }, [trades, money])

  if (entries.length === 0) {
    return (
      <div className={EMPTY_BLOCK}>
        <p>Nothing closed yet.</p>
      </div>
    )
  }

  return (
    <div className={UNI_TIMELINE}>
      {entries.map((entry) => (
        <div key={entry.id} className={UNI_EVENT}>
          <span className={`${UNI_EVENT_GLYPH} ${UNI_EVENT_TONE[entry.kind]}`}>
            {entry.kind === 'win' ? (
              <ArrowUpIcon size={14} />
            ) : (
              <ArrowDownIcon size={14} />
            )}
          </span>
          <span className={UNI_EVENT_BODY}>
            <span className={UNI_EVENT_TITLE}>
              {entry.title}
              <span className={UNI_EVENT_KIND}>Trade</span>
            </span>
            <span className={UNI_EVENT_TEXT}>{entry.body}</span>
          </span>
          <span className={UNI_EVENT_AGE}>{entry.age}</span>
        </div>
      ))}
    </div>
  )
}

/** Rough age of an ISO timestamp, in the compact form the product uses. */
function relative(iso: string): string {
  const when = new Date(iso)
  if (Number.isNaN(when.getTime())) return ''

  const days = Math.round((Date.now() - when.getTime()) / 86_400_000)
  if (days <= 0) return 'today'
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  return `${Math.round(days / 30)}mo`
}
