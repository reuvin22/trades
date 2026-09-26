import { useMemo } from 'react'
import { dayKey, tradeDate } from './stats'
import { EMPTY_INBOX, useInbox, type Inbox } from './university'
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

export type NotificationKind =
  | 'invite'
  | 'approved'
  /** Somebody answered a coach's invitation and is waiting on a decision. */
  | 'application'
  /** Somebody turned a coach's invitation down. */
  | 'declined'
  | 'risk'
  | 'rules'
  | 'streak'
  | 'quiet'

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
/** How long a refusal is still news. After this it is just history. */
const DECLINE_WINDOW_DAYS = 14

export function buildNotifications(
  profile: Profile | null,
  trades: StoredTrade[],
  inbox: Inbox = EMPTY_INBOX,
  // Last, and defaulted, so the hook below never has to name it — reading the
  // clock during render is the impurity the React lint rules object to, and
  // rightly: it makes a render's output depend on when it happened.
  now: number = Date.now(),
): Notification[] {
  const items: Notification[] = []
  const { invitations, intake } = inbox

  /* ---------------------------------------------------------- coach side */

  // -- somebody answered your invitation ---------------------------------
  //
  // The half that was missing. A coach sent an invitation, the trader
  // answered the form, and nothing anywhere told the coach — the application
  // sat in a tab they had no reason to open.
  for (const application of inbox.applications) {
    const who = application.studentName.trim() || application.studentEmail

    items.push({
      id: `application-${application.studentUid}`,
      kind: 'application',
      title: `${who} answered your form`,
      body: 'They are waiting on your approval before they can join.',
      age: ago(application.appliedAt),
      route: 'university',
    })
  }

  // -- somebody turned you down ------------------------------------------
  //
  // Bounded by recency, because there is no store of what has been read
  // across sessions: an unbounded list would resurface every refusal ever
  // received on every reload, which trains people to ignore the bell.
  const freshEnough = now - DECLINE_WINDOW_DAYS * 86_400_000

  for (const invite of inbox.declined) {
    const when = invite.respondedAt
    if (when === null || when.getTime() < freshEnough) continue

    const who = invite.studentName.trim() || invite.studentEmail

    items.push({
      id: `declined-${invite.studentUid}`,
      kind: 'declined',
      title: `${who} declined your invitation`,
      body: 'They are not joining. You can invite them again if that changes.',
      age: ago(when),
      route: 'university',
    })
  }

  /* -------------------------------------------------------- student side */

  // -- your coach approved you, and something is waiting -----------------
  //
  // The second notification in the joining flow. Approval is not the end of
  // it: the documents have to be signed before the enrolment completes, so
  // this says what is left rather than just congratulating somebody.
  if (intake.status === 'documents') {
    const left = intake.outstanding
    const where = intake.universityName.trim() || 'your coach'

    items.push({
      id: `approved-${intake.coachUid}-${left}`,
      kind: 'approved',
      title:
        left === 0
          ? `${where} approved you`
          : `${where} approved you — ${left} to sign`,
      body:
        left === 0
          ? 'Nothing left to do.'
          : `You are enrolled once the last ${left === 1 ? 'document is' : 'documents are'} signed.`,
      age: '',
      // Straight into the signing run. Landing on My University and leaving
      // somebody to find the documents is what this notification exists to
      // avoid.
      route: left === 0 ? 'university' : 'university/next',
    })
  }

  // -- somebody asked you to join their program ----------------------
  for (const invitation of invitations) {
    const who = invitation.coachName.trim() || invitation.coachEmail
    items.push({
      id: `invite-${invitation.coachUid}`,
      kind: 'invite',
      title: `${who} invited you to their program`,
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
  const inbox = useInbox(profile?.uid ?? null)

  return useMemo(
    () => buildNotifications(profile, trades, inbox),
    [inbox, profile, trades],
  )
}
