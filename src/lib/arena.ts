import { useCallback, useEffect, useRef, useState } from 'react'
import { apiFetch, date, readableApiError } from './api'
import type { Fill } from './desk'

/**
 * The arena, through the API.
 *
 * Nothing here carries money. A standing is a name, a badge and a number of
 * points — there is no return, balance or P&L in any of these shapes, which
 * is the whole reason the ladder scores points rather than percentages: a
 * rank says somebody is good without saying what they are worth.
 */

export type TierName =
  | 'Bronze'
  | 'Silver'
  | 'Gold'
  | 'Platinum'
  | 'Diamond'
  | 'Master'

export type Rank = {
  tier: TierName
  /** 1, 2 or 3 — the stars on the badge. */
  division: number
  points: number
  /** Where the next division starts, or null at the top. */
  nextAt: number | null
}

export type Standing = {
  uid: string
  displayName: string
  photoURL: string
  rank: Rank
  position: number
}

export type UniversityStanding = {
  coachUid: string
  name: string
  entrants: number
  points: number
  position: number
  rank: Rank
}

export type Tournament = {
  id: string
  name: string
  blurb: string
  startsAt: Date | null
  endsAt: Date | null
  entrants: number
  entered: boolean
  state: 'open' | 'running' | 'finished'
}

export type MyArena = {
  /** True once a match of theirs has settled. There is no joining step. */
  played: boolean
  matches: number
  wins: number
  rank: Rank
  position: number | null
  /** How the points were earned, so a score is never a black box. */
  breakdown: Record<string, number>
  universityName: string
}

type Wire = Record<string, unknown>

/** Fixed hues per tier, so a badge reads the same everywhere it appears. */
export const TIER_COLOUR: Record<TierName, string> = {
  Bronze: '#b06a2c',
  Silver: '#9aa4b2',
  Gold: '#e0a020',
  Platinum: '#59c3c3',
  Diamond: '#6aa9ff',
  Master: '#ff6a1a',
}

function toRank(wire: Wire | undefined): Rank {
  const raw = wire ?? {}

  return {
    tier: (raw.tier as TierName) ?? 'Bronze',
    division: Number(raw.division ?? 1),
    points: Number(raw.points ?? 0),
    nextAt:
      raw.next_at === null || raw.next_at === undefined ? null : Number(raw.next_at),
  }
}

/** "Gold II" — the badge, as words. */
export function rankLabel(rank: Rank): string {
  return `${rank.tier} ${'★'.repeat(Math.max(1, Math.min(3, rank.division)))}`
}

/** How far through the current division, 0–1. Null at the top of the ladder. */
export function rankProgress(rank: Rank): number | null {
  if (rank.nextAt === null) return null

  // The floor of this division is unknown to the client, so progress is
  // measured against the gap to the next one. Good enough for a bar, and it
  // avoids shipping the whole ladder table twice.
  const remaining = Math.max(0, rank.nextAt - rank.points)
  const span = Math.max(1, rank.nextAt - rank.points + 1)

  return Math.max(0, Math.min(1, 1 - remaining / span))
}

function toStanding(wire: Wire): Standing {
  return {
    uid: String(wire.uid ?? ''),
    displayName: String(wire.display_name ?? ''),
    photoURL: String(wire.photo_url ?? ''),
    rank: toRank(wire.rank as Wire),
    position: Number(wire.position ?? 0),
  }
}

/* ------------------------------------------------------------------ reads */

export type ArenaState = {
  me: MyArena | null
  standings: Standing[]
  myStanding: Standing | null
  universities: UniversityStanding[]
  myUniversity: UniversityStanding | null
  tournaments: Tournament[]
  loading: boolean
  error: string | null
  reload: () => void
}

const EMPTY: MyArena = {
  played: false,
  matches: 0,
  wins: 0,
  rank: { tier: 'Bronze', division: 1, points: 0, nextAt: null },
  position: null,
  breakdown: {},
  universityName: '',
}

/**
 * Everything the arena shows, in one pass.
 *
 * Four calls rather than four hooks, for the reason the university inbox
 * already learned: they are always needed together, and a page that fetched
 * them separately would paint four times.
 */
export function useArena(uid: string | null): ArenaState {
  const [me, setMe] = useState<MyArena | null>(null)
  const [standings, setStandings] = useState<Standing[]>([])
  const [myStanding, setMyStanding] = useState<Standing | null>(null)
  const [universities, setUniversities] = useState<UniversityStanding[]>([])
  const [myUniversity, setMyUniversity] = useState<UniversityStanding | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const reload = useCallback(() => setNonce((current) => current + 1), [])

  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()
    const signal = abort.signal

    Promise.all([
      apiFetch<Wire>('/api/v1/competition/me', { signal }),
      apiFetch<{ standings: Wire[]; me: Wire | null }>(
        '/api/v1/competition/leaderboard',
        { signal },
      ),
      apiFetch<{ standings: Wire[]; mine: Wire | null }>(
        '/api/v1/competition/universities',
        { signal },
      ),
      apiFetch<{ tournaments: Wire[] }>('/api/v1/competition/tournaments', {
        signal,
      }),
    ])
      .then(([mine, board, unis, cups]) => {
        setMe({
          played: mine.played === true,
          matches: Number(mine.matches ?? 0),
          wins: Number(mine.wins ?? 0),
          rank: toRank(mine.rank as Wire),
          position:
            mine.position === null || mine.position === undefined
              ? null
              : Number(mine.position),
          breakdown: (mine.breakdown as Record<string, number>) ?? {},
          universityName: String(mine.university_name ?? ''),
        })

        setStandings(board.standings.map(toStanding))
        setMyStanding(board.me === null ? null : toStanding(board.me))

        setUniversities(
          unis.standings.map((entry) => ({
            coachUid: String(entry.coach_uid ?? ''),
            name: String(entry.name ?? ''),
            entrants: Number(entry.entrants ?? 0),
            points: Number(entry.points ?? 0),
            position: Number(entry.position ?? 0),
            rank: toRank(entry.rank as Wire),
          })),
        )
        setMyUniversity(
          unis.mine === null
            ? null
            : {
                coachUid: String(unis.mine.coach_uid ?? ''),
                name: String(unis.mine.name ?? ''),
                entrants: Number(unis.mine.entrants ?? 0),
                points: Number(unis.mine.points ?? 0),
                position: Number(unis.mine.position ?? 0),
                rank: toRank(unis.mine.rank as Wire),
              },
        )

        setTournaments(
          cups.tournaments.map((entry) => ({
            id: String(entry.id ?? ''),
            name: String(entry.name ?? ''),
            blurb: String(entry.blurb ?? ''),
            startsAt: date(entry.starts_at),
            endsAt: date(entry.ends_at),
            entrants: Number(entry.entrants ?? 0),
            entered: entry.entered === true,
            state: (entry.state as Tournament['state']) ?? 'open',
          })),
        )

        setError(null)
        setLoadedFor(uid)
      })
      .catch((cause: unknown) => {
        if (signal.aborted) return
        setError(readableApiError(cause))
        setLoadedFor(uid)
      })

    return () => abort.abort()
  }, [uid, nonce])

  if (uid === null) {
    return {
      me: EMPTY,
      standings: [],
      myStanding: null,
      universities: [],
      myUniversity: null,
      tournaments: [],
      loading: false,
      error: null,
      reload,
    }
  }

  return {
    me,
    standings,
    myStanding,
    universities,
    myUniversity,
    tournaments,
    loading: loadedFor !== uid,
    error,
    reload,
  }
}

/* ----------------------------------------------------------------- writes */

export function enterTournament(id: string, join: boolean): Promise<unknown> {
  return apiFetch(`/api/v1/competition/tournaments/${id}/enter`, {
    method: join ? 'POST' : 'DELETE',
  })
}

/* ----------------------------------------------------------- the battle */

export type BattleState = 'idle' | 'searching' | 'running' | 'reporting' | 'finished'

export type Battle = {
  state: BattleState
  id: string
  /** What both sides trade. Chosen by the server, not by either player. */
  symbol: string
  opponent: { uid: string; displayName: string; rank: Rank } | null
  /** The real window, from the server — never recomputed from a local clock. */
  startsAt: Date | null
  endsAt: Date | null
  secondsLeft: number
  won: boolean | null
  pointsDelta: number
  /** Your own return over the window, as a percentage. Never theirs. */
  myReturn: number | null
  opponentReported: boolean
}

const NO_BATTLE: Battle = {
  state: 'idle',
  id: '',
  symbol: '',
  opponent: null,
  startsAt: null,
  endsAt: null,
  secondsLeft: 0,
  won: null,
  pointsDelta: 0,
  myReturn: null,
  opponentReported: false,
}

function toBattle(wire: Wire): Battle {
  const other = wire.opponent as Wire | null

  return {
    state: (wire.state as BattleState) ?? 'idle',
    id: String(wire.id ?? ''),
    symbol: String(wire.symbol ?? ''),
    opponent:
      other == null
        ? null
        : {
            uid: String(other.uid ?? ''),
            displayName: String(other.display_name ?? ''),
            rank: toRank(other.rank as Wire),
          },
    startsAt: date(wire.starts_at),
    endsAt: date(wire.ends_at),
    secondsLeft: Number(wire.seconds_left ?? 0),
    won: wire.won === null || wire.won === undefined ? null : wire.won === true,
    pointsDelta: Number(wire.points_delta ?? 0),
    myReturn:
      wire.my_return === null || wire.my_return === undefined
        ? null
        : Number(wire.my_return),
    opponentReported: wire.opponent_reported === true,
  }
}

/** How often to ask the server while something is pending. */
const POLL_MS = 4000

/**
 * The caller's match.
 *
 * Polled rather than pushed. Chat gets a websocket because a message has to
 * land in under a second; a match has a ten-minute clock and a result that
 * cannot change until the bell, so four seconds is indistinguishable from
 * instant and costs a fraction of the machinery.
 *
 * The countdown ticks locally between polls so the clock does not jump, but
 * the server's `secondsLeft` is what it resets to — a client whose clock is
 * wrong should not be able to end its own match early.
 */
export function useBattle(uid: string | null, onSettled?: () => void) {
  const [battle, setBattle] = useState<Battle>(NO_BATTLE)
  const [busy, setBusy] = useState(false)
  const settled = useRef(false)

  const refresh = useCallback(async () => {
    if (uid === null) return

    try {
      const next = toBattle(await apiFetch<Wire>('/api/v1/competition/battle'))
      setBattle(next)

      // Tell the page once, so a finished match refreshes the ladder behind it.
      if (next.state === 'finished' && !settled.current) {
        settled.current = true
        onSettled?.()
      }
      if (next.state !== 'finished') settled.current = false
    } catch {
      // Silent: a battle panel that cannot reach the API should sit still
      // rather than replace the arena with an error.
    }
  }, [uid, onSettled])

  /*
   * The first read, inlined rather than calling `refresh`.
   *
   * Same shape as every other hook here — the state is set in the promise
   * callback, not in the effect body. Calling the memoised `refresh` from
   * here instead reads to the hook rules as a render setting state during a
   * render, which is a complaint worth listening to rather than silencing.
   */
  useEffect(() => {
    if (uid === null) return

    const abort = new AbortController()

    apiFetch<Wire>('/api/v1/competition/battle', { signal: abort.signal })
      .then((wire) => {
        if (!abort.signal.aborted) setBattle(toBattle(wire))
      })
      .catch(() => undefined)

    return () => abort.abort()
  }, [uid])

  // Poll only while something is actually pending.
  useEffect(() => {
    const pending =
      battle.state === 'searching' ||
      battle.state === 'running' ||
      battle.state === 'reporting'

    if (!pending) return

    const timer = window.setInterval(() => void refresh(), POLL_MS)
    return () => window.clearInterval(timer)
  }, [battle.state, refresh])

  // The local tick between polls, so the clock counts rather than jumps.
  useEffect(() => {
    if (battle.state !== 'running') return

    const timer = window.setInterval(() => {
      setBattle((current) =>
        current.state === 'running'
          ? { ...current, secondsLeft: Math.max(0, current.secondsLeft - 1) }
          : current,
      )
    }, 1000)

    return () => window.clearInterval(timer)
  }, [battle.state])

  const start = useCallback(async () => {
    setBusy(true)
    try {
      setBattle(toBattle(await apiFetch<Wire>('/api/v1/competition/battle/search', { method: 'POST' })))
    } finally {
      setBusy(false)
    }
  }, [])

  const stop = useCallback(async () => {
    setBusy(true)
    try {
      await apiFetch('/api/v1/competition/battle/search', { method: 'DELETE' })
      setBattle(NO_BATTLE)
    } finally {
      setBusy(false)
    }
  }, [])

  return { battle, busy, start, stop, refresh }
}

/** `9:04` — a countdown somebody can read at a glance. */
export function clock(seconds: number): string {
  const safe = Math.max(0, seconds)
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`
}

/**
 * Send what was traded, and let the server price it.
 *
 * Times, sides and sizes only. Every price comes from the market data the
 * service fetches, so what comes back is a verified figure rather than one
 * this browser chose.
 */
export function reportFills(fills: Fill[]): Promise<unknown> {
  return apiFetch('/api/v1/competition/battle/fills', {
    method: 'POST',
    body: { fills: fills.map(({ at, side, size }) => ({ at, side, size })) },
  })
}
