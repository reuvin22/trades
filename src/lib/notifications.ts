import { useMemo } from 'react'
import { dayKey, tradeDate } from './stats'
import { useInvitations, type Invitation } from './university'
import type { Profile } from './profile'
import type { StoredTrade } from './trades'

/**
 * What the bell has to say, derived from what actually happened.
 *
 * This used to be an array of invented events — an NVDA fill, an Interactive
 * Brokers outage — on accounts that had neither. A notification nobody can act
 * on teaches people to ignore the bell, which is worse than an empty one.
 *
 * Everything below is read from the trader's own journal, their own stated
 * plan, or an invitation somebody really sent them. Nothing is a placeholder,
 * and when there is nothing to say the bell says nothing.
 *
 * There is no notification *store* yet — no server-side record of what has
 * been delivered or read — so these are computed on each render and read state
 * lives in the menu for the session. The ids are stable and derived from the
 * thing being reported, so the same event keeps the same id across renders and
 * marking one read holds.
 */

export type NotificationKind = 'invite' | 'risk' | 'rules' | 'streak' | 'quiet'

export type Notification = {
  id: string
  kind: NotificationKind
  title: string
  body: string
  age: string
  /** Where clicking it should go, when there is somewhere useful. */
  route?: string
}

/** The trader's daily loss limit in currency, when they have stated one. */
function dailyLossCap(profile: Profile | null): number | null {
  const pct = profile?.maxDailyLossPct ?? null
  const size = profile?.accountSize ?? profile?.openingBalance ?? null

  if (pct === null || size === null || pct <= 0 || size <= 0) return null
  return (size * pct) / 100
}

function ago(when: Date | null): string {
  if (when === null) return ''

  const minutes = Math.max(0, Math.round((Date.now() - when.getTime()) / 60_000))
  if (minutes < 60) return `${minutes}m`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`

  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d`
}

function moneyish(value: number): string {
  return `${value < 0 ? '-' : ''}$${Math.abs(Math.round(value)).toLocaleString()}`
}

/**
 * The derivation, as a plain function with time as an argument.
 *
 * Time is a real input here — "three losses in a row" and "nothing logged in a
 * week" are both statements about now — so it is passed in rather than read
 * from inside a render. That keeps the hook below pure with respect to its
 * arguments, and makes this testable without mocking the clock globally.
 */
export function buildNotifications(
  profile: Profile | null,
  trades: StoredTrade[],
  invitations: Invitation[],
  now: number = Date.now(),
): Notification[] {
  const items: Notification[] = []

  // -- somebody asked you to join their programme ----------------------
  for (const invitation of invitations) {
    const who = invitation.coachName.trim() || invitation.coachEmail
    items.push({
      id: `invite-${invitation.coachUid}`,
      kind: 'invite',
      title: `${who} invited you to their programme`,
      body: invitation.note || 'Open My University to accept or decline.',
      age: ago(invitation.invitedAt),
      route: 'university',
    })
  }

  const closed = trades.filter((trade) => trade.netPl !== null)

  // -- today, against the limit they set themselves --------------------
  const today = dayKey(new Date(now))
  const todayTrades = closed.filter((trade) => {
    const when = tradeDate(trade)
    return when !== null && dayKey(when) === today
  })

  const todayPl = todayTrades.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)
  const cap = dailyLossCap(profile)

  if (cap !== null && todayPl < 0) {
    const used = Math.abs(todayPl) / cap
    if (used >= 0.7) {
      items.push({
        id: `risk-${today}`,
        kind: 'risk',
        title:
          used >= 1
            ? 'You are past your daily loss limit'
            : 'Daily loss limit approaching',
        body: `${moneyish(todayPl)} today against a ${moneyish(-cap)} stop you set — ${Math.round(used * 100)}% of it, across ${todayTrades.length} ${todayTrades.length === 1 ? 'trade' : 'trades'}.`,
        age: 'today',
        route: 'journal',
      })
    }
  }

  // -- rules broken in the last week -----------------------------------
  const weekAgo = now - 7 * 86_400_000
  const recent = trades.filter((trade) => {
    const when = tradeDate(trade)
    return when !== null && when.getTime() >= weekAgo
  })

  const broken = recent.filter(
    (trade) =>
      trade.compliedEntry === 'no' ||
      trade.compliedExit === 'no' ||
      trade.compliedManagement === 'no',
  )

  if (broken.length >= 2) {
    const cost = broken.reduce((sum, trade) => sum + (trade.netPl ?? 0), 0)
    items.push({
      id: `rules-${broken.length}-${Math.round(cost)}`,
      kind: 'rules',
      title: `${broken.length} rule breaks this week`,
      body:
        cost < 0
          ? `They cost ${moneyish(cost)} between them. The trades where you kept to the plan are the comparison worth making.`
          : `They came out ${moneyish(cost)} ahead, which is the more dangerous version — it is the habit that costs, not this week.`,
      age: '7d',
      route: 'analytics',
    })
  }

  // -- a run of losses --------------------------------------------------
  // Newest first, so the head of the list is the current streak.
  let streak = 0
  for (const trade of closed) {
    if ((trade.netPl ?? 0) >= 0) break
    streak += 1
  }

  if (streak >= 3) {
    items.push({
      id: `streak-${streak}`,
      kind: 'streak',
      title: `${streak} losses in a row`,
      body: 'The trade after a run is the one most likely to be taken for the wrong reason.',
      age: ago(tradeDate(closed[0])),
      route: 'coach',
    })
  }

  // -- nothing logged in a while ---------------------------------------
  const last = trades.length > 0 ? tradeDate(trades[0]) : null
  if (last !== null) {
    const days = Math.round((now - last.getTime()) / 86_400_000)
    if (days >= 7) {
      items.push({
        id: `quiet-${days}`,
        kind: 'quiet',
        title: 'Nothing logged in a week',
        body: `Your last entry was ${days} days ago. A journal with gaps in it answers fewer questions than one with losses in it.`,
        age: `${days}d`,
        route: 'journal',
      })
    }
  }

  return items
}

export function useNotifications(
  profile: Profile | null,
  trades: StoredTrade[],
): Notification[] {
  const invitations = useInvitations(profile?.uid ?? null)

  return useMemo(
    () => buildNotifications(profile, trades, invitations),
    [invitations, profile, trades],
  )
}
