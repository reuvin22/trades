import { useCallback, useState } from 'react'
import { apiFetch } from './api'
import type { Profile } from './profile'
import type { StoredTrade } from './trades'

/**
 * Separate journals: one per trading account or challenge phase.
 *
 * A trade carries the name of the journal it was logged under. Blank is the
 * default journal, which is where everything logged before journals existed
 * lives — so nothing has to be migrated, and renaming it is how a trader
 * gives those trades a name.
 */

export const DEFAULT_JOURNAL_LABEL = 'Main account'

export function journalLabel(name: string): string {
  return name || DEFAULT_JOURNAL_LABEL
}

/**
 * Every journal worth offering: the ones named on the profile, in their order,
 * then any name only a trade still carries, so no trade is ever unreachable.
 * The default journal is listed while it holds trades or nothing else exists.
 */
export function journalsOf(profile: Profile | null, trades: StoredTrade[]): string[] {
  const named = (profile?.journalAccounts ?? []).filter(Boolean)
  const names = [...named]

  for (const trade of trades) {
    if (trade.account && !names.includes(trade.account)) names.push(trade.account)
  }

  const defaultUsed = trades.some((trade) => trade.account === '')
  return defaultUsed || names.length === 0 ? ['', ...names] : names
}

/** The trades in one journal, or all of them when none is picked. */
export function inJournal(trades: StoredTrade[], journal: string | null): StoredTrade[] {
  return journal === null ? trades : trades.filter((trade) => trade.account === journal)
}

const ACTIVE_KEY = 'ragdex.journal'

function readActive(): string | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY)
    return raw === null ? null : (JSON.parse(raw) as string)
  } catch {
    return null
  }
}

/** The journal being viewed, remembered per browser. Null is all of them. */
export function useActiveJournal(): [string | null, (journal: string | null) => void] {
  const [active, setActive] = useState<string | null>(readActive)

  const choose = useCallback((journal: string | null) => {
    setActive(journal)
    try {
      if (journal === null) window.localStorage.removeItem(ACTIVE_KEY)
      else window.localStorage.setItem(ACTIVE_KEY, JSON.stringify(journal))
    } catch {
      // Not remembered; the choice still holds for this visit.
    }
  }, [])

  return [active, choose]
}

/** Move every trade in one journal to another name, in one request. */
export async function renameJournalTrades(from: string, to: string): Promise<number> {
  const { moved } = await apiFetch<{ moved: number }>('/api/v1/trades/accounts/rename', {
    method: 'POST',
    body: { from_name: from, to_name: to },
  })
  return moved
}
