import { useEffect, useState } from 'react'
import {
  Timestamp,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { updateProfile, type User } from 'firebase/auth'
import { db } from './firebase'

export type Profile = {
  uid: string
  email: string
  displayName: string
  photoURL: string
  providers: string[]
  /** Set the first time an account reaches the app. */
  createdAt: Date | null
  lastSeenAt: Date | null
  verifiedAt: Date | null

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

  // Written by the billing page.
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
  return (match ?? ACCOUNT_TYPES.find((entry) => entry.value === DEFAULT_ACCOUNT_TYPE)!).label
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
}

function profileRef(uid: string) {
  if (!db) throw new Error('Firestore is not configured.')
  return doc(db, 'users', uid)
}

/**
 * Writes the account record on every sign-in. `createdAt` is only ever set by
 * the first write, so its absence beforehand is what marks a brand-new account.
 */
export async function recordSignIn(user: User): Promise<{ isNew: boolean }> {
  if (!db) return { isNew: false }

  const ref = profileRef(user.uid)
  const existing = await getDoc(ref)
  const isNew = !existing.exists()

  await setDoc(
    ref,
    {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      providers: user.providerData.map((entry) => entry.providerId),
      lastSeenAt: serverTimestamp(),
      ...(isNew ? { createdAt: serverTimestamp() } : {}),
      ...(user.emailVerified && !existing.data()?.verifiedAt
        ? { verifiedAt: serverTimestamp() }
        : {}),
    },
    { merge: true },
  )

  return { isNew }
}

/**
 * Saves the editable fields. The name and avatar are mirrored onto the Firebase
 * Auth record too, so the top bar and any future token reflect them.
 */
export async function saveProfileDetails(user: User, details: ProfileDetails) {
  if (!db) throw new Error('Firestore is not configured.')

  await updateProfile(user, {
    displayName: details.displayName || null,
    photoURL: details.photoURL || null,
  })

  await setDoc(
    profileRef(user.uid),
    { ...details, updatedAt: serverTimestamp() },
    { merge: true },
  )
}

/** Remembers the language the coach should reply in. */
export async function saveCoachLanguage(uid: string, coachLanguage: string) {
  if (!db) throw new Error('Firestore is not configured.')
  await setDoc(profileRef(uid), { coachLanguage }, { merge: true })
}

/** Records the chosen plan. No payment processor is wired up yet. */
export async function savePlan(uid: string, plan: string) {
  if (!db) throw new Error('Firestore is not configured.')

  await setDoc(
    profileRef(uid),
    { plan, planSince: serverTimestamp() },
    { merge: true },
  )
}

function toDate(value: unknown): Date | null {
  return value instanceof Timestamp ? value.toDate() : null
}

/** Live account record for the signed-in user. */
export function useProfile(user: User | null): ProfileState {
  const [state, setState] = useState<{
    uid: string | null
    profile: Profile | null
    isNewAccount: boolean
    error: string | null
  }>({ uid: null, profile: null, isNewAccount: false, error: null })

  useEffect(() => {
    if (!user || !db) return

    let live = true

    recordSignIn(user)
      .then(({ isNew }) => {
        if (live) {
          setState((current) => ({ ...current, uid: user.uid, isNewAccount: isNew }))
        }
      })
      .catch((cause: unknown) => {
        if (live) {
          setState({
            uid: user.uid,
            profile: null,
            isNewAccount: false,
            error: cause instanceof Error ? cause.message : 'Could not read your account.',
          })
        }
      })

    const stop = onSnapshot(
      profileRef(user.uid),
      (snapshot) => {
        const data = snapshot.data()
        setState((current) => ({
          ...current,
          uid: user.uid,
          profile: data
            ? ({
                ...data,
                createdAt: toDate(data.createdAt),
                lastSeenAt: toDate(data.lastSeenAt),
                verifiedAt: toDate(data.verifiedAt),
                planSince: toDate(data.planSince),
              } as Profile)
            : null,
        }))
      },
      (cause) => setState((current) => ({ ...current, uid: user.uid, error: cause.message })),
    )

    return () => {
      live = false
      stop()
    }
  }, [user])

  const fresh = state.uid === (user?.uid ?? null)

  return {
    profile: fresh ? state.profile : null,
    isNewAccount: fresh ? state.isNewAccount : false,
    loading: Boolean(user && db) && (!fresh || state.profile === null),
    error: fresh ? state.error : null,
  }
}
