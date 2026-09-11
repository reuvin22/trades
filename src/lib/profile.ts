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

  /** Which kind of account this is. Defaults to individual. */
  accountType?: AccountType

  plan?: string
  planSince?: Date | null
}

/** The three kinds of account the app recognises. */
export type AccountType = 'student' | 'coach' | 'individual'

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
