import { useEffect, useId, useRef, useState, type SubmitEvent } from 'react'
import { ChevronDownIcon, CloseIcon } from './Icons'
import {
  ACTION_MENU,
  FIELD,
  FIELD_HINT,
  MODAL,
  MODAL_BODY,
  MODAL_CLOSE,
  MODAL_HEAD,
  MODAL_NARROW,
  MODAL_SHELL,
  MODAL_SUB,
  MODAL_TITLE,
  PILL,
  PILL_ACCENT,
  PILL_IDLE,
  SAVE_ERROR,
} from './ui'
import { readableApiError } from '../lib/api'
import { journalLabel, journalsOf, renameJournalTrades } from '../lib/journalAccounts'
import { saveJournalAccounts, type Profile } from '../lib/profile'
import type { StoredTrade } from '../lib/trades'
import { useToast } from '../lib/toast'

const MAX_JOURNALS = 30

type JournalSwitcherProps = {
  profile: Profile | null
  trades: StoredTrade[]
  active: string | null
  onChange: (journal: string | null) => void
  onProfileSaved: () => void
  onTradesMoved: () => void
}

/**
 * Which journal the dashboard, journal and analytics show.
 *
 * A pill and menu like the range control, not a native select: the browser
 * draws a select's list itself, in its own font and colours, ignoring the
 * theme. "New / manage" sits in the same menu so the bar stays one control
 * wide on a phone.
 */
export function JournalSwitcher(props: JournalSwitcherProps) {
  const { profile, trades, active, onChange } = props
  const [open, setOpen] = useState(false)
  const [managing, setManaging] = useState(false)
  const wrapper = useRef<HTMLDivElement>(null)
  const journals = journalsOf(profile, trades)
  // A journal removed elsewhere falls back to all of them rather than an empty view.
  const current = active !== null && journals.includes(active) ? active : null

  useEffect(() => {
    if (!open) return

    function onPointerDown(event: PointerEvent) {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function pick(journal: string | null) {
    onChange(journal)
    setOpen(false)
  }

  return (
    <div ref={wrapper} className="relative min-w-0">
      <button
        type="button"
        className={`${PILL} ${PILL_IDLE} max-w-[220px] max-[560px]:max-w-[150px]`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Journal: ${current === null ? 'All accounts' : journalLabel(current)}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{current === null ? 'All accounts' : journalLabel(current)}</span>
        <ChevronDownIcon
          size={14}
          className={`flex-none transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className={`${ACTION_MENU} max-h-[min(360px,70vh)] overflow-y-auto!`} role="menu">
          <button
            type="button"
            role="menuitem"
            aria-current={current === null ? 'true' : undefined}
            onClick={() => pick(null)}
          >
            All accounts
          </button>
          {journals.map((name) => (
            <button
              key={name}
              type="button"
              role="menuitem"
              className="truncate"
              aria-current={current === name ? 'true' : undefined}
              onClick={() => pick(name)}
            >
              {journalLabel(name)}
            </button>
          ))}
          <hr className="mx-4 my-4 border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              setManaging(true)
            }}
          >
            + New / manage journals…
          </button>
        </div>
      )}

      <ManageJournals {...props} open={managing} journals={journals} onClose={() => setManaging(false)} />
    </div>
  )
}

function ManageJournals({
  open,
  onClose,
  journals,
  profile,
  trades,
  active,
  onChange,
  onProfileSaved,
  onTradesMoved,
}: JournalSwitcherProps & { open: boolean; journals: string[]; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const toast = useToast()
  const [draft, setDraft] = useState('')
  const [renaming, setRenaming] = useState<{ from: string; to: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (open && !node.open) node.showModal()
    else if (!open && node.open) node.close()
  }, [open])

  const named = (profile?.journalAccounts ?? []).filter(Boolean)
  const counts = new Map<string, number>()
  for (const trade of trades) counts.set(trade.account, (counts.get(trade.account) ?? 0) + 1)

  function taken(name: string, except?: string) {
    return journals.some(
      (journal) => journal !== except && journal.toLowerCase() === name.toLowerCase(),
    )
  }

  async function run(work: () => Promise<void>) {
    setBusy(true)
    setError('')
    try {
      await work()
    } catch (cause) {
      setError(readableApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const name = draft.trim()
    if (!name || busy) return
    if (taken(name)) return setError(`"${name}" already exists.`)
    if (named.length >= MAX_JOURNALS) return setError(`Up to ${MAX_JOURNALS} journals.`)

    void run(async () => {
      await saveJournalAccounts([...named, name])
      onProfileSaved()
      onChange(name)
      setDraft('')
      toast.success('Journal created', `New trades will be logged to ${name}.`)
    })
  }

  function rename(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!renaming || busy) return
    const { from } = renaming
    const to = renaming.to.trim()
    if (!to || to === from) return setRenaming(null)
    if (taken(to, from)) return setError(`"${to}" already exists.`)

    void run(async () => {
      const moved = counts.get(from) ? await renameJournalTrades(from, to) : 0
      const list = named.includes(from) ? named.map((name) => (name === from ? to : name)) : [...named, to]
      await saveJournalAccounts(list)
      onProfileSaved()
      if (moved) onTradesMoved()
      if (active === from) onChange(to)
      setRenaming(null)
      toast.success('Journal renamed', moved ? `${moved} ${moved === 1 ? 'trade' : 'trades'} moved to ${to}.` : `Now called ${to}.`)
    })
  }

  function remove(name: string) {
    void run(async () => {
      await saveJournalAccounts(named.filter((entry) => entry !== name))
      onProfileSaved()
      if (active === name) onChange(null)
    })
  }

  return (
    <dialog
      ref={dialog}
      className={`${MODAL} ${MODAL_NARROW}`}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === dialog.current && !busy) onClose()
      }}
    >
      <div className={MODAL_SHELL}>
        <header className={MODAL_HEAD}>
          <div>
            <h2 className={MODAL_TITLE} id={titleId}>
              Journals
            </h2>
            <p className={MODAL_SUB}>One per account or challenge phase. Each keeps its own profit and stats.</p>
          </div>
          <button type="button" className={MODAL_CLOSE} onClick={onClose} disabled={busy} aria-label="Close">
            <CloseIcon size={15} />
          </button>
        </header>

        <div className={MODAL_BODY}>
          <ul className="flex flex-col gap-8">
            {journals.map((name) => {
              const count = counts.get(name) ?? 0
              const editing = renaming?.from === name

              return (
                <li key={name} className="flex items-center gap-10 rounded-sm border border-line bg-tint-1 px-12 py-9">
                  {editing ? (
                    <form className={`${FIELD} flex-1 flex-row! items-center`} onSubmit={rename}>
                      <input
                        autoFocus
                        value={renaming.to}
                        maxLength={80}
                        aria-label={`New name for ${journalLabel(name)}`}
                        onChange={(event) => setRenaming({ from: name, to: event.target.value })}
                      />
                      <button type="submit" className={`${PILL} ${PILL_ACCENT}`} disabled={busy}>
                        Save
                      </button>
                      <button type="button" className={`${PILL} ${PILL_IDLE}`} disabled={busy} onClick={() => setRenaming(null)}>
                        Cancel
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-fg-strong">{journalLabel(name)}</span>
                        <span className="text-[11.5px] text-fg-muted">
                          {count} {count === 1 ? 'trade' : 'trades'}
                        </span>
                      </span>
                      <button
                        type="button"
                        className={`${PILL} ${PILL_IDLE}`}
                        disabled={busy}
                        onClick={() => setRenaming({ from: name, to: name })}
                      >
                        Rename
                      </button>
                      {/* Only an empty journal goes: its trades would otherwise have nowhere to be listed. */}
                      {name !== '' && count === 0 && (
                        <button type="button" className={`${PILL} ${PILL_IDLE}`} disabled={busy} onClick={() => remove(name)}>
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ul>

          <form className={`${FIELD} flex-row! items-center`} onSubmit={add}>
            <input
              value={draft}
              maxLength={80}
              placeholder="e.g. FTMO 100k — Phase 2"
              aria-label="New journal name"
              onChange={(event) => setDraft(event.target.value)}
            />
            <button type="submit" className={`${PILL} ${PILL_ACCENT} shrink-0`} disabled={busy || !draft.trim()}>
              Add journal
            </button>
          </form>

          <p className={FIELD_HINT}>
            Renaming moves that journal's trades with it — rename "{journalLabel('')}" to label the trades you logged
            before journals existed. The Calendar always shows every journal together.
          </p>
          {error && <p className={SAVE_ERROR} role="alert">{error}</p>}
        </div>
      </div>
    </dialog>
  )
}
