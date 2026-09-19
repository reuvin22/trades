import { useMemo, useState } from 'react'
import {
  BehaviourSection,
  ExecutionSection,
  MarketsSection,
  OverviewSection,
  RiskSection,
  SetupsSection,
  TimeSection,
} from '../components/AnalyticsSections'
import { TradeLog, type LogVariant } from '../components/TradeLog'
import { AnalyticsBoard } from '../components/AnalyticsBoard'
import { PAGE_HEAD, PAGE_SUB, PAGE_TITLE, ROW_STAGGER, TAB, TAB_ON, TABS } from '../components/ui'
import { deriveStats, startingCapital } from '../lib/stats'
import { moneyIn } from '../lib/journalStats'
import type { StoredTrade } from '../lib/trades'
import type { Profile as ProfileRecord } from '../lib/profile'

type AnalyticsProps = {
  trades: StoredTrade[]
  /** For the account size every percentage here is measured against. */
  profile: ProfileRecord | null
}

/**
 * The seven questions this page answers, one at a time.
 *
 * Tabs rather than one long page, and that is the main design decision here.
 * Seven sections of tables stacked vertically is a page whose bottom half
 * nobody reads; as tabs, each section is a question the trader chose to ask,
 * and each can be as deep as it needs to be without crowding the others.
 *
 * The dashboard and this page deliberately do not overlap. The dashboard says
 * where you stand. This says why.
 */
const SECTIONS = [
  { key: 'overview', label: 'Overview', view: OverviewSection },
  { key: 'setups', label: 'Setups', view: SetupsSection },
  { key: 'markets', label: 'Markets', view: MarketsSection },
  { key: 'risk', label: 'Risk', view: RiskSection },
  { key: 'time', label: 'Time', view: TimeSection },
  { key: 'behaviour', label: 'Behaviour', view: BehaviourSection },
  { key: 'execution', label: 'Execution', view: ExecutionSection },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

/** Which trade log belongs under which tab. Absent means no log at all. */
const LOGS: Partial<Record<SectionKey, LogVariant>> = {
  markets: 'markets',
  risk: 'risk',
  time: 'time',
  behaviour: 'behaviour',
  execution: 'execution',
}

export function Analytics({ trades, profile }: AnalyticsProps) {
  const [open, setOpen] = useState<SectionKey>('overview')

  const capital = startingCapital(profile)
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])
  const stats = useMemo(() => deriveStats(trades, capital), [trades, capital])

  const Section = SECTIONS.find((entry) => entry.key === open)?.view ?? OverviewSection

  return (
    <div className="terminal-page terminal-analytics">
      <div className={PAGE_HEAD}>
        <div>
          <h2 className={PAGE_TITLE}>Analytics</h2>
          <p className={PAGE_SUB}>
            Where your results come from, across {stats.tradeCount}{' '}
            {stats.tradeCount === 1 ? 'logged trade' : 'logged trades'}.
          </p>
        </div>
      </div>

      <div className={TABS} role="tablist" aria-label="Analysis">
        {SECTIONS.map((entry) => (
          <button
            key={entry.key}
            type="button"
            role="tab"
            aria-selected={open === entry.key}
            className={`${TAB} ${open === entry.key ? TAB_ON : ''}`}
            onClick={() => setOpen(entry.key)}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {open === 'overview' && <AnalyticsBoard trades={trades} stats={stats} capital={capital} />}

      {/* Keyed on the section, so switching replays the entrance rather than
          swapping content under a stationary card. */}
      <div key={open} className={`flex flex-col gap-18 ${ROW_STAGGER} ${open === 'overview' ? 'hidden' : ''}`}>
        <Section trades={trades} stats={stats} capital={capital} money={money} />
      </div>

      {/*
        Overview has the board, and Setups has a table that already breaks
        results down by setup — a log of individual trades under either one
        repeats what is directly above it. The rest each get a log ranked by
        that tab's own question; see TradeLog for what each variant shows.
      */}
      {LOGS[open] && <TradeLog trades={trades} variant={LOGS[open]} capital={capital} />}
    </div>
  )
}
