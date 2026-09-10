import { useEffect, useState } from 'react'
import {
  Timestamp,
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import {
  holdTime,
  netProfit,
  riskReward,
  type TradeEntry,
} from '../data/tradeForm'

/** One journal entry as it is stored under users/{uid}/trades. */
export type StoredTrade = {
  id: string
  ticker: string
  direction: 'Long' | 'Short'
  size: number | null
  sizeUnit: string
  entryPrice: number | null
  exitPrice: number | null
  entryAt: string
  exitAt: string
  setup: string
  rationale: string
  stopLoss: number | null
  takeProfit: number | null
  screenshot: string
  netPl: number | null
  riskReward: number | null
  duration: string | null
  compliedEntry: string
  compliedExit: string
  compliedManagement: string
  emotionBefore: string
  emotionDuring: string
  mistakes: string[]
  createdAt: Date | null
}

/**
 * Firestore's raw errors are unhelpful to a person, and `permission-denied` in
 * particular almost always means the project's security rules were never
 * deployed past the default deny-all.
 */
export function readableFirestoreError(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code: unknown }).code)
      : ''

  switch (code) {
    case 'permission-denied':
    case 'firestore/permission-denied':
      return 'Firestore rejected this request. Deploy firestore.rules — the default rules deny every read and write.'
    case 'unauthenticated':
      return 'Your session expired. Sign in again.'
    case 'unavailable':
      return 'Cannot reach Firestore right now. Check your connection.'
    case 'failed-precondition':
      return 'Firestore needs an index for this query. The console error link will create it.'
    default:
      return error instanceof Error ? error.message : 'Firestore request failed.'
  }
}

function toNumber(value: string): number | null {
  if (value.trim() === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function tradesCollection(uid: string) {
  if (!db) throw new Error('Firestore is not configured.')
  return collection(db, 'users', uid, 'trades')
}

/**
 * Writes the form entry plus the three derived figures, so queries and charts
 * never have to recompute P&L across the whole collection.
 */
export function saveTrade(uid: string, trade: TradeEntry) {
  return addDoc(tradesCollection(uid), {
    ticker: trade.ticker.trim(),
    direction: trade.direction,
    size: toNumber(trade.size),
    sizeUnit: trade.sizeUnit,
    entryPrice: toNumber(trade.entryPrice),
    exitPrice: toNumber(trade.exitPrice),
    entryAt: trade.entryAt,
    exitAt: trade.exitAt,
    setup: trade.setup.trim(),
    rationale: trade.rationale.trim(),
    stopLoss: toNumber(trade.stopLoss),
    takeProfit: toNumber(trade.takeProfit),
    screenshot: trade.screenshot.trim(),
    netPl: netProfit(trade),
    riskReward: riskReward(trade),
    duration: holdTime(trade),
    compliedEntry: trade.compliedEntry,
    compliedExit: trade.compliedExit,
    compliedManagement: trade.compliedManagement,
    emotionBefore: trade.emotionBefore,
    emotionDuring: trade.emotionDuring,
    mistakes: trade.mistakes,
    createdAt: serverTimestamp(),
  })
}

export type TradesState = {
  trades: StoredTrade[]
  loading: boolean
  error: string | null
}

type Snapshot = {
  uid: string | null
  trades: StoredTrade[]
  error: string | null
}

/** Live view of the signed-in trader's journal, newest first. */
export function useTrades(uid: string | null): TradesState {
  const [snapshot, setSnapshot] = useState<Snapshot>({
    uid: null,
    trades: [],
    error: null,
  })

  useEffect(() => {
    if (!uid || !db) return

    const wanted = query(tradesCollection(uid), orderBy('createdAt', 'desc'))

    return onSnapshot(
      wanted,
      (result) => {
        const trades = result.docs.map((entry) => {
          const data = entry.data()
          const created = data.createdAt

          return {
            id: entry.id,
            ...data,
            createdAt: created instanceof Timestamp ? created.toDate() : null,
          } as StoredTrade
        })

        setSnapshot({ uid, trades, error: null })
      },
      (error) => setSnapshot({ uid, trades: [], error: readableFirestoreError(error) }),
    )
  }, [uid])

  // Derived rather than stored, so switching accounts never shows stale rows.
  const fresh = snapshot.uid === uid

  return {
    trades: fresh ? snapshot.trades : [],
    loading: Boolean(uid && db) && !fresh,
    error: fresh ? snapshot.error : null,
  }
}
