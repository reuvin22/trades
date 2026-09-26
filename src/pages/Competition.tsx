import { useState } from 'react'
import {
  AnvilIcon,
  ChevronLeftIcon,
  CompetitionIcon,
  SpinnerIcon,
  StormIcon,
  TrophyIcon,
} from '../components/Icons'
import {
  WAR_ARENA,
  WAR_ARENA_LABEL,
  WAR_AVATAR,
  WAR_AVATAR_LETTERS,
  WAR_BACK,
  WAR_BADGE,
  WAR_BADGE_HOT,
  WAR_BADGE_RANK,
  WAR_BADGES,
  WAR_BAR,
  WAR_BOARD,
  WAR_BREAKDOWN,
  WAR_BTN,
  WAR_BTN_COLD,
  WAR_BTN_HOT,
  WAR_CARD,
  WAR_CARD_SEAM,
  WAR_CUP,
  WAR_CUP_HEAD,
  WAR_CUP_META,
  WAR_CUP_NAME,
  WAR_CUP_STATE,
  WAR_CUP_STATE_TONE,
  WAR_CLOCK,
  WAR_CUPS,
  WAR_DELTA,
  WAR_EMPTY,
  WAR_FILL,
  WAR_GRAIN,
  WAR_HANDLE,
  WAR_HERO,
  WAR_INNER,
  WAR_KICKER,
  WAR_LEDE,
  WAR_MAIL,
  WAR_MARK,
  WAR_ME,
  WAR_ME_FACE,
  WAR_ME_NAME,
  WAR_NOTE,
  WAR_PAGE,
  WAR_PART,
  WAR_PART_DOWN,
  WAR_PART_NAME,
  WAR_PART_VALUE,
  WAR_PLATE,
  WAR_PLATE_LABEL,
  WAR_PLATE_VALUE,
  WAR_PLATES,
  WAR_POS,
  WAR_POS_TOP,
  WAR_ROW,
  WAR_ROW_FACE,
  WAR_ROW_ME,
  WAR_ROW_NAME,
  WAR_ROW_POINTS,
  WAR_ROW_SUB,
  WAR_RESULT,
  WAR_RESULT_LOSS,
  WAR_RESULT_WIN,
  WAR_RULE,
  WAR_SEEKING,
  WAR_SIDE,
  WAR_SIDE_NAME,
  WAR_TAB,
  WAR_TAB_ON,
  WAR_TABS,
  WAR_TITLE,
  WAR_TITLE_HOT,
  WAR_TRACK,
  WAR_TRACK_NOTE,
  WAR_VERSUS,
  WAR_VS,
  WAR_WHO,
} from '../components/ui'
import { displayNameFor, initialsFor } from '../data/messages'
import { readableApiError } from '../lib/api'
import {
  TIER_COLOUR,
  enterArena,
  clock,
  enterTournament,
  leaveArena,
  rankLabel,
  useArena,
  useBattle,
  type Battle,
  type Rank,
  type Standing,
  type Tournament,
} from '../lib/arena'
import { accountTypeLabel } from '../lib/profile'
import { useToast } from '../lib/toast'
import { navigate } from '../lib/useHashRoute'
import { useImageUrl } from '../lib/useImageUrl'
import type { Profile } from '../lib/profile'

type Board = 'battle' | 'ranked' | 'ladder' | 'universities' | 'tournaments'

/**
 * The arena.
 *
 * Deliberately built as somewhere else — dark, cut rather than rounded, and
 * fixed regardless of the palette the trader picked for the journal. A ladder
 * that looked like the journal would read as another tab in the journal.
 *
 * **Points, never money.** A standing here is a name, a badge and a score.
 * Nothing on this page shows a return, a balance or a P&L, and the scoring
 * behind the points never reads a figure as a quantity — see
 * `services/scoring.py`. That is what makes publishing a rank beside somebody's
 * name defensible: it says they are good, not what they are worth.
 */
export function Competition({ profile }: { profile: Profile | null }) {
  const toast = useToast()
  const arena = useArena(profile?.uid ?? null)
  const [board, setBoard] = useState<Board>('battle')
  const [busy, setBusy] = useState(false)

  const photo = useImageUrl(profile?.photoURL ?? '')
  const handle = displayNameFor(profile?.displayName ?? '', profile?.email ?? '')
  const initials = initialsFor(handle, profile?.email ?? '')

  async function toggleEntry(join: boolean) {
    setBusy(true)
    try {
      await (join ? enterArena() : leaveArena())
      toast.success(join ? 'You are on the ladder.' : 'You have left the ladder.')
      arena.reload()
    } catch (cause) {
      toast.error('Could not do that', readableApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  async function toggleCup(cup: Tournament) {
    setBusy(true)
    try {
      await enterTournament(cup.id, !cup.entered)
      toast.success(cup.entered ? 'Withdrawn.' : `Entered ${cup.name}.`)
      arena.reload()
    } catch (cause) {
      toast.error('Could not do that', readableApiError(cause))
    } finally {
      setBusy(false)
    }
  }

  const me = arena.me

  return (
    <div className={WAR_PAGE}>
      <span className={WAR_GRAIN} aria-hidden="true" />

      <header className={WAR_BAR}>
        <span className={WAR_MARK}>
          <CompetitionIcon size={16} />
          RagDex Arena
        </span>

        <button type="button" className={WAR_BACK} onClick={() => navigate('dashboard')}>
          <ChevronLeftIcon size={14} />
          Back to journal
        </button>

        <span className={WAR_ME}>
          <span className={WAR_ME_FACE}>
            {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : initials}
          </span>
          <span className={WAR_ME_NAME}>{handle}</span>
        </span>
      </header>

      <div className={WAR_INNER}>
        <header className={WAR_HERO}>
          <span className={WAR_KICKER}>
            <CompetitionIcon size={15} />
            Competition
            <span className={WAR_RULE} aria-hidden="true" />
          </span>

          <h2 className={WAR_TITLE}>
            Step into
            <br />
            the <span className={WAR_TITLE_HOT}>forge</span>
          </h2>

          <p className={WAR_LEDE}>
            Points are earned for how you trade, not how much you make — rules
            kept, days clean, the journal actually written. Nobody on these
            boards can see what anybody is worth.
          </p>
        </header>

        {/* ------------------------------------------------ the fighter */}

        <section className={WAR_CARD}>
          <span className={WAR_CARD_SEAM} aria-hidden="true" />

          <span className={WAR_AVATAR}>
            {photo ? (
              <img src={photo} alt="" referrerPolicy="no-referrer" />
            ) : (
              <span className={WAR_AVATAR_LETTERS}>{initials}</span>
            )}
          </span>

          <div className={WAR_WHO}>
            <span className={WAR_HANDLE}>{handle}</span>
            <span className={WAR_MAIL}>{profile?.email ?? ''}</span>

            <div className={WAR_BADGES}>
              {me !== null && <RankBadge rank={me.rank} />}
              <span className={`${WAR_BADGE} ${WAR_BADGE_HOT}`}>
                {accountTypeLabel(profile?.accountType)}
              </span>
              {me !== null && me.universityName !== '' && (
                <span className={WAR_BADGE}>{me.universityName}</span>
              )}
            </div>

            <div className={WAR_PLATES}>
              <Plate label="Points" value={String(me?.rank.points ?? 0)} />
              <Plate
                label="Ladder position"
                value={me?.position != null ? `#${me.position}` : 'Unranked'}
              />
              <Plate
                label="Next division"
                value={
                  me?.rank.nextAt != null
                    ? `${Math.max(0, me.rank.nextAt - me.rank.points)} to go`
                    : 'Top of the ladder'
                }
              />
            </div>

            {me !== null && me.rank.nextAt != null && (
              <>
                <span className={WAR_TRACK}>
                  <span
                    className={WAR_FILL}
                    style={{
                      width: `${Math.round(
                        Math.min(100, (me.rank.points / me.rank.nextAt) * 100),
                      )}%`,
                    }}
                  />
                </span>
                <span className={WAR_TRACK_NOTE}>
                  <span>{me.rank.points} points</span>
                  <span>{me.rank.nextAt} for the next division</span>
                </span>
              </>
            )}

            <div className={WAR_BADGES}>
              {me?.entered ? (
                <button
                  type="button"
                  className={`${WAR_BTN} ${WAR_BTN_COLD}`}
                  disabled={busy}
                  onClick={() => toggleEntry(false)}
                >
                  Leave the ladder
                </button>
              ) : (
                <button
                  type="button"
                  className={`${WAR_BTN} ${WAR_BTN_HOT}`}
                  disabled={busy || arena.loading}
                  onClick={() => toggleEntry(true)}
                >
                  {busy && <SpinnerIcon size={14} className="animate-spin" />}
                  Enter the ladder
                </button>
              )}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------- the boards */}

        <div className={WAR_TABS}>
          {(
            [
              ['battle', 'Battle'],
              ['ranked', 'Ranked'],
              ['ladder', 'Leaderboard'],
              ['universities', 'University vs University'],
              ['tournaments', 'Tournaments'],
            ] as [Board, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`${WAR_TAB} ${board === id ? WAR_TAB_ON : ''}`}
              onClick={() => setBoard(id)}
            >
              {label}
            </button>
          ))}
        </div>

        {arena.error !== null && <p className={WAR_EMPTY}>{arena.error}</p>}

        {arena.loading ? (
          <p className={WAR_EMPTY}>Reading the ladder…</p>
        ) : board === 'battle' ? (
          <BattlePanel uid={profile?.uid ?? null} entered={me?.entered === true} onSettled={arena.reload} />
        ) : board === 'ranked' ? (
          <Ranked me={me} />
        ) : board === 'ladder' ? (
          <Ladder
            standings={arena.standings}
            mine={arena.myStanding}
            uid={profile?.uid ?? ''}
          />
        ) : board === 'universities' ? (
          <Universities
            standings={arena.universities}
            mine={arena.myUniversity?.coachUid ?? ''}
          />
        ) : (
          <Tournaments
            tournaments={arena.tournaments}
            busy={busy}
            onToggle={toggleCup}
          />
        )}

        <p className={WAR_NOTE}>
          Points are worked out from your own journal when you open this page, and
          only the total is stored — no board reads anybody else&rsquo;s trades.
          That also means a rank is as fresh as the last time its owner was here.
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ parts */

function RankBadge({ rank }: { rank: Rank }) {
  const colour = TIER_COLOUR[rank.tier]

  return (
    <span
      className={WAR_BADGE_RANK}
      style={{ borderColor: colour, color: colour, background: `${colour}1f` }}
    >
      {rankLabel(rank)}
    </span>
  )
}

function Plate({ label, value }: { label: string; value: string }) {
  return (
    <div className={WAR_PLATE}>
      <span className={WAR_PLATE_LABEL}>{label}</span>
      <span className={WAR_PLATE_VALUE}>{value}</span>
    </div>
  )
}

/** Your own standing, and where the points came from. */
function Ranked({ me }: { me: ReturnType<typeof useArena>['me'] }) {
  if (me === null) return <p className={WAR_EMPTY}>Nothing to show yet.</p>

  const parts = Object.entries(me.breakdown)

  if (parts.length === 0) {
    return (
      <p className={WAR_EMPTY}>
        No points yet. They start the moment you answer the rule questions on a
        trade — the journal is the floor of the score, not an extra.
      </p>
    )
  }

  return (
    <div className={WAR_BREAKDOWN}>
      {parts.map(([name, value]) => (
        <div key={name} className={WAR_PART}>
          <span className={WAR_PART_NAME}>{name}</span>
          <span className={`${WAR_PART_VALUE} ${value < 0 ? WAR_PART_DOWN : ''}`}>
            {value > 0 ? `+${value}` : value}
          </span>
        </div>
      ))}
      <div className={WAR_PART}>
        <span className={WAR_PART_NAME}>Total</span>
        <span className={WAR_PART_VALUE}>{me.rank.points}</span>
      </div>
    </div>
  )
}

function Ladder({
  standings,
  mine,
  uid,
}: {
  standings: Standing[]
  mine: Standing | null
  uid: string
}) {
  if (standings.length === 0) {
    return (
      <p className={WAR_EMPTY}>
        Nobody on the ladder yet. Enter, and the board starts with you.
      </p>
    )
  }

  const shown = standings.some((row) => row.uid === uid)

  return (
    <div className={WAR_BOARD}>
      {standings.map((row) => (
        <Row key={row.uid} row={row} me={row.uid === uid} />
      ))}

      {/* Their own row, even when it is nowhere near the top — a board that
          does not show you yourself is one you open once. */}
      {!shown && mine !== null && <Row row={mine} me />}
    </div>
  )
}

function Row({ row, me }: { row: Standing; me: boolean }) {
  const name = row.displayName.trim() || 'Trader'

  return (
    <div className={`${WAR_ROW} ${me ? WAR_ROW_ME : ''}`}>
      <span className={`${WAR_POS} ${row.position <= 3 ? WAR_POS_TOP : ''}`}>
        {row.position}
      </span>

      <span className={WAR_ROW_FACE}>{initialsFor(name, '')}</span>

      <span>
        <span className={WAR_ROW_NAME}>
          {name}
          {me && ' — you'}
        </span>
        <span className={WAR_ROW_SUB}>{rankLabel(row.rank)}</span>
      </span>

      <span className={WAR_ROW_POINTS}>{row.rank.points}</span>
    </div>
  )
}

function Universities({
  standings,
  mine,
}: {
  standings: { coachUid: string; name: string; entrants: number; points: number; position: number; rank: Rank }[]
  mine: string
}) {
  if (standings.length === 0) {
    return (
      <p className={WAR_EMPTY}>
        No university has entrants yet. A university&rsquo;s score is the sum of
        its members&rsquo; points, so it starts when its traders do.
      </p>
    )
  }

  return (
    <div className={WAR_BOARD}>
      {standings.map((row) => (
        <div
          key={row.coachUid}
          className={`${WAR_ROW} ${row.coachUid === mine ? WAR_ROW_ME : ''}`}
        >
          <span className={`${WAR_POS} ${row.position <= 3 ? WAR_POS_TOP : ''}`}>
            {row.position}
          </span>

          <span className={WAR_ROW_FACE}>
            {initialsFor(row.name || 'University', '')}
          </span>

          <span>
            <span className={WAR_ROW_NAME}>{row.name || 'Unnamed university'}</span>
            <span className={WAR_ROW_SUB}>
              {row.entrants} {row.entrants === 1 ? 'entrant' : 'entrants'} ·{' '}
              {rankLabel(row.rank)}
            </span>
          </span>

          <span className={WAR_ROW_POINTS}>{row.points}</span>
        </div>
      ))}
    </div>
  )
}

function Tournaments({
  tournaments,
  busy,
  onToggle,
}: {
  tournaments: Tournament[]
  busy: boolean
  onToggle: (cup: Tournament) => void
}) {
  if (tournaments.length === 0) {
    return (
      <p className={WAR_EMPTY}>
        No tournaments scheduled. When one opens it appears here, and entering is
        one click — the points it scores are the ones you earn inside its window.
      </p>
    )
  }

  return (
    <div className={WAR_CUPS}>
      {tournaments.map((cup) => (
        <section key={cup.id} className={WAR_CUP}>
          <div className={WAR_CUP_HEAD}>
            <GlyphFor state={cup.state} />
            <span className={WAR_CUP_NAME}>{cup.name}</span>
            <span className={`${WAR_CUP_STATE} ${WAR_CUP_STATE_TONE[cup.state]}`}>
              {cup.state}
            </span>
          </div>

          <p className={WAR_LEDE}>{cup.blurb}</p>

          <div className={WAR_CUP_META}>
            <span>
              {cup.entrants} {cup.entrants === 1 ? 'entrant' : 'entrants'}
            </span>
            {cup.startsAt !== null && (
              <span>Opens {cup.startsAt.toLocaleDateString('en-GB')}</span>
            )}
            {cup.endsAt !== null && (
              <span>Closes {cup.endsAt.toLocaleDateString('en-GB')}</span>
            )}
          </div>

          <button
            type="button"
            className={`${WAR_BTN} ${cup.entered ? WAR_BTN_COLD : WAR_BTN_HOT}`}
            disabled={busy || (cup.state !== 'open' && !cup.entered)}
            onClick={() => onToggle(cup)}
          >
            {cup.entered
              ? 'Withdraw'
              : cup.state === 'open'
                ? 'Enter'
                : 'Entries closed'}
          </button>
        </section>
      ))}
    </div>
  )
}

function GlyphFor({ state }: { state: Tournament['state'] }) {
  if (state === 'running') return <StormIcon size={18} />
  if (state === 'finished') return <AnvilIcon size={18} />
  return <TrophyIcon size={18} />
}

/**
 * One against one, ten minutes, best return wins.
 *
 * Polled rather than pushed — a match has a ten-minute clock and a result
 * that cannot change before the bell, so four seconds is indistinguishable
 * from instant. The countdown ticks locally between polls so it counts rather
 * than jumps, but the server's figure is what it resets to: a client with a
 * wrong clock must not be able to end its own match early.
 */
function BattlePanel({
  uid,
  entered,
  onSettled,
}: {
  uid: string | null
  entered: boolean
  onSettled: () => void
}) {
  const { battle, busy, start, stop } = useBattle(uid, onSettled)
  const toast = useToast()

  async function go(searching: boolean) {
    try {
      await (searching ? stop() : start())
    } catch (cause) {
      toast.error('Could not do that', readableApiError(cause))
    }
  }

  if (!entered) {
    return (
      <p className={WAR_EMPTY}>
        Enter the ladder before searching for a match — a battle moves points,
        and points need somewhere to move.
      </p>
    )
  }

  if (battle.state === 'running' || battle.state === 'reporting') {
    const counting = battle.state === 'running'

    return (
      <section className={WAR_ARENA}>
        <span className={WAR_ARENA_LABEL}>
          {counting ? 'Match in progress' : 'Waiting on the result'}
        </span>

        <span className={WAR_CLOCK}>{counting ? clock(battle.secondsLeft) : '0:00'}</span>

        <Versus opponent={battle.opponent} />

        <p className={WAR_LEDE}>
          {counting
            ? 'Best percentage return over the window takes it. Trade as you would — the journal is what gets read.'
            : battle.opponentReported
              ? 'Both results are in. Settling…'
              : 'Your result is in. Waiting for theirs — if they do not report, the match goes to you.'}
        </p>
      </section>
    )
  }

  if (battle.state === 'finished') {
    const won = battle.won === true
    const drew = battle.pointsDelta === 0 && battle.won !== true

    return (
      <section className={WAR_ARENA}>
        <span className={WAR_ARENA_LABEL}>Result</span>

        <span className={`${WAR_RESULT} ${won ? WAR_RESULT_WIN : WAR_RESULT_LOSS}`}>
          {drew ? 'Draw' : won ? 'Victory' : 'Defeat'}
        </span>

        <Versus opponent={battle.opponent} />

        <span className={`${WAR_DELTA} ${won ? WAR_RESULT_WIN : WAR_RESULT_LOSS}`}>
          {battle.pointsDelta > 0 ? `+${battle.pointsDelta}` : battle.pointsDelta} points
        </span>

        {battle.myReturn !== null && (
          <p className={WAR_LEDE}>
            You returned {battle.myReturn.toFixed(2)}% over the window. Only you see
            that figure — the board shows a rank, never a return.
          </p>
        )}

        <button
          type="button"
          className={`${WAR_BTN} ${WAR_BTN_HOT}`}
          disabled={busy}
          onClick={() => go(false)}
        >
          Search again
        </button>
      </section>
    )
  }

  const searching = battle.state === 'searching'

  return (
    <section className={WAR_ARENA}>
      <span className={WAR_ARENA_LABEL}>
        {searching ? 'Looking for an opponent' : 'One against one'}
      </span>

      {searching ? (
        <span className={WAR_CLOCK}>
          <span className={WAR_SEEKING} aria-hidden="true" />
        </span>
      ) : (
        <span className={WAR_CLOCK}>10:00</span>
      )}

      <p className={WAR_LEDE}>
        Ten minutes against one opponent, best percentage return wins. Beat
        somebody above your bracket and it is worth +15; lose to them and it
        costs 5. Inside your own bracket it is +10 and −10.
      </p>

      <button
        type="button"
        className={`${WAR_BTN} ${searching ? WAR_BTN_COLD : WAR_BTN_HOT}`}
        disabled={busy}
        onClick={() => go(searching)}
      >
        {busy && <SpinnerIcon size={14} className="animate-spin" />}
        {searching ? 'Stop searching' : 'Find a match'}
      </button>
    </section>
  )
}

function Versus({ opponent }: { opponent: Battle['opponent'] }) {
  if (opponent === null) return null

  const name = opponent.displayName.trim() || 'Trader'

  return (
    <div className={WAR_VERSUS}>
      <span className={WAR_SIDE}>
        <span className={WAR_ROW_FACE}>{initialsFor('You', '')}</span>
        <span className={WAR_SIDE_NAME}>You</span>
      </span>

      <span className={WAR_VS}>vs</span>

      <span className={WAR_SIDE}>
        <span className={WAR_ROW_FACE}>{initialsFor(name, '')}</span>
        <span className={WAR_SIDE_NAME}>{name}</span>
        <RankBadge rank={opponent.rank} />
      </span>
    </div>
  )
}
