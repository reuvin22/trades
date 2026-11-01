import { useState, type SubmitEvent } from 'react'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import {
  MAX_PROP_ACCOUNTS,
  PROP_ACCOUNT_KINDS,
  PROP_MARKETS,
  PROP_SIZES,
  savePropAccounts,
  savePropFirms,
  savePropPayouts,
  type Profile,
  type PropAccount,
  type PropPayout,
  type PropAccountKind,
  type PropAccountStatus,
  type PropMarket,
} from '../lib/profile'
import { ConfirmDialog, type ConfirmRequest } from './ConfirmDialog'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, PlusIcon, SpinnerIcon, TrashIcon } from './Icons'
import { SearchableSelect } from './SearchableSelect'
import { Select } from './Select'
import {
  ACCOUNT_CARD,
  CARD,
  FIELD,
  FIELD_HINT,
  FIELD_LABEL,
  PILL,
  PILL_IDLE,
  SECTION_TITLE,
  TOGGLE,
  TOGGLE_GROUP,
  TOGGLE_LONG,
  TOGGLE_SHORT,
} from './ui'

type Props = {
  profile: Profile | null
  onSaved: () => void
}

/** Mirrors MAX_PROP_FIRMS and MAX_PROP_PAYOUTS on the API. */
const MAX_FIRMS = 30
const MAX_PAYOUTS = 500

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const SIZE = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })

type Draft = {
  firm: string
  market: PropMarket
  size: string
  price: string
  quantity: string
  status: PropAccountStatus
}
const BLANK: Draft = { firm: '', market: 'futures', size: '', price: '', quantity: '1', status: 'active' }

/**
 * A searchable picker drawn as a form input. A plain wrapper rather than a
 * FIELD, whose input styles would also reach the search box in the panel.
 */
const PICKER = 'rounded-sm border border-line px-13 py-10 focus-within:border-accent'

/** Rows per page in each group. */
const PAGE_SIZE = 5
/** Most accounts one Add creates. Firms cap simultaneous accounts well below this. */
const MAX_QUANTITY = 50

/**
 * One group's page of rows. Clamped on read rather than reset in an effect: a
 * delete that empties the last page lands on the one before, not on a blank.
 */
function pageOf(rows: PropAccount[], page: number) {
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  return { pages, current, visible: rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE) }
}

const CLEAR_BUTTON = `${PILL} ${PILL_IDLE} px-11! py-6! text-[12px]! hover:text-red!`

function newId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
}

function StatusToggle({ value, onChange, disabled }: { value: PropAccountStatus; onChange: (next: PropAccountStatus) => void; disabled?: boolean }) {
  return (
    <div className={TOGGLE_GROUP}>
      {(['active', 'blown'] as const).map((option) => (
        <button
          key={option}
          type="button"
          disabled={disabled}
          aria-pressed={value === option}
          className={`${TOGGLE} p-7! text-[12px]! ${value !== option ? '' : option === 'active' ? TOGGLE_LONG : TOGGLE_SHORT}`}
          onClick={() => onChange(option)}
        >
          {option === 'active' ? 'Active' : 'Blown'}
        </button>
      ))}
    </div>
  )
}

/**
 * One firm the trader uses, with the payouts it has made.
 *
 * Payouts live under their firm rather than in a list of their own: "what has
 * Topstep paid me" is the question, and the answer belongs beside the name.
 */
function FirmRow({
  firm,
  payouts,
  busy,
  onPayouts,
  onRemove,
}: {
  firm: string
  payouts: PropPayout[]
  busy: boolean
  onPayouts: (next: PropPayout[], done: string) => Promise<boolean>
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [paidOn, setPaidOn] = useState(today)
  const [gap, setGap] = useState('')

  // Newest first: the payout just received is the one being checked.
  const own = payouts.filter((row) => row.firm === firm).sort((a, b) => b.paidOn.localeCompare(a.paidOn))
  const total = own.reduce((sum, row) => sum + row.amount, 0)

  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(amount)

    if (amount.trim() === '' || !Number.isFinite(value) || value <= 0) return setGap('Enter the payout amount in USD.')
    if (paidOn === '') return setGap('Pick the date it was paid.')
    if (payouts.length >= MAX_PAYOUTS) return setGap(`Your profile holds ${MAX_PAYOUTS} payouts.`)

    setGap('')
    const saved = await onPayouts(
      [...payouts, { id: newId(), firm, amount: value, paidOn }],
      `${USD.format(value)} payout from ${firm} added`,
    )
    if (saved) setAmount('')
  }

  return (
    <li className="rounded-sm border border-line bg-panel">
      <div className="flex flex-wrap items-center gap-x-12 gap-y-6 px-12 py-9">
        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg-strong">{firm}</span>
        <span className="text-[12px] tabular-nums text-fg-muted">
          {own.length === 0 ? 'No payouts yet' : (
            <>
              <b className="font-semibold text-green">{USD.format(total)}</b> · {own.length} {own.length === 1 ? 'payout' : 'payouts'}
            </>
          )}
        </span>
        <button
          type="button"
          className={`${PILL} ${PILL_IDLE} px-10! py-5! text-[12px]!`}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          Payouts
          <ChevronDownIcon size={13} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
        <button
          type="button"
          disabled={busy}
          className="grid size-28 place-items-center rounded-sm text-fg-muted hover:bg-tint-2 hover:text-red disabled:opacity-50"
          aria-label={`Remove ${firm} from your prop firms`}
          onClick={onRemove}
        >
          <CloseIcon size={13} />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-10 border-t border-line px-12 pt-10 pb-12">
          {own.length > 0 && (
            <ul className="flex flex-col divide-y divide-line">
              {own.map((row) => (
                <li key={row.id} className="flex items-center gap-12 py-7">
                  <span className="flex-1 text-[12.5px] tabular-nums text-fg-dim">
                    {row.paidOn ? PAID_ON.format(new Date(`${row.paidOn}T00:00`)) : '—'}
                  </span>
                  <span className="text-[13px] font-semibold tabular-nums text-green">+{USD.format(row.amount)}</span>
                  <button
                    type="button"
                    disabled={busy}
                    className="grid size-26 place-items-center rounded-sm text-fg-muted hover:bg-tint-2 hover:text-red disabled:opacity-50"
                    aria-label={`Remove ${USD.format(row.amount)} payout from ${firm}`}
                    onClick={() => void onPayouts(payouts.filter((entry) => entry.id !== row.id), 'Payout removed')}
                  >
                    <TrashIcon size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form className="grid grid-cols-[1fr_1fr_auto] items-end gap-10 max-[480px]:grid-cols-2" onSubmit={add}>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>Payout (USD)</span>
              <input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="1250.00" />
            </label>
            <label className={FIELD}>
              <span className={FIELD_LABEL}>Paid on</span>
              <input type="date" value={paidOn} max={today()} onChange={(event) => setPaidOn(event.target.value)} />
            </label>
            <button type="submit" disabled={busy} className={`${PILL} ${PILL_IDLE} justify-center max-[480px]:col-span-2`}>
              <PlusIcon size={14} />
              Add payout
            </button>
          </form>
          {gap && <p className="text-[12px] text-red" role="alert">{gap}</p>}
        </div>
      )}
    </li>
  )
}

/**
 * The firms this trader uses, each with its payout record. What the firm
 * picker in each account group searches, so a firm's name is spelled once
 * here rather than retyped on every account.
 */
function FirmList({
  firms,
  payouts,
  busy,
  onChange,
  onPayouts,
  onRemove,
}: {
  firms: string[]
  payouts: PropPayout[]
  busy: boolean
  onChange: (next: string[], done: string) => Promise<boolean>
  onPayouts: (next: PropPayout[], done: string) => Promise<boolean>
  onRemove: (firm: string) => void
}) {
  const [name, setName] = useState('')
  const [gap, setGap] = useState('')

  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleaned = name.trim()
    if (cleaned === '') return setGap('Type the name of a prop firm.')
    if (firms.some((firm) => firm.toLowerCase() === cleaned.toLowerCase())) return setGap(`${cleaned} is already on your list.`)
    if (firms.length >= MAX_FIRMS) return setGap(`Your list holds ${MAX_FIRMS} firms.`)

    setGap('')
    if (await onChange([...firms, cleaned], `${cleaned} added to your prop firms`)) setName('')
  }

  return (
    <div className="mb-14 flex flex-col gap-10 rounded-sm border border-line bg-tint-1 p-14 max-[560px]:p-11">
      <div>
        <h4 className="text-[13.5px] font-semibold text-fg-strong">Your prop firms</h4>
        <p className={FIELD_HINT}>
          The firms you trade with, and what each has paid you. Payouts count towards Payout total and Total profit on your dashboard.
        </p>
      </div>

      {firms.length > 0 && (
        <ul className="flex flex-col gap-8">
          {firms.map((firm) => (
            <FirmRow
              key={firm}
              firm={firm}
              payouts={payouts}
              busy={busy}
              onPayouts={onPayouts}
              onRemove={() => onRemove(firm)}
            />
          ))}
        </ul>
      )}

      <form className="flex flex-wrap items-end gap-10" onSubmit={add}>
        <label className={`${FIELD} min-w-180 flex-1`}>
          <span className={FIELD_LABEL}>Add a prop firm</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Topstep, FTMO, Apex…"
            maxLength={80}
            autoComplete="off"
          />
        </label>
        <button type="submit" disabled={busy} className={`${PILL} ${PILL_IDLE}`}>
          <PlusIcon size={14} />
          Add firm
        </button>
      </form>
      {gap && <p className="text-[12px] text-red" role="alert">{gap}</p>}
    </div>
  )
}

function KindGroup({
  kind,
  label,
  blurb,
  rows,
  firms,
  room,
  busy,
  onAdd,
  onStatus,
  onRemove,
  page,
  onPage,
}: {
  kind: PropAccountKind
  label: string
  blurb: string
  rows: PropAccount[]
  /** The trader's own firms, which the firm picker searches. */
  firms: string[]
  /** How many more accounts the whole list can take. */
  room: number
  busy: boolean
  onAdd: (added: PropAccount[]) => Promise<boolean>
  onStatus: (id: string, status: PropAccountStatus) => void
  onRemove: (id: string) => void
  /** Held by the section, whose Clear page needs to know what each group shows. */
  page: number
  onPage: (page: number) => void
}) {
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [gap, setGap] = useState('')
  const priced = kind !== 'funded'
  const spent = rows.reduce((sum, row) => sum + (row.price ?? 0), 0)
  const { pages, current, visible } = pageOf(rows, page)
  const setPage = onPage

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const size = Number(draft.size)
    const price = Number(draft.price)
    const quantity = Number(draft.quantity)

    if (draft.firm === '') return setGap('Pick the prop firm.')
    if (!PROP_SIZES[draft.market].includes(size)) return setGap('Pick the account size.')
    if (priced && (draft.price.trim() === '' || !Number.isFinite(price) || price < 0)) return setGap('Enter what it cost in USD.')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return setGap(`Quantity is a whole number from 1 to ${MAX_QUANTITY}.`)
    if (quantity > room) return setGap(`Your list holds ${MAX_PROP_ACCOUNTS} accounts; there is room for ${room} more.`)

    setGap('')
    // One row per account, not one row with a count: accounts bought together
    // rarely blow together, and each needs its own Active/Blown switch.
    const added = Array.from({ length: quantity }, () => ({
      id: newId(),
      kind,
      market: draft.market,
      firm: draft.firm,
      size,
      price: priced ? price : null,
      status: draft.status,
    }))
    const saved = await onAdd(added)
    if (saved) {
      // Firm and market stay: the next account is usually from the same firm.
      setDraft({ ...BLANK, firm: draft.firm, market: draft.market })
      // Show where the new rows landed.
      setPage(Math.ceil((rows.length + quantity) / PAGE_SIZE) - 1)
    }
  }

  return (
    <div className="flex flex-col gap-12 rounded-sm border border-line bg-tint-1 p-14 max-[560px]:p-11">
      <div className="flex flex-wrap items-baseline justify-between gap-8">
        <div>
          <h4 className="text-[13.5px] font-semibold text-fg-strong">{label}</h4>
          <p className={FIELD_HINT}>{blurb}</p>
        </div>
        <span className="text-[11.5px] tabular-nums text-fg-muted">
          {rows.length} total{priced && rows.length > 0 && ` · ${USD.format(spent)} spent`}
        </span>
      </div>

      {rows.length > 0 && (
        <ul className="flex flex-col divide-y divide-line">
          {visible.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-14 gap-y-8 py-9">
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg-strong max-[560px]:basis-full">{row.firm}</span>
              <span className="w-60 text-[11px] font-medium tracking-[0.06em] text-fg-muted uppercase">
                {PROP_MARKETS.find((market) => market.value === row.market)?.label ?? '—'}
              </span>
              <span className="w-64 text-[12.5px] tabular-nums text-fg-dim">{SIZE.format(row.size)}</span>
              {priced && <span className="w-80 text-[12.5px] tabular-nums text-fg-dim">{USD.format(row.price ?? 0)}</span>}
              <div className="w-150 max-[560px]:ml-auto max-[560px]:w-132">
                <StatusToggle value={row.status} disabled={busy} onChange={(next) => onStatus(row.id, next)} />
              </div>
              <button
                type="button"
                disabled={busy}
                className="grid size-30 place-items-center rounded-sm text-fg-muted hover:bg-tint-2 hover:text-red disabled:opacity-50"
                aria-label={`Remove ${row.firm} ${SIZE.format(row.size)}`}
                onClick={() => onRemove(row.id)}
              >
                <TrashIcon size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex flex-wrap items-center justify-between gap-10" aria-label={`${label} pages`}>
          <span className="text-[11.5px] tabular-nums text-fg-muted">
            {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, rows.length)} of {rows.length}
          </span>
          <div className="flex items-center gap-8">
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE} px-10! py-6!`}
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              aria-label="Previous page"
            >
              <ChevronLeftIcon size={14} />
            </button>
            <span className="text-[12px] tabular-nums text-fg-dim">
              Page {current + 1} of {pages}
            </span>
            <button
              type="button"
              className={`${PILL} ${PILL_IDLE} px-10! py-6!`}
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              aria-label="Next page"
            >
              <ChevronRightIcon size={14} />
            </button>
          </div>
        </nav>
      )}

      <form className="grid grid-cols-4 items-end gap-10 max-[760px]:grid-cols-2" onSubmit={submit}>
        <div className="col-span-2 flex min-w-0 flex-col gap-7">
          <span className={FIELD_LABEL}>Prop firm name</span>
          {firms.length > 0 ? (
            <div className={PICKER}>
              <SearchableSelect
                value={draft.firm}
                onChange={(firm) => setDraft({ ...draft, firm })}
                options={firms}
                label="Prop firms"
                placeholder="Search your prop firms"
              />
            </div>
          ) : (
            <p className={`${PICKER} text-[13px] text-fg-muted`}>Add your prop firms above first.</p>
          )}
        </div>
        <div className={FIELD}>
          <span className={FIELD_LABEL}>Market</span>
          <div className={TOGGLE_GROUP}>
            {PROP_MARKETS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={draft.market === option.value}
                className={`${TOGGLE} p-7! text-[12px]! aria-pressed:border-accent aria-pressed:text-fg-strong`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    market: option.value,
                    // A 150K futures account has no CFD twin, so a size the
                    // new market does not sell is cleared, not carried over.
                    size: PROP_SIZES[option.value].includes(Number(draft.size)) ? draft.size : '',
                  })
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Eval size</span>
          <Select value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })}>
            <option value="">Pick a size</option>
            {PROP_SIZES[draft.market].map((size) => (
              <option key={size} value={size}>
                {SIZE.format(size)}
              </option>
            ))}
          </Select>
        </label>
        {priced ? (
          <label className={FIELD}>
            <span className={FIELD_LABEL}>Price (USD)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.price}
              onChange={(event) => setDraft({ ...draft, price: event.target.value })}
              placeholder="49.00"
            />
          </label>
        ) : (
          <span aria-hidden className="max-[760px]:hidden" />
        )}
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Quantity</span>
          <input
            type="number"
            min="1"
            max={MAX_QUANTITY}
            step="1"
            value={draft.quantity}
            onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
          />
        </label>
        <div className={FIELD}>
          <span className={FIELD_LABEL}>Status</span>
          <StatusToggle value={draft.status} onChange={(status) => setDraft({ ...draft, status })} />
        </div>
        <button type="submit" disabled={busy || firms.length === 0} className={`${PILL} ${PILL_IDLE} justify-center`}>
          <PlusIcon size={14} />
          Add
        </button>
      </form>
      {gap && <p className="text-[12px] text-red" role="alert">{gap}</p>}
    </div>
  )
}

const PAID_ON = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

/** Today as YYYY-MM-DD in the trader's own time zone, for the date input. */
function today(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/**
 * Every evaluation bought, every reset, and every funded account.
 *
 * Outside the profile form on purpose: each row saves the moment it is added
 * or changed, so there is no half-entered list waiting on a Save button.
 */
export function PropAccounts({ profile, onSaved }: Props) {
  const toast = useToast()
  const [rows, setRows] = useState<PropAccount[]>([])
  const [seededFor, setSeededFor] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<ConfirmRequest | null>(null)
  const [pages, setPages] = useState<Record<PropAccountKind, number>>({ eval: 0, reset: 0, funded: 0 })
  const [firms, setFirms] = useState<string[]>([])
  const [payouts, setPayouts] = useState<PropPayout[]>([])

  const groups = PROP_ACCOUNT_KINDS.map((group) => {
    const own = rows.filter((row) => row.kind === group.value)
    return { ...group, rows: own, visible: pageOf(own, pages[group.value]).visible }
  })

  function clear(scope: 'page' | 'all') {
    const doomed = scope === 'all' ? rows : groups.flatMap((group) => group.visible)
    const ids = new Set(doomed.map((row) => row.id))
    const count = `${doomed.length} ${doomed.length === 1 ? 'account' : 'accounts'}`
    const where = groups
      .filter((group) => (scope === 'all' ? group.rows : group.visible).length > 0)
      .map((group) => group.label.toLowerCase())
      .join(', ')

    setConfirming({
      title: scope === 'all' ? 'Clear all prop firm accounts?' : 'Clear the pages shown?',
      body:
        scope === 'all'
          ? `Every account you have recorded — ${count} across ${where} — will be removed.`
          : `The ${count} on the page each group is showing (${where}) will be removed.`,
      consequence: 'They drop out of your dashboard totals, and this cannot be undone.',
      action: scope === 'all' ? 'Clear all' : 'Clear page',
      onConfirm: async () => {
        const saved = await commit(rows.filter((row) => !ids.has(row.id)), `${count} removed`)
        if (!saved) throw new Error('Nothing was removed. Try again.')
      },
    })
  }

  if (profile && seededFor !== profile.uid) {
    setSeededFor(profile.uid)
    setRows(profile.propAccounts ?? [])
    setFirms(profile.propFirms ?? [])
    setPayouts(profile.propPayouts ?? [])
  }

  /**
   * A firm with no payouts just goes. One with payouts asks first, and takes
   * them with it: they are its record, and left behind they would still count
   * on the dashboard with no row anywhere to see or delete them from.
   */
  function removeFirm(firm: string) {
    const remaining = firms.filter((entry) => entry !== firm)
    const own = payouts.filter((row) => row.firm === firm)
    if (own.length === 0) {
      void commitFirms(remaining, `${firm} removed from your prop firms`)
      return
    }

    const total = own.reduce((sum, row) => sum + row.amount, 0)
    setConfirming({
      title: `Remove ${firm}?`,
      body: `${firm} and its ${own.length} ${own.length === 1 ? 'payout' : 'payouts'} (${USD.format(total)}) will be removed.`,
      consequence: 'Your Payout total and Total profit drop by that amount. Accounts recorded under this firm stay.',
      action: 'Remove firm',
      onConfirm: async () => {
        const saved =
          (await commitPayouts(payouts.filter((row) => row.firm !== firm), `${firm}'s payouts removed`)) &&
          (await commitFirms(remaining, `${firm} removed from your prop firms`))
        if (!saved) throw new Error('Not everything was removed. Try again.')
      },
    })
  }

  async function commitPayouts(next: PropPayout[], done: string): Promise<boolean> {
    const before = payouts
    setPayouts(next)
    setBusy(true)
    try {
      const saved = await savePropPayouts(next)
      setPayouts(saved.propPayouts ?? next)
      onSaved()
      toast.success(done)
      return true
    } catch (cause) {
      setPayouts(before)
      toast.error('Could not save your payouts', readableApiError(cause))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function commitFirms(next: string[], done: string): Promise<boolean> {
    const before = firms
    setFirms(next)
    setBusy(true)
    try {
      const saved = await savePropFirms(next)
      setFirms(saved.propFirms ?? next)
      onSaved()
      toast.success(done)
      return true
    } catch (cause) {
      setFirms(before)
      toast.error('Could not save your prop firms', readableApiError(cause))
      return false
    } finally {
      setBusy(false)
    }
  }

  async function commit(next: PropAccount[], done: string): Promise<boolean> {
    const before = rows
    setRows(next)
    setBusy(true)
    try {
      const saved = await savePropAccounts(next)
      setRows(saved.propAccounts ?? next)
      onSaved()
      toast.success(done)
      return true
    } catch (cause) {
      setRows(before)
      toast.error('Could not save your prop accounts', readableApiError(cause))
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className={`${CARD} ${ACCOUNT_CARD}`}>
      <div className="mb-16 flex flex-wrap items-start justify-between gap-12">
        <div>
          <h3 className={`${SECTION_TITLE} mb-6!`}>Prop firm accounts</h3>
          <p className={FIELD_HINT}>Each entry saves straight away and is summed on your dashboard.</p>
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-8">
            <button type="button" className={CLEAR_BUTTON} disabled={busy} onClick={() => clear('page')}>
              <TrashIcon size={13} />
              Clear page
            </button>
            <button type="button" className={CLEAR_BUTTON} disabled={busy} onClick={() => clear('all')}>
              <TrashIcon size={13} />
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Removing a firm leaves its recorded accounts alone: they are history,
          and the list only decides what the picker offers next time. */}
      <FirmList
        firms={firms}
        payouts={payouts}
        busy={busy || !profile}
        onChange={commitFirms}
        onPayouts={commitPayouts}
        onRemove={removeFirm}
      />

      <div className="flex flex-col gap-14">
        {groups.map((group) => (
          <KindGroup
            key={group.value}
            kind={group.value}
            label={group.label}
            blurb={group.blurb}
            rows={group.rows}
            firms={firms}
            page={pages[group.value]}
            onPage={(page) => setPages((current) => ({ ...current, [group.value]: page }))}
            room={MAX_PROP_ACCOUNTS - rows.length}
            busy={busy || !profile}
            onAdd={(added) =>
              commit(
                [...rows, ...added],
                added.length === 1 ? `${added[0].firm} added` : `${added.length} × ${added[0].firm} added`,
              )
            }
            onStatus={(id, status) =>
              void commit(
                rows.map((row) => (row.id === id ? { ...row, status } : row)),
                status === 'blown' ? 'Marked as blown' : 'Marked as active',
              )
            }
            onRemove={(id) => void commit(rows.filter((row) => row.id !== id), 'Account removed')}
          />
        ))}
      </div>

      <ConfirmDialog request={confirming} onClose={() => setConfirming(null)} />

      {busy && (
        <p className={`${FIELD_HINT} mt-12 inline-flex items-center gap-6`}>
          <SpinnerIcon className="animate-spin" size={12} /> Saving…
        </p>
      )}
    </section>
  )
}
