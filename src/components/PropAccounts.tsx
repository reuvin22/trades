import { useId, useState, type FormEvent } from 'react'
import { readableApiError } from '../lib/api'
import { useToast } from '../lib/toast'
import {
  MAX_PROP_ACCOUNTS,
  PROP_ACCOUNT_KINDS,
  savePropAccounts,
  type Profile,
  type PropAccount,
  type PropAccountKind,
  type PropAccountStatus,
} from '../lib/profile'
import { ConfirmDialog, type ConfirmRequest } from './ConfirmDialog'
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SpinnerIcon, TrashIcon } from './Icons'
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

/** Offered as suggestions; any firm can be typed. */
const COMMON_FIRMS = [
  'Topstep',
  'Apex Trader Funding',
  'FTMO',
  'Tradeify',
  'Take Profit Trader',
  'MyFundedFutures',
  'FundedNext',
  'The5ers',
  'E8 Markets',
  'Lucid Trading',
]

const SIZES = [10000, 25000, 50000, 100000, 150000, 200000, 300000]

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const SIZE = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 1 })

type Draft = { firm: string; size: string; price: string; quantity: string; status: PropAccountStatus }
const BLANK: Draft = { firm: '', size: '', price: '', quantity: '1', status: 'active' }

/** Rows per page in each group. */
const PAGE_SIZE = 5
/** Most accounts one Add creates. Firms cap simultaneous accounts well below this. */
const MAX_QUANTITY = 50

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

function KindGroup({
  kind,
  label,
  blurb,
  rows,
  room,
  busy,
  onAdd,
  onStatus,
  onRemove,
  onClear,
}: {
  kind: PropAccountKind
  label: string
  blurb: string
  rows: PropAccount[]
  /** How many more accounts the whole list can take. */
  room: number
  busy: boolean
  onAdd: (added: PropAccount[]) => Promise<boolean>
  onStatus: (id: string, status: PropAccountStatus) => void
  onRemove: (id: string) => void
  /** Removes the rows on the page shown, or the whole group, after confirming. */
  onClear: (doomed: PropAccount[], scope: 'page' | 'all') => void
}) {
  const [draft, setDraft] = useState<Draft>(BLANK)
  const [gap, setGap] = useState('')
  const [page, setPage] = useState(0)
  const listId = useId()
  const priced = kind !== 'funded'
  const spent = rows.reduce((sum, row) => sum + (row.price ?? 0), 0)

  // Clamped on read rather than reset in an effect: a delete that empties the
  // last page should land on the one before it, not on a blank page.
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  const visible = rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const size = Number(draft.size)
    const price = Number(draft.price)
    const quantity = Number(draft.quantity)

    if (draft.firm.trim() === '') return setGap('Name the prop firm.')
    if (draft.size.trim() === '' || !Number.isFinite(size) || size <= 0) return setGap('Enter the account size.')
    if (priced && (draft.price.trim() === '' || !Number.isFinite(price) || price < 0)) return setGap('Enter what it cost in USD.')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) return setGap(`Quantity is a whole number from 1 to ${MAX_QUANTITY}.`)
    if (quantity > room) return setGap(`Your list holds ${MAX_PROP_ACCOUNTS} accounts; there is room for ${room} more.`)

    setGap('')
    // One row per account, not one row with a count: accounts bought together
    // rarely blow together, and each needs its own Active/Blown switch.
    const added = Array.from({ length: quantity }, () => ({
      id: newId(),
      kind,
      firm: draft.firm.trim(),
      size,
      price: priced ? price : null,
      status: draft.status,
    }))
    const saved = await onAdd(added)
    if (saved) {
      setDraft(BLANK)
      // Show where the new rows landed.
      setPage(Math.ceil((rows.length + quantity) / PAGE_SIZE) - 1)
    }
  }

  return (
    <div className="flex flex-col gap-12 rounded-sm border border-line bg-tint-1 p-14">
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
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg-strong">{row.firm}</span>
              <span className="w-64 text-[12.5px] tabular-nums text-fg-dim">{SIZE.format(row.size)}</span>
              {priced && <span className="w-80 text-[12.5px] tabular-nums text-fg-dim">{USD.format(row.price ?? 0)}</span>}
              <div className="w-150">
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

      {rows.length > 0 && (
        <nav className="flex flex-wrap items-center justify-between gap-10" aria-label={`${label} pages`}>
          <div className="flex items-center gap-10">
            <span className="text-[11.5px] tabular-nums text-fg-muted">
              {current * PAGE_SIZE + 1}–{Math.min((current + 1) * PAGE_SIZE, rows.length)} of {rows.length}
            </span>
            <button
              type="button"
              disabled={busy}
              className="inline-flex items-center gap-5 rounded-sm px-8 py-4 text-[11.5px] font-medium text-fg-muted hover:bg-tint-2 hover:text-red disabled:opacity-50"
              onClick={() => onClear(visible, 'page')}
            >
              <TrashIcon size={13} />
              Clear page
            </button>
            {pages > 1 && (
              <button
                type="button"
                disabled={busy}
                className="inline-flex items-center gap-5 rounded-sm px-8 py-4 text-[11.5px] font-medium text-fg-muted hover:bg-tint-2 hover:text-red disabled:opacity-50"
                onClick={() => onClear(rows, 'all')}
              >
                <TrashIcon size={13} />
                Clear all
              </button>
            )}
          </div>
          {pages > 1 && (
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
          )}
        </nav>
      )}

      <form className="grid grid-cols-[2fr_1fr_1fr_0.7fr_auto_auto] items-end gap-10 max-[760px]:grid-cols-2" onSubmit={submit}>
        <label className={`${FIELD} max-[760px]:col-span-2`}>
          <span className={FIELD_LABEL}>Prop firm</span>
          <input
            list={`${listId}-firms`}
            value={draft.firm}
            onChange={(event) => setDraft({ ...draft, firm: event.target.value })}
            placeholder="Topstep"
            autoComplete="off"
          />
          <datalist id={`${listId}-firms`}>
            {COMMON_FIRMS.map((firm) => <option key={firm} value={firm} />)}
          </datalist>
        </label>
        <label className={FIELD}>
          <span className={FIELD_LABEL}>Eval size</span>
          <input
            type="number"
            min="0"
            step="any"
            list={`${listId}-sizes`}
            value={draft.size}
            onChange={(event) => setDraft({ ...draft, size: event.target.value })}
            placeholder="50000"
          />
          <datalist id={`${listId}-sizes`}>
            {SIZES.map((size) => <option key={size} value={size} />)}
          </datalist>
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
        <button type="submit" disabled={busy} className={`${PILL} ${PILL_IDLE} justify-center`}>
          <PlusIcon size={14} />
          Add
        </button>
      </form>
      {gap && <p className="text-[12px] text-red" role="alert">{gap}</p>}
    </div>
  )
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

  if (profile && seededFor !== profile.uid) {
    setSeededFor(profile.uid)
    setRows(profile.propAccounts ?? [])
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
      <h3 className={SECTION_TITLE}>Prop firm accounts</h3>
      <p className={`${FIELD_HINT} -mt-10 mb-16`}>
        Each entry saves straight away and is summed on your dashboard.
      </p>

      <div className="flex flex-col gap-14">
        {PROP_ACCOUNT_KINDS.map((group) => (
          <KindGroup
            key={group.value}
            kind={group.value}
            label={group.label}
            blurb={group.blurb}
            rows={rows.filter((row) => row.kind === group.value)}
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
            onClear={(doomed, scope) => {
              const ids = new Set(doomed.map((row) => row.id))
              const name = group.label.toLowerCase()
              const count = `${doomed.length} ${doomed.length === 1 ? 'account' : 'accounts'}`
              setConfirming({
                title: scope === 'all' ? `Clear all ${name}?` : 'Clear this page?',
                body:
                  scope === 'all'
                    ? `All ${count} in ${name} will be removed.`
                    : `The ${count} shown on this page of ${name} will be removed.`,
                consequence: 'They drop out of your dashboard totals, and this cannot be undone.',
                action: scope === 'all' ? 'Clear all' : 'Clear page',
                onConfirm: async () => {
                  const saved = await commit(rows.filter((row) => !ids.has(row.id)), `${count} removed`)
                  if (!saved) throw new Error('Nothing was removed. Try again.')
                },
              })
            }}
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
