import { useCallback, useEffect, useState } from 'react'
import { apiFetch, date, num, readableApiError } from './api'
import type { AuthUser } from './useAuth'

/**
 * The account record, through the API.
 *
 * Reading it also upserts it, which is the contract `GET /api/v1/me` already
 * had: a first sign-in has a record without a separate call.
 */

export type Profile = {
  uid: string
  email: string
  displayName: string
  photoURL: string
  createdAt: Date | null
  lastSeenAt: Date | null

  // Editable on the profile page.
  timezone?: string
  currency?: string
  openingBalance?: number | null
  tradingStyle?: string
  markets?: string[]
  bio?: string

  /** Chosen once on the AI Coach's first visit. */
  coachLanguage?: string

  // -- Trading setup, edited on Settings ---------------------------------
  // These are what let the coach measure execution against a standard the
  // trader set, rather than guessing at one from position sizes alone.
  marketType?: MarketType | null
  fundingType?: FundingType | null
  propFirm?: string
  accountSize?: number | null
  riskPerTradePct?: number | null
  maxDailyLossPct?: number | null
  /** Reward planned per unit of risk: 2 means risking one to make two. */
  targetR?: number | null
  maxTradesPerDay?: number | null
  strategies?: string[]
  /** The non-negotiables, in their own words. */
  tradingRules?: string
  /** How often the behavioural reading is re-analysed. */
  leakCadence?: LeakCadence
  /** How far back "what is working" looks. */
  edgeWindow?: Period

  /** Which kind of account this is. Defaults to individual. */
  accountType?: AccountType

  plan?: string
  planSince?: Date | null
}

/** The three kinds of account the app recognises. */
export type AccountType = 'student' | 'coach' | 'individual'

export type MarketType =
  | 'forex'
  | 'crypto'
  | 'futures'
  | 'stocks'
  | 'options'
  | 'indices'
  | 'mixed'

/** Whose money is at risk. A funded account has rules someone else wrote and a
 *  drawdown that ends it rather than denting it. */
export type FundingType = 'personal' | 'prop_firm' | 'demo'

export const MARKET_TYPES: { value: MarketType; label: string }[] = [
  { value: 'forex', label: 'Forex' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'futures', label: 'Futures' },
  { value: 'stocks', label: 'Stocks' },
  { value: 'options', label: 'Options' },
  { value: 'indices', label: 'Indices' },
  { value: 'mixed', label: 'A mix' },
]

export const FUNDING_TYPES: {
  value: FundingType
  label: string
  blurb: string
}[] = [
  {
    value: 'personal',
    label: 'My own money',
    blurb: 'A personal account, funded by you.',
  },
  {
    value: 'prop_firm',
    label: 'Prop firm',
    blurb: 'Funded by a firm, under their rules and their drawdown limit.',
  },
  {
    value: 'demo',
    label: 'Demo',
    blurb: 'Practising. The habits are real even though the money is not.',
  },
]

/**
 * How often the behavioural leak is re-analysed.
 *
 * Not only a cost setting, though it is that too — the analysis used to run on
 * every dashboard load. It also decides what the finding is about: a daily
 * read speaks to yesterday's session, a monthly one to a pattern.
 */
export type Period = 'daily' | 'weekly' | 'monthly'

/** The old name for the same three spans, kept where it reads better. */
export type LeakCadence = Period

/** How far back the "what is working" card reads. A window, not a schedule:
 *  that card is worked out in the browser the moment it renders. */
export const EDGE_WINDOWS: { value: Period; label: string; blurb: string }[] = [
  // Worded exactly like LEAK_CADENCES above, so the two settings read as the
  // same three choices. The blurb carries the difference: this one is the
  // stretch of trading being ranked, not a schedule.
  {
    value: 'daily',
    label: 'End of each day',
    blurb: 'Ranks your setups over today alone. Thin unless you trade a lot in a session.',
  },
  {
    value: 'weekly',
    label: 'Every week',
    blurb:
      'Ranks your setups over the last week — recent enough to act on, long enough to mean something.',
  },
  {
    value: 'monthly',
    label: 'Every month',
    blurb:
      'Ranks your setups over the last month. Enough trades per setup for the ranking to be worth reading.',
  },
]

export const LEAK_CADENCES: {
  value: LeakCadence
  label: string
  blurb: string
}[] = [
  {
    value: 'daily',
    label: 'End of each day',
    blurb: 'A fresh read every day. Best while you are actively fixing a habit.',
  },
  {
    value: 'weekly',
    label: 'Every week',
    blurb: 'A week is enough trades for a pattern and short enough to act on.',
  },
  {
    value: 'monthly',
    label: 'Every month',
    blurb: 'For swing traders, or anyone whose week is only a few trades.',
  },
]

/** Offered as chips; anything else can be typed in. */
export const COMMON_STRATEGIES = [
  'Breakout',
  'Liquidity sweep',
  'Fair value gap',
  'Order block',
  'VWAP reclaim',
  'Trend pullback',
  'Opening range break',
  'Supply and demand',
  'Mean reversion',
  'Scalping',
]

export const ACCOUNT_TYPES: {
  value: AccountType
  label: string
  blurb: string
}[] = [
  {
    value: 'student',
    label: 'Student Trader Account',
    blurb: 'Learning the craft, usually on a small or simulated account.',
  },
  {
    value: 'coach',
    label: 'Coach Trader Account',
    blurb: 'Mentors and reviews other traders alongside their own journal.',
  },
  {
    value: 'individual',
    label: 'Individual Trader Account',
    blurb: 'Trading their own capital, for themselves.',
  },
]

export const DEFAULT_ACCOUNT_TYPE: AccountType = 'individual'

/** The label shown in the sidebar under the wordmark. */
export function accountTypeLabel(value: AccountType | undefined): string {
  const match = ACCOUNT_TYPES.find((entry) => entry.value === value)
  return (match ?? ACCOUNT_TYPES.find((entry) => entry.value === DEFAULT_ACCOUNT_TYPE)!)
    .label
}

export type ProfileDetails = {
  displayName: string
  accountType: AccountType
  photoURL: string
  timezone: string
  currency: string
  openingBalance: number | null
  tradingStyle: string
  markets: string[]
  bio: string
}

export type ProfileState = {
  profile: Profile | null
  /** True when this sign-in created the account record. */
  isNewAccount: boolean
  loading: boolean
  error: string | null
  reload: () => void
}

type ProfileWire = Record<string, unknown>

function toProfile(wire: ProfileWire): Profile {
  return {
    uid: String(wire.uid ?? ''),
    email: String(wire.email ?? ''),
    displayName: String(wire.display_name ?? ''),
    photoURL: String(wire.photo_url ?? ''),
    accountType: (wire.account_type as AccountType) ?? 'individual',
    timezone: (wire.timezone as string) ?? undefined,
    currency: (wire.currency as string) ?? undefined,
    openingBalance: num(wire.opening_balance),
    tradingStyle: (wire.trading_style as string) ?? undefined,
    markets: Array.isArray(wire.markets) ? wire.markets.map(String) : [],
    bio: String(wire.bio ?? ''),
    coachLanguage: (wire.coach_language as string) ?? undefined,
    marketType: (wire.market_type as MarketType) ?? null,
    fundingType: (wire.funding_type as FundingType) ?? null,
    propFirm: String(wire.prop_firm ?? ''),
    accountSize: num(wire.account_size),
    riskPerTradePct: num(wire.risk_per_trade_pct),
    maxDailyLossPct: num(wire.max_daily_loss_pct),
    targetR: num(wire.target_r),
    maxTradesPerDay: num(wire.max_trades_per_day),
    strategies: Array.isArray(wire.strategies) ? wire.strategies.map(String) : [],
    tradingRules: String(wire.trading_rules ?? ''),
    leakCadence: (wire.leak_cadence as LeakCadence) ?? 'daily',
    edgeWindow: (wire.edge_window as Period) ?? 'monthly',
    plan: String(wire.plan ?? 'individual'),
    planSince: date(wire.plan_since),
    createdAt: date(wire.created_at),
    lastSeenAt: date(wire.last_seen_at),
  }
}

/** Saves the editable fields. The API mirrors the name and avatar onto the
 *  auth record and the directory, so the top bar and contact search follow. */
export async function saveProfileDetails(details: ProfileDetails): Promise<Profile> {
  const wire = await apiFetch<ProfileWire>('/api/v1/me', {
    method: 'PATCH',
    body: {
      display_name: details.displayName,
      account_type: details.accountType,
      photo_url: details.photoURL,
      timezone: details.timezone,
      currency: details.currency,
      opening_balance: details.openingBalance,
      trading_style: details.tradingStyle,
      markets: details.markets,
      bio: details.bio,
    },
  })
  return toProfile(wire)
}

/** What the trader edits on Settings. Every number may be null — "not set" is
 *  a real state, and the coach is told to ask rather than assume a limit. */
export type TradingSetup = {
  marketType: MarketType | null
  fundingType: FundingType | null
  propFirm: string
  accountSize: number | null
  riskPerTradePct: number | null
  maxDailyLossPct: number | null
  targetR: number | null
  maxTradesPerDay: number | null
  strategies: string[]
  tradingRules: string
  leakCadence: LeakCadence
  edgeWindow: Period
}

export async function saveTradingSetup(setup: TradingSetup): Promise<Profile> {
  const wire = await apiFetch<ProfileWire>('/api/v1/me', {
    method: 'PATCH',
    body: {
      market_type: setup.marketType,
      funding_type: setup.fundingType,
      // Only meaningful alongside a prop firm, and left behind as stale text
      // otherwise — clearing it here keeps the record honest.
      prop_firm: setup.fundingType === 'prop_firm' ? setup.propFirm : '',
      account_size: setup.accountSize,
      risk_per_trade_pct: setup.riskPerTradePct,
      max_daily_loss_pct: setup.maxDailyLossPct,
      target_r: setup.targetR,
      max_trades_per_day: setup.maxTradesPerDay,
      strategies: setup.strategies,
      trading_rules: setup.tradingRules,
      leak_cadence: setup.leakCadence,
      edge_window: setup.edgeWindow,
    },
  })
  return toProfile(wire)
}

/**
 * Stores the avatar on its own, the moment it is uploaded.
 *
 * Not folded into the Save button. Choosing a photo reads as a completed act —
 * the preview changes, so it looks done — and leaving it pending until a
 * separate Save meant a refresh silently threw it away with no error to
 * explain where it went.
 */
export async function saveProfilePhoto(photoURL: string): Promise<Profile> {
  const wire = await apiFetch<ProfileWire>('/api/v1/me', {
    method: 'PATCH',
    body: { photo_url: photoURL },
  })
  return toProfile(wire)
}

/** Remembers the language the coach should reply in. */
export async function saveCoachLanguage(coachLanguage: string): Promise<Profile> {
  const wire = await apiFetch<ProfileWire>('/api/v1/me', {
    method: 'PATCH',
    body: { coach_language: coachLanguage },
  })
  return toProfile(wire)
}

/** Records the chosen plan. No payment processor is wired up yet. */
export async function savePlan(plan: string): Promise<Profile> {
  const wire = await apiFetch<ProfileWire>('/api/v1/me/plan', {
    method: 'PUT',
    body: { plan },
  })
  return toProfile(wire)
}

/**
 * How recently an account has to have been created to count as new.
 *
 * The API upserts on read, so `createdAt` is set by the first `GET /me` rather
 * than reported back as a flag. Comparing it against now is what tells a
 * brand-new account from a returning one.
 */
const NEW_ACCOUNT_WINDOW_MS = 60_000

/** The signed-in trader's account record. */
export function useProfile(user: AuthUser | null): ProfileState {
  const [state, setState] = useState<{
    uid: string | null
    profile: Profile | null
    isNewAccount: boolean
    error: string | null
  }>({ uid: null, profile: null, isNewAccount: false, error: null })

  const [nonce, setNonce] = useState(0)
  const reload = useCallback(() => setNonce((current) => current + 1), [])

  const uid = user?.uid ?? null

  useEffect(() => {
    if (!uid) return

    const abort = new AbortController()

    apiFetch<ProfileWire>('/api/v1/me', { signal: abort.signal })
      .then((wire) => {
        const profile = toProfile(wire)
        const created = profile.createdAt
        setState({
          uid,
          profile,
          isNewAccount:
            created !== null && Date.now() - created.getTime() < NEW_ACCOUNT_WINDOW_MS,
          error: null,
        })
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        setState({ uid, profile: null, isNewAccount: false, error: readableApiError(cause) })
      })

    return () => abort.abort()
  }, [uid, nonce])

  const fresh = state.uid === uid

  return {
    profile: fresh ? state.profile : null,
    isNewAccount: fresh && state.isNewAccount,
    loading: Boolean(uid) && !fresh,
    error: fresh ? state.error : null,
    reload,
  }
}
