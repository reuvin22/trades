import { useMemo, useState } from 'react'
import { ChartStrip } from '../components/ChartStrip'
import { CsvImport } from '../components/CsvImport'
import { QuickAddTrade } from '../components/QuickAddTrade'
import { RangeMenu } from '../components/RangeMenu'
import { TradeActions } from '../components/TradeActions'
import { deleteTrade, toEntry, updateTrade, type StoredTrade } from '../lib/trades'
import { inWindow, windowFor, type Preset } from '../lib/dateWindow'
import { downloadCsv } from '../lib/exportJournal'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import type { DateRange } from '../components/DateRangePicker'
import type { Profile as ProfileRecord } from '../lib/profile'
import { moneyIn } from '../lib/journalStats'
import { SESSION_LABELS } from '../data/tradeForm'

type TradeJournalProps = { uid: string | null; trades: StoredTrade[]; loading: boolean; error: string | null; reload: () => void; profile: ProfileRecord | null }
type Money = (value: number) => string
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function stamp(trade: StoredTrade) {
  const date = new Date(trade.entryAt || trade.createdAt?.toISOString() || '')
  return Number.isNaN(date.getTime()) ? 'Undated trade' : dateFormat.format(date)
}

function when(value: string) {
  const date = new Date(value)
  return value === '' || Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date)
}

/** Prices keep the precision they were entered with: 1.08415 is not 1.08. */
function price(value: number | null) {
  return value === null ? '—' : value.toLocaleString('en-US', { maximumFractionDigits: 6 })
}

function signed(value: number | null, money: Money) {
  return value === null ? 'Open' : `${value > 0 ? '+' : ''}${money(value)}`
}

/** The form stores "yes", "no" or blank; anything else is an older free-text answer. */
function verdict(value: string): { label: string; tone: 'good' | 'bad' | '' } {
  if (/^(yes|true|followed)$/i.test(value)) return { label: 'Followed', tone: 'good' }
  if (/^(no|false|broken)$/i.test(value)) return { label: 'Broken', tone: 'bad' }
  return { label: value || 'Not graded', tone: '' }
}

function ReviewCard({ label, value }: { label: string; value: string }) {
  const { label: text, tone } = verdict(value)
  return <article className="journal-review-card">
    <div><span>{label}</span><i className={tone === 'good' ? 'journal-switch on' : 'journal-switch'} /></div>
    <strong className={tone}>{text}</strong>
    <div className="journal-rule-line"><span className={tone} style={{ width: tone ? '100%' : '0%' }} /></div>
  </article>
}

/** Every figure the trade was logged with, so the journal is the record rather than a summary of it. */
function TradeFacts({ trade, money }: { trade: StoredTrade; money: Money }) {
  const pl = trade.netPl
  const facts: [string, string, string?][] = [
    ['Net P&L', signed(pl, money), pl === null ? '' : pl >= 0 ? 'good' : 'bad'],
    ['Risk : Reward', trade.riskReward === null ? '—' : `1 : ${trade.riskReward.toFixed(2)}`],
    ['Direction', trade.direction, trade.direction === 'Long' ? 'good' : 'bad'],
    ['Position size', trade.size === null ? '—' : `${trade.size.toLocaleString('en-US')} ${trade.sizeUnit}`],
    ['Entry price', price(trade.entryPrice)],
    ['Exit price', trade.exitPrice === null ? 'Still open' : price(trade.exitPrice)],
    ['Stop-loss', price(trade.stopLoss)],
    ['Take-profit', price(trade.takeProfit)],
    ['Entry time', when(trade.entryAt)],
    ['Exit time', when(trade.exitAt)],
    ['Held for', trade.duration ?? '—'],
    ['Session', trade.sessions.map((value) => SESSION_LABELS[value] ?? value).join(' + ') || '—'],
    ['Setup', trade.setup || '—'],
    ['Emotion before', trade.emotionBefore || '—'],
    ['Emotion during', trade.emotionDuring || '—'],
  ]

  return <section className="journal-facts-panel">
    <h3>Trade data</h3>
    <dl className="journal-facts">
      {facts.map(([label, value, tone]) => <div key={label}><dt>{label}</dt><dd className={tone ?? ''}>{value}</dd></div>)}
    </dl>
    <div className="journal-mistakes">
      <span>Mistakes</span>
      {trade.mistakes.length ? trade.mistakes.map((tag) => <b key={tag}>{tag}</b>) : <em>None tagged</em>}
    </div>
  </section>
}

function JournalWorkspace({ trades, loading, money, onOpen }: { trades: StoredTrade[]; loading: boolean; money: Money; onOpen: (trade: StoredTrade) => void }) {
  const [query, setQuery] = useState('')
  // The id, not the trade: a copy of the object would keep showing what the
  // trade said before an edit until the page was reloaded. Looked up from the
  // list on every render, the panel follows the journal as it refreshes.
  const [currentId, setCurrentId] = useState<string | null>(null)
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return trades.filter((trade) => `${trade.ticker} ${trade.setup} ${trade.direction} ${trade.emotionBefore} ${trade.emotionDuring} ${trade.mistakes.join(' ')}`.toLowerCase().includes(needle))
  }, [trades, query])
  const selected = visible.find((trade) => trade.id === currentId) ?? visible[0] ?? null
  const position = selected ? visible.findIndex((trade) => trade.id === selected.id) + 1 : 0

  return <section className="journal-workspace">
    <aside className="journal-log-panel">
      <div className="journal-log-head"><h3>Logs</h3><span>{visible.length} {visible.length === 1 ? 'trade' : 'trades'}</span></div>
      <label className="journal-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticker, setup, emotion, mistake" /></label>
      <div className="journal-log-list">
        {visible.map((trade) => {
          const tags = [trade.emotionBefore, trade.emotionDuring].filter((value, index, all) => value && all.indexOf(value) === index)
          return <button type="button" key={trade.id} onClick={() => setCurrentId(trade.id)} className={`journal-log-item ${selected?.id === trade.id ? 'active' : ''}`}>
            <span>{stamp(trade)}</span>
            <strong>{trade.ticker || 'Untitled'} · {trade.direction}</strong>
            <small>{trade.setup || 'No setup'}{trade.riskReward !== null && ` · 1 : ${trade.riskReward.toFixed(1)}`}</small>
            <em className={trade.netPl === null ? 'open' : trade.netPl < 0 ? 'loss' : ''}>{signed(trade.netPl, money)}</em>
            {(tags.length > 0 || trade.mistakes.length > 0) && <footer>
              {tags.map((tag) => <b key={tag}>{tag}</b>)}
              {trade.mistakes.length > 0 && <b className="mistake">{trade.mistakes.length} {trade.mistakes.length === 1 ? 'mistake' : 'mistakes'}</b>}
            </footer>}
          </button>
        })}
        {!visible.length && <p className="journal-empty">{loading ? 'Loading your logs…' : trades.length ? 'No matching trades.' : 'No trades in this range. Try All time.'}</p>}
      </div>
    </aside>
    <main className="journal-detail-panel">
      <div className="journal-detail-head">
        <div><h2>{selected ? `${selected.ticker || 'Untitled'} · ${selected.direction}` : 'Journal'}</h2><span>{selected ? stamp(selected) : 'Select a trade'}</span></div>
        <div>{selected && <span>{position} of {visible.length}</span>}{selected && <button type="button" onClick={() => onOpen(selected)}>Open full trade</button>}</div>
      </div>
      {selected ? <>
        <TradeFacts trade={selected} money={money} />
        <div className="journal-notes"><article><h3>Catalyst / Rationale</h3><p>{selected.rationale || 'No rationale recorded for this trade.'}</p></article><article><h3>Additional notes</h3><p>{selected.notes || 'No notes recorded for this trade.'}</p></article></div>
        <div className="journal-reviews"><ReviewCard label="Entry Rule" value={selected.compliedEntry} /><ReviewCard label="Exit Rule" value={selected.compliedExit} /><ReviewCard label="Management" value={selected.compliedManagement} /></div>
        <div className="journal-linked"><div><h3>Chart screenshots</h3></div>{selected.screenshots.length ? <ChartStrip keys={selected.screenshots} /> : <p>No chart screenshots attached to this trade.</p>}</div>
      </> : <p className="journal-empty">Select a log to review it.</p>}
    </main>
  </section>
}

export function TradeJournal({ profile, trades, loading, error, reload }: TradeJournalProps) {
  // All time by default: a journal that opens on the last 30 days looks like
  // it has lost every older trade.
  const [range, setRange] = useState<Preset>('ALL')
  const money = useMemo(() => moneyIn(profile?.currency ?? 'USD'), [profile?.currency])
  const [custom, setCustom] = useState<DateRange | null>(null)
  const [importing, setImporting] = useState(false)
  // Ids again, for the same reason: the popup and the edit form read the
  // trade from the reloaded journal rather than from a copy taken on click.
  const [activeId, setActiveId] = useState<string | null>(null)
  const [editing, setEditing] = useState<StoredTrade | null>(null)
  const active = trades.find((trade) => trade.id === activeId) ?? null
  const setActive = (trade: StoredTrade | null) => setActiveId(trade?.id ?? null)
  const toast = useToast()
  const shown = useMemo(() => trades.filter((trade) => inWindow(trade, windowFor(range, custom))), [trades, range, custom])

  return <div className="terminal-page terminal-journal journal-page">
    <header className="journal-page-head"><div><h1>Journal</h1><p>Review your preparation, execution, and lessons from every trade.</p></div><div><RangeMenu presets={['ALL', '7D', '30D', '90D']} range={range} custom={custom} onPreset={(next) => { setRange(next); setCustom(null) }} onCustom={setCustom} /><button type="button" onClick={() => setImporting(true)}>Import</button><button type="button" onClick={() => downloadCsv(shown)}>Export</button></div></header>
    {error && <p className="journal-error" role="alert">{error}</p>}
    <JournalWorkspace trades={shown} loading={loading} money={money} onOpen={setActive} />
    <TradeActions trade={active} onClose={() => setActive(null)} onEdit={(trade) => { setActive(null); setEditing(trade) }} onDelete={async (trade) => { try { await deleteTrade(trade.id); setActive(null); reload(); toast.success('Trade deleted', `${trade.ticker || 'Trade'} removed.`) } catch (cause) { toast.error('Could not delete trade', readableApiError(cause)) } }} />
    <QuickAddTrade open={editing !== null} initial={editing ? toEntry(editing) : null} setups={profile?.strategies ?? []} onClose={() => setEditing(null)} onSave={async (entry) => { if (!editing) return; await updateTrade(editing.id, entry); setEditing(null); reload() }} />
    <CsvImport open={importing} onClose={() => setImporting(false)} onImported={reload} />
  </div>
}
