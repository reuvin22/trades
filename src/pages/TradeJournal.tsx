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

type TradeJournalProps = { uid: string | null; trades: StoredTrade[]; loading: boolean; error: string | null; reload: () => void; profile: ProfileRecord | null }
const dateFormat = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function stamp(trade: StoredTrade) {
  const date = new Date(trade.entryAt || trade.createdAt?.toISOString() || '')
  return Number.isNaN(date.getTime()) ? 'Undated trade' : dateFormat.format(date)
}

function followed(value: string) { return /yes|true|followed/i.test(value) }

function ReviewCard({ label, value }: { label: string; value: string }) {
  const good = followed(value)
  return <article className="journal-review-card">
    <div><span>{label}</span><i className={good ? 'journal-switch on' : 'journal-switch'} /></div>
    <strong>{good ? 'Followed' : value || 'Not graded'}</strong>
    <div className="journal-rule-line"><span className={good ? 'good' : ''} style={{ width: good ? '82%' : '38%' }} /></div>
  </article>
}

function JournalWorkspace({ trades, loading, onOpen }: { trades: StoredTrade[]; loading: boolean; onOpen: (trade: StoredTrade) => void }) {
  const [query, setQuery] = useState('')
  const [current, setCurrent] = useState<StoredTrade | null>(trades[0] ?? null)
  const visible = useMemo(() => trades.filter((trade) => `${trade.ticker} ${trade.setup}`.toLowerCase().includes(query.toLowerCase())), [trades, query])
  const selected = current && visible.some((trade) => trade.id === current.id) ? current : visible[0] ?? null

  return <section className="journal-workspace">
    <aside className="journal-log-panel">
      <div className="journal-log-head"><h3>Logs</h3><button type="button">Add Mood⌄</button></div>
      <label className="journal-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label>
      <div className="journal-log-list">
        {visible.map((trade) => <button type="button" key={trade.id} onClick={() => setCurrent(trade)} className={`journal-log-item ${selected?.id === trade.id ? 'active' : ''}`}>
          <span>{stamp(trade)}</span><strong>{trade.ticker || 'Untitled'} · {trade.netPl === null ? 'Open' : `$${trade.netPl.toFixed(2)}`}</strong><small>{trade.setup || 'No setup'} · {trade.direction}</small><em className={trade.netPl !== null && trade.netPl < 0 ? 'loss' : ''}>{trade.netPl === null ? 'OPEN' : `${trade.netPl >= 0 ? '+' : ''}${trade.netPl.toFixed(2)}`}</em>
          <footer><b>Calm</b><b>Fear</b><b>FOMO</b></footer>
        </button>)}
        {!visible.length && <p className="journal-empty">{loading ? 'Loading your logs…' : 'No matching trades.'}</p>}
      </div>
    </aside>
    <main className="journal-detail-panel">
      <div className="journal-detail-head"><div><h2>Journal</h2><span>{selected ? stamp(selected) : 'Select a trade'}</span></div><div><span>1 - {visible.length}</span><strong>★★★★★</strong></div></div>
      {selected ? <>
        <div className="journal-notes"><article><h3>Pre-market Plan</h3><p>{selected.rationale || 'Add your pre-market thesis, risk, and execution plan when logging a trade.'}</p></article><article><h3>Post-market Reflection</h3><p>{selected.notes || 'Record what happened, what you learned, and what to repeat next time.'}</p></article></div>
        <div className="journal-reviews"><ReviewCard label="Entry Rule" value={selected.compliedEntry} /><ReviewCard label="Exit Rule" value={selected.compliedExit} /><ReviewCard label="Management" value={selected.compliedManagement} /></div>
        <div className="journal-linked"><div><h3>Linked Trades</h3><button type="button" onClick={() => onOpen(selected)}>Open full trade</button></div>{selected.screenshots.length ? <ChartStrip keys={selected.screenshots} /> : <p>No chart screenshots attached to this trade.</p>}</div>
      </> : <p className="journal-empty">Select a log to review it.</p>}
    </main>
  </section>
}

export function TradeJournal({ profile, trades, loading, error, reload }: TradeJournalProps) {
  const [range, setRange] = useState<Preset>('30D')
  const [custom, setCustom] = useState<DateRange | null>(null)
  const [importing, setImporting] = useState(false)
  const [active, setActive] = useState<StoredTrade | null>(null)
  const [editing, setEditing] = useState<StoredTrade | null>(null)
  const toast = useToast()
  const shown = useMemo(() => trades.filter((trade) => inWindow(trade, windowFor(range, custom))), [trades, range, custom])

  return <div className="terminal-page terminal-journal journal-page">
    <header className="journal-page-head"><div><h1>Journal</h1><p>Review your preparation, execution, and lessons from every trade.</p></div><div><RangeMenu presets={['7D', '30D', '90D']} range={range} custom={custom} onPreset={(next) => { setRange(next); setCustom(null) }} onCustom={setCustom} /><button type="button" onClick={() => setImporting(true)}>Import</button><button type="button" onClick={() => downloadCsv(shown)}>Export</button></div></header>
    {error && <p className="journal-error" role="alert">{error}</p>}
    <JournalWorkspace trades={shown} loading={loading} onOpen={setActive} />
    <TradeActions trade={active} onClose={() => setActive(null)} onEdit={(trade) => { setActive(null); setEditing(trade) }} onDelete={async (trade) => { try { await deleteTrade(trade.id); setActive(null); reload(); toast.success('Trade deleted', `${trade.ticker || 'Trade'} removed.`) } catch (cause) { toast.error('Could not delete trade', readableApiError(cause)) } }} />
    <QuickAddTrade open={editing !== null} initial={editing ? toEntry(editing) : null} setups={profile?.strategies ?? []} onClose={() => setEditing(null)} onSave={async (entry) => { if (!editing) return; await updateTrade(editing.id, entry); setEditing(null); reload() }} />
    <CsvImport open={importing} onClose={() => setImporting(false)} onImported={reload} />
  </div>
}
